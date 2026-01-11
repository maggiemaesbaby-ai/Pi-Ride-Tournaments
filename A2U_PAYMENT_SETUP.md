# App-to-User (A2U) Payment Setup Guide

## What is A2U?

**App-to-User (A2U)** payments allow your app to send Pi directly to users' wallets. This is required for:
- Cashouts from dashboard to wallet
- Refunds
- Rewards/bonuses
- Payouts to drivers

## Required Credentials

### 1. Pi API Key
- **What it is:** Authentication key for your app to use Pi Network APIs
- **Where to get it:** Pi Developer Portal (https://developers.minepi.com)
- **NOT your personal wallet:** This is a separate API credential

### 2. Pi Wallet Private Seed (App Wallet)
- **What it is:** A dedicated wallet that your app controls to send payments from
- **Where to get it:** Generated through Pi Developer Portal when setting up A2U
- **IMPORTANT:** This is NOT your personal wallet seed! Never use your personal wallet seed in your app code!

## Setup Steps

### Step 1: Register Your App
1. Go to https://developers.minepi.com
2. Sign in with your Pi account
3. Navigate to "My Apps"
4. Select your existing app or create a new one

### Step 2: Enable A2U Payments
1. In your app settings, find "Payment Settings"
2. Enable "App-to-User Payments"
3. Complete the verification process
4. Pi will generate an app wallet for you

### Step 3: Get Credentials
1. **API Key:** Found in your app settings under "API Credentials"
2. **Wallet Seed:** Provided when you enable A2U (one-time display - save it securely!)

### Step 4: Fund Your App Wallet
1. Note your app wallet address from the developer portal
2. Send Pi to this address from your personal wallet
3. This is the Pi pool your app will use for cashouts

### Step 5: Add to Environment Variables
Add these to your Vercel environment variables:

```
PI_API_KEY=your_api_key_here
PI_WALLET_PRIVATE_SEED=your_app_wallet_seed_here
```

## Security Best Practices

- ✅ Store credentials as environment variables
- ✅ Never commit credentials to git
- ✅ Use a dedicated app wallet, not your personal wallet
- ✅ Set up monitoring for unusual withdrawal patterns
- ✅ Implement rate limiting on cashout endpoints
- ❌ Never expose private seed in client-side code
- ❌ Never use your personal wallet seed

## Implementation Notes

The code is currently set up to handle A2U payments but will show "pending setup" messages until you add the credentials. Once credentials are added:

1. Users click "Cash Out"
2. System authenticates user to get wallet address
3. Backend verifies balance and limits
4. A2U payment is initiated from app wallet to user wallet
5. Transaction is recorded in database
6. User receives Pi in their wallet

## Daily Withdrawal Limit

Current limit: **$750 USD per day** (converted to Pi equivalent)

Exception: Marketplace sellers can exceed this limit for individual item sales over $750.

## Testing

Before going live:
1. Test with small amounts in Pi testnet
2. Verify transactions appear in user wallets
3. Check database records match wallet transactions
4. Test limit enforcement
5. Test error handling (insufficient app wallet balance, etc.)

## Support

For issues with A2U setup:
- Pi Developer Portal: https://developers.minepi.com
- Pi Developer Documentation: https://developers.minepi.com/doc
- Pi Developer Community: https://developers.minepi.com/community
