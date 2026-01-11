import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { entryId: string } }) {
  try {
    const { entryId } = await params

    console.log("[v0] 🔍 Fetching tournament entry:", entryId)

    if (!entryId) {
      return NextResponse.json({ error: "Entry ID required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: entry, error } = await supabase.from("tournament_entries").select("*").eq("id", entryId).single()

    if (error || !entry) {
      console.error("[v0] ❌ Failed to fetch tournament entry:", error)
      return NextResponse.json({ error: "Tournament entry not found" }, { status: 404 })
    }

    console.log("[v0] ✅ Tournament entry found:", {
      id: entry.id,
      user_id: entry.user_id,
      game_id: entry.game_id,
      platform: entry.platform,
      status: entry.status,
    })

    return NextResponse.json({ entry })
  } catch (error) {
    console.error("[v0] ❌ Error fetching tournament entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
