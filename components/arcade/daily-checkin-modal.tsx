"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { dailyCheckInDB } from "@/lib/daily-checkin-db"
import { useToast } from "@/hooks/use-toast"
import { X, Gift, Trophy, Sparkles } from "@/lib/icons"

interface DailyCheckInModalProps {
  userId: string
  onClose: () => void
  onWeeklyUnlock?: () => void
}

export function DailyCheckInModal({ userId, onClose, onWeeklyUnlock }: DailyCheckInModalProps) {
  const { toast } = useToast()
  const [checkInData, setCheckInData] = useState(dailyCheckInDB.getUserCheckIn(userId))
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Refresh check-in data
    setCheckInData(dailyCheckInDB.getUserCheckIn(userId))
  }, [userId])

  const handleDayClick = (day: number) => {
    // Only allow clicking today's check-in
    if (day !== checkInData.currentStreak + 1) return

    if (dailyCheckInDB.hasCheckedInToday(userId)) {
      toast({
        title: "Already Checked In!",
        description: "You've already claimed today's reward. Come back tomorrow!",
        variant: "destructive",
      })
      return
    }

    setIsAnimating(true)

    const result = dailyCheckInDB.checkIn(userId)

    if (result.success) {
      setCheckInData(dailyCheckInDB.getUserCheckIn(userId))

      setTimeout(() => {
        setIsAnimating(false)

        if (result.unlocked) {
          toast({
            title: "🎉 7-Day Streak Complete!",
            description: "Free Weekly Tournament unlocked! Look for the glowing Free Play button in any game.",
          })
          onWeeklyUnlock?.()
        } else {
          const reward = dailyCheckInDB.getRewardForDay(day)
          toast({
            title: `Day ${day} Reward Collected!`,
            description: `${reward.description} - ${7 - result.streak} days until Free Tournament!`,
          })
        }

        setTimeout(() => {
          onClose()
        }, 1500)
      }, 800)
    } else {
      setIsAnimating(false)
      toast({
        title: "Already Checked In!",
        description: "You've already claimed today's reward. Come back in 24 hours!",
        variant: "destructive",
      })
    }
  }

  const rewards = Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    ...dailyCheckInDB.getRewardForDay(i + 1),
    isCompleted: i < checkInData.currentStreak,
    isToday: i === checkInData.currentStreak && !dailyCheckInDB.hasCheckedInToday(userId),
    isLocked: i > checkInData.currentStreak,
  }))

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="relative w-full max-w-md bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-4 border-yellow-400 shadow-2xl shadow-yellow-500/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
        >
          <X className="w-5 h-5" />
        </Button>

        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-block relative mb-4">
              <div className="text-6xl animate-bounce">
                <Gift className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-pink-400 animate-pulse" />
            </div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2 drop-shadow-lg animate-glow">
              DAILY REWARD
            </h2>
            <p className="text-yellow-200 text-sm font-semibold">Come back tomorrow for more rewards!</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 flex justify-center gap-3">
            {[8, 15, 22, 30].map((milestone) => (
              <div key={milestone} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center border-4 border-white/50 shadow-lg">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-bold mt-1">{milestone}</span>
              </div>
            ))}
          </div>

          {/* Reward Cards - Days 1-6 */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {rewards.slice(0, 6).map((reward) => (
              <Card
                key={reward.day}
                onClick={() => handleDayClick(reward.day)}
                className={`
                  relative overflow-hidden transition-all duration-300 cursor-pointer border-4
                  ${
                    reward.isCompleted
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-300 opacity-60"
                      : reward.isToday
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-200 shadow-xl shadow-yellow-500/50 animate-pulse scale-105"
                        : "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 opacity-40"
                  }
                `}
              >
                <CardContent className="p-3 text-center">
                  <div className="text-xs font-bold text-white mb-2 bg-black/30 rounded px-2 py-0.5">
                    Day {reward.day}
                  </div>
                  <div className="text-4xl mb-2">{reward.icon}</div>
                  <Badge
                    className={`text-xs font-black ${
                      reward.isToday ? "bg-white text-purple-900" : "bg-purple-900 text-white"
                    }`}
                  >
                    {reward.label}
                  </Badge>
                  {reward.isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-4xl">✓</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Day 7 - Special Card */}
          <Card
            onClick={() => handleDayClick(7)}
            className={`
              relative overflow-hidden transition-all duration-300 cursor-pointer border-4 mb-6
              ${
                rewards[6].isCompleted
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 border-green-300 opacity-60"
                  : rewards[6].isToday
                    ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 border-yellow-200 shadow-2xl shadow-yellow-500/70 animate-pulse"
                    : "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 opacity-40"
              }
            `}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-sm font-bold text-white mb-2 bg-black/30 rounded px-3 py-1 inline-block">
                  Day 7
                </div>
                <div className="flex justify-center items-center gap-3 mb-2">
                  <div className="text-3xl">{rewards[6].icon}</div>
                  <Trophy className="w-10 h-10 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" />
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg px-4 py-1 font-black">
                  {rewards[6].label}
                </Badge>
                <p className="text-white text-xs mt-2 font-semibold">{rewards[6].description}</p>
                {rewards[6].isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-6xl">✓</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Streak Display */}
          <div className="text-center">
            <p className="text-yellow-300 font-bold text-lg mb-2">
              Current Streak: {checkInData.currentStreak} / 7 days
            </p>
            {checkInData.weeklyTournamentUnlocked && !checkInData.weeklyTournamentPlayed && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-4 py-2 animate-pulse">
                <Trophy className="w-4 h-4 mr-2" />
                Free Tournament Available!
              </Badge>
            )}
            {dailyCheckInDB.hasCheckedInToday(userId) && checkInData.currentStreak < 7 && (
              <p className="text-cyan-300 text-sm">
                ✓ Checked in today! Come back tomorrow for Day {checkInData.currentStreak + 1}
              </p>
            )}
          </div>

          <Button
            onClick={onClose}
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg py-6"
          >
            Tap to Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
