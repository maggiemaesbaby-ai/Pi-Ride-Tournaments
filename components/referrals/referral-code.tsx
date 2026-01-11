"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getReferralData } from "@/lib/referral-system"
import { usePiWallet } from "@/hooks/use-pi-wallet"

export function ReferralCode() {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const { user } = usePiWallet()
  const [referralCode, setReferralCode] = useState("PIRIDE------")
  const [referralLink, setReferralLink] = useState("")

  useEffect(() => {
    if (user?.uid) {
      const referralData = getReferralData(user.uid)
      setReferralCode(referralData.code)
      setReferralLink(`https://ride.pi/ref/${referralData.code}`)
    }
  }, [user])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pi Ride",
          text: "Try Pi Ride: Traveling Made Easy – All in Pi.",
          url: referralLink,
        })
      } catch (error) {
        console.log("Share cancelled")
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Your Referral Code</h2>

      <div className="space-y-4">
        <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Referral Code</p>
          <p className="text-3xl font-bold text-primary tracking-wider">{referralCode}</p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Referral Link</p>
          <p className="text-sm font-mono break-all">{referralLink}</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={copyToClipboard} className="flex-1 gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button onClick={shareReferral} variant="outline" className="flex-1 gap-2 bg-transparent">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
          <h3 className="font-semibold mb-2">Referral Rewards</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Your friend gets their first ride platform fee FREE</li>
            <li>• You get 1 free platform fee ride for each completed signup</li>
            <li>• Rewards expire 30 days after earning</li>
            <li>• 5 referrals = 5 free platform fee rides</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
