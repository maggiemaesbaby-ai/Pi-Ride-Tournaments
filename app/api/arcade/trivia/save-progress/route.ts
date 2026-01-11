import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      progressId,
      currentLevel,
      level1Answers,
      level2Answers,
      level3Answers,
      level1Time,
      level2Time,
      level3Time,
      correctAnswers,
      isPaused,
      elapsedTime,
    } = body

    console.log("[v0] 💾 Saving trivia progress:", { progressId, currentLevel, correctAnswers })

    const supabase = await createClient()

    // Update progress
    const { error } = await supabase
      .from("trivia_player_progress")
      .update({
        current_level: currentLevel,
        level_1_answers: level1Answers,
        level_2_answers: level2Answers,
        level_3_answers: level3Answers,
        level_1_time: level1Time,
        level_2_time: level2Time,
        level_3_time: level3Time,
        correct_answers: correctAnswers,
        total_time: elapsedTime,
        pause_start_time: isPaused ? Date.now() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", progressId)

    if (error) {
      console.error("[v0] ❌ Failed to save progress:", error)
      throw error
    }

    console.log("[v0] ✅ Progress saved successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] ❌ Save progress error:", error)
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 })
  }
}
