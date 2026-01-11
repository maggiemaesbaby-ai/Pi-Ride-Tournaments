import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const progressId = searchParams.get("progressId")

    if (!progressId) {
      return NextResponse.json({ error: "Progress ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get progress data
    const { data: progress, error } = await supabase
      .from("trivia_player_progress")
      .select("*")
      .eq("id", progressId)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      ...progress,
    })
  } catch (error) {
    console.error("[v0] Failed to load results:", error)
    return NextResponse.json({ error: "Failed to load results" }, { status: 500 })
  }
}
