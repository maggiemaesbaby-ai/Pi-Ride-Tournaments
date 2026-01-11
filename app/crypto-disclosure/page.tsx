export default function CryptoDisclosure() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Cryptocurrency Disclosure</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Understanding Pi Cryptocurrency Payments</h2>
            <p className="text-muted-foreground">
              Pi Ride uses Pi cryptocurrency for certain services. This page explains how cryptocurrency payments work
              and important considerations before using our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">What is Pi Cryptocurrency?</h2>
            <p className="text-muted-foreground mb-4">
              Pi is a digital cryptocurrency developed by the Pi Network. Unlike traditional money:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Pi transactions are recorded on a blockchain (digital ledger)</li>
              <li>Pi value can fluctuate based on market demand</li>
              <li>Pi transactions are generally irreversible once confirmed</li>
              <li>Pi is still in development and not yet widely accepted as payment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">When You Use Pi Payments</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="p-4 bg-primary/10 border-l-4 border-primary rounded">
                <h3 className="text-lg font-semibold text-foreground mb-2">Pi Pioneer Driver Services</h3>
                <p className="mb-2">When you book a Pi Pioneer driver, you pay with Pi cryptocurrency:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Payment is processed through Pi Network blockchain</li>
                  <li>Transaction is final once confirmed (cannot be reversed)</li>
                  <li>Driver receives Pi directly to their wallet</li>
                  <li>Pi Ride collects a 3% platform fee in Pi</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Important Risks and Considerations</h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Value Volatility</h3>
                <p className="text-yellow-800">
                  The value of Pi can change rapidly. The USD equivalent shown is an estimate and may differ at the time
                  of payment. You bear the risk of price changes.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Irreversible Transactions</h3>
                <p className="text-yellow-800">
                  Once a Pi payment is confirmed on the blockchain, it cannot be cancelled, reversed, or refunded by Pi
                  Ride. Disputes must be resolved with the service provider directly.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Technical Dependencies</h3>
                <p className="text-yellow-800">
                  Pi payments depend on Pi Network infrastructure. Service interruptions, blockchain delays, or network
                  issues may affect your ability to make payments.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Limited Acceptance</h3>
                <p className="text-yellow-800">
                  Pi is not widely accepted. Only specific services within Pi Ride accept Pi payments (Pioneer drivers).
                  Most services require traditional payment on partner websites.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Alternative: Affiliate Partner Services</h2>
            <div className="p-4 bg-secondary/10 border-l-4 border-secondary rounded">
              <p className="text-muted-foreground mb-2">
                If you prefer not to use cryptocurrency, Pi Ride offers access to traditional services:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Pay with credit cards, debit cards, or cash on partner websites</li>
                <li>No cryptocurrency required</li>
                <li>Services include Uber, Lyft, DoorDash, hotels, and more</li>
                <li>Standard refund and dispute policies apply through partners</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Tax Implications</h2>
            <p className="text-muted-foreground">
              Cryptocurrency transactions may have tax consequences in your jurisdiction. You are solely responsible for
              understanding and complying with all tax obligations related to your Pi transactions. Pi Ride does not
              provide tax advice. Consult a tax professional for guidance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Not Investment Advice</h2>
            <p className="text-muted-foreground">
              Nothing on Pi Ride constitutes investment, financial, legal, or tax advice. Pi Ride is a service platform,
              not a financial institution. We do not recommend buying, holding, or selling Pi cryptocurrency. Use Pi at
              your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Consent</h2>
            <p className="text-muted-foreground">
              By using Pi payment services on Pi Ride, you acknowledge that you understand:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>How cryptocurrency payments work</li>
              <li>The risks associated with using cryptocurrency</li>
              <li>That Pi transactions are irreversible</li>
              <li>That you bear all risks related to Pi value changes</li>
              <li>Your tax reporting responsibilities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
            <p className="text-muted-foreground">
              If you have questions about cryptocurrency payments, contact us at:{" "}
              <a href="mailto:ryanbo34@yahoo.com" className="text-primary hover:underline">
                ryanbo34@yahoo.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
