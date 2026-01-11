"use client"

import { Card } from "@/components/ui/card"
import { Users, Gift, TrendingUp } from "lucide-react"
import { getReferralData, getAvailableRewards } from "@/lib/referral-system"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useEffect, useState } from "react"

export function ReferralStats() {
  const { user } = usePiWallet()
  const [stats, setStats] = useState({
    totalReferrals: 0,
    availableRewards: 0,
    activeReferrals: 0,
  })

  useEffect(() => {
    if (user?.uid) {
      const referralData = getReferralData(user.uid)
      const availableRewards = getAvailableRewards(user.uid)
      const activeReferrals = referralData.referrals.filter((r) => r.firstRideCompleted).length

      setStats({
        totalReferrals: referralData.totalReferrals,
        availableRewards: availableRewards.length,
        activeReferrals,
      })
    }
  }, [user])

  const statsData = [
    { label: "Total Referrals", value: stats.totalReferrals.toString(), icon: Users, color: "text-primary" },
    {
      label: "Available Free Rides",
      value: stats.availableRewards.toString(),
      icon: Gift,
      color: "text-secondary",
    },
    { label: "Active Referrals", value: stats.activeReferrals.toString(), icon: TrendingUp, color: "text-success" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statsData.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
