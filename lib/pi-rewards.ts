export interface PiReward {
  id: string
  userId: string
  amount: number
  type: "booking" | "referral" | "milestone"
  description: string
  timestamp: number
  expiresAt?: number
}

export function getUserRewards(userId: string): PiReward[] {
  if (typeof window === "undefined") return []
  
  const rewards = localStorage.getItem(`pi_rewards_${userId}`)
  return rewards ? JSON.parse(rewards) : []
}

export function addReward(userId: string, reward: Omit<PiReward, 'id' | 'timestamp'>) {
  if (typeof window === "undefined") return
  
  const rewards = getUserRewards(userId)
  const newReward: PiReward = {
    ...reward,
    id: `reward-${Date.now()}`,
    timestamp: Date.now()
  }
  
  rewards.unshift(newReward)
  localStorage.setItem(`pi_rewards_${userId}`, JSON.stringify(rewards))
  
  return newReward
}

export function calculateCashback(amount: number, userTier: "bronze" | "silver" | "gold" | "platinum" = "bronze"): number {
  const rates = {
    bronze: 0.01,   // 1% cashback
    silver: 0.02,   // 2% cashback
    gold: 0.03,     // 3% cashback
    platinum: 0.05  // 5% cashback
  }
  
  return amount * rates[userTier]
}

export function getUserTier(userId: string): "bronze" | "silver" | "gold" | "platinum" {
  if (typeof window === "undefined") return "bronze"
  
  const bookings = localStorage.getItem(`booking_count_${userId}`)
  const count = bookings ? parseInt(bookings) : 0
  
  if (count >= 100) return "platinum"
  if (count >= 50) return "gold"
  if (count >= 20) return "silver"
  return "bronze"
}

export function getTotalRewardsEarned(userId: string): number {
  const rewards = getUserRewards(userId)
  return rewards.reduce((total, reward) => total + reward.amount, 0)
}
