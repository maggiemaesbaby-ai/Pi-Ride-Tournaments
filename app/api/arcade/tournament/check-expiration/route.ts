import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { entryId } = await request.json()

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 })
    }

    const { data: entry, error } = await supabase
      .from("tournament_entries")
      .select("must_play_by, forfeited, status")
      .eq("id", entryId)
      .single()

    if (error) {
      console.error("[v0] Error checking entry expiration:", error)
      return NextResponse.json({ error: "Failed to check entry" }, { status: 500 })
    }

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const now = new Date()
    const expiresAt = entry.must_play_by ? new Date(entry.must_play_by) : null
    const timeRemaining = expiresAt ? expiresAt.getTime() - now.getTime() : 0
    const isExpired = expiresAt && now > expiresAt

    return NextResponse.json({
      success: true,
      isExpired,
      forfeited: entry.forfeited,
      expiresAt: expiresAt?.toISOString(),
      timeRemaining: Math.max(0, timeRemaining),
      minutesRemaining: Math.max(0, Math.floor(timeRemaining / 60000)),
    })
  } catch (error: any) {
    console.error("[v0] Check expiration error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: expiredEntries, error: fetchError } = await supabase
      .from("tournament_entries")
      .select("*")
      .eq("status", "active")
      .not("must_play_by", "is", null)
      .lt("must_play_by", new Date().toISOString())
      .eq("forfeited", false)

    if (fetchError) {
      console.error("[v0] Error fetching expired entries:", fetchError)
      throw fetchError
    }

    if (!expiredEntries || expiredEntries.length === 0) {
      return NextResponse.json({ success: true, forfeited: 0 })
    }

    const triviaExpiredEntries = expiredEntries.filter((e) => e.game_id === "trivia" || e.game_id.startsWith("trivia-"))

    if (triviaExpiredEntries.length === 0) {
      return NextResponse.json({ success: true, forfeited: 0 })
    }

    // Forfeit all expired IQ Arena entries
    const { error: updateError } = await supabase
      .from("tournament_entries")
      .update({
        status: "completed",
        forfeited: true,
        forfeit_reason: "Time expired - 30 minute play window exceeded",
        score: 0,
        rank: 999999,
      })
      .in(
        "id",
        triviaExpiredEntries.map((e) => e.id),
      )

    if (updateError) {
      console.error("[v0] Error forfeiting entries:", updateError)
      throw updateError
    }

    console.log("[v0] Auto-forfeited", triviaExpiredEntries.length, "expired IQ Arena tournament entries")

    return NextResponse.json({
      success: true,
      forfeited: triviaExpiredEntries.length,
      entries: triviaExpiredEntries.map((e) => ({
        id: e.id,
        user_id: e.user_id,
        game_id: e.game_id,
        tier_id: e.tier_id,
      })),
    })
  } catch (error: any) {
    console.error("[v0] Auto-forfeit error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
