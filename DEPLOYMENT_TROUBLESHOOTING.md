# Pi Ride App - Deployment Troubleshooting

## "Developer Failed to Approve Payment" Error

This error occurs when the Pi Network payment modal times out because the backend `/api/pi/approve` endpoint fails to approve the payment within the 30-second window.

### Root Causes:

1. **Missing PI_API_KEY Environment Variable**
   - Check Vercel Dashboard → Your Project → Settings → Environment Variables
   - Ensure `PI_API_KEY` is set for Production, Preview, and Development environments
   - Get your key from: https://develop.pi/apps

2. **Invalid PI_API_KEY**
   - Verify the key is correct (no extra spaces or characters)
   - Ensure the key is for the correct Pi app (sandbox vs mainnet)
   - The key format should be a long alphanumeric string

3. **API Endpoint Issues**
   - The `/api/pi/approve` route must be deployed successfully
   - Check Vercel deployment logs for any build errors
   - Verify the route is accessible: `https://your-domain.vercel.app/api/pi/approve`

4. **Authorization Header Format**
   - Must be exactly: `authorization: key ${PI_API_KEY}` (lowercase "authorization", lowercase "key")
   - NOT: `Authorization: Key ${PI_API_KEY}` (incorrect)

5. **Vercel Function Timeout**
   - Pi Network API calls must complete within 30 seconds
   - Check Vercel Function Logs for timeout errors

### Debugging Steps:

1. **Check Vercel Runtime Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click latest deployment → "Runtime Logs" tab
   - Look for `[v0] [APPROVE]` log messages
   - If you see "PI_API_KEY environment variable not set", add the env var
   - If you see Pi API errors, check the error details

2. **Test the Approval Endpoint:**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/pi/approve \
     -H "Content-Type: application/json" \
     -d '{"paymentId":"test-payment-id"}'
   ```
   - Should return error about invalid payment ID (means endpoint is working)
   - Should NOT return 500 error about missing PI_API_KEY

3. **Verify Environment Variable:**
   - In Vercel Dashboard, go to Settings → Environment Variables
   - Click "Edit" on PI_API_KEY
   - Make sure it's enabled for all environments (Production, Preview, Development)
   - After adding/editing, trigger a new deployment (Deployments → ⋮ → Redeploy)

4. **Check Client-Side Logs:**
   - Open Chrome DevTools (F12) when testing payment
   - Go to Console tab
   - Look for `[v0]` prefixed messages
   - You should see: "Payment ready for approval", "Calling /api/pi/approve", "Approval response status"
   - If response status is 500, check server logs
   - If response status is 400, payment ID is invalid

### Quick Fix Checklist:

- [ ] Add `PI_API_KEY` to Vercel environment variables
- [ ] Redeploy the app after adding the environment variable
- [ ] Verify the key is valid from https://develop.pi/apps
- [ ] Check Vercel Runtime Logs for `[v0] [APPROVE]` messages
- [ ] Test payment flow in Pi Browser on testnet
- [ ] If still failing, check the full error message in Vercel logs

### Testing in Sandbox Mode:

1. Make sure your Pi app is in "Development" mode at https://develop.pi/apps
2. Use the Pi Browser to test (not regular Chrome/Safari)
3. Ensure you have testnet Pi in your wallet
4. The payment should complete within 30 seconds if the backend is working

### Contact Support:

If the issue persists after following all steps:
1. Share the Vercel Runtime Logs from the failed deployment
2. Share the browser console logs during payment attempt
3. Verify your Pi app settings at https://develop.pi/apps
