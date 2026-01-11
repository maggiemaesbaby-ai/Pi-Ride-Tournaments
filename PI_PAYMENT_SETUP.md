# Pi Network Payment Setup Guide

## Critical Issue Fixed

The payment approval was failing with "Invalid/missing API key" error. This has been fixed by correcting the authorization header format from `authorization: Key ${PI_API_KEY}` to `authorization: key ${PI_API_KEY}` (lowercase "key").

## Environment Variables Required

### PI_API_KEY
Your Pi Network App Server API Key from https://develop.pi/apps

**How to set in Vercel:**
1. Go to your Vercel project dashboard
2. Click Settings → Environment Variables
3. Add: `PI_API_KEY` = `your_actual_api_key_here`
4. Select all environments (Production, Preview, Development)
5. Click Save
6. Redeploy your app

**Important Notes:**
- Use **sandbox API key** for testing (get from Pi Developer Portal → Your App → API Keys → Sandbox)
- Use **production API key** when going live
- The SDK is initialized with `sandbox: true` - make sure your API key matches this mode
- Authorization header format: `authorization: key ${PI_API_KEY}` (lowercase "key")

## How Pi Payments Work

### Step 1: User Initiates Payment (Client-Side)
```typescript
window.Pi.createPayment({
  amount: 10.5,
  memo: "Ride from A to B",
  metadata: { rideId: "123" }
}, {
  onReadyForServerApproval: (paymentId) => {
    // Call your backend to approve
  },
  onReadyForServerCompletion: (paymentId, txid) => {
    // Call your backend to complete
  },
  onCancel: (paymentId) => {},
  onError: (error, payment) => {}
})
```

### Step 2: Server Approves Payment (Backend)
Your app calls `/api/pi/approve` which calls:
```
POST https://api.minepi.com/v2/payments/{paymentId}/approve
Headers: { authorization: key ${PI_API_KEY} }
```

### Step 3: Server Completes Payment (Backend)
Your app calls `/api/pi/complete` which calls:
```
POST https://api.minepi.com/v2/payments/{paymentId}/complete
Headers: { authorization: key ${PI_API_KEY} }
Body: { txid: "blockchain_transaction_id" }
```

## Testing Payments

### In Pi Browser (Recommended)
1. Open your Vercel URL in Pi Browser
2. Click "Book Ride" (or any payment button)
3. Pi wallet modal appears
4. Approve with sandbox Pi
5. Check Vercel Runtime Logs for `[v0] [APPROVE]` and `[v0] [COMPLETE]` messages

### Common Errors

**"Developer failed to approve the payment"**
- Solution: PI_API_KEY is missing or invalid in Vercel environment variables
- Check: Vercel Dashboard → Settings → Environment Variables → PI_API_KEY

**"Payment expired"**
- Solution: Approval took too long (>30 seconds timeout)
- Check: Vercel Runtime Logs for slow API responses or errors

**"Maximum call stack size exceeded"**
- Solution: Fixed by using React Context pattern for wallet state
- This error should no longer occur after the latest updates

## Vercel Deployment Checklist

- [ ] PI_API_KEY environment variable set in Vercel
- [ ] Using correct API key mode (sandbox for testing, production for live)
- [ ] Latest code deployed (Context-based wallet hook)
- [ ] HTTPS enabled (required by Pi Network)
- [ ] Tested payment flow in Pi Browser

## Support

If payments still fail:
1. Check Vercel Runtime Logs (Vercel Dashboard → Deployments → Latest → Runtime Logs)
2. Look for `[v0] [APPROVE]` logs showing the exact error from Pi API
3. Verify PI_API_KEY is correct and matches the SDK mode (sandbox/production)
