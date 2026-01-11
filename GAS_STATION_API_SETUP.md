# Gas Station Price API Setup

## Overview
The Gas tab allows users to find nearby gas stations with real-time pricing information based on their current location.

## API Integration Options

### Option 1: Apify Gas Station Prices API (Recommended)
- **Provider**: Apify (scraped/gas-station-prices)
- **Data Source**: GasBuddy
- **Cost**: $10/month + usage
- **Documentation**: https://apify.com/scraped/gas-station-prices

**Setup Steps:**
1. Create an Apify account at https://apify.com
2. Get your API token from the Apify console
3. Add environment variables to Vercel:
   - `APIFY_API_TOKEN` - Your Apify API token

**API Usage:**
```typescript
// Example API call
const response = await fetch('https://api.apify.com/v2/acts/scraped~gas-station-prices/runs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.APIFY_API_TOKEN}`
  },
  body: JSON.stringify({
    zipcodes: ["90210"]
  })
});
```

### Option 2: GasBuddy Scraper API
- **Provider**: Apify (stanvanrooy6/gasbuddy-scraper)
- **Cost**: $10.99/month + usage
- **Documentation**: https://apify.com/stanvanrooy6/gasbuddy-scraper

### Option 3: Direct Integration with GasBuddy
- **Provider**: GasBuddy
- **Contact**: Requires partnership/enterprise agreement
- **Best for**: High-volume applications

## Current Implementation

The Gas tab currently uses **demo data** for testing. To enable real gas prices:

1. Sign up for an Apify account
2. Subscribe to the Gas Station Prices API
3. Add your API token to environment variables
4. Update `/components/tabs/gas-tab.tsx` to call the real API

## Features

- ✅ Display nearby gas stations sorted by distance or price
- ✅ Show prices for Regular, Mid-Grade, Premium, and Diesel
- ✅ Last updated timestamps
- ✅ Distance from user location
- ✅ Direct navigation to station
- ✅ Highlight best price

## Next Steps

1. Register for Apify account
2. Subscribe to Gas Station Prices API
3. Add API credentials to environment variables
4. Replace demo data with real API calls
5. Test with live data

</parameter>
