# Deriv OAuth 2.0 Setup & Configuration Guide

## Overview

DigitPrinters uses Deriv's official OAuth 2.0 authorization flow for secure user authentication. This guide covers the complete setup, configuration, and troubleshooting for production `https://www.digitprinters.site`.

---

## OAuth Flow

```
User → Home Page
  ↓
User clicks "Login with Deriv"
  ↓
App generates OAuth state token
  ↓
Redirect to: https://oauth.deriv.com/oauth2/authorize
  ├─ client_id=<NEW_OAUTH_CLIENT_ID>
  ├─ redirect_uri=https://www.digitprinters.site/auth/callback
  ├─ scope=read+write
  └─ state=<random_state>
  ↓
User sees Deriv authorization screen
  ├─ Shows app name
  ├─ Shows requested scopes and permissions
  └─ User clicks "Authorize" or "Decline"
  ↓
Deriv redirects to: https://www.digitprinters.site/auth/callback?code=<code>&state=<state>
  ↓
Callback page validates state and exchanges code
  ↓
Backend (/api/oauth-token) exchanges code for tokens
  ├─ POST https://oauth.deriv.com/oauth2/token
  ├─ Payload: grant_type=authorization_code, client_id, client_secret, code, redirect_uri
  └─ Response: { access_token, refresh_token, expires_in }
  ↓
App stores tokens in localStorage
  ├─ deriv_access_token
  ├─ deriv_refresh_token
  └─ deriv_token_expiry
  ↓
App connects websocket with access token
  └─ wss://ws.derivws.com/websockets/v3?app_id=134275
  ↓
Websocket authorizes with token
  ├─ send { authorize: <access_token> }
  └─ Receive authorization response with account data
  ↓
User is logged in and sees dashboard
```

---

## Configuration

### 1. Environment Variables

#### Local Development (`.env`)

```env
# Client-side (visible in browser)
VITE_DERIV_OAUTH_CLIENT_ID=<NEW_OAUTH_CLIENT_ID>
VITE_DERIV_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback

# Backend / server-side values are not committed
# DERIV_OAUTH_CLIENT_SECRET=<your_client_secret>
# DERIV_OAUTH_CLIENT_ID=<NEW_OAUTH_CLIENT_ID>
# DERIV_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
```

#### Production (Vercel Environment Variables)

Set these in Vercel dashboard → Settings → Environment Variables:

**Client-side:**
```
VITE_DERIV_OAUTH_CLIENT_ID=<NEW_OAUTH_CLIENT_ID>
VITE_DERIV_OAUTH_REDIRECT_URI=https://www.digitprinters.site/auth/callback
```

**Server-side (Backend API):**
```
DERIV_OAUTH_CLIENT_SECRET=<your_client_secret>
DERIV_OAUTH_CLIENT_ID=<NEW_OAUTH_CLIENT_ID>
DERIV_OAUTH_REDIRECT_URI=https://www.digitprinters.site/auth/callback
```

### 2. Deriv App Configuration

Log in to [Deriv API Dashboard](https://app.deriv.com/account/api-token):

1. Go to "API Tokens" section
2. Register your application:
   - **App Name**: DigitPrinters
   - **App Category**: Trading Platform
   - **Redirect URIs**:
     - Production: `https://www.digitprinters.site/auth/callback`
     - Non-www alias: `https://digitprinters.site/auth/callback`
     - Local: `http://localhost:5173/auth/callback` (for local development)

3. Note the generated:
   - **OAuth Client ID**: `<NEW_OAUTH_CLIENT_ID>`
   - **Client Secret**: (Keep this secret! Never commit to repo)

### 3. Vercel Configuration

In Vercel dashboard for the project:

1. **Settings → Environment Variables**
   - Add `DERIV_OAUTH_CLIENT_SECRET`
   - Add `DERIV_OAUTH_CLIENT_ID`
   - Add `DERIV_OAUTH_REDIRECT_URI`

2. **Settings → Domains**
   - Ensure primary production domain is `www.digitprinters.site`
   - Verify non-www traffic is redirected to `www`

---

## File Structure

```
src/
├── context/
│   └── AuthContext.jsx          # OAuth state management, token storage
├── pages/
│   ├── Home.jsx                 # Login entry point
│   ├── Callback.jsx             # OAuth callback handler
│   └── Dashboard.jsx            # Protected route
├── components/common/
│   ├── ProtectedRoute.jsx       # Route guard (prevent redirect loops)
│   └── Navbar.jsx               # Logout functionality
├── services/
│   └── deriv.js                 # Websocket connection & authorization
├── utils/
│   └── constants.js             # OAuth config constants
└── hooks/
    ├── useAuthorize.js          # Custom authorization hook
    └── useDeriv.js              # Custom Deriv hook

api/
└── oauth-token.js               # Token exchange endpoint

vercel.json                       # Routing & deployment config
.env                             # Local development secrets
.env.example                     # Environment variable template
```

---

## Key Components

### 1. AuthContext (`src/context/AuthContext.jsx`)

Manages OAuth flow and token lifecycle:

- **`login()`**: Generates OAuth state, builds authorization URL, redirects to Deriv
- **`handleCallback(code, state)`**: Validates state, exchanges code for token
- **`refreshAccessToken()`**: Renews expired tokens using refresh token
- **`logout()`**: Clears tokens and disconnects websocket

**Token Storage (localStorage):**
```javascript
deriv_access_token      // OAuth access token
deriv_refresh_token     // For token refresh
deriv_token_expiry      // Timestamp when token expires
deriv_oauth_state       // Temporary state for CSRF protection
deriv_post_login_redirect // Path to redirect after login
```

### 2. Callback Page (`src/pages/Callback.jsx`)

Handles OAuth callback:

1. Validates URL parameters: `code` and `state`
2. Checks for OAuth errors from Deriv
3. Calls `handleCallback()` to process authentication
4. Redirects to dashboard on success or home on error
5. Logs detailed information for debugging

### 3. ProtectedRoute (`src/components/common/ProtectedRoute.jsx`)

Guards protected routes:

- Prevents redirect loops by checking authentication state
- Shows loading spinner while verifying auth
- Stores attempted path for redirect after login

### 4. OAuth Token Endpoint (`api/oauth-token.js`)

Backend API for secure token exchange:

- **Endpoint**: `/api/oauth-token`
- **Method**: POST
- **Payload**:
  ```json
  {
    "code": "authorization_code_from_deriv",
    "redirect_uri": "https://www.digitprinters.site/auth/callback"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "token_for_deriv_api",
    "refresh_token": "token_for_refresh",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
  ```

### 5. Deriv WebSocket (`src/services/deriv.js`)

Manages websocket connection:

- Connects to `wss://ws.derivws.com/websockets/v3`
- Uses legacy websocket app_id: `134275`
- Authorizes with OAuth token: `{ authorize: access_token }`
- Handles reconnection logic
- Manages live tick subscriptions

---

## Logging & Debugging

### Enable Detailed Logging

In `src/utils/constants.js`:

```javascript
export const OAUTH_LOGGING = {
  enabled: true,
  logUrlGeneration: true,
  logCallbackParsing: true,
  logTokenExchange: true,
  logWebsocketAuth: true,
  logRedirects: true,
};
```

### Browser Console Logs

Look for these prefixes:

- `[OAuth]` - OAuth flow events
- `[OAuth Error]` - OAuth errors
- `[Callback]` - Callback page events
- `[DerivWS]` - WebSocket events
- `[ProtectedRoute]` - Route access events
- `[Home]` - Home page events

### Vercel Logs

Check Vercel dashboard:

1. Go to project → Deployments
2. Select latest deployment → Functions
3. Look for `api/oauth-token` logs

---

## Troubleshooting

### Issue: Blank Screen After Login

**Cause**: Websocket authorization failing

**Solution**:
1. Check browser console for `[DerivWS Error]`
2. Verify `DERIV_OAUTH_CLIENT_SECRET` is set in Vercel
3. Ensure redirect URI matches Deriv app configuration
4. Check network tab → WebSocket tab for connection errors

### Issue: "Invalid OAuth State"

**Cause**: State validation failed (CSRF protection)

**Solution**:
1. Clear localStorage (DevTools → Application)
2. Clear browser cookies for `www.digitprinters.site`
3. Try logging in again
4. Check if redirect URI domain changed

### Issue: Token Exchange Failed (502 Error)

**Cause**: Backend configuration issue

**Solution**:
1. Verify `DERIV_OAUTH_CLIENT_SECRET` is set in Vercel
2. Check Vercel function logs for `/api/oauth-token`
3. Ensure `redirect_uri` in request matches Deriv app configuration
4. Verify Deriv API endpoint is accessible: https://oauth.deriv.com/oauth2/token

### Issue: Redirect Loop (Keeps Going to Home)

**Cause**: Authentication not persisting properly

**Solution**:
1. Check browser console for errors
2. Verify localStorage tokens are being stored
3. Check if websocket authorization succeeds
4. Look for CORS errors in browser network tab

### Issue: "Domain Mismatch" Error

**Cause**: Redirect URI doesn't match Deriv app configuration

**Solution**:
1. Go to [Deriv API Dashboard](https://app.deriv.com/account/api-token)
2. Edit app configuration
3. Add all redirect URIs:
   - `https://www.digitprinters.site/auth/callback`
   - `https://digitprinters.site/auth/callback`
   - `http://localhost:5173/auth/callback` (local dev)
4. Save changes
5. Clear browser cache and try again

---

## Production Checklist

Before deploying to production:

- [ ] Set `DERIV_OAUTH_CLIENT_SECRET` in Vercel Environment Variables
- [ ] Verify Deriv OAuth client ID is configured in Vercel
- [ ] Add `https://www.digitprinters.site/auth/callback` to Deriv app redirect URIs
- [ ] Add `https://digitprinters.site/auth/callback` as a non-www alias if needed
- [ ] Verify `.env` is in `.gitignore` (never commit secrets)
- [ ] Test login flow end-to-end on staging
- [ ] Check browser console for any errors
- [ ] Verify websocket connects after login
- [ ] Test token refresh (wait for token to near expiry)
- [ ] Test logout functionality
- [ ] Verify protected routes are not accessible without login

---

## Security Best Practices

1. **Never commit secrets**: `.env` files with credentials should always be in `.gitignore`
2. **Use HTTPS only**: All OAuth URLs must use HTTPS in production
3. **State token validation**: Always validate state to prevent CSRF attacks
4. **Token storage**: Access tokens are stored in localStorage (XSS vulnerability if site is compromised)
   - Consider using httpOnly cookies in future versions
5. **Token expiry**: Implement automatic token refresh before expiry
6. **Logout**: Always clear tokens and disconnect websocket on logout
7. **Domain whitelist**: Register all redirect URIs in Deriv app configuration

---

## Testing

### Local Development

```bash
# Start dev server
npm run dev

# Dev server runs on: http://localhost:5173
# Update .env to use local redirect URI:
# VITE_DERIV_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback

# Don't forget to add this URI to Deriv app configuration!
```

### Manual Testing Checklist

1. Click "Login with Deriv"
2. Verify redirect to Deriv authorization page
3. Check URL contains: `client_id`, `redirect_uri`, `scope`, `state`
4. Authorize on Deriv page
5. Verify callback to `/auth/callback`
6. Check browser console for successful token exchange
7. Verify redirect to dashboard
8. Check localStorage for tokens
9. Verify websocket connection in DevTools Network tab
10. Test logout
11. Verify tokens are cleared

---

## References

- [Deriv OAuth Documentation](https://api.deriv.com/docs/auth)
- [OAuth 2.0 Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-1.3.1)
- [Deriv API Dashboard](https://app.deriv.com/account/api-token)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

---

## Support

For issues:

1. Check browser console logs (prefix: `[OAuth]`, `[DerivWS]`, etc.)
2. Check Vercel function logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure redirect URI matches in both `.env` and Deriv app configuration
5. Test with incognito/private browser window to rule out cache issues
