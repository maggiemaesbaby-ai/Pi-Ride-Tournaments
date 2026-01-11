import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { matchId } = await request.json()

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all participants with scores
    const { data: participants, error: participantsError } = await supabase
      .from("match_participants")
      .select("*")
      .eq("match_id", matchId)
      .order("final_score", { ascending: false })

    if (participantsError) {
      console.error("[v0] Error fetching participants:", participantsError)
      return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
    }

    // Get match details for prize pool
    const { data: match, error: matchError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      console.error("[v0] Error fetching match:", matchError)
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    const { data: tierConfig, error: tierError } = await supabase
      .from("game_tiers")
      .select("*")
      .eq("game_id", match.game_id)
      .eq("tier_id", match.tier_id)
      .single()

    if (tierError || !tierConfig) {
      console.error("[v0] Error fetching tier config:", tierError)
      return NextResponse.json({ error: "Tier configuration not found" }, { status: 404 })
    }

    const prizePool = match.prize_pool
    const payoutStructure = tierConfig.payout_structure as Record<string, number>

    const prizes: Record<string, number> = { ...payoutStructure }

    // Calculate total payout and app profit
    const totalPayout = Object.values(prizes).reduce((sum, amount) => sum + amount, 0)
    const appProfit = prizePool - totalPayout

    console.log(`[v0] Match ${matchId} payouts:`, {
      prizePool,
      totalPayout,
      appProfit,
      prizes,
    })

    const updates = []
    const notifications = []

    for (let i = 0; i < Object.keys(prizes).length; i++) {
      const rank = i + 1
      const rankKey = rank.toString()
      const prize = prizes[rankKey] || 0

      if (prize <= 0) continue

      updates.push(
        supabase.from("match_participants").update({ rank, prize_amount: prize }).eq("id", participants[i].id),
      )

      // Create payout record
      updates.push(
        supabase.from("tournament_payouts").insert({
          match_id: matchId,
          user_id: participants[i].user_id,
          amount: prize,
          status: "pending",
        }),
      )

      const rankEmojis = ["🥇", "🥈", "🥉", "🏅", "🏅"]
      const rankEmoji = rankEmojis[i] || "🏅"
      const rankNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
      const rankName = rankNames[i] || `${rank}th`

      notifications.push(
        supabase.from("user_notifications").insert({
          user_id: participants[i].user_id,
          type: "match_complete",
          title: `${rankEmoji} ${rankName} Place!`,
          message: `Congratulations! You placed ${rankName} and won ${prize}π in the tournament match!`,
          data: {
            match_id: matchId,
            rank,
            prize,
            score: participants[i].final_score,
          },
        }),
      )
    }

    for (let i = Object.keys(prizes).length; i < participants.length; i++) {
      notifications.push(
        supabase.from("user_notifications").insert({
          user_id: participants[i].user_id,
          type: "match_complete",
          title: "Match Complete",
          message: `Your tournament match has ended. Check your results in the tournament history!`,
          data: {
            match_id: matchId,
            score: participants[i].final_score,
          },
        }),
      )
    }

    await Promise.all([...updates, ...notifications])

    // Mark match as completed
    await supabase
      .from("tournament_matches")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", matchId)

    console.log(
      "[v0] Match completed:",
      matchId,
      "Prize pool distributed:",
      prizePool,
      "Notifications sent to",
      participants.length,
      "users",
    )

    try {
      await fetch("/api/arcade/tournament/process-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      })
    } catch (payoutError) {
      console.error("[v0] Error triggering automatic payout:", payoutError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Complete match error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
