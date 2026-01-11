import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: true,
        entries: [],
        stats: {
          totalGames: 0,
          totalWinnings: 0,
          bestRank: null,
          avgScore: 0,
        },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 })
    }

    const { data: entries, error } = await supabase
      .from("tournament_entries")
      .select(`
        id,
        game_id,
        tier_id,
        tournament_tiers:tier_id (name),
        entry_fee,
        score,
        rank,
        payout,
        status,
        created_at,
        completed_at
      `)
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Tournament history query error:", error)
      return NextResponse.json({ success: false, error: "Failed to load tournament history" }, { status: 500 })
    }

    // Calculate stats
    const totalGames = entries?.length || 0
    const totalWinnings = entries?.reduce((sum, entry) => sum + Number.parseFloat(entry.payout || 0), 0) || 0
    const rankedEntries = entries?.filter((e) => e.rank !== null) || []
    const bestRank = rankedEntries.length > 0 ? Math.min(...rankedEntries.map((e) => e.rank)) : null
    const avgScore = totalGames > 0 ? entries.reduce((sum, e) => sum + (e.score || 0), 0) / totalGames : 0

    return NextResponse.json({
      success: true,
      entries: entries || [],
      stats: {
        totalGames,
        totalWinnings,
        bestRank,
        avgScore: Math.round(avgScore),
      },
    })
  } catch (error) {
    console.error("[v0] Tournament history error:", error)
    return NextResponse.json({ success: false, error: "Failed to load tournament history" }, { status: 500 })
  }
}
