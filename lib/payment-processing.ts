export interface PaymentBreakdown {
  baseAmount: number
  platformFee: number
  driverEarnings: number
  totalCharged: number
  isPioneerDriver: boolean
}

export interface PaymentRecord {
  id: string
  userId: string
  driverId: string
  serviceType: "ride" | "food" | "package"
  breakdown: PaymentBreakdown
  timestamp: number
  status: "pending" | "approved" | "completed" | "failed"
  piTransactionId?: string
}

// In-memory storage for demo purposes
const paymentsStore: PaymentRecord[] = []
const driverEarningsStore: Map<string, number> = new Map()

export function calculatePaymentBreakdown(
  baseAmount: number,
  isPioneerDriver: boolean = true
): PaymentBreakdown {
  // Pioneer drivers: 3% commission
  // Non-pioneer drivers: 2% commission (if we ever allow them)
  const commissionRate = isPioneerDriver ? 0.03 : 0.02
  const platformFee = baseAmount * commissionRate
  const driverEarnings = baseAmount - platformFee
  const totalCharged = baseAmount

  return {
    baseAmount,
    platformFee,
    driverEarnings,
    totalCharged,
    isPioneerDriver,
  }
}

export function createPaymentRecord(
  userId: string,
  driverId: string,
  serviceType: "ride" | "food" | "package",
  baseAmount: number,
  isPioneerDriver: boolean = true
): PaymentRecord {
  const breakdown = calculatePaymentBreakdown(baseAmount, isPioneerDriver)

  const payment: PaymentRecord = {
    id: `payment-${Date.now()}`,
    userId,
    driverId,
    serviceType,
    breakdown,
    timestamp: Date.now(),
    status: "pending",
  }

  paymentsStore.push(payment)
  return payment
}

export function approvePayment(paymentId: string): boolean {
  const payment = paymentsStore.find((p) => p.id === paymentId)
  if (!payment) return false

  payment.status = "approved"
  return true
}

export function completePayment(paymentId: string, piTransactionId: string): boolean {
  const payment = paymentsStore.find((p) => p.id === paymentId)
  if (!payment) return false

  payment.status = "completed"
  payment.piTransactionId = piTransactionId

  // Add earnings to driver's account
  const currentEarnings = driverEarningsStore.get(payment.driverId) || 0
  driverEarningsStore.set(payment.driverId, currentEarnings + payment.breakdown.driverEarnings)

  return true
}

export function getDriverEarnings(driverId: string): {
  totalEarnings: number
  payments: PaymentRecord[]
  breakdown: {
    rides: number
    food: number
    packages: number
  }
} {
  const driverPayments = paymentsStore.filter((p) => p.driverId === driverId && p.status === "completed")

  const breakdown = {
    rides: driverPayments
      .filter((p) => p.serviceType === "ride")
      .reduce((sum, p) => sum + p.breakdown.driverEarnings, 0),
    food: driverPayments
      .filter((p) => p.serviceType === "food")
      .reduce((sum, p) => sum + p.breakdown.driverEarnings, 0),
    packages: driverPayments
      .filter((p) => p.serviceType === "package")
      .reduce((sum, p) => sum + p.breakdown.driverEarnings, 0),
  }

  return {
    totalEarnings: driverEarningsStore.get(driverId) || 0,
    payments: driverPayments,
    breakdown,
  }
}

export function getPlatformRevenue(): {
  totalRevenue: number
  revenueByService: {
    rides: number
    food: number
    packages: number
  }
  pioneerDriverRevenue: number
  nonPioneerDriverRevenue: number
} {
  const completedPayments = paymentsStore.filter((p) => p.status === "completed")

  const revenueByService = {
    rides: completedPayments
      .filter((p) => p.serviceType === "ride")
      .reduce((sum, p) => sum + p.breakdown.platformFee, 0),
    food: completedPayments
      .filter((p) => p.serviceType === "food")
      .reduce((sum, p) => sum + p.breakdown.platformFee, 0),
    packages: completedPayments
      .filter((p) => p.serviceType === "package")
      .reduce((sum, p) => sum + p.breakdown.platformFee, 0),
  }

  const pioneerDriverRevenue = completedPayments
    .filter((p) => p.breakdown.isPioneerDriver)
    .reduce((sum, p) => sum + p.breakdown.platformFee, 0)

  const nonPioneerDriverRevenue = completedPayments
    .filter((p) => !p.breakdown.isPioneerDriver)
    .reduce((sum, p) => sum + p.breakdown.platformFee, 0)

  return {
    totalRevenue: revenueByService.rides + revenueByService.food + revenueByService.packages,
    revenueByService,
    pioneerDriverRevenue,
    nonPioneerDriverRevenue,
  }
}

export function getPaymentHistory(userId: string): PaymentRecord[] {
  return paymentsStore.filter((p) => p.userId === userId).sort((a, b) => b.timestamp - a.timestamp)
}
