export interface TripStop {
  id: string
  address: string
  lat?: number
  lng?: number
  order: number
  estimatedTime?: number
  notes?: string
}

export interface MultiStopTrip {
  id: string
  userId: string
  pickup: string
  destination: string
  stops: TripStop[]
  totalDistance: number
  totalPrice: number
  createdAt: number
}

export function calculateMultiStopPrice(basePrice: number, numberOfStops: number): number {
  // Add $2 per additional stop
  const stopFee = (numberOfStops - 2) * 2 // -2 because pickup and destination are included
  return basePrice + Math.max(0, stopFee)
}

export function saveMultiStopTrip(trip: MultiStopTrip) {
  if (typeof window === "undefined") return
  
  const trips = getMultiStopTrips(trip.userId)
  trips.unshift(trip)
  localStorage.setItem(`multi_stop_trips_${trip.userId}`, JSON.stringify(trips.slice(0, 10)))
}

export function getMultiStopTrips(userId: string): MultiStopTrip[] {
  if (typeof window === "undefined") return []
  
  const trips = localStorage.getItem(`multi_stop_trips_${userId}`)
  return trips ? JSON.parse(trips) : []
}
