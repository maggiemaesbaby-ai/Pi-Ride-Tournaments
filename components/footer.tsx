import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">Pi Ride</h3>
            <p className="text-sm text-muted-foreground">
              The all-in-one Pi cryptocurrency platform for rides, food, entertainment, and more.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">About</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/payment-flow"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  How Payments Work
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="mailto:ryanbo34@yahoo.com"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  ryanbo34@yahoo.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Pi Ride. All rights reserved. Powered by Pi Network.</p>
        </div>
      </div>
    </footer>
  )
}
