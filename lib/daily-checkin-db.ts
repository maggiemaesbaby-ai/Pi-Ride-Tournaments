// Daily check-in tracking system for arcade rewards

export interface DailyCheckIn {
  userId: string
  checkInDates: string[] // Array of ISO date strings (YYYY-MM-DD)
  currentStreak: number // 1-7
  weeklyTournamentUnlocked: boolean
  weeklyTournamentPlayed: boolean
  lastCheckInDate: string
  lastCheckInTimestamp: number // Unix timestamp in milliseconds
  totalCheckIns: number
}

class DailyCheckInDB {
  private readonly STORAGE_KEY = "pi-arcade-checkin-v1"
  private checkIns: Map<string, DailyCheckIn> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return

    const data = localStorage.getItem(this.STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      this.checkIns = new Map(parsed.checkIns || [])
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({
        checkIns: Array.from(this.checkIns.entries()),
      }),
    )
  }

  private getTodayDate(): string {
    return new Date().toISOString().split("T")[0]
  }

  private getYesterdayDate(): string {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split("T")[0]
  }

  // Get user's check-in data
  getUserCheckIn(userId: string): DailyCheckIn {
    let checkIn = this.checkIns.get(userId)

    if (!checkIn) {
      checkIn = {
        userId,
        checkInDates: [],
        currentStreak: 0,
        weeklyTournamentUnlocked: false,
        weeklyTournamentPlayed: false,
        lastCheckInDate: "",
        lastCheckInTimestamp: 0,
        totalCheckIns: 0,
      }
      this.checkIns.set(userId, checkIn)
      this.saveToStorage()
    }

    return checkIn
  }

  // Check if user has checked in today
  hasCheckedInToday(userId: string): boolean {
    const checkIn = this.getUserCheckIn(userId)
    const today = this.getTodayDate()
    const now = Date.now()
    const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    // Check both date AND timestamp to ensure no check-ins within 24 hours
    const isSameDay = checkIn.lastCheckInDate === today
    const isWithin24Hours = now - checkIn.lastCheckInTimestamp < twentyFourHours

    return isSameDay || isWithin24Hours
  }

  // Perform daily check-in
  checkIn(userId: string): { success: boolean; streak: number; unlocked: boolean } {
    const checkIn = this.getUserCheckIn(userId)
    const today = this.getTodayDate()
    const yesterday = this.getYesterdayDate()
    const now = Date.now()
    const twentyFourHours = 24 * 60 * 60 * 1000

    // Already checked in today or within 24 hours
    if (checkIn.lastCheckInDate === today || now - checkIn.lastCheckInTimestamp < twentyFourHours) {
      return { success: false, streak: checkIn.currentStreak, unlocked: checkIn.weeklyTournamentUnlocked }
    }

    // Check if streak continues or breaks
    if (checkIn.lastCheckInDate === yesterday) {
      // Consecutive day
      checkIn.currentStreak += 1
    } else if (checkIn.lastCheckInDate) {
      // Streak broken, reset
      checkIn.currentStreak = 1
      checkIn.weeklyTournamentUnlocked = false
      checkIn.weeklyTournamentPlayed = false
    } else {
      // First check-in
      checkIn.currentStreak = 1
    }

    // Update check-in data
    checkIn.lastCheckInDate = today
    checkIn.lastCheckInTimestamp = now
    checkIn.checkInDates.push(today)
    checkIn.totalCheckIns += 1

    // Unlock weekly tournament after 7 consecutive days
    if (checkIn.currentStreak === 7) {
      checkIn.weeklyTournamentUnlocked = true
    }

    this.checkIns.set(userId, checkIn)
    this.saveToStorage()

    return {
      success: true,
      streak: checkIn.currentStreak,
      unlocked: checkIn.weeklyTournamentUnlocked,
    }
  }

  // Mark weekly tournament as played
  playWeeklyTournament(userId: string): boolean {
    const checkIn = this.getUserCheckIn(userId)

    if (!checkIn.weeklyTournamentUnlocked || checkIn.weeklyTournamentPlayed) {
      return false
    }

    checkIn.weeklyTournamentPlayed = true
    checkIn.weeklyTournamentUnlocked = false
    checkIn.currentStreak = 0 // Reset streak after playing
    checkIn.lastCheckInDate = "" // Reset to start new 7-day cycle

    this.checkIns.set(userId, checkIn)
    this.saveToStorage()

    return true
  }

  // Get check-in rewards by day
  getRewardForDay(day: number): { icon: string; label: string; description: string } {
    const rewards = [
      { icon: "💎", label: "30", description: "30 Gems" },
      { icon: "💎", label: "50", description: "50 Gems" },
      { icon: "🎁", label: "BONUS", description: "Mystery Bonus 0-61" },
      { icon: "⭐", label: "50%", description: "50% Boost" },
      { icon: "💎", label: "70", description: "70 Gems" },
      { icon: "⭐", label: "30%", description: "30% Boost" },
      { icon: "🏆", label: "FREE GAME", description: "Free Weekly Tournament" },
    ]
    return rewards[day - 1] || rewards[0]
  }
}

export const dailyCheckInDB = new DailyCheckInDB()
