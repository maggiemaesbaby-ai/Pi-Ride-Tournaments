import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { calculateTournamentElo } from "@/lib/elo-rating"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { tournamentId, gameId, tier, results } = await request.json()

    console.log("[v0] Updating ratings for tournament:", tournamentId)

    // Get current ratings for all players
    const playerIds = results.map((r: any) => r.userId)
    const { data: ratingsData } = await supabase
      .from("game_ratings")
      .select("user_id, rating, games_played")
      .in("user_id", playerIds)
      .eq("game_id", gameId)

    // Create maps for quick lookup
    const ratingsMap = new Map(ratingsData?.map((r) => [r.user_id, r.rating]) || [])
    const gamesPlayedMap = new Map(ratingsData?.map((r) => [r.user_id, r.games_played]) || [])

    // Prepare player results with current ratings
    const playerResults = results.map((r: any) => ({
      userId: r.userId,
      score: r.score,
      rating: ratingsMap.get(r.userId) || 1200,
      position: r.position,
    }))

    // Calculate new Elo ratings
    const eloUpdates = calculateTournamentElo(playerResults, gamesPlayedMap)

    console.log("[v0] Elo updates:", eloUpdates)

    // Update game ratings in database
    for (const update of eloUpdates) {
      const result = results.find((r: any) => r.userId === update.userId)
      const isWin = result.position <= 3 // Top 3 count as wins

      // Upsert game rating
      const { data: existingRating } = await supabase
        .from("game_ratings")
        .select("*")
        .eq("user_id", update.userId)
        .eq("game_id", gameId)
        .single()

      if (existingRating) {
        await supabase
          .from("game_ratings")
          .update({
            rating: update.newRating,
            games_played: existingRating.games_played + 1,
            wins: existingRating.wins + (isWin ? 1 : 0),
            best_score: Math.max(existingRating.best_score || 0, result.score),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", update.userId)
          .eq("game_id", gameId)
      } else {
        await supabase.from("game_ratings").insert({
          user_id: update.userId,
          game_id: gameId,
          rating: update.newRating,
          games_played: 1,
          wins: isWin ? 1 : 0,
          best_score: result.score,
        })
      }

      // Upsert overall player stats
      const { data: existingStats } = await supabase
        .from("player_stats")
        .select("*")
        .eq("user_id", update.userId)
        .single()

      if (existingStats) {
        const newOverallRating =
          (existingStats.overall_rating * existingStats.games_played + update.newRating) /
          (existingStats.games_played + 1)

        await supabase
          .from("player_stats")
          .update({
            overall_rating: newOverallRating,
            games_played: existingStats.games_played + 1,
            wins: existingStats.wins + (isWin ? 1 : 0),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", update.userId)
      } else {
        await supabase.from("player_stats").insert({
          user_id: update.userId,
          username: result.username || "Player",
          overall_rating: update.newRating,
          games_played: 1,
          wins: isWin ? 1 : 0,
        })
      }
    }

    // Save match history
    await supabase.from("match_history").insert({
      tournament_id: tournamentId,
      game_id: gameId,
      tier,
      players: playerResults,
      results: eloUpdates,
    })

    return NextResponse.json({
      success: true,
      updates: eloUpdates,
    })
  } catch (error: any) {
    console.error("[v0] Error updating ratings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
