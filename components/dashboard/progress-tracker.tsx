"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Target } from "lucide-react"

export function ProgressTracker() {
  const currentBookings = 24
  const nextMilestone = 500
  const currentFee = 2
  const nextFee = 3
  const progress = (currentBookings / nextMilestone) * 100

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Progress to Next Tier</h2>
          <p className="text-sm text-muted-foreground">
            {currentBookings} / {nextMilestone} bookings
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-3 mb-4" />

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-success" />
            <span className="text-sm font-medium">Current Tier</span>
          </div>
          <p className="text-2xl font-bold text-success">{currentFee}%</p>
          <p className="text-xs text-muted-foreground">Platform fee</p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Next Tier</span>
          </div>
          <p className="text-2xl font-bold text-primary">{nextFee}%</p>
          <p className="text-xs text-muted-foreground">At 500 bookings</p>
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium">Final Tier</span>
          </div>
          <p className="text-2xl font-bold text-warning">5%</p>
          <p className="text-xs text-muted-foreground">At 2000 bookings</p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-sm text-balance">
          <strong>Note:</strong> Platform fees increase as you reach booking milestones. You're currently at{" "}
          {currentFee}% and need {nextMilestone - currentBookings} more bookings to reach the next tier.
        </p>
      </div>
    </Card>
  )
}
