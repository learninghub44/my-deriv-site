import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const logCallback = (msg, data) => {
  console.info(`[Callback] ${msg}`, {
    ...data,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  });
};

const logCallbackError = (msg, error) => {
  console.error(`[Callback Error] ${msg}`, {
    error: error?.message || String(error),
    stack: error?.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
  });
};

export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback, initializationStep } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const hashRaw = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
    const hashParams = new URLSearchParams(hashRaw);
    const queryParams = Object.fromEntries(searchParams.entries());
    const hashParamsObject = Object.fromEntries(hashParams.entries());
    const code = searchParams.get('code') || hashParams.get('code');
    const state = searchParams.get('state') || hashParams.get('state');
    const tokenFromCallback =
      searchParams.get('access_token') ||
      hashParams.get('access_token') ||
      searchParams.get('token1') ||
      hashParams.get('token1');
    const expiresIn =
      searchParams.get('expires_in') ||
      hashParams.get('expires_in') ||
      searchParams.get('expires') ||
      hashParams.get('expires');
    const errorParam = searchParams.get('error') || hashParams.get('error');
    const errorDescription =
      searchParams.get('error_description') || hashParams.get('error_description');
    const callbackParams = { ...queryParams, ...hashParamsObject };

    logCallback('OAuth callback page loaded', {
      hasCode: !!code,
      codeLength: code?.length || 0,
      hasAccessToken: !!tokenFromCallback,
      tokenLength: tokenFromCallback?.length || 0,
      hasState: !!state,
      hasError: !!errorParam,
      errorParam,
      params: callbackParams,
      paramKeys: Object.keys(callbackParams),
      path: window.location.pathname,
      search: window.location.search,
    });
    console.info('[Callback] Deriv OAuth callback params', {
      code,
      state,
      access_token: tokenFromCallback,
      expires_in: expiresIn,
      error: errorParam,
      error_description: errorDescription,
      params: callbackParams,
      queryParams,
      hashParams: hashParamsObject,
      url: window.location.href,
    });

    // Check for OAuth error from Deriv
    if (errorParam) {
      const errorMsg = errorDescription || errorParam;
      logCallbackError('OAuth error from Deriv', {
        error: errorParam,
        description: errorDescription,
      });
      addToast(`OAuth error: ${errorMsg}`, 'error');
      navigate('/', { replace: true });
      return;
    }

    // Validate that we have an authorization code
    if (!code && !tokenFromCallback) {
      logCallbackError('Missing authorization code or access token in callback', {
        code,
        state,
        hasAccessToken: !!tokenFromCallback,
        params: callbackParams,
      });
      addToast('Invalid callback: missing authorization code or access token', 'error');
      navigate('/', { replace: true });
      return;
    }

    handleCallback({
      code,
      state,
      accessToken: tokenFromCallback,
      expiresIn: expiresIn ? Number(expiresIn) : undefined,
      params: callbackParams,
    })
      .then((redirectPath) => {
        logCallback('OAuth callback processed successfully', {
          redirectPath,
          codeLength: code?.length || 0,
          usedDirectToken: !!tokenFromCallback && !code,
        });
        navigate(redirectPath || '/dashboard', { replace: true });
      })
      .catch((err) => {
        logCallbackError('Callback processing failed', err);
        const errorMsg = err?.message || 'Deriv login failed';
        addToast(errorMsg, 'error');
        navigate('/', { replace: true });
      });
  }, [searchParams, handleCallback, navigate, addToast]);

  return <LoadingSpinner fullScreen message={initializationStep || 'Authenticating...'} />;
}