// Referral system with Pi blockchain tracking
interface ReferralData {
  code: string
  userId: string
  referrals: ReferredUser[]
  rewards: ReferralReward[]
  totalReferrals: number
  availableRewards: number
}

interface ReferredUser {
  userId: string
  username: string
  signupDate: string
  firstRideCompleted: boolean
  referrerBonus: number
}

interface ReferralReward {
  id: string
  type: "fee_waived"
  expiresAt: string
  used: boolean
  usedAt?: string
  bookingId?: string
}

// Generate unique referral code for user
export function generateReferralCode(userId: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `PIRIDE${randomPart}`
}

// Check if user signed up through a referral
export function checkReferralSignup(referralCode?: string): string | null {
  if (!referralCode) return null

  // Validate referral code format
  if (/^PIRIDE[A-Z0-9]{6}$/.test(referralCode)) {
    return referralCode
  }
  return null
}

// Award referral bonus to referrer
export function awardReferralBonus(referrerId: string, newUserId: string): ReferralReward[] {
  const rewards: ReferralReward[] = []
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

  // Get current referral count
  const referralData = getReferralData(referrerId)
  const newReferralCount = referralData.referrals.length + 1

  // Every referral earns a reward that must be used within 30 days
  const reward: ReferralReward = {
    id: `reward-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    type: "fee_waived",
    expiresAt: expiresAt.toISOString(),
    used: false,
  }

  rewards.push(reward)

  // Store reward in localStorage (in production, this would be blockchain)
  storeReferralReward(referrerId, reward)

  console.log(
    `[v0] Referral bonus awarded to ${referrerId}:`,
    `${rewards.length} free fee ride(s), expires ${expiresAt.toLocaleDateString()}`,
  )

  return rewards
}

// Get available (unused, non-expired) rewards
export function getAvailableRewards(userId: string): ReferralReward[] {
  const referralData = getReferralData(userId)
  const now = new Date()

  return referralData.rewards.filter((reward) => {
    const expiresAt = new Date(reward.expiresAt)
    return !reward.used && expiresAt > now
  })
}

// Apply referral reward to booking
export function applyReferralReward(userId: string, bookingId: string): ReferralReward | null {
  const availableRewards = getAvailableRewards(userId)

  if (availableRewards.length === 0) {
    return null
  }

  // Use oldest reward first
  const reward = availableRewards[0]
  reward.used = true
  reward.usedAt = new Date().toISOString()
  reward.bookingId = bookingId

  // Update storage
  updateReferralReward(userId, reward)

  console.log(`[v0] Referral reward applied:`, reward.id, `to booking`, bookingId)

  return reward
}

// Get referral data from storage
export function getReferralData(userId: string): ReferralData {
  if (typeof window === "undefined") {
    return {
      code: "",
      userId,
      referrals: [],
      rewards: [],
      totalReferrals: 0,
      availableRewards: 0,
    }
  }

  const stored = localStorage.getItem(`referral_${userId}`)
  if (!stored) {
    const newCode = generateReferralCode(userId)
    const newData: ReferralData = {
      code: newCode,
      userId,
      referrals: [],
      rewards: [],
      totalReferrals: 0,
      availableRewards: 0,
    }
    localStorage.setItem(`referral_${userId}`, JSON.stringify(newData))
    return newData
  }

  const data = JSON.parse(stored) as ReferralData
  // Calculate available rewards count directly without calling getAvailableRewards to avoid circular dependency
  const now = new Date()
  data.availableRewards = data.rewards.filter((reward) => {
    const expiresAt = new Date(reward.expiresAt)
    return !reward.used && expiresAt > now
  }).length
  return data
}

// Store referral reward
function storeReferralReward(userId: string, reward: ReferralReward) {
  const data = getReferralData(userId)
  data.rewards.push(reward)
  // Calculate directly instead of calling getAvailableRewards
  const now = new Date()
  data.availableRewards = data.rewards.filter((r) => {
    const expiresAt = new Date(r.expiresAt)
    return !r.used && expiresAt > now
  }).length
  localStorage.setItem(`referral_${userId}`, JSON.stringify(data))
}

// Update referral reward
function updateReferralReward(userId: string, reward: ReferralReward) {
  const data = getReferralData(userId)
  const index = data.rewards.findIndex((r) => r.id === reward.id)
  if (index !== -1) {
    data.rewards[index] = reward
    // Calculate directly instead of calling getAvailableRewards
    const now = new Date()
    data.availableRewards = data.rewards.filter((r) => {
      const expiresAt = new Date(r.expiresAt)
      return !r.used && expiresAt > now
    }).length
    localStorage.setItem(`referral_${userId}`, JSON.stringify(data))
  }
}

// Add referred user
export function addReferredUser(referrerId: string, newUser: ReferredUser) {
  const data = getReferralData(referrerId)
  data.referrals.push(newUser)
  data.totalReferrals = data.referrals.length
  localStorage.setItem(`referral_${referrerId}`, JSON.stringify(data))
}

// Mark first ride completed for referred user
export function markFirstRideCompleted(referrerId: string, referredUserId: string) {
  const data = getReferralData(referrerId)
  const referral = data.referrals.find((r) => r.userId === referredUserId)
  if (referral && !referral.firstRideCompleted) {
    referral.firstRideCompleted = true
    localStorage.setItem(`referral_${referrerId}`, JSON.stringify(data))
  }
}
