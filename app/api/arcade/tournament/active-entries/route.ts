import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const gameId = searchParams.get("gameId")
    const platform = searchParams.get("platform")

    console.log("[v0] 📡 ===== ACTIVE ENTRIES REQUEST =====")
    console.log("[v0] Request params:", { userId, gameId, platform })

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: allEntries } = await supabase
      .from("tournament_entries")
      .select("id, status, score, created_at")
      .eq("user_id", userId)

    console.log("[v0] 🔍 ALL entries for user (all statuses):", allEntries?.length || 0)
    allEntries?.forEach((entry: any) => {
      console.log(`[v0]   - Entry ${entry.id}: status=${entry.status}, score=${entry.score}`)
    })

    let query = supabase.from("tournament_entries").select("*").eq("user_id", userId).eq("status", "active")

    if (gameId) {
      query = query.eq("game_id", gameId)
    }

    if (platform) {
      query = query.eq("platform", platform)
      console.log("[v0] 🎯 Filtering by platform:", platform)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error("[v0] ❌ Error fetching active entries:", error)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    console.log("[v0] 📊 Database query result - Total entries with status='active':", entries?.length || 0)
    entries?.forEach((entry: any, index: number) => {
      console.log(`[v0] Entry ${index + 1}:`, {
        id: entry.id,
        game_id: entry.game_id,
        platform: entry.platform,
        status: entry.status,
        score: entry.score,
        created_at: entry.created_at,
      })
    })

    const transformedEntries =
      entries?.map((entry: any) => ({
        id: entry.id,
        user_id: entry.user_id,
        game_id: entry.game_id,
        tier_id: entry.tier_id,
        entry_fee: entry.entry_fee,
        status: entry.status,
        match_id: entry.match_id,
        created_at: entry.created_at,
      })) || []

    console.log("[v0] ✅ Returning active tournament entries - count:", transformedEntries.length)

    return NextResponse.json({ entries: transformedEntries })
  } catch (error) {
    console.error("[v0] Active entries error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
