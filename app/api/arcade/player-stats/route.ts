import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get overall player stats
    const { data: playerStats } = await supabase.from("player_stats").select("*").eq("user_id", userId).single()

    // Get per-game ratings
    const { data: gameRatings } = await supabase
      .from("game_ratings")
      .select("*")
      .eq("user_id", userId)
      .order("rating", { ascending: false })

    // Get recent match history
    const { data: recentMatches } = await supabase
      .from("match_history")
      .select("*")
      .contains("players", { [userId]: {} })
      .order("completed_at", { ascending: false })
      .limit(20)

    const { data: regularTournaments } = await supabase
      .from("tournament_entries")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })

    const { data: triviaTournaments } = await supabase
      .from("trivia_tournament_entries")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })

    const activeTournaments = [...(regularTournaments || []), ...(triviaTournaments || [])]
    console.log("[v0] Active tournaments fetched:", activeTournaments.length)

    return NextResponse.json({
      playerStats: playerStats || {
        overall_rating: 1200,
        games_played: 0,
        wins: 0,
        losses: 0,
      },
      gameRatings: gameRatings || [],
      recentMatches: recentMatches || [],
      activeTournaments,
    })
  } catch (error: any) {
    console.error("[v0] Error fetching player stats:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
