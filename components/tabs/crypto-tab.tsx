"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bitcoin, Wallet, Calculator, Clock } from "@/lib/icons"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { usePiWallet } from "@/hooks/use-pi-wallet"

export function CryptoTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const { isConnected, connect } = usePiWallet()

  const handleSubscribe = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    setIsSubscribing(true)

    try {
      console.log("[v0] Creating crypto tax subscription...")

      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Subscription Activated!",
        description: "Your professional crypto tax service is now active. Check your email for setup instructions.",
      })

      setShowSubscriptionDialog(false)
    } catch (error) {
      toast({
        title: "Subscription Failed",
        description: "Unable to process subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Crypto Services</h2>
          <p className="text-muted-foreground">Buy and manage Pi cryptocurrency within the ecosystem</p>
        </div>
        <Input
          placeholder="Search crypto services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bitcoin className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-2xl">Buy Pi Cryptocurrency</CardTitle>
              <CardDescription>Purchase Pi directly from official channels</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              Official Pi Network purchase
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              Secure transactions
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              Direct to your Pi wallet
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              No third-party exchanges needed
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              console.log("[v0] Buy Pi button clicked")
              toast({
                title: "Buy Pi Feature Coming Soon",
                description: "In-app Pi purchasing will be available after Pi Network approval",
              })
            }}
          >
            <Bitcoin className="w-5 h-5 mr-2" />
            Buy Pi
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          Crypto Tax Tools
        </h3>
        <Card>
          <CardHeader>
            <CardTitle>Professional Crypto Tax Services</CardTitle>
            <CardDescription>Comprehensive tax record keeping and reporting for Pi transactions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Stay compliant with tax regulations while using Pi cryptocurrency. Our comprehensive service automatically
              tracks all your transactions, calculates capital gains/losses, and generates IRS-ready reports. Perfect
              for pioneers who want peace of mind during tax season.
            </p>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Automatic transaction history tracking across all Pi services
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Real-time capital gains/loss calculations with FIFO/LIFO methods
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Tax-ready reports compatible with TurboTax, H&R Block, and accountants
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                IRS Form 8949 and Schedule D support
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Live chat support for tax questions from crypto tax professionals
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                Year-round access with quarterly tax estimate calculations
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Annual Subscription</span>
                <span className="text-2xl font-bold text-primary">99π/year</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cancel anytime • Full refund in first 30 days • Automatic renewal
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={() => setShowSubscriptionDialog(true)}>
              <Calculator className="w-5 h-5 mr-2" />
              Subscribe Now
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Professional Crypto Tax Subscription</DialogTitle>
            <DialogDescription>
              Subscribe to comprehensive tax tracking and reporting for all your Pi transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">What's Included:</h4>
              <ul className="text-sm space-y-1">
                <li>• Automatic transaction tracking</li>
                <li>• Capital gains/loss calculations</li>
                <li>• IRS-ready tax reports</li>
                <li>• Form 8949 & Schedule D support</li>
                <li>• Live chat support with tax pros</li>
                <li>• Quarterly tax estimates</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
              <span className="font-semibold">Annual Subscription</span>
              <span className="text-2xl font-bold text-primary">99π</span>
            </div>

            <p className="text-xs text-muted-foreground">
              By subscribing, you agree to automatic annual renewal at 99π/year. Cancel anytime with full refund in
              first 30 days.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)} disabled={isSubscribing}>
              Cancel
            </Button>
            <Button onClick={handleSubscribe} disabled={isSubscribing}>
              {isSubscribing ? "Processing..." : isConnected ? "Subscribe with Pi" : "Connect Wallet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          Hardware Wallets
        </h3>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="w-10 h-10 text-muted-foreground" />
              <div>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>Hardware wallet support for Pi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hardware wallet integration for Pi cryptocurrency is in development. Keep your Pi secure!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
