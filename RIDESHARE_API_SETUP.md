# Rideshare API Integration Setup Guide

This guide explains how to set up API integrations for rideshare providers in your Pi Ride app.

## Environment Variables Required

Add these to your Vercel project environment variables:

### Uber API
```
UBER_CLIENT_ID=your_uber_client_id
UBER_CLIENT_SECRET=your_uber_client_secret
UBER_SERVER_TOKEN=your_uber_server_token
```

**Setup Steps:**
1. Go to https://developer.uber.com
2. Create a new app
3. Copy your Client ID, Client Secret, and Server Token
4. Add to Vercel environment variables

**Documentation:** https://developer.uber.com/docs/tutorials-rides-api

---

### Lyft API
```
LYFT_CLIENT_ID=your_lyft_client_id
LYFT_CLIENT_SECRET=your_lyft_client_secret
```

**Setup Steps:**
1. Go to https://www.lyft.com/developers
2. Register for API access
3. Create an application
4. Copy your credentials

**Documentation:** Available through Lyft developer portal

---

### Cabify API
```
CABIFY_API_KEY=your_cabify_api_key
CABIFY_ACCESS_TOKEN=your_cabify_access_token
```

**Setup Steps:**
1. Go to https://developers.cabify.com
2. Create a business account
3. Generate API key and access token
4. Add to environment variables

**Documentation:** https://developers.cabify.com/docs/getting-started

---

### Via API (Coming Soon)
```
VIA_API_KEY=your_via_api_key
```

**Setup Steps:**
1. Sign up at https://ridewithvia.com/developer to be notified when public API is available
2. Documentation pending release

---

## Providers Requiring Partnership

These providers require direct business partnerships for API access:

### Bolt
- Contact: business.bolt.eu
- Type: B2B Partnership required

### Free Now (MyTaxi)
- Contact: https://www.free-now.com/taxi-partner-solutions/
- Type: Taxi partner integration

### DiDi, Grab, Ola, Gett
- Contact: Regional business teams
- Type: Enterprise partnership required
- Note: These serve specific geographic markets

---

## Testing in Development

The app currently uses demo/mock data for testing. Once you add API credentials:

1. Add environment variables to Vercel project
2. Deploy the app
3. API calls will automatically switch from mock to real data
4. Start with sandbox/test mode for each provider
5. Request production access once tested

---

## API Call Flow

1. User enters pickup and destination
2. App calls `getRideEstimates()` to fetch prices from all configured providers
3. User selects a ride
4. App calls `requestRide()` with provider and service details
5. Payment processed through Pi Network
6. Ride confirmed with provider's API
7. User sees real-time tracking

---

## Security Notes

- Never commit API keys to code
- Use environment variables only
- Enable production mode only after testing
- Monitor API usage and rate limits
- Each provider has different rate limits and pricing

---

## Support

For API integration help:
- Uber: https://developer.uber.com/docs
- Lyft: developer support portal
- Cabify: https://developers.cabify.com/docs
- Via: Coming soon
