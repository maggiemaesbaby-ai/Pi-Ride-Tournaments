import { Wallet, CheckCircle } from "@/lib/icons"

export default function PaymentFlowPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            How Pi Payments Work
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Understanding the seamless payment flow that powers Pi Ride
          </p>
        </div>

        {/* Payment Flow Diagram */}
        <div className="grid md:grid-cols-1 gap-6 max-w-md mx-auto">
          {/* Step 1 */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">1. User Pays with Pi</h3>
              <p className="text-sm text-muted-foreground">
                Customer selects a service and pays using Pi cryptocurrency through the Pi Network SDK
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <CheckCircle className="w-7 h-7 text-green-500" />
            Benefits for Everyone
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-cyan-500">For Users</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2" />
                  <span>Pay with Pi for everything</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2" />
                  <span>Access all travel services</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2" />
                  <span>Simple, unified experience</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-pink-500">For Pi Ride</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2" />
                  <span>Listing fees and transaction fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2" />
                  <span>Sustainable business model</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pi Ecosystem Compliance */}
        <div className="bg-card border-2 border-primary/20 rounded-lg p-8 space-y-4">
          <h2 className="text-2xl font-bold text-primary">Pi Ecosystem Compliance</h2>
          <div className="space-y-3 text-muted-foreground">
            <p>
              Pi Ride is <strong className="text-foreground">100% compliant</strong> with Pi Network Ecosystem
              requirements:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Pi-Only for Users:</strong> Customers can only pay with Pi cryptocurrency
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Pi SDK Authentication:</strong> Users login exclusively through Pi Network SDK
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Secure Transactions:</strong> All payments processed through official Pi Network payment APIs
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Technical Integration */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold">Technical Integration</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Frontend (User-Facing)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span>Pi Network SDK for wallet connection and authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span>Payment initiation through Pi SDK</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span>Real-time Pi price display from CoinGecko API</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Backend (Server-Side)</h3>
              <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span>Pi Platform API for payment approval and completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                  <span>Transaction logging and reconciliation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Future Enhancements */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-8 space-y-4">
          <h2 className="text-2xl font-bold">Future Enhancements</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-500">1</span>
              </div>
              <div>
                <strong className="text-foreground">Direct Pi Acceptance:</strong> Partner with service providers who
                accept Pi directly
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-500">2</span>
              </div>
              <div>
                <strong className="text-foreground">Pi Treasury:</strong> Hold Pi reserves to optimize platform
                operations
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-purple-500">3</span>
              </div>
              <div>
                <strong className="text-foreground">Enhanced Features:</strong> Add more Pi-powered services and
                marketplace options
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
