export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Pi Ride ("we," "our," or "us") operates the Pi Ride mobile application and website (collectively, the
              "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">2.1 Information from Pi Network</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Pi Network username</li>
                  <li>Pi Network user ID</li>
                  <li>Pi wallet address (for payment processing)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">2.2 Location Information</h3>
                <p>We collect your real-time location data when you use our Service to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Find nearby rides, restaurants, and entertainment venues</li>
                  <li>Calculate distances and pricing</li>
                  <li>Provide accurate pickup and delivery services</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">2.3 Transaction Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Booking history</li>
                  <li>Payment amounts in Pi cryptocurrency</li>
                  <li>Service preferences and selections</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Process your bookings and Pi cryptocurrency transactions</li>
              <li>Provide location-based services (rides, food delivery, entertainment)</li>
              <li>Send booking confirmations and service updates</li>
              <li>Improve our Service and user experience</li>
              <li>Maintain security and prevent fraud</li>
              <li>Process referral rewards in Pi cryptocurrency</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing</h2>
            <p className="text-muted-foreground mb-4">We share your information with:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Pi Network:</strong> For authentication and payment processing
              </li>
              <li>
                <strong>Service Providers:</strong> Restaurants, theaters, and ride providers you book through our app
              </li>
              <li>
                <strong>Location Services:</strong> For mapping and geolocation features
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect rights and safety
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Pi Cryptocurrency Payments</h2>
            <p className="text-muted-foreground">
              All payments are processed through Pi Network's blockchain. We do not store your Pi wallet private keys.
              Transaction records are maintained on the Pi blockchain and are subject to Pi Network's privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your information. However, no method of
              transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal obligations)</li>
              <li>Opt-out of location tracking (may limit Service functionality)</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our Service is not intended for users under 18 years of age. We do not knowingly collect information from
              children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy periodically. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:ryanbo34@yahoo.com" className="text-primary hover:underline">
                ryanbo34@yahoo.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Pi Marketplace Data Collection and Usage</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">11.1 Seller Information</h3>
                <p className="mb-2">When you register as a marketplace seller, we collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Business name and description</li>
                  <li>Contact information (email, phone)</li>
                  <li>Business address and service locations</li>
                  <li>Pi wallet address for payment processing</li>
                  <li>Product listings (photos, descriptions, pricing)</li>
                  <li>3D product visualization data (multi-angle photos if provided)</li>
                  <li>Transaction history and sales analytics</li>
                  <li>Customer reviews and ratings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">11.2 Buyer Information</h3>
                <p className="mb-2">When you make marketplace purchases, we collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Purchase history and order details</li>
                  <li>Product preferences and browsing behavior</li>
                  <li>Shipping addresses for product delivery</li>
                  <li>Payment amounts in Pi cryptocurrency</li>
                  <li>Communication with sellers (messages, offers, negotiations)</li>
                  <li>Product reviews and ratings you submit</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">11.3 Product Content and Images</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Product photos uploaded by sellers are stored for listing display</li>
                  <li>Multi-angle photos used for 3D visualization are processed to create interactive models</li>
                  <li>We do not claim ownership of seller-uploaded content</li>
                  <li>Product images may be displayed in search results and marketplace browsing</li>
                  <li>
                    3D visualization data is generated from uploaded photos and stored for performance optimization
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">11.4 Marketplace Data Sharing</h3>
                <p className="mb-2">We share marketplace information with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Buyers and Sellers:</strong> Order details, shipping info, and contact information shared
                    between transaction parties
                  </li>
                  <li>
                    <strong>Pi Network:</strong> Transaction data for payment processing on Pi blockchain
                  </li>
                  <li>
                    <strong>Analytics:</strong> Aggregated, anonymized data for marketplace performance analysis
                  </li>
                  <li>
                    <strong>Law Enforcement:</strong> When required by law or to investigate fraud
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">11.5 Data Retention</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Active product listings retained while business account is active</li>
                  <li>Transaction records kept for 7 years for tax and legal compliance</li>
                  <li>Product photos and 3D visualization data deleted within 30 days of listing removal</li>
                  <li>Customer communication logs retained for dispute resolution (up to 2 years)</li>
                  <li>Deleted accounts: data anonymized after 90 days, except legal retention requirements</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">11.6 Marketplace Security</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Product data and seller information encrypted in transit and at rest</li>
                  <li>Pi wallet addresses used only for payment processing</li>
                  <li>Access controls limit employee access to seller and buyer data</li>
                  <li>Regular security audits to protect marketplace integrity</li>
                  <li>Fraud detection systems monitor for suspicious transactions</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">11.7 Your Marketplace Privacy Rights</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your seller/buyer data and transaction history</li>
                  <li>Edit or delete product listings at any time</li>
                  <li>Request removal of product photos and 3D visualization data</li>
                  <li>Export your marketplace data in portable format</li>
                  <li>Close your seller account and request data deletion (subject to legal retention)</li>
                  <li>Opt-out of marketing communications while maintaining marketplace access</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Escrow and Payment Protection Data</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">12.1 Seller Trust Scores</h3>
                <p className="mb-2">We maintain trust and performance metrics for marketplace sellers including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Completion rate of orders and deliveries</li>
                  <li>Shipping speed ratings from buyers</li>
                  <li>Product quality ratings and reviews</li>
                  <li>Dispute history and resolution outcomes</li>
                  <li>Response time to customer inquiries</li>
                  <li>First successful delivery milestone status</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">12.2 Escrow Payment Protection</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>New Seller Escrow:</strong> First sale payments are held in escrow until successful delivery
                    is confirmed
                  </li>
                  <li>
                    <strong>Automatic Release:</strong> After first successful delivery, future payments release
                    instantly to sellers
                  </li>
                  <li>
                    <strong>Re-Enabled Protection:</strong> Escrow may be re-enabled if seller receives 2 poor shipping
                    ratings or disputes are filed
                  </li>
                  <li>
                    <strong>Payment Timing:</strong> Escrow payments release automatically after buyer confirms delivery
                    or 7 days post-delivery
                  </li>
                  <li>
                    <strong>Dispute Holds:</strong> Payments remain in escrow during active dispute investigations
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">12.3 Review and Rating Data</h3>
                <p className="mb-2">When you submit reviews, we collect and display:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Star ratings (1-5 stars) for overall experience, shipping speed, and product quality</li>
                  <li>Written review comments and feedback</li>
                  <li>Review submission date and verified purchase badge</li>
                  <li>Your Pi Network username (displayed with review)</li>
                  <li>Product photos uploaded with reviews</li>
                  <li>Helpfulness votes from other users</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">12.4 Dispute and Case Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Dispute reasons and detailed descriptions</li>
                  <li>Evidence submitted (photos, tracking info, communications)</li>
                  <li>Resolution history and outcomes</li>
                  <li>Refund amounts and processing status</li>
                  <li>Administrative notes from dispute mediation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">12.5 Data Sharing for Trust and Safety</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Public Display:</strong> Seller trust scores and badges visible to all marketplace users
                  </li>
                  <li>
                    <strong>Reviews:</strong> Your reviews and ratings publicly visible on product pages
                  </li>
                  <li>
                    <strong>Aggregated Metrics:</strong> Overall seller performance metrics displayed on shop profiles
                  </li>
                  <li>
                    <strong>Dispute Records:</strong> Dispute outcomes affect seller trust scores; details kept private
                    except to involved parties
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">12.6 Your Rights Regarding Trust Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>View your complete trust score breakdown and performance metrics</li>
                  <li>Request correction of inaccurate dispute records</li>
                  <li>Appeal trust score reductions with supporting evidence</li>
                  <li>Edit or delete reviews you submitted within 30 days</li>
                  <li>Report fraudulent or abusive reviews</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Pi Arcade Tournament Data</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">
                  13.1 Tournament and Gameplay Data Collection
                </h3>
                <p className="mb-2">When you participate in Pi Arcade tournaments, we collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Game scores, completion times, and performance metrics</li>
                  <li>Tournament entry payments and prize winnings in Pi</li>
                  <li>Match history, rankings, and leaderboard positions</li>
                  <li>Game pause/resume events and timestamps</li>
                  <li>Disconnection events and reconnection attempts</li>
                  <li>Saved game states for tournament and free play modes</li>
                  <li>In-game actions and gameplay patterns for anti-cheat verification</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">13.2 Use of Tournament Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Determine tournament winners and distribute prize payouts</li>
                  <li>Maintain leaderboards and player statistics</li>
                  <li>Detect cheating, bots, and unfair gameplay practices</li>
                  <li>Improve game balance and tournament structures</li>
                  <li>Verify disputes and review contested matches</li>
                  <li>Generate aggregated analytics for platform performance</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">13.3 Public Tournament Information</h3>
                <p className="mb-2">The following tournament data is publicly visible:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your Pi username and tournament rankings</li>
                  <li>High scores and achievements on global leaderboards</li>
                  <li>Tournament participation history (games played, wins, losses)</li>
                  <li>Total Pi winnings and payout amounts</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">13.4 Saved Game Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Tournament game states saved for 3 minutes during pauses/disconnections</li>
                  <li>Free play (PWA) game states saved indefinitely in local device storage</li>
                  <li>Saved tournament games automatically deleted after forfeit or completion</li>
                  <li>We do not access or share saved game data except for anti-cheat verification</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">13.5 Tournament Data Retention</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Active tournament matches retained until completion (max 7 days)</li>
                  <li>Tournament results and leaderboards kept for 1 year</li>
                  <li>Payment records (entry fees, payouts) retained for 7 years for tax compliance</li>
                  <li>Anti-cheat investigation data kept for 2 years</li>
                  <li>Game replay data for disputes retained for 30 days post-match</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium text-foreground mb-2">13.6 Your Arcade Privacy Rights</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>View your complete tournament history and statistics</li>
                  <li>Request removal from public leaderboards (scores remain for prize verification)</li>
                  <li>Access game replay data for your matches</li>
                  <li>Appeal anti-cheat decisions with supporting evidence</li>
                  <li>Delete saved free play game data from your device</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us at:{" "}
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
