export interface BusinessLocation {
  id: string
  businessId: string
  businessName: string
  category: string
  address: string
  city: string
  state: string
  coordinates: {
    lat: number
    lng: number
  }
  piWalletAddress: string
  phone?: string
  email?: string
  website?: string
  description?: string
  approved: boolean
  createdAt: string
}

export class BusinessMapManager {
  private static BUSINESSES_KEY = "pi_businesses_map"

  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  }

  // Add business to map
  static addBusinessToMap(business: Omit<BusinessLocation, "approved" | "createdAt">): string {
    if (!this.isBrowser()) return ""

    const businesses = this.getAllBusinesses()
    const newBusiness: BusinessLocation = {
      ...business,
      approved: true,
      createdAt: new Date().toISOString(),
    }

    businesses.push(newBusiness)
    localStorage.setItem(this.BUSINESSES_KEY, JSON.stringify(businesses))

    return newBusiness.id
  }

  // Get all approved businesses
  static getAllBusinesses(): BusinessLocation[] {
    if (!this.isBrowser()) return []

    const data = localStorage.getItem(this.BUSINESSES_KEY)
    return data ? JSON.parse(data) : []
  }

  // Get business by ID
  static getBusiness(id: string): BusinessLocation | null {
    const businesses = this.getAllBusinesses()
    return businesses.find((b) => b.id === id) || null
  }

  // Get businesses by category
  static getBusinessesByCategory(category: string): BusinessLocation[] {
    return this.getAllBusinesses().filter((b) => b.category === category)
  }

  // Update business coordinates
  static updateCoordinates(id: string, lat: number, lng: number): boolean {
    if (!this.isBrowser()) return false

    const businesses = this.getAllBusinesses()
    const index = businesses.findIndex((b) => b.id === id)

    if (index === -1) return false

    businesses[index].coordinates = { lat, lng }
    localStorage.setItem(this.BUSINESSES_KEY, JSON.stringify(businesses))

    return true
  }

  // Get businesses near coordinates
  static getNearbyBusinesses(lat: number, lng: number, radiusMiles = 25): BusinessLocation[] {
    const businesses = this.getAllBusinesses()

    return businesses.filter((business) => {
      if (!business.coordinates) return false

      const distance = this.calculateDistance(lat, lng, business.coordinates.lat, business.coordinates.lng)

      return distance <= radiusMiles
    })
  }

  // Calculate distance between two coordinates (Haversine formula)
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}
