// Real-time ride matching and driver management system

export interface DriverLocation {
  driverId: string
  username: string
  lat: number
  lng: number
  isOnline: boolean
  serviceRadius: number // in km
  services: string[] // ['rides', 'food', 'packages']
  vehicleType: string
  rating: number
  currentJobId?: string
  lastUpdated: number
}

export interface RideRequest {
  id: string
  userId: string
  username: string
  pickupLat: number
  pickupLng: number
  pickupAddress: string
  destinationLat: number
  destinationLng: number
  destinationAddress: string
  vehicleType: string
  estimatedPrice: number
  status: "pending" | "accepted" | "driver_enroute" | "arrived" | "in_progress" | "completed" | "cancelled"
  assignedDriverId?: string
  invitedDrivers: string[] // Track which drivers were notified
  createdAt: number
  scheduledFor?: number // timestamp for scheduled rides
  isPrepaid?: boolean
}

export interface ScheduledRide extends RideRequest {
  scheduledFor: number
  remindersSent: number[]
  acceptedByDriver?: string
  prepaidAmount: number
  prepaidTxid: string
}

class RideMatchingDB {
  private readonly STORAGE_KEY = "pi-ride-matching-v1"
  private drivers: Map<string, DriverLocation> = new Map()
  private rideRequests: Map<string, RideRequest> = new Map()
  private scheduledRides: Map<string, ScheduledRide> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return

    const data = localStorage.getItem(this.STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      this.drivers = new Map(parsed.drivers || [])
      this.rideRequests = new Map(parsed.rideRequests || [])
      this.scheduledRides = new Map(parsed.scheduledRides || [])
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({
        drivers: Array.from(this.drivers.entries()),
        rideRequests: Array.from(this.rideRequests.entries()),
        scheduledRides: Array.from(this.scheduledRides.entries()),
      }),
    )
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Driver Management
  updateDriverLocation(driver: DriverLocation) {
    driver.lastUpdated = Date.now()
    this.drivers.set(driver.driverId, driver)
    this.saveToStorage()
  }

  setDriverOnline(driverId: string, isOnline: boolean) {
    const driver = this.drivers.get(driverId)
    if (driver) {
      driver.isOnline = isOnline
      driver.lastUpdated = Date.now()
      this.drivers.set(driverId, driver)
      this.saveToStorage()
    }
  }

  setDriverRadius(driverId: string, radiusKm: number) {
    const driver = this.drivers.get(driverId)
    if (driver) {
      driver.serviceRadius = radiusKm
      this.drivers.set(driverId, driver)
      this.saveToStorage()
    }
  }

  setDriverServices(driverId: string, services: string[]) {
    const driver = this.drivers.get(driverId)
    if (driver) {
      driver.services = services
      this.drivers.set(driverId, driver)
      this.saveToStorage()
    }
  }

  getDriver(driverId: string): DriverLocation | undefined {
    return this.drivers.get(driverId)
  }

  getAllOnlineDrivers(): DriverLocation[] {
    return Array.from(this.drivers.values()).filter((d) => d.isOnline && !d.currentJobId)
  }

  // Ride Request Management
  createRideRequest(request: Omit<RideRequest, "id" | "status" | "invitedDrivers" | "createdAt">): RideRequest {
    const id = `ride-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const rideRequest: RideRequest = {
      ...request,
      id,
      status: "pending",
      invitedDrivers: [],
      createdAt: Date.now(),
    }

    this.rideRequests.set(id, rideRequest)
    this.saveToStorage()
    return rideRequest
  }

  // Find matching drivers within radius
  findMatchingDrivers(request: RideRequest): DriverLocation[] {
    const matchingDrivers: DriverLocation[] = []

    for (const driver of this.drivers.values()) {
      // Check if driver is online and available
      if (!driver.isOnline || driver.currentJobId) continue

      // Check if driver provides ride service
      if (!driver.services.includes("rides")) continue

      // Calculate distance from driver to pickup location
      const distance = this.calculateDistance(driver.lat, driver.lng, request.pickupLat, request.pickupLng)

      // Check if pickup is within driver's service radius
      if (distance <= driver.serviceRadius) {
        matchingDrivers.push({ ...driver, distance } as any)
      }
    }

    // Sort by rating (highest first), then by distance (closest first)
    return matchingDrivers.sort((a: any, b: any) => {
      if (b.rating !== a.rating) return b.rating - a.rating
      return a.distance - b.distance
    })
  }

  // Notify drivers about new ride request
  notifyDriversForRide(requestId: string): DriverLocation[] {
    const request = this.rideRequests.get(requestId)
    if (!request) return []

    const matchingDrivers = this.findMatchingDrivers(request)

    // Update request with invited drivers
    request.invitedDrivers = matchingDrivers.map((d) => d.driverId)
    this.rideRequests.set(requestId, request)
    this.saveToStorage()

    return matchingDrivers
  }

  // Driver accepts ride
  acceptRide(requestId: string, driverId: string): boolean {
    const request = this.rideRequests.get(requestId)
    const driver = this.drivers.get(driverId)

    if (!request || !driver || request.status !== "pending") {
      return false
    }

    // Assign ride to driver
    request.assignedDriverId = driverId
    request.status = "accepted"
    this.rideRequests.set(requestId, request)

    // Mark driver as busy
    driver.currentJobId = requestId
    this.drivers.set(driverId, driver)

    this.saveToStorage()
    return true
  }

  // Update ride status
  updateRideStatus(requestId: string, status: RideRequest["status"]) {
    const request = this.rideRequests.get(requestId)
    if (!request) return false

    request.status = status
    this.rideRequests.set(requestId, request)

    // If ride is completed or cancelled, free up the driver
    if (status === "completed" || status === "cancelled") {
      if (request.assignedDriverId) {
        const driver = this.drivers.get(request.assignedDriverId)
        if (driver) {
          driver.currentJobId = undefined
          this.drivers.set(request.assignedDriverId, driver)
        }
      }
    }

    this.saveToStorage()
    return true
  }

  // Get driver's active rides
  getDriverActiveRides(driverId: string): RideRequest[] {
    return Array.from(this.rideRequests.values()).filter(
      (r) =>
        r.assignedDriverId === driverId && ["accepted", "driver_enroute", "arrived", "in_progress"].includes(r.status),
    )
  }

  // Get driver's pending invitations
  getDriverPendingInvitations(driverId: string): RideRequest[] {
    return Array.from(this.rideRequests.values()).filter(
      (r) => r.invitedDrivers.includes(driverId) && r.status === "pending",
    )
  }

  // Scheduled Rides
  createScheduledRide(
    request: Omit<ScheduledRide, "id" | "status" | "invitedDrivers" | "createdAt" | "remindersSent">,
  ): ScheduledRide {
    const id = `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const scheduledRide: ScheduledRide = {
      ...request,
      id,
      status: "pending",
      invitedDrivers: [],
      createdAt: Date.now(),
      remindersSent: [],
      isPrepaid: true,
    }

    this.scheduledRides.set(id, scheduledRide)
    this.saveToStorage()
    return scheduledRide
  }

  // Get driver's scheduled rides
  getDriverScheduledRides(driverId: string): ScheduledRide[] {
    return Array.from(this.scheduledRides.values()).filter(
      (r) => r.acceptedByDriver === driverId && r.status === "pending",
    )
  }

  // Driver accepts scheduled ride
  acceptScheduledRide(rideId: string, driverId: string): boolean {
    const ride = this.scheduledRides.get(rideId)
    if (!ride || ride.acceptedByDriver) return false

    ride.acceptedByDriver = driverId
    this.scheduledRides.set(rideId, ride)
    this.saveToStorage()
    return true
  }

  // Send reminder to driver for scheduled ride
  sendScheduledRideReminder(rideId: string, minutesBefore: number): boolean {
    const ride = this.scheduledRides.get(rideId)
    if (!ride) return false

    ride.remindersSent.push(minutesBefore)
    this.scheduledRides.set(rideId, ride)
    this.saveToStorage()
    return true
  }

  // Get upcoming scheduled rides that need reminders
  getUpcomingScheduledRides(minutesThreshold: number): ScheduledRide[] {
    const now = Date.now()
    const threshold = now + minutesThreshold * 60 * 1000

    return Array.from(this.scheduledRides.values()).filter(
      (r) =>
        r.scheduledFor <= threshold &&
        r.scheduledFor > now &&
        !r.remindersSent.includes(minutesThreshold) &&
        r.acceptedByDriver,
    )
  }

  // Cancel ride (by rider or driver)
  cancelRide(requestId: string, cancelledBy: "rider" | "driver"): boolean {
    // Check regular rides
    const regularRide = this.rideRequests.get(requestId)
    if (regularRide) {
      regularRide.status = "cancelled"
      this.rideRequests.set(requestId, regularRide)

      // Free up driver if assigned
      if (regularRide.assignedDriverId) {
        const driver = this.drivers.get(regularRide.assignedDriverId)
        if (driver) {
          driver.currentJobId = undefined
          this.drivers.set(regularRide.assignedDriverId, driver)
        }

        // If driver cancelled after accepting, make ride available again
        if (cancelledBy === "driver" && regularRide.status !== "pending") {
          regularRide.status = "pending"
          regularRide.assignedDriverId = undefined
          // Remove cancelled driver from future invites for this ride
          regularRide.invitedDrivers = regularRide.invitedDrivers.filter((id) => id !== regularRide.assignedDriverId)
          this.rideRequests.set(requestId, regularRide)
        }
      }

      this.saveToStorage()
      return true
    }

    // Check scheduled rides
    const scheduledRide = this.scheduledRides.get(requestId)
    if (scheduledRide) {
      scheduledRide.status = "cancelled"
      this.scheduledRides.set(requestId, scheduledRide)
      this.saveToStorage()
      return true
    }

    return false
  }

  getRideRequest(requestId: string): RideRequest | undefined {
    return this.rideRequests.get(requestId)
  }

  getScheduledRide(rideId: string): ScheduledRide | undefined {
    return this.scheduledRides.get(rideId)
  }
}

export const rideMatchingDB = new RideMatchingDB()
