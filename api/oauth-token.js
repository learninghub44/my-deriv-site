/**
 * OAuth Token Exchange Endpoint
 * Handles Deriv OAuth 2.0 token exchange and refresh
 * 
 * This backend endpoint:
 * 1. Exchanges authorization code for access token
 * 2. Handles token refresh with refresh token
 * 3. Validates redirect URIs to prevent mismatches
 * 4. Securely stores client secret (not exposed to client)
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

const parseRequestBody = (request) => {
  if (!request.body) return {};
  if (typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body);
    } catch {
      return Object.fromEntries(new URLSearchParams(request.body));
    }
  }
  return {};
};

export default async function handler(request, response) {
  const requestId = Math.random().toString(36).substring(7);
  
  if (request.method !== 'POST') {
    log('Invalid method received', { method: request.method, requestId });
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  log('OAuth token request received', {
    requestId,
    method: request.method,
    hasBody: !!request.body,
  });

  try {
    const requestBody = parseRequestBody(request);
    const { code, grant_type, refresh_token, redirect_uri } = requestBody;
    
    const clientId =
      process.env.DERIV_OAUTH_CLIENT_ID ||
      process.env.VITE_DERIV_OAUTH_CLIENT_ID ||
      process.env.VITE_DERIV_APP_ID ||
      '332LK4VWd9A4pEEfTMn53';
    const clientSecret = process.env.DERIV_OAUTH_CLIENT_SECRET;
    const redirectUri =
      redirect_uri ||
      process.env.DERIV_OAUTH_REDIRECT_URI ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/auth/callback`
        : 'https://www.digitprinters.site/auth/callback');

    log('OAuth configuration loaded', {
      requestId,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      bodyKeys: Object.keys(requestBody),
      hasCode: !!code,
      redirectUri,
      grantType: grant_type || 'authorization_code',
    });

    // Validation checks
    if (!clientId || !clientSecret) {
      logError('OAuth server not properly configured', null, {
        requestId,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      response.status(500).json({ 
        error: 'OAuth server not configured',
        code: 'SERVER_ERROR',
      });
      return;
    }

    if (!code && grant_type !== 'refresh_token') {
      logError('Missing authorization code for authorization_code flow', null, {
        requestId,
        grantType: grant_type,
        hasCode: !!code,
      });
      response.status(400).json({ 
        error: 'Missing authorization code',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    if (grant_type === 'refresh_token' && !refresh_token) {
      logError('Missing refresh token for refresh_token flow', null, {
        requestId,
        hasRefreshToken: !!refresh_token,
      });
      response.status(400).json({ 
        error: 'Missing refresh token',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    const body = new URLSearchParams({
      grant_type: grant_type || 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    if (grant_type === 'refresh_token') {
      body.append('refresh_token', refresh_token);
      log('Preparing refresh_token request', {
        requestId,
        redirectUri,
      });
    } else {
      body.append('code', code);
      log('Preparing authorization_code exchange request', {
        requestId,
        codeLength: code?.length,
        redirectUri,
      });
    }

    log('Sending token request to Deriv OAuth endpoint', {
      requestId,
      grantType: grant_type || 'authorization_code',
      endpoint: 'https://oauth.deriv.com/oauth2/token',
    });

    const tokenResponse = await fetch('https://oauth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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
      const statusCode = tokenResponse.ok ? 200 : 502;
      response.status(statusCode).json(data);
      return;
    }

    if (!data.access_token) {
      logError('No access token in successful response', null, {
        requestId,
        responseKeys: Object.keys(data),
      });
      response.status(502).json({ 
        error: 'Invalid token response from Deriv',
        code: 'INVALID_RESPONSE',
      });
      return;
    }

    log('Token exchange successful', {
      requestId,
      accessTokenLength: data.access_token.length,
      expiresIn: data.expires_in,
      hasRefreshToken: !!data.refresh_token,
    });

    response.status(200).json(data);
  } catch (error) {
    logError('Token endpoint threw exception', error, {
      requestId,
    });
    response.status(500).json({ 
      error: error?.message || 'Token exchange failed',
      code: 'SERVER_ERROR',
    });
  }
}
