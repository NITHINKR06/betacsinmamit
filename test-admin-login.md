 Admin Login Fix - Testing Guide

## Quick Test Steps

### 1. Test in Production Mode Locally

```bash
# Serve the production build
npm run preview
```

Then navigate to: http://localhost:4173/admin/login

### 2. Test the Login Flow

1. **Clear Browser Data**
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Site Data (localStorage, sessionStorage, cookies)

2. **Test Login Process**
   - Click "Sign in with Google"
   - Select your admin account
   - After redirect, you should see:
     - Loading spinner briefly ("Checking authentication status...")
     - Then OTP verification form
     - NOT the login button again (no loop)

3. **Verify OTP Flow**
   - Check email for OTP
   - Enter the 6-digit code
   - Should navigate to /admin/dashboard

### 3. Check SessionStorage

While on the OTP page, check DevTools > Application > Session Storage:
- Should see `pendingAdmin` with user data
- Should see `otpSentForPending` = true

### 4. Test Edge Cases

- **Refresh on OTP page**: Should maintain state and show OTP form
- **Close tab and reopen**: Should reset to login (sessionStorage cleared)
- **Invalid OTP**: Should show error and allow retry
- **Resend OTP**: Should work after timer expires

## Production Deployment

After local testing passes:

1. **Deploy to Production**
   ```bash
   # Your deployment command
   npm run deploy
   # or
   vercel --prod
   ```

2. **Test in Production**
   - Clear all browser data for the production domain
   - Test the complete flow
   - Monitor browser console for any errors

## Troubleshooting

If issues persist:

1. **Check Browser Console**
   - Look for any JavaScript errors
   - Check network tab for failed requests

2. **Verify Firebase Configuration**
   - Ensure redirect URI is whitelisted in Firebase Console
   - Check Google OAuth settings

3. **Session Storage Issues**
   - Some browsers in private mode may restrict sessionStorage
   - Test in normal browsing mode

## Success Criteria

✅ No redirect loop after Google sign-in
✅ OTP page displays correctly
✅ State persists during redirect
✅ OTP verification works
✅ Successfully navigates to admin dashboard
✅ Logout clears all session data

## Rollback Plan

If issues occur in production:
1. Revert the commit
2. Redeploy previous version
3. Investigate logs for root cause
