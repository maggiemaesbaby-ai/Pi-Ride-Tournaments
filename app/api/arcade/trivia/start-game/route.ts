import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const TIER_MAX_PLAYERS: Record<string, number> = {
  newbie: 10,
  rookie: 7,
  elite: 5,
  mega: 100,
  bronze: 10,
  silver: 7,
  gold: 5,
}

const CATEGORY_MAP: Record<string, string> = {
  "general-knowledge": "general",
  general_knowledge: "general",
  entertainment: "entertainment",
  geography: "geography",
  history: "history",
  "history-geography": "history_geography",
  history_geography: "history_geography",
  literature: "literature",
  science: "science",
  sports: "sports",
  technology: "technology",
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const tier = searchParams.get("tier") || "bronze"
    const isFreePlay = searchParams.get("freeplay") === "true"
    const entryIdParam = searchParams.get("entryId")

    const entryId = entryIdParam && entryIdParam !== "null" && entryIdParam !== "undefined" ? entryIdParam : null

    const dbCategory = category ? CATEGORY_MAP[category] || category : null

    console.log("[v0] IQ Arena start-game API called:", {
      category,
      dbCategory,
      tier,
      isFreePlay,
      entryId,
    })

    if (!dbCategory) {
      return NextResponse.json({ error: "Category required" }, { status: 400 })
    }

    const supabase = await createClient()

    let userId = "temp" // Default for free play

    if (entryId) {
      console.log("[v0] Fetching user_id from tournament entry:", entryId)

      const { data: entry, error: entryError } = await supabase
        .from("tournament_entries")
        .select("user_id")
        .eq("id", entryId)
        .single()

      if (entryError) {
        console.error("[v0] Error fetching tournament entry:", entryError)
        return NextResponse.json({ error: "Invalid tournament entry" }, { status: 400 })
      }

      if (entry && entry.user_id) {
        userId = entry.user_id
        console.log("[v0] Found user_id from entry:", userId)
      } else {
        console.error("[v0] No user_id found in tournament entry")
        return NextResponse.json({ error: "Tournament entry missing user_id" }, { status: 400 })
      }
    }

    console.log("[v0] Loading questions with database RANDOM() functions...")

    const { data: easyQuestions, error: easyError } = await supabase.rpc("get_random_easy_questions", {
      p_category: dbCategory,
      p_limit: 3,
    })

    const { data: proQuestions, error: proError } = await supabase.rpc("get_random_pro_questions", {
      p_category: dbCategory,
      p_limit: 7,
    })

    const { data: hardQuestions, error: hardError } = await supabase.rpc("get_random_hard_questions", {
      p_category: dbCategory,
      p_limit: 8,
    })

    if (easyError || proError || hardError) {
      console.error("[v0] Error calling randomization functions:", { easyError, proError, hardError })
      return NextResponse.json(
        {
          error: "Database randomization function not found. Please run SQL setup script.",
          details: easyError?.message || proError?.message || hardError?.message,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Questions fetched from database with RANDOM():", {
      easy: easyQuestions?.length || 0,
      pro: proQuestions?.length || 0,
      hard: hardQuestions?.length || 0,
      question_ids: [...(easyQuestions || []), ...(proQuestions || []), ...(hardQuestions || [])].map((q: any) => q.id),
    })

    const questions = [...(easyQuestions || []), ...(proQuestions || []), ...(hardQuestions || [])]

    if (questions.length < 18) {
      console.error(`[v0] ❌ CRITICAL: Only ${questions.length} questions loaded! Need 18 for tournament.`)
      console.error(`[v0] Frontend category: ${category}, Database category: ${dbCategory}`)
      throw new Error(
        `Insufficient questions in database. Found ${questions.length}, need 18. Database category: ${dbCategory}, Frontend category: ${category}`,
      )
    }

    const finalQuestions = questions

    const progressInsert: any = {
      pi_uid: userId,
      category,
      tier: isFreePlay ? "free" : tier,
      is_free_play: isFreePlay,
      total_questions: finalQuestions.length,
      status: "in_progress",
    }

    if (entryId) {
      progressInsert.entry_id = entryId
    }

    console.log("[v0] Creating player progress record with userId:", userId)

    const { data: progressData, error: progressError } = await supabase
      .from("trivia_player_progress")
      .insert(progressInsert)
      .select()
      .single()

    if (progressError) {
      console.error("[v0] Error creating player progress:", progressError)
      throw progressError
    }

    return NextResponse.json({
      success: true,
      questions: finalQuestions.map((q: any) => ({
        id: q.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
      })),
      progressId: progressData.id,
    })
  } catch (error: any) {
    console.error("[v0] Failed to start game:", error)
    return NextResponse.json({ error: "Failed to start game", details: error.message }, { status: 500 })
  }
}
