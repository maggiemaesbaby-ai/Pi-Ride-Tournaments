import { Mail, MessageSquare, HelpCircle } from "@/lib/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Contact Us | Pi Ride",
  description: "Get in touch with the Pi Ride support team",
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            We're here to help! Reach out to our support team with any questions or concerns.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card>
            <CardHeader>
              <Mail className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Email Support</CardTitle>
              <CardDescription>Get help via email</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="mailto:support@piride.com" className="text-primary hover:underline font-medium">
                support@piride.com
              </a>
              <p className="text-sm text-muted-foreground mt-2">Response time: 24-48 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="w-8 h-8 text-primary mb-2" />
              <CardTitle>General Inquiries</CardTitle>
              <CardDescription>Questions about Pi Ride</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                For general questions about our services, pricing, or partnerships, contact us via email.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <HelpCircle className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Technical Support</CardTitle>
              <CardDescription>App or payment issues</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Having trouble with payments or the app? Email us with details and screenshots.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">How do I connect my Pi wallet?</h3>
              <p className="text-sm text-muted-foreground">
                Open Pi Ride in the Pi Browser app, select a service, and click "Connect Wallet" to authenticate with
                your Pi Network account.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                Pi Ride exclusively accepts Pi cryptocurrency for all transactions. We do not accept cash or credit
                cards.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">What is the app fee?</h3>
              <p className="text-sm text-muted-foreground">
                Pi Ride charges a 5% app fee on all bookings and orders to maintain and improve our services.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">How do I report a problem?</h3>
              <p className="text-sm text-muted-foreground">
                Email us at support@piride.com with a detailed description of the issue, including screenshots if
                possible.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Can I get a refund?</h3>
              <p className="text-sm text-muted-foreground">
                Refund policies vary by service provider. Contact support with your booking details and we'll assist you
                with the refund process.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <a href="mailto:support@piride.com">
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
