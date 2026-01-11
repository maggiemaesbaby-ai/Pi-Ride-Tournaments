# Theater API Integration Guide

Your Pi Ride app is now ready to connect with real movie theater APIs! This guide explains how to switch from demo mode to live data.

## Current Status

**Demo Mode Active** - The app shows sample movies and theaters. Everything works perfectly, just with mock data.

## Supported Theater APIs

You can integrate with any of these providers:

### 1. AMC Theatres API
- **Website**: https://developer.amctheatres.com
- **Best For**: Direct AMC theater access, IMAX listings
- **Features**: Real-time showtimes, seat selection, ticket purchase

### 2. Fandango API
- **Website**: https://developer.fandango.com
- **Best For**: Multi-theater access, wide coverage
- **Features**: All major theaters, reviews, trailers

### 3. Atom Tickets API
- **Website**: https://developer.atomtickets.com
- **Best For**: Social features, group bookings
- **Features**: Multiple chains, social sharing, pre-order concessions

## How to Connect (5 Minutes)

### Step 1: Get Your API Key

1. Choose your preferred provider (AMC, Fandango, or Atom)
2. Sign up for their developer program
3. Get your API key

### Step 2: Add Environment Variable

In the Vercel dashboard or v0 Vars section, add **server-only** environment variables (no NEXT_PUBLIC_ prefix):

```
AMC_API_KEY=your_api_key_here
```

Or for Fandango:
```
FANDANGO_API_KEY=your_api_key_here
```

Or for Atom:
```
ATOM_API_KEY=your_api_key_here
```

**Important**: Do NOT use `NEXT_PUBLIC_` prefix - these are server-only variables for security.

### Step 3: Update Configuration

Open `app/actions/theater-api.ts` and change this line:

```typescript
activeProvider: 'amc' as 'mock' | 'amc' | 'fandango' | 'atom',
```

Change from `'mock'` to `'amc'`, `'fandango'`, or `'atom'`

### Step 4: Implement API Calls

Uncomment the API call code in `app/actions/theater-api.ts`:

```typescript
export async function getAMCTheaters(latitude?: number, longitude?: number): Promise<Theater[]> {
  if (THEATER_API_CONFIG.activeProvider === 'mock') {
    return MOCK_AMC_THEATERS
  }

  // Uncomment and customize for your provider:
  const response = await fetch(`${THEATER_API_CONFIG.amc.endpoint}/theaters?lat=${latitude}&lng=${longitude}`, {
    headers: { 'Authorization': `Bearer ${THEATER_API_CONFIG.amc.apiKey}` }
  })
  return await response.json()
}
```

### Step 5: Deploy

Push to GitHub and deploy to Vercel. Your app will automatically use live data!

## Security

✅ **API keys are server-only** - They never get exposed to the client browser

✅ **Server Actions** - All API calls happen on the server, keeping your keys safe

✅ **No NEXT_PUBLIC_ prefix** - Environment variables stay on the server

## What Happens Next

✅ **Automatic Switch** - No UI changes needed. The app instantly shows real data.

✅ **Same User Experience** - Everything works exactly the same, just with live showtimes.

✅ **Real Bookings** - Tickets purchased through the API provider's system.

## API Response Format

Your API responses should match this format (or map them in the server actions):

```typescript
interface Theater {
  id: string
  name: string
  distance: number
  address: string
  hasIMAX?: boolean
  screens?: number
}

interface Movie {
  id: string
  title: string
  rating: string
  duration: string
  price: number
  showtimes: string[]
  imax?: boolean
  posterUrl?: string
}
```

## Need Help?

Contact the theater API provider's support team for:
- API documentation
- Rate limits
- Authentication issues
- Data format questions

## Demo Mode

Keep demo mode active by leaving `activeProvider: 'mock'` - perfect for testing and development!
