import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("id", matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Get all participants with their user details and scores
    const { data: participants, error: participantsError } = await supabase
      .from("match_participants")
      .select(`
        *,
        arcade_users(username, avatar_url)
      `)
      .eq("match_id", matchId)
      .order("final_score", { ascending: false })

    if (participantsError) {
      console.error("[v0] Error fetching participants:", participantsError)
      return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
    }

    // Get payout information
    const { data: payouts, error: payoutsError } = await supabase
      .from("tournament_payouts")
      .select("*")
      .eq("match_id", matchId)

    if (payoutsError) {
      console.error("[v0] Error fetching payouts:", payoutsError)
    }

    // Combine data
    const participantsWithPayouts = participants.map((p, index) => {
      const payout = payouts?.find((pay) => pay.user_id === p.user_id)
      return {
        ...p,
        position: index + 1,
        payout: payout?.amount || 0,
        payoutStatus: payout?.status || null,
      }
    })

    return NextResponse.json({
      match,
      participants: participantsWithPayouts,
    })
  } catch (error) {
    console.error("[v0] Match details error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
