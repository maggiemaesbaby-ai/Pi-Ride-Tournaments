export interface Rating {
  id: string
  userId: string
  driverId: string
  serviceType: "ride" | "food" | "package"
  rating: number
  review: string
  timestamp: number
  bookingId: string
}

export interface DriverRating {
  driverId: string
  averageRating: number
  totalRatings: number
  ratingBreakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

// In-memory storage for demo purposes
const ratingsStore: Rating[] = []
const driverRatingsStore: Map<string, DriverRating> = new Map()

export function submitRating(
  userId: string,
  driverId: string,
  bookingId: string,
  serviceType: "ride" | "food" | "package",
  rating: number,
  review: string
): Rating {
  const newRating: Rating = {
    id: `rating-${Date.now()}`,
    userId,
    driverId,
    serviceType,
    rating,
    review,
    timestamp: Date.now(),
    bookingId,
  }

  ratingsStore.push(newRating)

  // Update driver rating
  updateDriverRating(driverId, rating)

  return newRating
}

function updateDriverRating(driverId: string, rating: number) {
  const existing = driverRatingsStore.get(driverId) || {
    driverId,
    averageRating: 0,
    totalRatings: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  }

  // Update breakdown
  existing.ratingBreakdown[rating as 1 | 2 | 3 | 4 | 5]++
  existing.totalRatings++

  // Recalculate average
  const totalPoints =
    existing.ratingBreakdown[5] * 5 +
    existing.ratingBreakdown[4] * 4 +
    existing.ratingBreakdown[3] * 3 +
    existing.ratingBreakdown[2] * 2 +
    existing.ratingBreakdown[1] * 1

  existing.averageRating = totalPoints / existing.totalRatings

  driverRatingsStore.set(driverId, existing)
}

export function getDriverRating(driverId: string): DriverRating | null {
  return driverRatingsStore.get(driverId) || null
}

export function getDriverReviews(driverId: string, limit: number = 10): Rating[] {
  return ratingsStore
    .filter((r) => r.driverId === driverId && r.review.length > 0)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
}

export function getUserRatings(userId: string): Rating[] {
  return ratingsStore.filter((r) => r.userId === userId).sort((a, b) => b.timestamp - a.timestamp)
}

export function canUserRate(userId: string, bookingId: string): boolean {
  return !ratingsStore.some((r) => r.userId === userId && r.bookingId === bookingId)
}
