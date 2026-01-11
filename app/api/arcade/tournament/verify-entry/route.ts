import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { entryId } = await req.json()

    console.log("[v0] 🔍 ===== VERIFY ENTRY API CALLED =====")
    console.log("[v0] Entry ID received:", entryId)

    if (!entryId) {
      console.log("[v0] ❌ No entry ID provided")
      return NextResponse.json({ valid: false, error: "Entry ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    console.log("[v0] 📊 Querying database for entry:", entryId)

    // Verify entry exists and is active
    const { data: entry, error } = await supabase.from("tournament_entries").select("*").eq("id", entryId).single()

    console.log("[v0] Database query result:", { entry, error })

    if (error || !entry) {
      console.error("[v0] ❌ Entry not found in database:", entryId, error)
      return NextResponse.json({ valid: false, error: "Entry not found" }, { status: 404 })
    }

    console.log("[v0] ✅ Entry found:", {
      id: entry.id,
      status: entry.status,
      score: entry.score,
      gameId: entry.game_id,
      tierId: entry.tier_id,
    })

    // Check entry status
    if (entry.status !== "active") {
      console.error("[v0] ❌ Entry not active:", { entryId, status: entry.status })
      return NextResponse.json({ valid: false, error: "Entry is not active" }, { status: 400 })
    }

    // Check if entry has already been used (score submitted)
    if (entry.score !== null) {
      console.error("[v0] ❌ Entry already used (score exists):", entryId)
      return NextResponse.json({ valid: false, error: "Entry has already been used" }, { status: 400 })
    }

    console.log("[v0] ✅✅ Entry verified successfully:", entryId)
    return NextResponse.json({
      valid: true,
      entry: {
        id: entry.id,
        gameId: entry.game_id,
        tierId: entry.tier_id,
        userId: entry.user_id,
      },
    })
  } catch (error) {
    console.error("[v0] ❌ Entry verification error:", error)
    return NextResponse.json({ valid: false, error: "Verification failed" }, { status: 500 })
  }
}
