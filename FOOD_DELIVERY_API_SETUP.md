# Food Delivery API Integration Guide

## Overview
This guide covers integration with major food delivery platforms for the Pi Ride app. These APIs allow customers to order food and pay with Pi cryptocurrency.

---

## Providers with Public APIs

### 1. Uber Eats
**Status:** Public API Available (Requires Approval)  
**API Type:** Marketplace API  
**Registration:** https://developer.uber.com/  

**Features:**
- Store and menu management
- Order processing
- Real-time order status
- Promotional campaigns

**Required Credentials:**
- `UBER_EATS_CLIENT_ID`
- `UBER_EATS_CLIENT_SECRET`
- `UBER_EATS_SERVER_TOKEN`

**Getting Started:**
1. Visit https://developer.uber.com/
2. Create a developer account
3. Register your app for "Uber Eats Marketplace"
4. Request written approval from Uber for production access
5. Obtain credentials from dashboard

**Documentation:** https://developer.uber.com/docs/eats/introduction

---

### 2. DoorDash
**Status:** Early Access Required  
**API Type:** Marketplace API  
**Registration:** https://developer.doordash.com/  

**Features:**
- Catalog management
- Inventory updates
- Order fulfillment
- Webhook notifications

**Required Credentials:**
- `DOORDASH_DEVELOPER_ID`
- `DOORDASH_KEY_ID`
- `DOORDASH_SIGNING_SECRET`

**Getting Started:**
1. Visit https://developer.doordash.com/
2. Join the Developer Portal
3. Request early access to Marketplace APIs
4. Add a Marketplace integration
5. Set up JWT authentication

**Quality Standards:**
- Order failure rate: <1%
- Merchant cancel rate: <1%
- Part of DoorDash Preferred Integrations Program (DPIP)

**Documentation:** https://developer.doordash.com/en-US/docs/marketplace/

---

### 3. Grubhub
**Status:** API Available (Limited Documentation)  
**API Type:** Order Management API  
**Registration:** Contact Grubhub Business Relations  

**Features:**
- Real-time order ingestion
- Status updates
- Menu management
- Custom pricing

**Required Credentials:**
- `GRUBHUB_API_KEY`
- `GRUBHUB_SECRET`

**Getting Started:**
1. Contact Grubhub for business partnership
2. Access via KitchenHub unified API (alternative)
3. Self-onboarding through Grubhub portal

**Note:** Direct API access requires business partnership

---

### 4. Deliveroo
**Status:** Public Developer Portal  
**API Type:** Platform Suite APIs  
**Registration:** https://developers.deliveroo.com/  

**Features:**
- Restaurant Platform Suite
- Retail/Grocery Platform Suite
- Custom delivery experiences
- Sandbox testing environment

**Required Credentials:**
- `DELIVEROO_CLIENT_ID`
- `DELIVEROO_CLIENT_SECRET`
- `DELIVEROO_API_KEY`

**Getting Started:**
1. Visit https://developers.deliveroo.com/
2. Create developer account
3. Choose your API product suite:
   - Partner Platform (restaurants)
   - Retail Platform (grocery)
   - Signature Suite (custom)
4. Test in sandbox environment
5. Request production access

**Documentation:** https://developers.deliveroo.com/

---

### 5. Postmates (Uber)
**Status:** Merged with Uber Eats  
**Note:** Postmates is now part of Uber. Use Uber Eats API for integration.

---

## Alternative: Unified API Solution

### KitchenHub
**Unified API for Multiple Platforms**  
**Website:** https://www.trykitchenhub.com/developer

**Supported Platforms:**
- Uber Eats
- DoorDash
- Grubhub
- And more...

**Benefits:**
- Single API for multiple platforms
- Unified order management
- Menu synchronization
- Simplified integration

**Required Credentials:**
- `KITCHENHUB_API_KEY`
- `KITCHENHUB_WEBHOOK_SECRET`

---

## Environment Variables

Add these to your Vercel project in the "Vars" section:

```bash
# Uber Eats
UBER_EATS_CLIENT_ID=your_client_id
UBER_EATS_CLIENT_SECRET=your_client_secret
UBER_EATS_SERVER_TOKEN=your_server_token

# DoorDash
DOORDASH_DEVELOPER_ID=your_developer_id
DOORDASH_KEY_ID=your_key_id
DOORDASH_SIGNING_SECRET=your_signing_secret

# Grubhub
GRUBHUB_API_KEY=your_api_key
GRUBHUB_SECRET=your_secret

# Deliveroo
DELIVEROO_CLIENT_ID=your_client_id
DELIVEROO_CLIENT_SECRET=your_client_secret
DELIVEROO_API_KEY=your_api_key

# KitchenHub (Alternative)
KITCHENHUB_API_KEY=your_api_key
KITCHENHUB_WEBHOOK_SECRET=your_webhook_secret
```

---

## Integration Priority

### Immediate Access (Start Here)
1. **Deliveroo** - Public API with sandbox
2. **Uber Eats** - Apply for approval

### Requires Approval
3. **DoorDash** - Request early access
4. **Grubhub** - Business partnership required

### Alternative Solution
5. **KitchenHub** - Unified API (covers all platforms)

---

## Next Steps

1. Register with Deliveroo first (fastest access)
2. Apply for Uber Eats developer access
3. Request DoorDash early access
4. Consider KitchenHub for simplified multi-platform integration
5. Add all credentials to Vercel environment variables
6. Test integrations in sandbox environments
7. Apply for production access

---

## Legal Considerations

- Ensure compliance with each platform's terms of service
- Verify merchant agreements allow third-party payment methods (Pi)
- Implement proper order confirmation and receipts
- Handle customer data according to platform guidelines
- Maintain minimum quality standards (for DoorDash DPIP)

---

## Support

- Uber Eats: https://developer.uber.com/docs/eats
- DoorDash: https://developer.doordash.com/support
- Deliveroo: https://developers.deliveroo.com/docs
- KitchenHub: https://www.trykitchenhub.com/contact
