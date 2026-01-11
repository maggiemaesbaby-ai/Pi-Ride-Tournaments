import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { entryId, platform } = await request.json()

    console.log("[v0] 🔄 ===== UPDATE PLATFORM API CALLED =====")
    console.log("[v0] 📝 Entry ID:", entryId)
    console.log("[v0] 🎯 New platform value:", platform)

    if (!entryId || !platform) {
      console.error("[v0] ❌ Missing required fields:", { entryId, platform })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: existingEntry, error: fetchError } = await supabase
      .from("tournament_entries")
      .select("*")
      .eq("id", entryId)
      .single()

    if (fetchError || !existingEntry) {
      console.error("[v0] ❌ Entry not found:", entryId, fetchError)
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    console.log("[v0] 📊 BEFORE UPDATE - Entry details:", {
      id: existingEntry.id,
      user_id: existingEntry.user_id,
      game_id: existingEntry.game_id,
      platform: existingEntry.platform,
      status: existingEntry.status,
      tier_id: existingEntry.tier_id,
    })
    console.log("[v0] 🔄 Changing platform from:", existingEntry.platform, "→", platform)

    const { error: updateError } = await supabase.from("tournament_entries").update({ platform }).eq("id", entryId)

    if (updateError) {
      console.error("[v0] ❌ Failed to update entry platform:", updateError)
      return NextResponse.json({ error: "Failed to update platform" }, { status: 500 })
    }

    const { data: updatedEntry } = await supabase.from("tournament_entries").select("*").eq("id", entryId).single()

    console.log("[v0] 📊 AFTER UPDATE - Entry details:", {
      id: updatedEntry.id,
      user_id: updatedEntry.user_id,
      game_id: updatedEntry.game_id,
      platform: updatedEntry.platform,
      status: updatedEntry.status,
      tier_id: updatedEntry.tier_id,
    })

    if (updatedEntry.platform === platform) {
      console.log("[v0] ✅ Platform update VERIFIED - Entry now has platform:", updatedEntry.platform)
    } else {
      console.error("[v0] ⚠️ Platform update FAILED - Expected:", platform, "Got:", updatedEntry.platform)
    }

    console.log("[v0] ===== UPDATE PLATFORM API COMPLETE =====")

    return NextResponse.json({ success: true, entry: updatedEntry })
  } catch (error: any) {
    console.error("[v0] ❌ Update platform error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
