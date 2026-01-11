"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { ArrowLeft, CheckCircle } from "@/lib/icons"
import Link from "next/link"

export default function LagosRiderWaitlist() {
  const { user, connectWallet } = usePiWallet()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState("")

  const handleJoinWaitlist = async () => {
    if (!user?.uid) {
      await connectWallet()
      setTimeout(() => {
        if (user?.uid) {
          window.location.href = "/dashboard?tab=waitlist"
        }
      }, 1000)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/lagos/join-waitlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          piUserId: user.uid,
          email: email || user.username,
          type: "rider",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join waitlist")
      }

      window.location.href = "/dashboard?tab=waitlist"
    } catch (err: any) {
      console.error("[Lagos Rider Waitlist] Error:", err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 text-white p-4">
      <div className="container mx-auto max-w-2xl py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-white hover:text-white/80">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {!joined ? (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Join the Lagos Rider Waitlist</CardTitle>
              <CardDescription className="text-white/80 text-lg">
                Be among the first riders when Pi Ride launches in Lagos, Nigeria!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-lg border border-green-400/30">
                <h3 className="font-bold text-lg mb-2">What You Get:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Priority access when we launch in Lagos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Notification when drivers are active in your area</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Book rides with verified, background-checked drivers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Pay with Pi - support the Pioneer ecosystem</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">
                    Email (Optional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <p className="text-xs text-white/60 mt-1">We'll notify you when Lagos launches!</p>
                </div>

                {error && <p className="text-red-300 text-sm">{error}</p>}

                <Button
                  onClick={handleJoinWaitlist}
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {!user?.uid ? "Connect Wallet to Join" : isSubmitting ? "Joining..." : "Join Waitlist"}
                </Button>

                <p className="text-xs text-white/70 text-center">
                  After connecting your wallet, you'll be redirected to your dashboard waitlist section to confirm your
                  registration.
                </p>
              </div>

              <p className="text-xs text-white/70 text-center">
                By joining, you'll receive updates about the Lagos launch. Your Pi wallet will be used for payments when
                we go live.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">You're on the Waitlist!</h2>
              <p className="text-white/90 text-lg mb-6">
                Thank you for joining! We'll notify you when Pi Ride launches in Lagos.
              </p>
              <p className="text-white/80 mb-8">
                The more pioneers that join, the faster we can launch. Share with your friends in Lagos!
              </p>
              <Link href="/">
                <Button size="lg" className="bg-white text-green-600 hover:bg-white/90">
                  Return to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
