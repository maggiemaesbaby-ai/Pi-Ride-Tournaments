import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const gameId = searchParams.get("gameId")
    const tier = searchParams.get("tier")

    if (!userId || !gameId || !tier) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Create Supabase client inside the function
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if user has a match in the arcade_matches table
    const { data: matches, error } = await supabase
      .from("arcade_matches")
      .select("id, game_id, tier, players, status")
      .eq("game_id", gameId)
      .eq("tier", tier)
      .contains("players", [userId])
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("[v0] Error checking match:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (matches && matches.length > 0) {
      const match = matches[0]
      return NextResponse.json({
        matchId: match.id,
        gameId: match.game_id,
        tier: match.tier,
        status: match.status,
      })
    }

    return NextResponse.json({ matchId: null })
  } catch (error: any) {
    console.error("[v0] Check match error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
