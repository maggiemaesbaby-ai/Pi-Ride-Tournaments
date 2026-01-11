"use client"

import { Card } from "@/components/ui/card"
import { User, CheckCircle, Clock, Calendar } from "lucide-react"
import { getReferralData, getAvailableRewards } from "@/lib/referral-system"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useEffect, useState } from "react"

export function ReferralList() {
  const { user } = usePiWallet()
  const [referrals, setReferrals] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])

  useEffect(() => {
    if (user?.uid) {
      const referralData = getReferralData(user.uid)
      setReferrals(referralData.referrals)
      setRewards(getAvailableRewards(user.uid))
    }
  }, [user])

  return (
    <div className="space-y-6">
      {rewards.length > 0 && (
        <Card className="p-6 bg-secondary/5 border-2 border-secondary">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-secondary" />
            Available Rewards ({rewards.length})
          </h2>
          <div className="space-y-3">
            {rewards.map((reward) => {
              const expiresAt = new Date(reward.expiresAt)
              const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

              return (
                <div key={reward.id} className="flex items-center justify-between p-4 bg-white rounded-lg border-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold">Platform Fee Waived</p>
                      <p className="text-sm text-muted-foreground">Use on your next booking</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-warning">
                      <Calendar className="w-4 h-4" />
                      <span>Expires in {daysUntilExpiry} days</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{expiresAt.toLocaleDateString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Your Referrals ({referrals.length})</h2>

        {referrals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No referrals yet. Share your code to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((referral) => (
              <div key={referral.userId} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{referral.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.signupDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-primary">{referral.referrerBonus} π</p>
                    <p className="text-xs text-muted-foreground">bonus earned</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {referral.firstRideCompleted ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <Clock className="w-5 h-5 text-warning" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
