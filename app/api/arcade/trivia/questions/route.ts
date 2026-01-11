import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "general"
    const count = Number.parseInt(searchParams.get("count") || "18")
    const freePlay = searchParams.get("freePlay") === "true"
    const tier = searchParams.get("tier")

    console.log("[v0] API - Fetching trivia questions", { category, count, freePlay, tier })

    const supabase = await createServerClient()

    let questions
    let error

    if (freePlay) {
      // For free play, use the old logic (36 easy questions per category)
      const result = await supabase
        .from("trivia_questions")
        .select("id, question, option_a, option_b, option_c, option_d, correct_answer, difficulty")
        .eq("category", category)
        .or("is_free_play.eq.true,game_mode.eq.freeplay")
        .limit(count * 3) // Get 3x more for better randomization

      questions = result.data
      error = result.error
    } else {
      // For tournaments, call the PostgreSQL function to get random questions from ALL difficulty levels
      const result = await supabase.rpc("get_random_tournament_questions", {
        p_category: category,
        p_count: count,
      })

      questions = result.data
      error = result.error
    }

    if (error) {
      console.error("[v0] API - Error fetching questions from Supabase", { error, category })
      return NextResponse.json(
        {
          error: `Database error: ${error.message}. Make sure to run the 'create-random-tournament-question-selector.sql' script.`,
          details: error,
        },
        { status: 500 },
      )
    }

    console.log("[v0] API - Questions fetched", { count: questions?.length || 0, category, freePlay })

    if (!questions || questions.length === 0) {
      console.log("[v0] API - No questions found for category", { category })
      return NextResponse.json(
        {
          error: `No questions found for category '${category}'. Please run the SQL scripts in Supabase SQL Editor to populate questions.`,
          category,
        },
        { status: 404 },
      )
    }

    // For free play, still shuffle to randomize
    if (freePlay) {
      const shuffled = [...questions]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      questions = shuffled.slice(0, count)
    }

    console.log("[v0] API - Returning questions", {
      requested: count,
      returning: questions.length,
      questionIds: questions.map((q: any) => q.id),
      difficulties: questions.reduce((acc: any, q: any) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
        return acc
      }, {}),
    })

    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error("[v0] API - Unexpected error fetching questions", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch questions", details: error.toString() },
      { status: 500 },
    )
  }
}
