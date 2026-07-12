/**
 * Auth Context
 * Manages Deriv OAuth 2.0 flow and websocket lifecycle
 * 
 * Flow:
 * 1. User clicks "Login with Deriv"
 * 2. App generates OAuth state and redirects to https://oauth.deriv.com/oauth2/authorize
 * 3. User sees Deriv authorization screen with requested scopes
 * 4. User authorizes and is redirected back to /auth/callback with code
 * 5. Backend exchanges code for access token
 * 6. App stores token and connects websocket
 * 7. App authorizes websocket connection with token
 * 8. User sees dashboard with live trading data
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { initDeriv } from '../services/deriv';
import { useToast } from './ToastContext';
import { DERIV_OAUTH_CONFIG, OAUTH_LOGGING } from '../utils/constants';

const AuthContext = createContext(null);

const SYNTHETIC_SUBSCRIPTION_SYMBOLS = [
  'R_10',
  'R_25',
  'R_50',
  'R_75',
  'R_100',
  'BOOM500',
  'BOOM1000',
  'CRASH500',
  'CRASH1000',
  'JD10',
  'JD25',
  'JD50',
  'JD75',
  'JD100',
];

// ==================== OAuth State Management ====================

const getStoredState = () => localStorage.getItem('deriv_oauth_state');
const getPostLoginRedirect = () => localStorage.getItem('deriv_post_login_redirect') || '/dashboard';
const clearStoredAuthState = () => {
  localStorage.removeItem('deriv_oauth_state');
  localStorage.removeItem('deriv_post_login_redirect');
};

const generateRandomState = () => {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const storeAuthState = (state, redirectPath) => {
  localStorage.setItem('deriv_oauth_state', state);
  localStorage.setItem('deriv_post_login_redirect', redirectPath || '/dashboard');
};

// ==================== Logging Utilities ====================

const logOAuth = (action, data) => {
  if (OAUTH_LOGGING.enabled) {
    console.info(`[OAuth] ${action}`, data);
  }
};

const logOAuthError = (action, error) => {
  console.error(`[OAuth Error] ${action}`, error);
};

export const AuthProvider = ({ children }) => {
  // Safe initialization with error handling
  let addToast;
  try {
    const toastContext = useToast();
    addToast = toastContext.addToast;
  } catch (err) {
    console.warn('[AuthContext] ToastContext not available, using fallback', err);
    addToast = (message, type) => console.log(`[Toast Fallback] ${type}: ${message}`);
  }

  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deriv, setDeriv] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [websiteStatus, setWebsiteStatus] = useState(null);
  const [balances, setBalances] = useState({});
  const [marketTicks, setMarketTicks] = useState({});
  const [marketSubscriptions, setMarketSubscriptions] = useState([]);
  const [accessToken, setAccessToken] = useState(() => {
    try {
      return localStorage.getItem('deriv_access_token');
    } catch (err) {
      console.warn('[AuthContext] Failed to read access token from localStorage', err);
      return null;
    }
  });
  const [refreshToken, setRefreshToken] = useState(() => {
    try {
      return localStorage.getItem('deriv_refresh_token');
    } catch (err) {
      console.warn('[AuthContext] Failed to read refresh token from localStorage', err);
      return null;
    }
  });
  const [tokenExpiry, setTokenExpiry] = useState(() => {
    try {
      return Number(localStorage.getItem('deriv_token_expiry')) || null;
    } catch (err) {
      console.warn('[AuthContext] Failed to read token expiry from localStorage', err);
      return null;
    }
  });
  const [initializationStep, setInitializationStep] = useState(() => {
    try {
      return localStorage.getItem('deriv_access_token') ? 'Connecting to markets...' : '';
    } catch {
      return '';
    }
  });
  const [loginStatus, setLoginStatus] = useState(accessToken ? 'pending' : 'unauthenticated');

  const ensureDeriv = useCallback(() => {
    if (deriv) return deriv;
    const instance = initDeriv();
    setDeriv(instance);
    return instance;
  }, [deriv]);

  const normalizeAccount = useCallback((account, balanceResponse) => {
    const balancePayload = balanceResponse?.balance || {};
    const loginid = account.loginid || account.account_number || balancePayload.loginid;
    const currency = balancePayload.currency || account.currency || 'USD';
    const balance = Number(balancePayload.balance ?? account.balance ?? 0);

    return {
      ...account,
      loginid,
      account_number: account.account_number || loginid,
      balance,
      currency,
      account_type: account.account_type || (account.is_virtual ? 'virtual' : 'real'),
    };
  }, []);

  const initializeAuthenticatedSession = useCallback(async (token, reason = 'callback') => {
    if (!token) {
      throw new Error('No access token available for session initialization');
    }

    const derivInstance = ensureDeriv();
    setLoading(true);
    setInitializationStep(reason === 'restore' ? 'Restoring authentication...' : 'Authenticating...');
    setLoginStatus('initializing');
    setIsAuthenticated(false);
    setError(null);

    logOAuth('Starting authenticated trading session initialization', {
      reason,
      websocketUrl: 'wss://ws.derivws.com/websockets/v3?app_id=134275',
      timestamp: new Date().toISOString(),
    });

    derivInstance.setToken(token);

    setInitializationStep('Connecting to markets...');
    await derivInstance.connect();

    logOAuth('Websocket connected for trading session', {
      connected: derivInstance.isConnected(),
      reason,
      timestamp: new Date().toISOString(),
    });

    setInitializationStep('Authenticating...');
    const authorizationResponse = await derivInstance.authorize(token);
    const authorizePayload = authorizationResponse.authorize || {};

    logOAuth('Authorization response received', {
      loginid: authorizePayload.loginid,
      currency: authorizePayload.currency,
      isVirtual: authorizePayload.is_virtual,
      scopes: authorizePayload.scopes,
      timestamp: new Date().toISOString(),
    });

    setInitializationStep('Loading balances...');
    const accountListResponse = await derivInstance.getAccountList();
    const accountList = Array.isArray(accountListResponse.account_list) ? accountListResponse.account_list : [];

    logOAuth('Account list loaded', {
      accountCount: accountList.length,
      loginIds: accountList.map((account) => account.loginid || account.account_number).filter(Boolean),
      currencies: [...new Set(accountList.map((account) => account.currency).filter(Boolean))],
    });

    const balanceEntries = await Promise.all(
      accountList.map(async (account) => {
        const loginid = account.loginid || account.account_number;
        try {
          const balanceResponse = await derivInstance.getBalance(loginid);
          logOAuth('Balance fetch complete', {
            loginid,
            balance: balanceResponse.balance?.balance,
            currency: balanceResponse.balance?.currency,
          });
          return [loginid, normalizeAccount(account, balanceResponse)];
        } catch (err) {
          logOAuthError('Balance fetch failed', {
            loginid,
            error: err?.message || String(err),
          });
          return [loginid, normalizeAccount(account, null)];
        }
      })
    );

    const balanceMap = Object.fromEntries(balanceEntries);
    const hydratedAccounts = Object.values(balanceMap);
    const activeAccount =
      hydratedAccounts.find((account) => account.loginid === authorizePayload.loginid) ||
      hydratedAccounts.find((account) => account.account_number === authorizePayload.account_number) ||
      hydratedAccounts[0] ||
      normalizeAccount(authorizePayload, { balance: authorizePayload });

    setUser({
      accountId: activeAccount.loginid || activeAccount.account_number || authorizePayload.loginid || 'Unknown',
      balance: Number(activeAccount.balance || 0),
      currency: activeAccount.currency || authorizePayload.currency || 'USD',
      email: authorizePayload.email || '',
      accountType: activeAccount.is_virtual || activeAccount.account_type === 'virtual' ? 'Demo' : 'Real',
      loginid: activeAccount.loginid || authorizePayload.loginid,
    });
    setAccounts(hydratedAccounts);
    setBalances(balanceMap);
    setSelectedAccount(activeAccount);

    logOAuth('Active account selected', {
      loginid: activeAccount.loginid,
      accountNumber: activeAccount.account_number,
      currency: activeAccount.currency,
      balance: activeAccount.balance,
      accountType: activeAccount.account_type,
    });

    const statusResponse = await derivInstance.getWebsiteStatus();
    setWebsiteStatus(statusResponse.website_status || null);

    setInitializationStep('Connecting to markets...');
    const subscribedSymbols = [];
    await Promise.all(
      SYNTHETIC_SUBSCRIPTION_SYMBOLS.map(async (symbol) => {
        try {
          await derivInstance.subscribeTicks(symbol, (tick) => {
            setMarketTicks((current) => ({ ...current, [symbol]: tick }));
          });
          subscribedSymbols.push(symbol);
        } catch (err) {
          logOAuthError('Market subscription failed', {
            symbol,
            error: err?.message || String(err),
          });
        }
      })
    );
    setMarketSubscriptions(subscribedSymbols);

    logOAuth('Market subscriptions initialized', {
      symbols: subscribedSymbols,
      requestedSymbols: SYNTHETIC_SUBSCRIPTION_SYMBOLS,
    });

    setIsAuthenticated(true);
    setLoginStatus('authenticated');
    setInitializationStep('');
    setLoading(false);

    logOAuth('Authenticated trading session ready', {
      reason,
      accountCount: hydratedAccounts.length,
      balanceCount: Object.keys(balanceMap).length,
      marketSubscriptionCount: subscribedSymbols.length,
    });

    return {
      authorization: authorizationResponse,
      accounts: hydratedAccounts,
      balances: balanceMap,
      activeAccount,
      subscriptions: subscribedSymbols,
    };
  }, [ensureDeriv, normalizeAccount]);

  const logout = useCallback(() => {
    try {
      logOAuth('User logout initiated', { timestamp: new Date().toISOString() });

      setIsAuthenticated(false);
      setUser(null);
      setAccounts([]);
      setSelectedAccount(null);
      setAccessToken(null);
      setRefreshToken(null);
      setTokenExpiry(null);
      setLoginStatus('unauthenticated');
      setStatus('disconnected');
      setWebsiteStatus(null);
      setBalances({});
      setMarketTicks({});
      setMarketSubscriptions([]);
      setInitializationStep('');
      setError(null);

      // Safe localStorage operations
      try {
        localStorage.removeItem('deriv_access_token');
        localStorage.removeItem('deriv_refresh_token');
        localStorage.removeItem('deriv_token_expiry');
        clearStoredAuthState();
      } catch (err) {
        console.warn('[AuthContext] Failed to clear localStorage during logout', err);
      }

      if (deriv) {
        try {
          deriv.disconnect();
        } catch (err) {
          console.warn('[AuthContext] Failed to disconnect websocket during logout', err);
        }
      }

      logOAuth('Logout completed', {
        timestamp: new Date().toISOString(),
        tokensCleared: true,
        websocketDisconnected: !!deriv,
      });
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
      // Force clear state even if logout fails
      setIsAuthenticated(false);
      setUser(null);
      setAccounts([]);
      setSelectedAccount(null);
      setAccessToken(null);
      setRefreshToken(null);
      setTokenExpiry(null);
      setLoginStatus('unauthenticated');
      setStatus('disconnected');
      setWebsiteStatus(null);
      setBalances({});
      setMarketTicks({});
      setMarketSubscriptions([]);
      setInitializationStep('');
      setError(null);
    }
  }, [deriv]);

  const refreshAccessToken = useCallback(async () => {
    try {
      if (!refreshToken) {
        logOAuth('Token refresh skipped - no refresh token', {});
        return null;
      }

      setLoading(true);
      logOAuth('Refreshing access token', { timestamp: new Date().toISOString() });

      try {
        const response = await fetch('/api/oauth-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            redirect_uri: DERIV_OAUTH_CONFIG.redirect_uri,
          }),
        });

        const data = await response.json();

        logOAuth('Token refresh response received', {
          status: response.status,
          hasAccessToken: !!data.access_token,
          expiresIn: data.expires_in,
        });

        if (!response.ok || !data.access_token) {
          throw new Error(data.error || 'Failed to refresh Deriv session');
        }

        const expiry = data.expires_in ? Date.now() + data.expires_in * 1000 : null;
        try {
          localStorage.setItem('deriv_access_token', data.access_token);
          localStorage.setItem('deriv_refresh_token', data.refresh_token || refreshToken);
          if (expiry) localStorage.setItem('deriv_token_expiry', String(expiry));
        } catch (storageErr) {
          console.warn('[AuthContext] Failed to save tokens to localStorage:', storageErr);
        }

        logOAuth('Tokens refreshed successfully', {
          accessTokenLength: data.access_token.length,
          expiresIn: data.expires_in,
        });

        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token || refreshToken);
        setTokenExpiry(expiry);
        setLoginStatus('authenticated');
        setError(null);

        await initializeAuthenticatedSession(data.access_token, 'refresh');

        return data;
      } catch (err) {
        const errorMsg = err?.message || 'Token refresh failed';
        logOAuthError('Token refresh failed', { error: errorMsg });
        logout();
        throw err;
      } finally {
        setLoading(false);
      }
    } catch (outerErr) {
      console.error('[AuthContext] Critical error in refreshAccessToken:', outerErr);
      setLoading(false);
      throw outerErr;
    }
  }, [initializeAuthenticatedSession, logout, refreshToken]);

  useEffect(() => {
    try {
      const derivInstance = initDeriv();
      setDeriv(derivInstance);

      const updateStatus = (nextStatus) => {
        try {
          setStatus(nextStatus);
          if (nextStatus === 'connected') {
            addToast('Connected to Deriv and streaming live data', 'success');
          } else if (nextStatus === 'disconnected') {
            addToast('Connection lost. Reconnecting automatically...', 'warning');
          } else if (nextStatus === 'error') {
            addToast('Deriv websocket reported an error', 'error');
          }
        } catch (err) {
          console.warn('[AuthContext] Error updating status:', err);
        }
      };

      const handleError = (err) => {
        try {
          const message = err?.message || String(err);
          setError(message);
          addToast(`Deriv error: ${message}`, 'error');
        } catch (toastErr) {
          console.warn('[AuthContext] Error handling error:', toastErr);
        }
      };

      const unsubStatus = derivInstance.on('status', updateStatus);
      const unsubError = derivInstance.on('error', handleError);

      let refreshTimer = null;
      const scheduleRefresh = () => {
        if (!tokenExpiry || !refreshToken) return;
        const msUntilRefresh = tokenExpiry - Date.now() - 120000;
        if (msUntilRefresh <= 0) {
          refreshAccessToken().catch(() => {});
          return;
        }
        refreshTimer = window.setTimeout(() => {
          refreshAccessToken().catch(() => {});
        }, msUntilRefresh);
      };

      if (accessToken) {
        if (tokenExpiry && Date.now() > tokenExpiry && refreshToken) {
          logOAuth('Stored token expired, refreshing before auth restoration', {
            timestamp: new Date().toISOString(),
          });
          refreshAccessToken().catch(() => {});
        } else {
          logOAuth('Auth restoration started from persisted token', {
            timestamp: new Date().toISOString(),
          });
          initializeAuthenticatedSession(accessToken, 'restore').catch((err) => {
            logOAuthError('Auth restoration failed', {
              error: err?.message || String(err),
            });
            setLoading(false);
            setLoginStatus('unauthenticated');
            setIsAuthenticated(false);
          });
        }
        scheduleRefresh();
      } else {
        setInitializationStep('');
        setLoading(false);
      }

      return () => {
        try {
          unsubStatus();
          unsubError();
          if (refreshTimer) {
            clearTimeout(refreshTimer);
          }
        } catch (err) {
          console.warn('[AuthContext] Error during cleanup:', err);
        }
      };
    } catch (err) {
      console.error('[AuthContext] Critical error in useEffect initialization:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
      setStatus('error');
    }
  }, [accessToken, addToast, initializeAuthenticatedSession, refreshAccessToken, refreshToken, tokenExpiry]);

  const login = useCallback(() => {
    const state = generateRandomState();
    const redirectPath = window.location.pathname === '/' ? '/dashboard' : window.location.pathname;
    storeAuthState(state, redirectPath);

    const oauthParams = new URLSearchParams({
      response_type: DERIV_OAUTH_CONFIG.response_type,
      client_id: DERIV_OAUTH_CONFIG.client_id,
      redirect_uri: DERIV_OAUTH_CONFIG.redirect_uri,
      scope: DERIV_OAUTH_CONFIG.scope,
      state,
    });

    const oauthUrl = `${DERIV_OAUTH_CONFIG.authorize_url}?${oauthParams.toString()}`;

    logOAuth('Initiating OAuth login flow', {
      endpoint: DERIV_OAUTH_CONFIG.authorize_url,
      client_id: DERIV_OAUTH_CONFIG.client_id,
      redirect_uri: DERIV_OAUTH_CONFIG.redirect_uri,
      scope: DERIV_OAUTH_CONFIG.scope,
      state: state.substring(0, 8) + '...', // Don't log full state
      postLoginRedirect: redirectPath,
      timestamp: new Date().toISOString(),
    });

    logOAuth('Generated OAuth URL', {
      url: oauthUrl,
      length: oauthUrl.length,
    });

    window.location.href = oauthUrl;
  }, []);

  const handleCallback = useCallback(
    async (callbackInput, stateArg) => {
      const callbackData =
        typeof callbackInput === 'object' && callbackInput !== null
          ? callbackInput
          : { code: callbackInput, state: stateArg };
      const {
        code,
        state,
        accessToken: tokenFromCallback,
        expiresIn,
        params: callbackParams = {},
      } = callbackData;

      setLoading(true);
      setError(null);
      const storedState = getStoredState();

      logOAuth('OAuth callback received', {
        path: window.location.pathname,
        hasCode: !!code,
        hasDirectToken: !!tokenFromCallback,
        hasState: !!state,
        stateMatches: state === storedState,
        storedStateExists: !!storedState,
        paramKeys: Object.keys(callbackParams),
        timestamp: new Date().toISOString(),
      });

      if (storedState && state && storedState !== state) {
        const errorMsg = 'Invalid OAuth state. Please try logging in again.';
        logOAuthError('State validation failed', {
          storedState: storedState?.substring(0, 8) + '...',
          receivedState: state?.substring(0, 8) + '...',
          match: state === storedState,
        });
        clearStoredAuthState();
        throw new Error(errorMsg);
      }

      if (!code && tokenFromCallback) {
        try {
          const expiry = expiresIn ? Date.now() + Number(expiresIn) * 1000 : null;
          localStorage.setItem('deriv_access_token', tokenFromCallback);
          localStorage.setItem('deriv_refresh_token', '');
          if (expiry) {
            localStorage.setItem('deriv_token_expiry', String(expiry));
          }

          logOAuth('Direct OAuth token received in callback', {
            tokenLength: tokenFromCallback.length,
            expiresIn,
            expiryTime: expiry ? new Date(expiry).toISOString() : null,
          });

          setAccessToken(tokenFromCallback);
          setRefreshToken('');
          setTokenExpiry(expiry);
          const redirectPath = getPostLoginRedirect();
          clearStoredAuthState();
          await initializeAuthenticatedSession(tokenFromCallback, 'callback-token');
          return redirectPath;
        } catch (err) {
          const errorMsg = err.message || 'OAuth token callback failed';
          logOAuthError('Direct token callback processing failed', {
            error: errorMsg,
            stack: err.stack,
          });
          setError(errorMsg);
          setLoginStatus('unauthenticated');
          throw err;
        } finally {
          setLoading(false);
        }
      }

      if (!code) {
        const errorMsg = 'No authorization code received from Deriv';
        logOAuthError('Missing authorization code', {
          code,
          hasDirectToken: !!tokenFromCallback,
          paramKeys: Object.keys(callbackParams),
        });
        clearStoredAuthState();
        throw new Error(errorMsg);
      }

      try {
        logOAuth('Exchanging authorization code for tokens', {
          codeLength: code.length,
          redirectUri: DERIV_OAUTH_CONFIG.redirect_uri,
          endpoint: '/api/oauth-token',
        });

        const response = await fetch('/api/oauth-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: DERIV_OAUTH_CONFIG.redirect_uri,
          }),
        });

        const responseText = await response.text();
        let data = {};
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch {
          data = { error: responseText || 'Invalid token response' };
        }

        logOAuth('Token exchange response received', {
          status: response.status,
          hasAccessToken: !!data.access_token,
          hasRefreshToken: !!data.refresh_token,
          expiresIn: data.expires_in,
          error: data.error,
          errorDescription: data.error_description,
          timestamp: new Date().toISOString(),
        });

        if (!response.ok || !data.access_token) {
          throw new Error(data.error_description || data.error || 'Failed to exchange code for token');
        }

        const expiry = data.expires_in ? Date.now() + data.expires_in * 1000 : null;
        localStorage.setItem('deriv_access_token', data.access_token);
        localStorage.setItem('deriv_refresh_token', data.refresh_token || '');
        if (expiry) {
          localStorage.setItem('deriv_token_expiry', String(expiry));
        }

        logOAuth('Tokens stored successfully', {
          accessTokenLength: data.access_token.length,
          expiresIn: data.expires_in,
          expiryTime: new Date(expiry).toISOString(),
        });

        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token || '');
        setTokenExpiry(expiry);
        const redirectPath = getPostLoginRedirect();
        clearStoredAuthState();
        await initializeAuthenticatedSession(data.access_token, 'callback');

        logOAuth('OAuth callback completed', {
          redirectPath,
          timestamp: new Date().toISOString(),
        });

        return redirectPath;
      } catch (err) {
        const errorMsg = err.message || 'OAuth callback failed';
        logOAuthError('Callback processing failed', {
          error: errorMsg,
          stack: err.stack,
        });
        setError(errorMsg);
        setLoginStatus('unauthenticated');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [initializeAuthenticatedSession]
  );

  const connectDeriv = useCallback(async () => {
    if (!deriv) return;
    setLoading(true);
    try {
      await deriv.connect();
    } catch (err) {
      setError(err.message || 'Deriv connection failed');
    } finally {
      setLoading(false);
    }
  }, [deriv]);

  const authorize = useCallback(async () => {
    if (!deriv) {
      throw new Error('Deriv is not available');
    }
    if (!accessToken) {
      throw new Error('No access token available');
    }
    setLoading(true);
    try {
      return initializeAuthenticatedSession(accessToken, 'manual');
    } catch (err) {
      setError(err.message || 'Authorization failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [deriv, accessToken, initializeAuthenticatedSession]);

  try {
    return (
      <AuthContext.Provider
        value={{
          user,
          accounts,
          selectedAccount,
          setSelectedAccount,
          isAuthenticated,
          loading,
          deriv,
          status,
          error,
          websiteStatus,
          balances,
          marketTicks,
          marketSubscriptions,
          initializationStep,
          accessToken,
          login,
          handleCallback,
          connectDeriv,
          authorize,
          logout,
          loginStatus,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  } catch (err) {
    console.error('[AuthContext] Critical error in AuthProvider render:', err);
    // Fallback UI to prevent blank screen
    return (
      <AuthContext.Provider
        value={{
          user: null,
          accounts: [],
          selectedAccount: null,
          setSelectedAccount: () => {},
          isAuthenticated: false,
          loading: false,
          deriv: null,
          status: 'error',
          error: 'Authentication system failed to initialize',
          websiteStatus: null,
          balances: {},
          marketTicks: {},
          marketSubscriptions: [],
          initializationStep: '',
          accessToken: null,
          login: () => {},
          handleCallback: () => {},
          connectDeriv: () => {},
          authorize: () => {},
          logout: () => {},
          loginStatus: 'error',
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
