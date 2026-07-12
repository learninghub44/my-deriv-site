# Vercel Deployment Guide - Deriv OAuth Setup

## Prerequisites

- Vercel project already connected to GitHub repository
- Deriv OAuth app registered with App ID: `332LK4VWd9A4pEEfTMn53`
- Client Secret obtained from Deriv OAuth app settings

---

## Step 1: Get Your Deriv OAuth Credentials

1. Go to [Deriv API Dashboard](https://app.deriv.com/account/api-token)
2. Register or edit your application
3. Note your:
   - **App ID**: `332LK4VWd9A4pEEfTMn53`
   - **Client Secret**: (keep safe!)

4. Add redirect URI to Deriv app configuration:
   - `https://digitprinters.site/auth/callback`

---

## Step 2: Set Vercel Environment Variables

1. Go to Vercel dashboard
2. Select the "digitprinters.site" project
3. Click "Settings" → "Environment Variables"
4. Add the following variables:

### Production Variables

```
DERIV_OAUTH_CLIENT_ID
Value: 332LK4VWd9A4pEEfTMn53

DERIV_OAUTH_CLIENT_SECRET
Value: <your_client_secret_from_deriv>

DERIV_OAUTH_REDIRECT_URI
Value: https://digitprinters.site/auth/callback

VITE_DERIV_APP_ID
Value: 332LK4VWd9A4pEEfTMn53

VITE_DERIV_OAUTH_REDIRECT_URI
Value: https://digitprinters.site/auth/callback
```

**Apply these to:**
- ✅ Production
- ✅ Preview
- ✅ Development

---

## Step 3: Verify vercel.json Configuration

The project's `vercel.json` should have:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "digitprinters/dist",
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.digitprinters.site"
        }
      ],
      "destination": "https://digitprinters.site/:path*",
      "statusCode": 301
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures:
- ✅ API routes work: `/api/oauth-token`
- ✅ OAuth callbacks routed: `/auth/callback`, `/callback`, `/oauth/callback`
- ✅ SPA fallback: All other routes use `index.html`
- ✅ www redirect: Canonical domain enforcement

---

## Step 4: Deploy

### Option A: Automatic Deploy (Recommended)

1. Push your changes to the main branch:
```bash
git add .
git commit -m "Fix: Complete Deriv OAuth 2.0 authentication system"
git push origin main
```

2. Vercel automatically deploys
3. Check deployment status at vercel.com/deployments

### Option B: Manual Deploy

1. Go to Vercel dashboard
2. Select the project
3. Click "Deployments" → "Redeploy" (on latest commit)

---

## Step 5: Test OAuth Flow

### 1. Test Home Page
- Navigate to `https://digitprinters.site`
- Should show login screen (not redirect loop)

### 2. Test Login
- Click "Login with Deriv"
- Should redirect to Deriv authorization page
- Should show app name and requested scopes

### 3. Test Authorization
- Click "Authorize" on Deriv page
- Should redirect back to `https://digitprinters.site/auth/callback?code=...&state=...`

### 4. Test Callback
- Callback page should process silently
- Should show loading spinner briefly
- Should redirect to dashboard

### 5. Test Dashboard
- Should show dashboard with live data
- Should show user account information
- Check browser DevTools for websocket connection

### 6. Test Logout
- Click logout button
- Should redirect to home page
- Tokens should be cleared from localStorage

---

## Debugging

### View Function Logs

1. Go to Vercel dashboard → Deployments → Latest
2. Click "Functions" tab
3. Find `api/oauth-token` function
4. View logs for `POST` requests

### Check Browser Logs

Open browser DevTools Console and look for:

```
[OAuth] - OAuth flow events
[OAuth Error] - OAuth errors
[DerivWS] - WebSocket events
[Callback] - Callback page events
[App] - App initialization
```

### Common Issues

**Issue: "Cannot POST /api/oauth-token"**
- Check `vercel.json` rewrites
- Verify `api/oauth-token.js` exists
- Check Vercel function deployment status

**Issue: "Redirect URI mismatch"**
- Verify `DERIV_OAUTH_REDIRECT_URI` environment variable
- Verify Deriv app configuration includes `https://digitprinters.site/auth/callback`
- Clear browser cache and try again

**Issue: 502 Bad Gateway on token exchange**
- Check `DERIV_OAUTH_CLIENT_SECRET` is set in Vercel
- Check function logs for error details
- Verify Deriv OAuth endpoint is accessible

**Issue: Token not persisting**
- Check if tokens appear in localStorage (DevTools)
- Check browser console for errors
- Verify websocket connects after token stored

---

## Security Checklist

Before going live:

- [ ] `DERIV_OAUTH_CLIENT_SECRET` is set in Vercel (not in code)
- [ ] `.env` files with secrets are in `.gitignore`
- [ ] Redirect URI in Deriv app matches: `https://digitprinters.site/auth/callback`
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] Custom domain is configured in Vercel
- [ ] www redirect is working
- [ ] Production environment variables are distinct from preview/dev

---

## Monitoring

### Set Up Alerts (Optional)

1. Go to Vercel project settings
2. Click "Alerts" section
3. Configure:
   - Failed deployments notification
   - Function error rate threshold
   - Response time threshold

### Regular Checks

- Monitor function logs for errors
- Check user feedback for login issues
- Review browser error patterns in analytics
- Monitor Deriv API status

---

## Rollback

If something goes wrong:

1. Go to Vercel Deployments
2. Find the previous working deployment
3. Click "..."  menu → "Promote to Production"
4. Verify the rollback succeeded

---

## Next Steps

After successful deployment:

1. Announce the new OAuth login to users
2. Monitor for issues in first 24 hours
3. Share troubleshooting guide with support team
4. Document any edge cases discovered
5. Plan future OAuth enhancements (if needed)

---

## Support

For Vercel-specific issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Visit [Vercel Community](https://vercel.com/support)

For Deriv OAuth issues:
- Check [Deriv OAuth Documentation](https://api.deriv.com/docs/auth)
- Review logs in browser console and Vercel functions

---

## Configuration Summary

```
Deployment URL:     https://digitprinters.site
OAuth Endpoint:     https://oauth.deriv.com/oauth2/authorize
Token Endpoint:     https://oauth.deriv.com/oauth2/token
Callback URL:       https://digitprinters.site/auth/callback
Token API:          https://digitprinters.site/api/oauth-token
App ID:             332LK4VWd9A4pEEfTMn53
WebSocket URL:      wss://ws.derivws.com/websockets/v3
```
