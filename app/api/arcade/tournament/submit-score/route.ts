import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { entryId, userId, gameId, score, platform } = await request.json()

    console.log("[v0] 📡 ===== SUBMIT SCORE REQUEST =====")
    console.log("[v0] Request body:", { entryId, userId, gameId, score, platform })

    if (!entryId || !userId || !gameId || score === undefined || !platform) {
      console.log("[v0] ❌ Missing required fields:", { entryId, userId, gameId, score, platform })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: anyEntry, error: anyEntryError } = await supabase
      .from("tournament_entries")
      .select("*")
      .eq("id", entryId)
      .single()

    const entryUserId = String(anyEntry.user_id || "").trim()
    const requestUserId = String(userId || "").trim()

    console.log("[v0] 🔍 Entry lookup (any user):", {
      found: !!anyEntry,
      entryUserId: entryUserId,
      requestUserId: requestUserId,
      match: entryUserId === requestUserId,
    })

    if (anyEntryError || !anyEntry) {
      console.error("[v0] ❌ Entry not found at all:", anyEntryError)
      return NextResponse.json({ error: "Tournament entry not found" }, { status: 404 })
    }

    if (entryUserId !== requestUserId) {
      console.error("[v0] ❌ User ID mismatch:", {
        entryUserId: entryUserId,
        requestUserId: requestUserId,
        entryUserIdRaw: anyEntry.user_id,
        requestUserIdRaw: userId,
        entryUserIdType: typeof anyEntry.user_id,
        requestUserIdType: typeof userId,
      })
      return NextResponse.json(
        {
          error: "User ID not found",
          details: `Entry user: ${entryUserId}, Request user: ${requestUserId}`,
        },
        { status: 403 },
      )
    }

    const entry = anyEntry
    console.log("[v0] ✅ Entry found and user matches:", { id: entry.id, status: entry.status, user_id: entry.user_id })

    const { data: beforeUpdate } = await supabase
      .from("tournament_entries")
      .select("id, status, score")
      .eq("id", entryId)
      .single()

    console.log("[v0] 🔍 Entry BEFORE status update:", beforeUpdate)

    const { error: updateError } = await supabase
      .from("tournament_entries")
      .update({
        score,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", entryId)

    if (updateError) {
      console.error("[v0] ❌ Error updating tournament entry:", updateError)
      return NextResponse.json({ error: "Failed to update tournament entry" }, { status: 500 })
    }

    console.log(`[v0] ✅ Tournament entry ${entryId} updated - status: completed, score: ${score}`)

    const { data: verifyEntry } = await supabase
      .from("tournament_entries")
      .select("id, status, score")
      .eq("id", entryId)
      .single()

    console.log("[v0] 🔍 Entry AFTER status update (verification):", verifyEntry)

    if (verifyEntry?.status !== "completed") {
      console.error("[v0] ⚠️ WARNING: Status did not change to 'completed'! Current status:", verifyEntry?.status)
    } else {
      console.log("[v0] ✅ Status successfully changed to 'completed'")
    }

    try {
      const protocol = request.headers.get("x-forwarded-proto") || "https"
      const host = request.headers.get("host")
      const baseUrl = `${protocol}://${host}`

      console.log("[v0] 🔄 Triggering match assignment at:", `${baseUrl}/api/arcade/tournament/assign-to-match`)

      await fetch(`${baseUrl}/api/arcade/tournament/assign-to-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, userId, gameId, tierId: entry.tier_id, score }),
      })

      console.log("[v0] ✅ Match assignment triggered successfully")
    } catch (assignError) {
      console.error("[v0] ❌ Error triggering match assignment:", assignError)
      // Non-critical error, continue
    }

    return NextResponse.json({ success: true, entryId })
  } catch (error) {
    console.error("[v0] Submit score error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
