export interface PaymentRecord {
  id: string
  userId: string
  amount: number
  type: 'pioneer_driver' | 'affiliate_redirect'
  service: string
  serviceType: 'ride' | 'food' | 'package' | 'accommodation' | 'entertainment'
  metadata: {
    pickup?: string
    destination?: string
    provider: string
    isPioneerDriver?: boolean
  }
  piPaymentId?: string
  piTxId?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  timestamp: number
  completedAt?: number
}

export function savePaymentRecord(record: Omit<PaymentRecord, 'id' | 'timestamp'>): PaymentRecord {
  if (typeof window === 'undefined') {
    console.warn('[v0] Payment logger only works in browser')
    return { ...record, id: '', timestamp: Date.now() }
  }

  const fullRecord: PaymentRecord = {
    ...record,
    id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  }

  try {
    const existingRecords = getPaymentHistory(record.userId)
    const updatedRecords = [fullRecord, ...existingRecords].slice(0, 100) // Keep last 100
    localStorage.setItem(`payment_history_${record.userId}`, JSON.stringify(updatedRecords))
    
    console.log('[v0] Payment record saved:', fullRecord.id)
    return fullRecord
  } catch (error) {
    console.error('[v0] Failed to save payment record:', error)
    return fullRecord
  }
}

export function updatePaymentStatus(
  userId: string,
  paymentId: string,
  status: PaymentRecord['status'],
  piTxId?: string
): void {
  if (typeof window === 'undefined') return

  try {
    const records = getPaymentHistory(userId)
    const updatedRecords = records.map(record => {
      if (record.piPaymentId === paymentId || record.id === paymentId) {
        return {
          ...record,
          status,
          ...(piTxId && { piTxId }),
          ...(status === 'completed' && { completedAt: Date.now() })
        }
      }
      return record
    })
    
    localStorage.setItem(`payment_history_${userId}`, JSON.stringify(updatedRecords))
    console.log('[v0] Payment status updated:', paymentId, status)
  } catch (error) {
    console.error('[v0] Failed to update payment status:', error)
  }
}

export function getPaymentHistory(userId: string): PaymentRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(`payment_history_${userId}`)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('[v0] Failed to get payment history:', error)
    return []
  }
}

export function getPaymentStats(userId: string) {
  const history = getPaymentHistory(userId)
  
  const completed = history.filter(r => r.status === 'completed')
  const pioneerPayments = completed.filter(r => r.type === 'pioneer_driver')
  const affiliateClicks = history.filter(r => r.type === 'affiliate_redirect')
  
  return {
    totalTransactions: completed.length,
    totalPiSpent: pioneerPayments.reduce((sum, r) => sum + r.amount, 0),
    pioneerRides: pioneerPayments.filter(r => r.serviceType === 'ride').length,
    affiliateRedirects: affiliateClicks.length,
    last30Days: completed.filter(r => r.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000).length
  }
}

export function getAllPaymentRecords(): PaymentRecord[] {
  if (typeof window === 'undefined') return []

  try {
    const allRecords: PaymentRecord[] = []
    
    // Iterate through all localStorage keys to find payment history
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('payment_history_')) {
        const stored = localStorage.getItem(key)
        if (stored) {
          const records = JSON.parse(stored)
          allRecords.push(...records)
        }
      }
    }
    
    // Sort by timestamp descending (newest first)
    return allRecords.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('[v0] Failed to get all payment records:', error)
    return []
  }
}
