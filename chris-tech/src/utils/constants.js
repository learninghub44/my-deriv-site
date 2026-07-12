/**
 * Constants
 * Application-wide constants
 */

export const SYNTHETIC_INDICES = {
  R_10: { name: 'Volatility 10', multiplier: 10 },
  R_25: { name: 'Volatility 25', multiplier: 25 },
  R_50: { name: 'Volatility 50', multiplier: 50 },
  R_75: { name: 'Volatility 75', multiplier: 75 },
  R_100: { name: 'Volatility 100', multiplier: 100 },
};

export const DURATIONS = [
  { label: '15 seconds', value: '15s' },
  { label: '30 seconds', value: '30s' },
  { label: '1 minute', value: '1m' },
  { label: '5 minutes', value: '5m' },
  { label: '15 minutes', value: '15m' },
  { label: '1 hour', value: '1h' },
];

export const CONTRACT_TYPES = {
  CALL: 'CALL',
  PUT: 'PUT',
  HIGHER: 'HIGHER',
  LOWER: 'LOWER',
};

export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const API_ENDPOINTS = {
  // Websocket connection URL is no longer static - it's minted per-account via
  // REST (POST /trading/v1/options/accounts/{id}/otp), see src/services/deriv.js
  BALANCE: '/balance',
  PROPOSAL: '/proposal',
  BUY: '/buy',
  SELL: '/sell',
  PORTFOLIO: '/portfolio',
  TICKS: '/ticks',
  TICKS_HISTORY: '/ticks_history',
  ACTIVE_SYMBOLS: '/active_symbols',
  WEBSITE_STATUS: '/website_status',
};

// Default production URL (Cloudflare Pages) - can be overridden via env var
const DEFAULT_APP_URL = 'https://my-deriv-site.pages.dev';

/**
 * Deriv OAuth Configuration
 * Uses official OAuth 2.0 endpoint with proper scopes and redirect handling
 * Falls back to Chris Tech's own App ID/domain if env vars aren't set.
 */
export const DERIV_OAUTH_CONFIG = {
  authorize_url: 'https://auth.deriv.com/oauth2/auth',
  token_url: 'https://auth.deriv.com/oauth2/token',
  client_id: import.meta.env.VITE_DERIV_APP_ID || '33NNVvIyYD0iFQM4vlZJn',
  redirect_uri: import.meta.env.VITE_DERIV_OAUTH_REDIRECT_URI || `${DEFAULT_APP_URL}/auth/callback`,
  scope: 'trade account_manage',
  response_type: 'code',
};

/**
 * Logging configuration for OAuth debugging
 */
export const OAUTH_LOGGING = {
  enabled: true,
  logUrlGeneration: true,
  logCallbackParsing: true,
  logTokenExchange: true,
  logWebsocketAuth: true,
  logRedirects: true,
};
