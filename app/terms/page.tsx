export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Pi Ride ("Service"), you agree to be bound by these Terms of Service ("Terms"). If
              you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
            <p className="text-muted-foreground mb-4">
              Pi Ride operates as a hybrid platform offering two types of services:
            </p>
            <div className="space-y-4 text-muted-foreground">
              <div className="p-4 bg-primary/10 border-l-4 border-primary rounded">
                <h3 className="text-lg font-semibold text-foreground mb-2">Direct Pi Payment Services</h3>
                <p className="mb-2">
                  Services where you pay directly in Pi cryptocurrency through Pi Network blockchain:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Pi Pioneer Driver rides (verified Pi Network members)</li>
                  <li>Pi Pioneer food and package delivery</li>
                  <li>Future direct partnership services</li>
                </ul>
                <p className="mt-2 text-sm font-medium">
                  ✓ Real Pi transactions • ✓ Instant wallet-to-wallet payments • ✓ 3% platform fee
                </p>
              </div>

              <div className="p-4 bg-secondary/10 border-l-4 border-secondary rounded">
                <h3 className="text-lg font-semibold text-foreground mb-2">Affiliate Partner Services</h3>
                <p className="mb-2">
                  Services that redirect you to partner websites where you pay with traditional currency:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Uber, Lyft, and other ride-sharing services</li>
                  <li>Food delivery platforms (DoorDash, Uber Eats, GrubHub)</li>
                  <li>Hotels, car rentals, entertainment venues</li>
                </ul>
                <p className="mt-2 text-sm font-medium">
                  ✓ Pay with USD/credit cards on partner sites • ✓ Pi Ride earns affiliate commission • ✓ No Pi payment
                  required
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-4">
              All services are clearly labeled to distinguish between direct Pi payment and affiliate redirect services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You must be at least 18 years old to use this Service</li>
              <li>You must have a valid Pi Network account</li>
              <li>You must have sufficient Pi cryptocurrency to make payments for direct Pi services</li>
              <li>You must comply with all applicable laws in your jurisdiction</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Pi Network Integration</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Our Service uses Pi Network's authentication and payment systems. By using Pi Ride, you also agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pi Network's Terms of Service</li>
                <li>Pi Network's Privacy Policy</li>
                <li>Pi Network's payment processing policies</li>
              </ul>
              <p className="mt-4">
                We are not responsible for issues arising from Pi Network's services, including blockchain delays,
                transaction failures, or account suspensions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Payments and Fees</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">5.1 Pi Network Payment Services</h3>
                <p className="mb-2">Services paid directly through Pi cryptocurrency:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Pi Pioneer driver rides and deliveries (3% platform fee + driver earnings)</li>
                  <li>Marketplace purchases from verified Pi sellers</li>
                  <li>Direct service bookings through Pi payment gateway</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">5.3 Pi Pioneer Driver Program</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Upfront Plan:</strong> One-time 100π registration fee (or 0.001π with promo code) to become
                    a verified driver with 3% fixed commission on all rides
                  </li>
                  <li>
                    <strong>No-Upfront Plan:</strong> Free signup with tiered commission structure:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>5% commission for rides 0-499</li>
                      <li>6% commission for rides 500-999</li>
                      <li>7% commission for rides 1000+</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Commission Agreement:</strong> By selecting the no-upfront plan, you agree that commission
                    rates will automatically increase as you reach milestone ride counts (500 and 1000 completed rides).
                    These tiers are designed to balance platform sustainability with driver earnings as you grow your
                    business with Pi Ride.
                  </li>
                  <li>
                    <strong>Priority Placement:</strong> Pioneer drivers appear first in search results
                  </li>
                  <li>
                    <strong>Instant Payments:</strong> Earnings paid immediately to driver's Pi wallet upon ride
                    completion
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. User Responsibilities</h2>
            <p className="text-muted-foreground mb-4">You agree to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide accurate location and contact information</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Not interfere with or disrupt the Service</li>
              <li>Not attempt to manipulate pricing or referral systems</li>
              <li>Treat service providers (drivers, restaurants, venues) with respect</li>
              <li>Maintain the security of your Pi Network account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <strong>7.1 Direct Service Providers:</strong> When using Pi Pioneer driver services, Pi Ride acts as a
                payment facilitator between you and independent drivers who are verified Pi Network members.
              </p>
              <p>
                <strong>7.2 No Liability:</strong> Pi Ride is not responsible for the quality, safety, or legality of
                services provided by direct service providers. Disputes should be resolved directly with the service
                provider.
              </p>
              <p>
                <strong>7.3 Independent Contractors:</strong> Pi Pioneer drivers are independent contractors, not
                employees of Pi Ride. Pi Ride does not control driver schedules, vehicle maintenance, or service
                delivery methods.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Location Services</h2>
            <p className="text-muted-foreground">
              Our Service requires access to your device's location. By using the Service, you consent to location
              tracking for the purposes of providing local services, calculating distances, and processing bookings. You
              can disable location services, but this will limit Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Referral Program</h2>
            <p className="text-muted-foreground">
              Our referral program allows you to earn Pi cryptocurrency by referring new users. Referral rewards are
              subject to terms and conditions that may change. We reserve the right to suspend accounts that abuse the
              referral system.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Pi Arcade Tournaments</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Pi Arcade Tournaments are skill-based gaming competitions where users pay entry fees in Pi
                cryptocurrency to compete for prize pools.
              </p>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">9.1 Tournament Entry</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Entry fees are paid in Pi and are non-refundable once a match begins</li>
                  <li>Players can only enter each tournament once to prevent self-competition</li>
                  <li>Tournaments start when the maximum number of players is reached (typically 7 players)</li>
                  <li>Entry fees are held in escrow until tournament completion</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">9.2 Game Saves and Pauses</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Players may pause tournament games at any time</li>
                  <li>Paused games are automatically saved and can be resumed within 3 minutes</li>
                  <li>If a player does not resume within 3 minutes, their game is forfeited at the paused score</li>
                  <li>Disconnections are treated as pauses - reconnect within 3 minutes to continue</li>
                  <li>PWA/standalone users can pause and save games indefinitely for free play mode</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">9.3 Prizes and Payouts</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Top 3 players receive Pi prizes based on tournament tier</li>
                  <li>Payouts are automatically distributed to winner wallets upon tournament completion</li>
                  <li>Prize distribution: 1st place (60%), 2nd place (30%), 3rd place (10%)</li>
                  <li>No platform fees are deducted from prize pools</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">9.4 Fair Play</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use of bots, automation, or game modifications is strictly prohibited</li>
                  <li>Suspicious activity may result in account suspension and prize forfeiture</li>
                  <li>Disputes can be filed within 24 hours of tournament completion</li>
                  <li>We reserve the right to review game replays for verification</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Cancellations</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You may cancel bookings according to each service provider's cancellation policy</li>
              <li>Late cancellations may result in partial or full charges</li>
              <li>Pi cryptocurrency payments already processed on the blockchain cannot be reversed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE
              UNINTERRUPTED ACCESS, ACCURACY OF INFORMATION, OR AVAILABILITY OF THIRD-PARTY SERVICES.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PI RIDE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR PI CRYPTOCURRENCY.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Account Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your access to the Service at any time for violations of
              these Terms, fraudulent activity, or any reason at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance
              of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by and construed in accordance with applicable laws. Any disputes shall be
              resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact us at:{" "}
              <a href="mailto:ryanbo34@yahoo.com" className="text-primary hover:underline">
                ryanbo34@yahoo.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">17. Pi Marketplace Terms</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                The Pi Marketplace is a peer-to-peer platform where verified Pi Network members can buy and sell goods
                using Pi cryptocurrency.
              </p>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  17.1 Seller Requirements and Responsibilities
                </h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Registration:</strong> One-time 100π business registration fee (subject to promotional
                    discounts via promo codes)
                  </li>
                  <li>
                    <strong>Fee Structure:</strong> Choose between $100 upfront fee with 3% transaction fee, or $0
                    upfront with 8% transaction fee
                  </li>
                  <li>
                    <strong>Accurate Listings:</strong> Sellers must provide truthful descriptions, accurate images, and
                    correct pricing
                  </li>
                  <li>
                    <strong>Product Images:</strong> Upload clear photos; optional 3D visualization with multiple angle
                    photos
                  </li>
                  <li>
                    <strong>Color Variants:</strong> If offering multiple colors, clearly specify available options with
                    accurate representations
                  </li>
                  <li>
                    <strong>Inventory Management:</strong> Maintain accurate stock levels and promptly mark items as
                    sold
                  </li>
                  <li>
                    <strong>Order Fulfillment:</strong> Ship items within stated timeframes and provide tracking
                    information
                  </li>
                  <li>
                    <strong>Communication:</strong> Respond to buyer inquiries within 24 hours
                  </li>
                  <li>
                    <strong>Prohibited Items:</strong> No illegal, counterfeit, hazardous, or restricted items
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">17.2 Buyer Rights and Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Browse Freely:</strong> Search and filter products by category, location, business, and
                    price
                  </li>
                  <li>
                    <strong>3D Product Views:</strong> Interactive 3D visualization available for products with multiple
                    angle photos
                  </li>
                  <li>
                    <strong>Color Selection:</strong> Choose from available color variants when offered by seller
                  </li>
                  <li>
                    <strong>Make Offers:</strong> Submit price offers to sellers for negotiation
                  </li>
                  <li>
                    <strong>Payment:</strong> All purchases processed through Pi Network wallet using Pi cryptocurrency
                  </li>
                  <li>
                    <strong>Due Diligence:</strong> Review product details, seller ratings, and shipping terms before
                    purchase
                  </li>
                  <li>
                    <strong>Disputes:</strong> Contact seller first; escalate to Pi Ride support if unresolved
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">17.3 Marketplace Payments and Transactions</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Pi Wallet Required:</strong> All transactions use Pi Network cryptocurrency
                  </li>
                  <li>
                    <strong>Testnet Mode:</strong> Currently operating in Pi Network testnet/sandbox mode until mainnet
                    approval
                  </li>
                  <li>
                    <strong>Buy Now:</strong> Instant purchase at listed price with immediate Pi wallet payment
                  </li>
                  <li>
                    <strong>Make Offer:</strong> Buyers can propose alternative prices; sellers accept or counter
                  </li>
                  <li>
                    <strong>Transaction Finality:</strong> Blockchain transactions are permanent and non-reversible once
                    confirmed
                  </li>
                  <li>
                    <strong>Platform Fee:</strong> 3-8% commission deducted from seller earnings based on fee plan
                  </li>
                  <li>
                    <strong>Payment Processing:</strong> Buyer pays full amount; seller receives amount minus platform
                    fee
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">17.4 Product Listings and Content</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Product Photos:</strong> Sellers own copyright to uploaded photos
                  </li>
                  <li>
                    <strong>3D Visualization:</strong> Optional feature using uploaded multi-angle photos to create
                    interactive 3D view
                  </li>
                  <li>
                    <strong>Color Variants:</strong> Sellers can specify available colors via photo uploads or color
                    picker
                  </li>
                  <li>
                    <strong>Content License:</strong> Sellers grant Pi Ride license to display product content on
                    platform
                  </li>
                  <li>
                    <strong>Prohibited Content:</strong> No copyrighted, offensive, misleading, or illegal content
                  </li>
                  <li>
                    <strong>Removal Rights:</strong> Pi Ride reserves right to remove listings violating terms
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">17.5 Shop Customization</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Business Profile:</strong> Customize shop name, description, and branding
                  </li>
                  <li>
                    <strong>Product Categories:</strong> Organize products into categories for easy browsing
                  </li>
                  <li>
                    <strong>Display Templates:</strong> Choose from grid, list, or featured product layouts
                  </li>
                  <li>
                    <strong>Shop Settings:</strong> Control visibility, display modes, and product arrangement
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">17.6 Disputes and Returns</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Item Not Received:</strong> Buyer may file dispute if item not delivered within stated
                    timeframe
                  </li>
                  <li>
                    <strong>Item Not as Described:</strong> Buyer may request return if item significantly differs from
                    listing
                  </li>
                  <li>
                    <strong>Return Policy:</strong> Each seller sets own return policy; clearly stated in listing
                  </li>
                  <li>
                    <strong>Refund Processing:</strong> If approved, refund issued in Pi cryptocurrency to buyer's
                    wallet
                  </li>
                  <li>
                    <strong>Platform Mediation:</strong> Pi Ride may mediate disputes but is not liable for resolution
                    outcomes
                  </li>
                  <li>
                    <strong>Blockchain Limitations:</strong> Refunds require seller cooperation; cannot reverse
                    blockchain transactions
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">17.7 Seller Fees</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Fee Plan Selection:</strong> Choose during registration; cannot be changed after signup
                  </li>
                  <li>
                    <strong>Transaction Reporting:</strong> Sellers receive monthly sales reports and earnings
                    statements
                  </li>
                  <li>
                    <strong>Withdrawal:</strong> Earnings remain in Pi wallet; subject to Pi Network withdrawal policies
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">17.8 Marketplace Liability</h3>
                <p className="mb-2">
                  <strong>Platform Role:</strong> Pi Ride operates as a marketplace platform connecting buyers and
                  sellers. We are not a party to transactions between buyers and sellers.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Pi Ride does not guarantee product quality, authenticity, or seller performance</li>
                  <li>Sellers are independent contractors responsible for product legality and compliance</li>
                  <li>Buyers assume risk when purchasing from sellers</li>
                  <li>Pi Ride not liable for damages from defective products, fraud, or non-delivery</li>
                  <li>Users agree to indemnify Pi Ride from claims arising from marketplace transactions</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">17.9 Prohibited Marketplace Activities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Selling counterfeit, stolen, or illegal goods</li>
                  <li>Price manipulation or artificial inflation</li>
                  <li>False reviews or ratings</li>
                  <li>Harassment of buyers or sellers</li>
                  <li>Money laundering or fraud</li>
                  <li>Circumventing platform fees through off-platform transactions</li>
                  <li>Multiple accounts to exploit promo codes</li>
                  <li>
                    Selling movie tickets, gift cards, or any products with links that take users away from the Pi
                    ecosystem
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">18. Marketplace Trust and Safety Systems</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">18.1 Seller Trust Score System</h3>
                <p className="mb-2">
                  All marketplace sellers are evaluated on performance metrics that determine payment processing and
                  visibility:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Trust Score Components:</strong> Shipping speed, product quality, communication, dispute
                    history
                  </li>
                  <li>
                    <strong>Public Display:</strong> Trust badges and ratings visible on seller profiles and product
                    listings
                  </li>
                  <li>
                    <strong>Performance Impact:</strong> Higher trust scores result in better search placement and buyer
                    confidence
                  </li>
                  <li>
                    <strong>Score Updates:</strong> Trust scores update automatically based on buyer reviews and dispute
                    outcomes
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">18.2 Escrow Payment Protection</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>First Sale Escrow:</strong> New sellers' first sale payment held in escrow until delivery
                    confirmed
                  </li>
                  <li>
                    <strong>Instant Release After Success:</strong> After first successful delivery, all future payments
                    release instantly to seller wallet
                  </li>
                  <li>
                    <strong>Protection Re-Activation:</strong> If seller receives 2 poor shipping ratings (below 3
                    stars) or any dispute is filed, escrow automatically re-enables
                  </li>
                  <li>
                    <strong>Release Timing:</strong> Escrow payments release 7 days after delivery or when buyer
                    confirms receipt
                  </li>
                  <li>
                    <strong>Dispute Holds:</strong> Active disputes pause payment release until resolution
                  </li>
                  <li>
                    <strong>Non-Reversible:</strong> Once released from escrow, blockchain transactions cannot be
                    reversed
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">18.3 Buyer Review and Rating System</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Required Ratings:</strong> Overall experience (1-5 stars), shipping speed (1-5 stars),
                    product quality (1-5 stars)
                  </li>
                  <li>
                    <strong>Verified Purchase Badge:</strong> Only actual buyers can review products
                  </li>
                  <li>
                    <strong>Review Timing:</strong> Buyers can submit reviews after delivery confirmation
                  </li>
                  <li>
                    <strong>Public Visibility:</strong> Reviews and ratings publicly displayed on product pages
                  </li>
                  <li>
                    <strong>Edit Window:</strong> Reviews editable within 30 days of submission
                  </li>
                  <li>
                    <strong>Seller Responses:</strong> Sellers may publicly respond to reviews
                  </li>
                  <li>
                    <strong>Helpful Voting:</strong> Users can vote reviews as helpful or not helpful
                  </li>
                  <li>
                    <strong>Prohibited Content:</strong> No profanity, personal attacks, or false statements in reviews
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">18.4 Dispute Resolution Process</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Filing Disputes:</strong> Buyers may file disputes for "Item Not Received" or "Not as
                    Described"
                  </li>
                  <li>
                    <strong>Evidence Required:</strong> Photos, tracking info, and detailed descriptions required
                  </li>
                  <li>
                    <strong>Seller Response:</strong> Sellers have 48 hours to respond to disputes
                  </li>
                  <li>
                    <strong>Admin Mediation:</strong> Pi Ride administrators review evidence and make binding decisions
                  </li>
                  <li>
                    <strong>Refund Outcomes:</strong> If buyer prevails, refund issued in Pi to buyer's wallet; seller's
                    trust score impacted
                  </li>
                  <li>
                    <strong>Seller Protection:</strong> Tracking numbers and delivery confirmations protect sellers from
                    false claims
                  </li>
                  <li>
                    <strong>Repeated Disputes:</strong> Sellers with multiple disputes may face listing restrictions or
                    account suspension
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">18.5 Poor Shipping Rating Consequences</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Threshold:</strong> 2 shipping ratings below 3 stars triggers automatic consequences
                  </li>
                  <li>
                    <strong>Escrow Re-Activation:</strong> Instant payments suspended; future sales held in escrow
                  </li>
                  <li>
                    <strong>Visibility Impact:</strong> Poor shipping badge displayed on seller profile
                  </li>
                  <li>
                    <strong>Recovery:</strong> 5 consecutive positive shipping ratings (4+ stars) removes restrictions
                  </li>
                  <li>
                    <strong>Seller Dashboard Alerts:</strong> Real-time notifications of trust score changes
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">18.6 Fraud Prevention</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Automated detection of suspicious listing patterns and pricing</li>
                  <li>Review monitoring for fake or coordinated reviews</li>
                  <li>Transaction analysis for unusual patterns</li>
                  <li>Immediate suspension of accounts engaging in fraudulent activity</li>
                  <li>Cooperation with law enforcement when illegal activity detected</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">18.7 Seller Account Suspension</h3>
                <p className="mb-2">Pi Ride reserves the right to suspend or terminate seller accounts for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>3 or more unresolved disputes in 90-day period</li>
                  <li>Trust score falling below 2.0 stars</li>
                  <li>Consistent poor shipping ratings (below 3 stars average)</li>
                  <li>Selling prohibited or counterfeit items</li>
                  <li>Manipulating reviews or trust scores</li>
                  <li>Failure to ship items within stated timeframes</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">19. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact us at:{" "}
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
