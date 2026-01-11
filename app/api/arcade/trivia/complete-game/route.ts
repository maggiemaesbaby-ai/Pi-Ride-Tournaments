import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { progressId, entryId, correctAnswers, totalTime, level1Time, level2Time, level3Time } = body

    console.log("[v0] 🏁 IQ Arena complete-game API called:", {
      progressId,
      entryId,
      correctAnswers,
      totalTime,
    })

    const supabase = await createClient()

    // Calculate score (correct answers weighted heavily, time as tiebreaker)
    const score = correctAnswers * 100 - totalTime

    // Update progress
    const { error: progressError } = await supabase
      .from("trivia_player_progress")
      .update({
        correct_answers: correctAnswers,
        total_time: totalTime,
        level_1_time: level1Time,
        level_2_time: level2Time,
        level_3_time: level3Time,
        score,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", progressId)

    if (progressError) {
      console.error("[v0] ❌ Failed to update progress:", progressError)
      throw progressError
    }

    console.log("[v0] ✅ Progress updated successfully")

    if (entryId) {
      console.log("[v0] 🎯 Updating tournament entry to completed:", entryId)

      const { error: entryError } = await supabase
        .from("tournament_entries")
        .update({
          score,
          status: "completed", // This is critical - marks entry as completed
        })
        .eq("id", entryId)

      if (entryError) {
        console.error("[v0] ❌ Failed to update tournament entry:", entryError)
        throw entryError
      }

      console.log("[v0] ✅ Tournament entry marked as completed - will clear from active tournaments")
    }

    return NextResponse.json({ success: true, score })
  } catch (error) {
    console.error("[v0] ❌ Failed to complete game:", error)
    return NextResponse.json({ error: "Failed to complete game" }, { status: 500 })
  }
}
