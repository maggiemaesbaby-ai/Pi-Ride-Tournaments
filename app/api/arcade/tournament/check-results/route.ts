import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get completed tournament entries with match results
    const { data: results, error } = await supabase
      .from("match_participants")
      .select(`
        *,
        tournament_matches(game_id, tier_id, prize_pool, status),
        tournament_entries(game_id, entry_fee),
        tournament_payouts(amount, status, processed_at)
      `)
      .eq("user_id", userId)
      .not("final_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[v0] Error fetching results:", error)
      return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[v0] Check results error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
