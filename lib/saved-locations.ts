export interface SavedLocation {
  id: string
  label: string // "Home", "Work", or custom
  address: string
  lat?: number
  lng?: number
  icon: string
}

export function getSavedLocations(userId: string): SavedLocation[] {
  if (typeof window === "undefined") return []
  
  const saved = localStorage.getItem(`saved_locations_${userId}`)
  return saved ? JSON.parse(saved) : []
}

export function saveLocation(userId: string, location: SavedLocation) {
  if (typeof window === "undefined") return
  
  const locations = getSavedLocations(userId)
  const existingIndex = locations.findIndex(l => l.id === location.id)
  
  if (existingIndex >= 0) {
    locations[existingIndex] = location
  } else {
    locations.push(location)
  }
  
  localStorage.setItem(`saved_locations_${userId}`, JSON.stringify(locations))
}

export function deleteLocation(userId: string, locationId: string) {
  if (typeof window === "undefined") return
  
  const locations = getSavedLocations(userId).filter(l => l.id !== locationId)
  localStorage.setItem(`saved_locations_${userId}`, JSON.stringify(locations))
}

export interface RecentTrip {
  id: string
  pickup: string
  destination: string
  service: string
  price: number
  timestamp: number
  rideType: string
}

export function getRecentTrips(userId: string): RecentTrip[] {
  if (typeof window === "undefined") return []
  
  const trips = localStorage.getItem(`recent_trips_${userId}`)
  return trips ? JSON.parse(trips) : []
}

export function saveTrip(userId: string, trip: Omit<RecentTrip, 'id' | 'timestamp'>) {
  if (typeof window === "undefined") return
  
  const trips = getRecentTrips(userId)
  const newTrip: RecentTrip = {
    ...trip,
    id: `trip-${Date.now()}`,
    timestamp: Date.now()
  }
  
  trips.unshift(newTrip)
  localStorage.setItem(`recent_trips_${userId}`, JSON.stringify(trips.slice(0, 10))) // Keep last 10
}
