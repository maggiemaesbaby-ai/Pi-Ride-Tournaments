// Driver database with approval, ratings, and service management

export interface Driver {
  id: string
  piUsername: string
  name: string
  email: string
  phone: string
  city: string
  vehicleType: "sedan" | "suv" | "luxury"
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  licensePlate: string
  serviceArea: string[]
  servicesOffered: ("rides" | "food" | "packages")[]

  // Status
  approved: boolean
  isOnline: boolean
  inRide: boolean

  // Ratings - 10 person review spread for fair movement
  totalRatings: number
  ratingSum: number
  averageRating: number
  recentRatings: number[] // Last 10 ratings for review spread

  // Earnings
  totalEarnings: number
  completedRides: number

  feePackage: "upfront" | "no-upfront"
  commission: number // Current commission rate based on tier
  upfrontFeeOwed: number
  upfrontFeePaid: number

  // Fee free signup promo (legacy - kept for backwards compatibility)
  isFreeSignup: boolean
  feeStatus: "pending" | "waived" | "paid"

  // Location (when online)
  currentLat?: number
  currentLng?: number

  createdAt: number
  updatedAt: number
}

export interface RideRequest {
  id: string
  userId: string
  pickup: string
  destination: string
  pickupLat: number
  pickupLng: number
  destinationLat: number
  destinationLng: number
  vehicleType: "sedan" | "suv" | "luxury"
  estimatedPrice: number
  status: "searching" | "accepted" | "in_progress" | "completed" | "cancelled"
  requestedAt: number

  // Matching
  notifiedDrivers: string[] // Driver IDs who were notified
  acceptedBy?: string // Driver ID who accepted
  acceptedAt?: number
}

class DriverDB {
  private storageKey = "pi_ride_drivers"
  private rideRequestsKey = "pi_ride_requests"

  // Driver Management
  getAllDrivers(): Driver[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.storageKey)
    return stored ? JSON.parse(stored) : []
  }

  saveDrivers(drivers: Driver[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(drivers))
  }

  addDriver(
    driverData: Omit<
      Driver,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "totalRatings"
      | "ratingSum"
      | "averageRating"
      | "recentRatings"
      | "totalEarnings"
      | "completedRides"
      | "isOnline"
      | "inRide"
      | "feePackage"
      | "commission"
      | "upfrontFeeOwed"
      | "upfrontFeePaid"
    >,
  ): Driver {
    const drivers = this.getAllDrivers()

    const newDriver: Driver = {
      ...driverData,
      id: `driver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      totalRatings: 0,
      ratingSum: 0,
      averageRating: 5.0, // Start at 5.0 for new drivers (fair chance)
      recentRatings: [],
      totalEarnings: 0,
      completedRides: 0,
      isOnline: false,
      inRide: false,
      feePackage: "no-upfront", // Default fee package
      commission: 0.05, // Default commission for no-upfront package
      upfrontFeeOwed: 0, // Default upfront fee owed
      upfrontFeePaid: 0, // Default upfront fee paid
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    drivers.push(newDriver)
    this.saveDrivers(drivers)
    return newDriver
  }

  getDriver(driverId: string): Driver | null {
    const drivers = this.getAllDrivers()
    return drivers.find((d) => d.id === driverId) || null
  }

  getDriverByPiUsername(piUsername: string): Driver | null {
    const drivers = this.getAllDrivers()
    return drivers.find((d) => d.piUsername === piUsername) || null
  }

  updateDriver(driverId: string, updates: Partial<Driver>): boolean {
    const drivers = this.getAllDrivers()
    const index = drivers.findIndex((d) => d.id === driverId)

    if (index === -1) return false

    drivers[index] = {
      ...drivers[index],
      ...updates,
      updatedAt: Date.now(),
    }

    this.saveDrivers(drivers)
    return true
  }

  approveDriver(driverId: string): boolean {
    return this.updateDriver(driverId, { approved: true })
  }

  setDriverOnline(driverId: string, isOnline: boolean, lat?: number, lng?: number): boolean {
    return this.updateDriver(driverId, {
      isOnline,
      currentLat: lat,
      currentLng: lng,
    })
  }

  // Rating System - 10 person review spread for fair movement
  addRating(driverId: string, rating: number): boolean {
    const driver = this.getDriver(driverId)
    if (!driver) return false

    // Add to recent ratings (keep last 10 for spread calculation)
    const recentRatings = [...driver.recentRatings, rating].slice(-10)

    // Update totals
    const totalRatings = driver.totalRatings + 1
    const ratingSum = driver.ratingSum + rating

    // Calculate average with 10 person review spread
    // New drivers need 10 ratings before average fully reflects their true performance
    let averageRating: number
    if (totalRatings < 10) {
      // For first 10 ratings, blend with starting 5.0 to give new drivers fair chance
      const blendFactor = totalRatings / 10
      const trueAverage = ratingSum / totalRatings
      averageRating = trueAverage * blendFactor + 5.0 * (1 - blendFactor)
    } else {
      // After 10 ratings, use true average
      averageRating = ratingSum / totalRatings
    }

    return this.updateDriver(driverId, {
      totalRatings,
      ratingSum,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      recentRatings,
    })
  }

  // Get available drivers for a ride request, sorted by rating
  getAvailableDrivers(vehicleType: string, lat: number, lng: number, maxDistance = 10): Driver[] {
    const drivers = this.getAllDrivers()

    return drivers
      .filter(
        (d) =>
          d.approved && d.isOnline && !d.inRide && d.vehicleType === vehicleType && d.servicesOffered.includes("rides"),
      )
      .map((d) => ({
        ...d,
        distance: this.calculateDistance(lat, lng, d.currentLat || 0, d.currentLng || 0),
      }))
      .filter((d) => d.distance <= maxDistance)
      .sort((a, b) => {
        // Sort by rating first (higher rated drivers shown first)
        if (Math.abs(a.averageRating - b.averageRating) > 0.1) {
          return b.averageRating - a.averageRating
        }
        // Then by distance for same rating
        return a.distance - b.distance
      })
  }

  // Ride Request Management
  createRideRequest(request: Omit<RideRequest, "id" | "requestedAt" | "status" | "notifiedDrivers">): RideRequest {
    const requests = this.getRideRequests()

    const newRequest: RideRequest = {
      ...request,
      id: `request-${Date.now()}`,
      status: "searching",
      notifiedDrivers: [],
      requestedAt: Date.now(),
    }

    requests.push(newRequest)
    this.saveRideRequests(requests)

    return newRequest
  }

  getRideRequests(): RideRequest[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.rideRequestsKey)
    return stored ? JSON.parse(stored) : []
  }

  saveRideRequests(requests: RideRequest[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.rideRequestsKey, JSON.stringify(requests))
  }

  getRideRequest(requestId: string): RideRequest | null {
    const requests = this.getRideRequests()
    return requests.find((r) => r.id === requestId) || null
  }

  updateRideRequest(requestId: string, updates: Partial<RideRequest>): boolean {
    const requests = this.getRideRequests()
    const index = requests.findIndex((r) => r.id === requestId)

    if (index === -1) return false

    requests[index] = {
      ...requests[index],
      ...updates,
    }

    this.saveRideRequests(requests)
    return true
  }

  acceptRideRequest(requestId: string, driverId: string): boolean {
    const request = this.getRideRequest(requestId)
    if (!request || request.status !== "searching") return false

    // Update request
    this.updateRideRequest(requestId, {
      status: "accepted",
      acceptedBy: driverId,
      acceptedAt: Date.now(),
    })

    // Update driver status
    this.updateDriver(driverId, { inRide: true })

    return true
  }

  completeRide(
    requestId: string,
    rating: number,
  ): {
    success: boolean
    driverEarnings: number
    upfrontFeeDeducted: number
    remainingFeeOwed: number
    needsDirectPayment: boolean // New flag to trigger Pi wallet payment
  } {
    const request = this.getRideRequest(requestId)
    if (!request || !request.acceptedBy) {
      return {
        success: false,
        driverEarnings: 0,
        upfrontFeeDeducted: 0,
        remainingFeeOwed: 0,
        needsDirectPayment: false,
      }
    }

    const driver = this.getDriver(request.acceptedBy)
    if (!driver) {
      return {
        success: false,
        driverEarnings: 0,
        upfrontFeeDeducted: 0,
        remainingFeeOwed: 0,
        needsDirectPayment: false,
      }
    }

    const previousRides = driver.completedRides

    const updatedCommission = this.calculateCommission(driver)

    // Calculate ride earnings
    const rideAmount = request.estimatedPrice
    const commissionAmount = rideAmount * updatedCommission
    const driverShare = rideAmount - commissionAmount

    // Check if this is the first ride and upfront fee is owed
    const remainingFeeOwed = driver.upfrontFeeOwed - driver.upfrontFeePaid
    const isFirstRide = driver.completedRides === 0
    const needsDirectPayment = driver.feePackage === "upfront" && isFirstRide && remainingFeeOwed > 0

    // Update request
    this.updateRideRequest(requestId, { status: "completed" })

    // Update driver - pay the ride earnings in full and update commission
    const newRides = driver.completedRides + 1
    this.updateDriver(request.acceptedBy, {
      inRide: false,
      completedRides: newRides,
      totalEarnings: driver.totalEarnings + driverShare,
      commission: updatedCommission, // Update commission tier if needed
    })

    notificationsDB.checkAndNotifyTierChange(request.acceptedBy, previousRides, newRides)

    // Add rating
    this.addRating(request.acceptedBy, rating)

    return {
      success: true,
      driverEarnings: driverShare,
      upfrontFeeDeducted: 0,
      remainingFeeOwed,
      needsDirectPayment,
    }
  }

  // Get pending ride requests for a driver
  getPendingRequestsForDriver(driverId: string): RideRequest[] {
    const driver = this.getDriver(driverId)
    if (!driver || !driver.approved || !driver.isOnline) return []

    const requests = this.getRideRequests()

    return requests
      .filter(
        (r) =>
          r.status === "searching" && r.vehicleType === driver.vehicleType && !r.notifiedDrivers.includes(driverId),
      )
      .map((r) => {
        // Mark driver as notified
        this.updateRideRequest(r.id, {
          notifiedDrivers: [...r.notifiedDrivers, driverId],
        })
        return r
      })
  }

  // Utility: Calculate distance between two points (simplified)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1)
    const dLng = this.deg2rad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  // Get driver's fee balance
  getDriverFeeBalance(driverId: string): {
    feePackage: string
    commission: number
    upfrontFeeOwed: number
    upfrontFeePaid: number
    remainingBalance: number
    isPaidOff: boolean
  } | null {
    const driver = this.getDriver(driverId)
    if (!driver) return null

    const remainingBalance = driver.upfrontFeeOwed - driver.upfrontFeePaid

    return {
      feePackage: driver.feePackage,
      commission: driver.commission * 100, // Convert to percentage
      upfrontFeeOwed: driver.upfrontFeeOwed,
      upfrontFeePaid: driver.upfrontFeePaid,
      remainingBalance,
      isPaidOff: remainingBalance <= 0,
    }
  }

  recordUpfrontFeePayment(driverId: string, amountPaid: number): boolean {
    const driver = this.getDriver(driverId)
    if (!driver) return false

    return this.updateDriver(driverId, {
      upfrontFeePaid: driver.upfrontFeePaid + amountPaid,
      feeStatus: driver.upfrontFeePaid + amountPaid >= driver.upfrontFeeOwed ? "paid" : "pending",
    })
  }

  switchToDeferredPayment(driverId: string): boolean {
    const driver = this.getDriver(driverId)
    if (!driver) return false

    // Mark that driver needs to pay from future earnings
    return this.updateDriver(driverId, {
      feeStatus: "pending", // Keep pending until fully paid from earnings
    })
  }

  deductFromRideEarnings(
    driverId: string,
    rideEarnings: number,
  ): {
    driverPayout: number
    feeDeducted: number
    remainingOwed: number
  } {
    const driver = this.getDriver(driverId)
    if (!driver) {
      return { driverPayout: rideEarnings, feeDeducted: 0, remainingOwed: 0 }
    }

    const remainingOwed = driver.upfrontFeeOwed - driver.upfrontFeePaid

    if (remainingOwed <= 0) {
      // Fee already paid
      return { driverPayout: rideEarnings, feeDeducted: 0, remainingOwed: 0 }
    }

    let feeDeducted = 0
    let driverPayout = rideEarnings

    if (rideEarnings >= remainingOwed) {
      // Can pay off entire balance
      feeDeducted = remainingOwed
      driverPayout = rideEarnings - remainingOwed
    } else {
      // Partial payment
      feeDeducted = rideEarnings
      driverPayout = 0
    }

    // Update driver record
    this.updateDriver(driverId, {
      upfrontFeePaid: driver.upfrontFeePaid + feeDeducted,
      totalEarnings: driver.totalEarnings - feeDeducted, // Adjust total earnings
      feeStatus: driver.upfrontFeePaid + feeDeducted >= driver.upfrontFeeOwed ? "paid" : "pending",
    })

    return {
      driverPayout,
      feeDeducted,
      remainingOwed: remainingOwed - feeDeducted,
    }
  }

  private calculateCommission(driver: Driver): number {
    if (driver.feePackage === "upfront") {
      return 0.03 // 3% fixed for upfront plan
    }

    // No-upfront plan: tiered commission
    if (driver.completedRides >= 1000) {
      return 0.07 // 7% at 1000+ rides
    } else if (driver.completedRides >= 500) {
      return 0.06 // 6% at 500-999 rides
    } else {
      return 0.05 // 5% at 0-499 rides
    }
  }

  getCommissionTierInfo(driverId: string): {
    currentTier: string
    currentCommission: number
    completedRides: number
    nextTier: string | null
    ridesUntilNextTier: number | null
  } | null {
    const driver = this.getDriver(driverId)
    if (!driver || driver.feePackage !== "no-upfront") return null

    let currentTier: string
    let nextTier: string | null
    let ridesUntilNextTier: number | null

    if (driver.completedRides >= 1000) {
      currentTier = "Tier 3"
      nextTier = null
      ridesUntilNextTier = null
    } else if (driver.completedRides >= 500) {
      currentTier = "Tier 2"
      nextTier = "Tier 3"
      ridesUntilNextTier = 1000 - driver.completedRides
    } else {
      currentTier = "Tier 1"
      nextTier = "Tier 2"
      ridesUntilNextTier = 500 - driver.completedRides
    }

    return {
      currentTier,
      currentCommission: driver.commission * 100,
      completedRides: driver.completedRides,
      nextTier,
      ridesUntilNextTier,
    }
  }
}

import { notificationsDB } from "./notifications-db"

export const driverDB = new DriverDB()
