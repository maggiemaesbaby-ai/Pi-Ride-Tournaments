// Milestone-based transaction tracking system
// Activates 2% app fee after reaching 1,000 unique users

interface Transaction {
  id: string
  userId: string
  amount: number
  type: 'pioneer_driver' | 'affiliate'
  service: string
  serviceType: string
  timestamp: number
  fees: {
    platformFee: number
    appFee: number
  }
  status: 'pending' | 'completed' | 'failed'
}

interface MilestoneData {
  totalUsers: number
  totalTransactions: number
  totalRevenue: number
  appFeeRevenue: number
  currentMilestone: number
  milestoneReached: boolean
  transactions: Transaction[]
}

const MILESTONE_THRESHOLD = 1000 // Activate 2% fee after 1,000 users
const APP_FEE_RATE = 0.02 // 2% app fee

// Get current milestone data
export function getMilestoneData(): MilestoneData {
  if (typeof window === 'undefined') {
    return {
      totalUsers: 0,
      totalTransactions: 0,
      totalRevenue: 0,
      appFeeRevenue: 0,
      currentMilestone: 0,
      milestoneReached: false,
      transactions: []
    }
  }

  const data = localStorage.getItem('milestone_data')
  if (!data) {
    const initialData: MilestoneData = {
      totalUsers: 0,
      totalTransactions: 0,
      totalRevenue: 0,
      appFeeRevenue: 0,
      currentMilestone: 0,
      milestoneReached: false,
      transactions: []
    }
    localStorage.setItem('milestone_data', JSON.stringify(initialData))
    return initialData
  }

  return JSON.parse(data)
}

// Save milestone data
function saveMilestoneData(data: MilestoneData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('milestone_data', JSON.stringify(data))
}

// Record a new transaction
export function recordTransaction(
  userId: string,
  amount: number,
  type: 'pioneer_driver' | 'affiliate',
  service: string,
  serviceType: string
): Transaction {
  const data = getMilestoneData()

  // Check if this is a new user
  const existingUserTransactions = data.transactions.filter(t => t.userId === userId)
  const isNewUser = existingUserTransactions.length === 0

  if (isNewUser) {
    data.totalUsers += 1
    
    // Check if milestone reached
    if (data.totalUsers >= MILESTONE_THRESHOLD && !data.milestoneReached) {
      data.milestoneReached = true
      data.currentMilestone = MILESTONE_THRESHOLD
    }
  }

  // Calculate fees
  const fees = calculateTransactionFees(amount, type, data.milestoneReached)

  const transaction: Transaction = {
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    amount,
    type,
    service,
    serviceType,
    timestamp: Date.now(),
    fees,
    status: 'pending'
  }

  data.transactions.push(transaction)
  data.totalTransactions += 1

  saveMilestoneData(data)

  return transaction
}

// Calculate transaction fees
export function calculateTransactionFees(
  amount: number,
  type: 'pioneer_driver' | 'affiliate',
  milestoneReached: boolean
): { platformFee: number; appFee: number } {
  // Platform fee (for Pioneer drivers)
  const platformFee = type === 'pioneer_driver' ? amount * 0.03 : 0

  // App fee (only after milestone reached)
  const appFee = milestoneReached ? amount * APP_FEE_RATE : 0

  return {
    platformFee,
    appFee
  }
}

// Update transaction status
export function updateTransactionStatus(
  transactionId: string,
  status: 'completed' | 'failed'
): void {
  const data = getMilestoneData()
  
  const transaction = data.transactions.find(t => t.id === transactionId)
  if (!transaction) return

  transaction.status = status

  // Update revenue if completed
  if (status === 'completed') {
    data.totalRevenue += transaction.amount
    data.appFeeRevenue += transaction.fees.appFee
  }

  saveMilestoneData(data)
}

// Get milestone progress
export function getMilestoneProgress(): {
  current: number
  target: number
  percentage: number
  remaining: number
  feeActive: boolean
} {
  const data = getMilestoneData()

  return {
    current: data.totalUsers,
    target: MILESTONE_THRESHOLD,
    percentage: Math.min((data.totalUsers / MILESTONE_THRESHOLD) * 100, 100),
    remaining: Math.max(MILESTONE_THRESHOLD - data.totalUsers, 0),
    feeActive: data.milestoneReached
  }
}

// Reset milestone data (for testing)
export function resetMilestoneData(): void {
  if (typeof window === 'undefined') return
  
  const initialData: MilestoneData = {
    totalUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    appFeeRevenue: 0,
    currentMilestone: 0,
    milestoneReached: false,
    transactions: []
  }
  
  localStorage.setItem('milestone_data', JSON.stringify(initialData))
}

// Get user transaction history
export function getUserTransactions(userId: string): Transaction[] {
  const data = getMilestoneData()
  return data.transactions.filter(t => t.userId === userId)
}

// Get recent transactions
export function getRecentTransactions(limit: number = 10): Transaction[] {
  const data = getMilestoneData()
  return data.transactions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}
