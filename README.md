# Pi Ride - Mobility Aggregator for Pi Network

Pi Ride is a comprehensive mobility platform built for the Pi Network ecosystem, allowing users to book rides, rentals, EV charging, and transit services using Pi cryptocurrency.

## Features 

### Core Services
- **Rides**: Book economy, comfort, or premium rides with real-time pricing
- **Rentals**: Rent electric sc ooters, bikes, cars, and vans by the hour or day
- **EV Charging**: Reserve charging slots at nearby stations with transparent pricing
- **Transit**: Purchase bus and train tickets for public transportation

### Platform Features
- **Pi Wallet Integration**: Seamless connection with Pi Network wallet
- **Real-time Pi/USD Conversion**: Live price updates and currency conversion
- **Progress Tracking**: Monitor your bookings and platform fee tier
- **Referral System**: Earn rewards by inviting friends
- **Dashboard**: Track spending, bookings, and savings

### Fee Structure
- **Initial**: 2% platform fee
- **500 Bookings**: Fee increases to 3%
- **2000 Bookings**: Fee increases to 5%

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Blockchain**: Pi Network SDK v2.0

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Pi Network account (for wallet integration)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/pi-ride.git
cd pi-ride
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Pi Network SDK Setup

The Pi Network SDK is automatically loaded via the script tag in `app/layout.tsx`. For development, the SDK runs in sandbox mode.

To use in production:
1. Register your app on the Pi Developer Portal
2. Update the SDK initialization in `hooks/use-pi-wallet.tsx` to remove sandbox mode
3. Configure your app's backend to handle payment approvals and completions

## Project Structure

\`\`\`
pi-ride/
├── app/
│   ├── dashboard/          # User dashboard
│   ├── referrals/          # Referral program
│   ├── layout.tsx          # Root layout with Pi SDK
│   └── page.tsx            # Home page
├── components/
│   ├── dashboard/          # Dashboard components
│   ├── referrals/          # Referral components
│   ├── tabs/               # Service tab components
│   ├── ui/                 # shadcn/ui components
│   ├── header.tsx          # Main navigation
│   ├── service-tabs.tsx    # Service selection tabs
│   └── stats-bar.tsx       # Pi price & conversion
├── hooks/
│   └── use-pi-wallet.tsx   # Pi Network wallet hook
└── README.md
\`\`\`

## Pi Network Integration

### Authentication
\`\`\`typescript
const { connect } = usePiWallet();
await connect();
\`\`\`

### Creating Payments
\`\`\`typescript
// Payment data
const paymentData = {
  amount: 10.5,
  memo: "Ride booking from Downtown to Airport",
  metadata: {
    service: "ride",
    booking_id: "12345"
  }
};

// Payment callbacks
window.Pi.createPayment(paymentData, {
  onReadyForServerApproval: async (paymentId) => {
    // Backend approves payment
    await fetch('/api/pi/approve', {
      method: 'POST',
      body: JSON.stringify({ paymentId })
    });
  },
  onReadyForServerCompletion: async (paymentId, txid) => {
    // Backend completes payment
    await fetch('/api/pi/complete', {
      method: 'POST',
      body: JSON.stringify({ paymentId, txid })
    });
  },
  onCancel: (paymentId) => {
    console.log('Payment cancelled');
  },
  onError: (error, payment) => {
    console.error('Payment error:', error);
  }
});
\`\`\`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Deploy with default settings

The app will be automatically deployed and optimized for production.

## Environment Variables

### Required for Production

Add this environment variable to your Vercel project (in the Vars section of the in-chat sidebar):

\`\`\`
PI_API_KEY=your_api_key_from_pi_developer_portal
\`\`\`

**How to get your API key:**
1. Go to https://develop.pi/apps
2. Register or select your app
3. Copy the API key from the app settings

### For Development

No environment variables are required for development. The Pi SDK runs in sandbox mode by default.

## Pi Network Payment Setup

### Testing on Testnet

1. **Switch to Testnet**
   - Open wallet.pi in Pi Browser
   - Switch to Testnet mode
   - Use the faucet to get 100 Test-Pi

2. **Authorize Sandbox Mode**
   - Go to Pi App > Utilities > Sandbox
   - Authorize your app daily for testing

3. **Access Through Pi Browser**
   - Must use Pi Browser for payment testing
   - Regular browsers won't have access to the Pi SDK

### Payment Flow

The app implements the official Pi Network payment flow:

1. **User initiates payment** → `window.Pi.createPayment()` is called
2. **onReadyForServerApproval** → Your backend calls Pi API to approve payment
3. **User signs transaction** → Pi Wallet modal opens for user to sign
4. **onReadyForServerCompletion** → Your backend completes payment with transaction ID
5. **Transaction verified** → Verified on Stellar Testnet blockchain

### API Routes

The app includes two backend API routes for Pi Network payments:

- **POST /api/pi/approve** - Approves payment with Pi Network Platform API
- **POST /api/pi/complete** - Completes payment and verifies transaction ID on blockchain

These routes are automatically called by the payment callbacks in all service tabs (rides, rentals, charging, transit).

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: support@ride.pi

## Acknowledgments

- Built with Next.js and Tailwind CSS
- UI components from shadcn/ui
- Powered by Pi Network SDK

---

**Pi Ride** - Revolutionizing mobility with cryptocurrency 🚗⚡🚲
