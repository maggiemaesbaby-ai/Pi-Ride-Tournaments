# Pi Payment API Troubleshooting Guide

## Current Issue: "Invalid/missing API key" (401 Error)

Your code is correct. The issue is with the **PI_API_KEY environment variable** on Vercel.

### Root Cause
The Pi API is rejecting your Server API Key with a 401 error. This happens when:

1. **Wrong Environment Key**: Using a production API key in sandbox mode (or vice versa)
2. **Incorrect API Key**: The key is typed incorrectly or from a different app
3. **Expired/Revoked Key**: The key is no longer valid

### How to Fix

#### Step 1: Verify Your Current API Key
Visit: `https://your-app.vercel.app/api/pi/test-key`

This will show:
- Whether PI_API_KEY is set
- The key's length and prefix/suffix
- No sensitive data is exposed

#### Step 2: Get the Correct API Key

1. Go to [Pi Developer Portal](https://develop.pi)
2. Select your app
3. Go to "Keys" or "Settings"
4. Copy the **Server API Key** for your environment:
   - If using `Pi.init({ version: "2.0", sandbox: true })` → Use **Sandbox API Key**
   - If using `Pi.init({ version: "2.0" })` → Use **Production API Key**

#### Step 3: Update Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Find `PI_API_KEY`
5. **Delete** the old value
6. **Add** new value with the correct key from Step 2
7. **Redeploy** your app

### Current Configuration

Based on your code:
- **SDK Mode**: Sandbox (`sandbox: true`)
- **Required Key**: Sandbox Server API Key from Pi Developer Portal

### Testing After Fix

1. Open your app in Pi Browser
2. Try a payment
3. Check Vercel Runtime Logs - you should see:
   ```
   [v0] [APPROVE] Success: {paymentId}
   ```
   Instead of:
   ```
   [v0] [APPROVE] Failed: 401 - {"error":"Invalid/missing API key"}
   ```

### Authorization Header Format (Confirmed Correct)

Your code uses: `Authorization: Key ${PI_API_KEY}`

This matches the official Pi Network Platform API specification.

## Additional Resources

- [Pi Platform API Docs](https://github.com/pi-apps/pi-platform-docs)
- [Pi Developer Portal](https://develop.pi)
- [Pi SDK Reference](https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md)
