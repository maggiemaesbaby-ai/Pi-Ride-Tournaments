import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  try {
    const isAuthenticated = await isAdminAuthenticated()
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get active tournament instances with participant counts
    const { data: instances, error: instancesError } = await supabase
      .from("tournament_instances")
      .select(
        `
        *,
        tournament:tournament_id(game_id, tier, entry_fee_pi),
        entries:tournament_entries(count)
      `,
      )
      .eq("status", "filling")
      .order("created_at", { ascending: false })

    if (instancesError) throw instancesError

    // Get recent completed matches from last 24 hours
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: matches, error: matchesError } = await supabase
      .from("tournament_matches")
      .select(
        `
        *,
        tournament:tournament_id(game_id, tier, entry_fee_pi),
        participants:match_participants(count, prize_amount)
      `,
      )
      .gte("completed_at", twentyFourHoursAgo.toISOString())
      .order("completed_at", { ascending: false })
      .limit(20)

    if (matchesError) throw matchesError

    // Calculate match payouts
    const recentMatches = matches?.map((match: any) => {
      const totalPayouts = match.participants?.reduce(
        (sum: number, p: any) => sum + Number.parseFloat(p.prize_amount || 0),
        0,
      )
      return {
        ...match,
        participant_count: match.participants?.length || 0,
        total_payouts: totalPayouts || 0,
      }
    })

    return NextResponse.json({
      success: true,
      activeTournaments: instances || [],
      recentMatches: recentMatches || [],
    })
  } catch (error) {
    console.error("[v0] Failed to fetch active tournaments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch tournaments" }, { status: 500 })
  }
}
