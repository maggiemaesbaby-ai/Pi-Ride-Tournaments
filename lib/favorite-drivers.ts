export interface FavoriteDriver {
  id: string
  userId: string
  driverId: string
  driverName: string
  rating: number
  completedRides: number
  vehicleType: string
  addedAt: number
}

export function getFavoriteDrivers(userId: string): FavoriteDriver[] {
  if (typeof window === "undefined") return []
  
  const favorites = localStorage.getItem(`favorite_drivers_${userId}`)
  return favorites ? JSON.parse(favorites) : []
}

export function addFavoriteDriver(userId: string, driver: Omit<FavoriteDriver, 'userId' | 'addedAt'>) {
  if (typeof window === "undefined") return
  
  const favorites = getFavoriteDrivers(userId)
  
  // Check if already favorited
  if (favorites.some(f => f.driverId === driver.driverId)) {
    return
  }
  
  const newFavorite: FavoriteDriver = {
    ...driver,
    userId,
    addedAt: Date.now()
  }
  
  favorites.push(newFavorite)
  localStorage.setItem(`favorite_drivers_${userId}`, JSON.stringify(favorites))
}

export function removeFavoriteDriver(userId: string, driverId: string) {
  if (typeof window === "undefined") return
  
  const favorites = getFavoriteDrivers(userId).filter(f => f.driverId !== driverId)
  localStorage.setItem(`favorite_drivers_${userId}`, JSON.stringify(favorites))
}

export function isFavoriteDriver(userId: string, driverId: string): boolean {
  return getFavoriteDrivers(userId).some(f => f.driverId === driverId)
}
