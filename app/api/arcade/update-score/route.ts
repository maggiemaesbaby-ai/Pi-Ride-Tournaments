import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { matchId, userId, score, completionTime, livesLost } = await request.json()

    const supabase = await createClient()

    // Update player score
    const { error } = await supabase
      .from("arcade_match_players")
      .update({
        score,
        completion_time: completionTime,
        lives_lost: livesLost,
        game_status: "completed",
      })
      .eq("match_id", matchId)
      .eq("user_id", userId)

    if (error) throw error

    // Check if all players have completed
    const { data: players } = await supabase.from("arcade_match_players").select("*").eq("match_id", matchId)

    const allCompleted = players?.every((p) => p.game_status === "completed")

    if (allCompleted && players) {
      const sortedPlayers = players.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }
        return a.completion_time - b.completion_time
      })

      const { data: match } = await supabase.from("arcade_matches").select("prize_pool").eq("id", matchId).single()

      const prizePool = match?.prize_pool || 0
      const payouts = [prizePool * 0.5, prizePool * 0.3, prizePool * 0.2]

      // Update rankings and payouts
      for (let i = 0; i < sortedPlayers.length; i++) {
        const payout = i < 3 ? payouts[i] : 0
        await supabase
          .from("arcade_match_players")
          .update({ rank: i + 1, payout })
          .eq("id", sortedPlayers[i].id)

        // Update player stats
        if (i === 0) {
          await supabase.rpc("increment_player_wins", { user_id: sortedPlayers[i].user_id })
        }
        await supabase.rpc("increment_player_games", { user_id: sortedPlayers[i].user_id })
        if (payout > 0) {
          await supabase.rpc("add_player_earnings", { user_id: sortedPlayers[i].user_id, amount: payout })
        }
      }

      // Mark match as completed
      await supabase
        .from("arcade_matches")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", matchId)

      console.log("[v0] All players completed. Triggering payouts...")
      fetch("/api/arcade/distribute-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      })
        .then(() => console.log("[v0] Payout distribution initiated"))
        .catch((err) => console.error("[v0] Payout distribution failed:", err))

      return NextResponse.json({ matchCompleted: true, rankings: sortedPlayers })
    }

    return NextResponse.json({ matchCompleted: false })
  } catch (error) {
    console.error("[v0] Update score error:", error)
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 })
  }
}
