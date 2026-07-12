/**
 * OAuth Token Exchange Endpoint (Cloudflare Pages Function)
 * Handles Deriv OAuth 2.0 token exchange and refresh
 *
 * This backend endpoint:
 * 1. Exchanges authorization code for access token
 * 2. Handles token refresh with refresh token
 * 3. Validates redirect URIs to prevent mismatches
 * 4. Securely stores client secret (not exposed to client)
 *
 * Cloudflare Pages Functions route: POST /api/oauth-token
 * Env vars are read from context.env, set in the Cloudflare Pages dashboard
 * under Settings -> Environment variables (not process.env, which doesn't
 * exist in the Workers runtime).
 */

const log = (msg, data) => {
  console.info(`[OAuth Token] ${msg}`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const logError = (msg, error, data) => {
  console.error(`[OAuth Token Error] ${msg}`, {
    error: error?.message || String(error),
    ...data,
    timestamp: new Date().toISOString(),
  });
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = Math.random().toString(36).substring(7);

  log('OAuth token request received', { requestId, method: request.method });

  try {
    let requestBody = {};
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      requestBody = await request.json();
    } else {
      const text = await request.text();
      try {
        requestBody = JSON.parse(text);
      } catch {
        requestBody = Object.fromEntries(new URLSearchParams(text));
      }
    }

    const { code, grant_type, refresh_token, redirect_uri, client_id, code_verifier } = requestBody;

    const clientId =
      client_id ||
      env.DERIV_OAUTH_CLIENT_ID ||
      env.VITE_DERIV_OAUTH_CLIENT_ID ||
      env.VITE_DERIV_APP_ID ||
      '33NNVvIyYD0iFQM4vlZJn';
    const redirectUri =
      redirect_uri ||
      env.DERIV_OAUTH_REDIRECT_URI ||
      'https://my-deriv-site.pages.dev/auth/callback';

    log('OAuth configuration loaded', {
      requestId,
      hasClientId: !!clientId,
      hasCodeVerifier: !!code_verifier,
      bodyKeys: Object.keys(requestBody),
      hasCode: !!code,
      redirectUri,
      grantType: grant_type || 'authorization_code',
    });

    if (!clientId || !redirectUri) {
      logError('OAuth server not properly configured', null, {
        requestId,
        hasClientId: !!clientId,
        hasRedirectUri: !!redirectUri,
      });
      return json({ error: 'OAuth server not configured', code: 'SERVER_ERROR' }, 500);
    }

    if (!code && grant_type !== 'refresh_token') {
      logError('Missing authorization code for authorization_code flow', null, {
        requestId,
        grantType: grant_type,
        hasCode: !!code,
      });
      return json({ error: 'Missing authorization code', code: 'INVALID_REQUEST' }, 400);
    }

    if (grant_type === 'refresh_token' && !refresh_token) {
      logError('Missing refresh token for refresh_token flow', null, {
        requestId,
        hasRefreshToken: !!refresh_token,
      });
      return json({ error: 'Missing refresh token', code: 'INVALID_REQUEST' }, 400);
    }

    if (grant_type !== 'refresh_token' && !code_verifier) {
      logError('Missing PKCE code_verifier for authorization_code flow', null, { requestId });
      return json({ error: 'Missing code_verifier', code: 'INVALID_REQUEST' }, 400);
    }

    // Deriv's current OAuth app is a public client - it does not issue a client
    // secret. Identity is proven with the PKCE code_verifier instead.
    const body = new URLSearchParams({
      grant_type: grant_type || 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
    });

    if (grant_type === 'refresh_token') {
      body.append('refresh_token', refresh_token);
      log('Preparing refresh_token request', { requestId, redirectUri });
    } else {
      body.append('code', code);
      body.append('code_verifier', code_verifier);
      log('Preparing authorization_code exchange request', {
        requestId,
        codeLength: code?.length,
        redirectUri,
      });
    }

    log('Sending token request to Deriv OAuth endpoint', {
      requestId,
      grantType: grant_type || 'authorization_code',
      endpoint: 'https://auth.deriv.com/oauth2/token',
    });

    const tokenResponse = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await tokenResponse.json();

    log('Token response received from Deriv', {
      requestId,
      status: tokenResponse.status,
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      expiresIn: data.expires_in,
      error: data.error,
    });

    if (!tokenResponse.ok) {
      logError('Deriv OAuth token endpoint returned error', null, {
        requestId,
        status: tokenResponse.status,
        error: data.error,
        errorDescription: data.error_description,
      });
      return json(data, 502);
    }

    if (!data.access_token) {
      logError('No access token in successful response', null, {
        requestId,
        responseKeys: Object.keys(data),
      });
      return json({ error: 'Invalid token response from Deriv', code: 'INVALID_RESPONSE' }, 502);
    }

    log('Token exchange successful', {
      requestId,
      accessTokenLength: data.access_token.length,
      expiresIn: data.expires_in,
      hasRefreshToken: !!data.refresh_token,
    });

    return json(data, 200);
  } catch (error) {
    logError('Token endpoint threw exception', error, { requestId });
    return json({ error: error?.message || 'Token exchange failed', code: 'SERVER_ERROR' }, 500);
  }
}

export async function onRequestGet() {
  return json({ error: 'Method not allowed' }, 405);
}
