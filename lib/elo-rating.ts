// Elo Rating System Implementation
// Based on chess rating system adapted for arcade tournaments

interface PlayerResult {
  userId: string
  score: number
  rating: number
  position: number
}

interface EloUpdate {
  userId: string
  oldRating: number
  newRating: number
  ratingChange: number
}

/**
 * Calculate expected score for player A against player B
 * @param ratingA - Player A's current rating
 * @param ratingB - Player B's current rating
 * @returns Expected score (0-1) for player A
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

/**
 * Calculate K-factor based on number of games played
 * New players have higher K-factor for faster rating adjustment
 */
export function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < 30) return 40 // New players
  if (gamesPlayed < 100) return 30 // Intermediate
  return 20 // Experienced players
}

/**
 * Calculate actual score based on placement in tournament
 * 1st place = 1.0, 2nd = 0.75, 3rd = 0.5, 4th+ = 0.25
 */
export function getActualScore(position: number, totalPlayers: number): number {
  if (position === 1) return 1.0
  if (position === 2) return 0.75
  if (position === 3) return 0.5
  return 0.25
}

/**
 * Calculate new Elo ratings for all players in a tournament
 * @param results - Array of player results with userId, score, rating, position
 * @param gamesPlayedMap - Map of userId to games played for K-factor calculation
 * @returns Array of Elo updates for each player
 */
export function calculateTournamentElo(results: PlayerResult[], gamesPlayedMap: Map<string, number>): EloUpdate[] {
  const updates: EloUpdate[] = []

  // Calculate average rating of all opponents
  const avgRating = results.reduce((sum, p) => sum + p.rating, 0) / results.length

  results.forEach((player) => {
    const gamesPlayed = gamesPlayedMap.get(player.userId) || 0
    const kFactor = getKFactor(gamesPlayed)

    // Calculate expected score against average opponent
    const expectedScore = calculateExpectedScore(player.rating, avgRating)

    // Get actual score based on placement
    const actualScore = getActualScore(player.position, results.length)

    // Calculate rating change
    const ratingChange = Math.round(kFactor * (actualScore - expectedScore))
    const newRating = Math.max(100, player.rating + ratingChange) // Minimum rating of 100

    updates.push({
      userId: player.userId,
      oldRating: player.rating,
      newRating,
      ratingChange,
    })
  })

  return updates
}

/**
 * Get rank title based on rating
 */
export function getRankTitle(rating: number): string {
  if (rating >= 2400) return "Arcade Legend"
  if (rating >= 2200) return "Grand Master"
  if (rating >= 2000) return "Master"
  if (rating >= 1800) return "Expert"
  if (rating >= 1600) return "Advanced"
  if (rating >= 1400) return "Intermediate"
  if (rating >= 1200) return "Novice"
  return "Beginner"
}

/**
 * Get rank color based on rating
 */
export function getRankColor(rating: number): string {
  if (rating >= 2400) return "text-purple-400"
  if (rating >= 2200) return "text-yellow-400"
  if (rating >= 2000) return "text-orange-400"
  if (rating >= 1800) return "text-red-400"
  if (rating >= 1600) return "text-blue-400"
  if (rating >= 1400) return "text-green-400"
  if (rating >= 1200) return "text-gray-400"
  return "text-gray-500"
}
