# Accommodation & Travel Essentials API Setup Guide

This document provides information on integrating real accommodation booking and travel insurance APIs into the Pi Ride app.

## Accommodation APIs

### 1. Booking.com Connectivity API

**Overview:**
- Access to 28+ million listings worldwide
- Real-time availability and pricing
- Multi-language support

**Registration:**
- Visit: https://developers.booking.com/
- Sign up for Partner Hub account
- Request API access (requires business verification)

**Environment Variables:**
\`\`\`
BOOKING_COM_API_KEY=your_api_key_here
BOOKING_COM_API_SECRET=your_api_secret_here
\`\`\`

**API Endpoints:**
- Search: https://supply-xml.booking.com/hotels/xml/search
- Booking: https://secure-supply-xml.booking.com/hotels/xml/reservations

---

### 2. Expedia Rapid API

**Overview:**
- 500,000+ properties globally
- RESTful API design
- Real-time rates and availability

**Registration:**
- Visit: https://developers.expediagroup.com/
- Create developer account
- Request production access

**Environment Variables:**
\`\`\`
EXPEDIA_API_KEY=your_api_key_here
EXPEDIA_SECRET=your_secret_here
\`\`\`

**Key Features:**
- Shopping API for live rates
- Booking API for reservations
- Multi-currency support

---

### 3. Airbnb API (Partner Access)

**Note:** Airbnb does not provide public API access. Integration requires:
- Partnership agreement with Airbnb
- Contact: https://www.airbnb.com/partners

**Alternative:** Use web scraping services (not recommended for production)

---

## Travel Insurance APIs

### 1. Allianz Travel Insurance

**Overview:**
- Multiple plan types
- Real-time quote generation
- Coverage up to $250,000

**Registration:**
- Contact Allianz for B2B partnership
- Website: https://www.allianztravelinsurance.com/
- Email: partnerships@allianz-assistance.com

**Environment Variables:**
\`\`\`
ALLIANZ_PARTNER_ID=your_partner_id
ALLIANZ_API_KEY=your_api_key
\`\`\`

**Features:**
- Single-trip and annual plans
- Pre-existing condition coverage
- 24/7 assistance

---

### 2. AIG Travel Guard

**Overview:**
- Comprehensive travel protection
- Medical emergency coverage
- Trip cancellation benefits

**Registration:**
- Visit: https://www.travelguard.com/
- Request B2B partnership
- Requires business verification

**Environment Variables:**
\`\`\`
AIG_PARTNER_ID=your_partner_id
AIG_API_KEY=your_api_key
\`\`\`

---

### 3. nib Travel Insurance API

**Overview:**
- Developer-friendly API
- Quote and booking flows
- Mid-office integration

**Registration:**
- Visit: https://developer.nibtravelinsurance.com/
- Create developer account
- Request API credentials

**Environment Variables:**
\`\`\`
NIB_API_KEY=your_api_key
NIB_CLIENT_ID=your_client_id
\`\`\`

**Documentation:** https://developer.nibtravelinsurance.com

---

## Airport Shuttle Integration

### Options:

1. **SuperShuttle / Roadrunner Shuttle**
   - Contact for API access
   - Regional coverage

2. **Local shuttle services**
   - Partner with regional providers
   - Custom integration per region

3. **Ride-hailing integration**
   - Use existing Uber/Lyft APIs
   - Filter for shared/shuttle options

---

## Pi Ride Fee Implementation

**For Travel Insurance (5% fee):**
\`\`\`typescript
const basePrice = insuranceQuote.price
const piRideFee = basePrice * 0.05
const totalPrice = basePrice + piRideFee
\`\`\`

**Display to users:**
- Show base price clearly
- Display Pi Ride fee separately (5%)
- Show total price prominently

---

## Implementation Priority

1. **Immediate:** Mock data for testing (already implemented)
2. **Phase 1:** Booking.com API (hotels/motels)
3. **Phase 2:** Expedia Rapid API (vacation rentals)
4. **Phase 3:** Travel insurance APIs (Allianz or nib)
5. **Phase 4:** Airport shuttle partnerships

---

## Testing

All accommodation and travel essential features currently use demo data for testing the full user flow including:
- Search and filtering
- Selection and booking
- Pi wallet payment integration
- Confirmation flow

Replace mock data with real API calls once credentials are obtained.
