import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { piUserId } = body

    if (!piUserId) {
      return NextResponse.json({ error: "Pi user ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Update driver to mark agreement as accepted
    const { data: driver, error: updateError } = await supabase
      .from("drivers")
      .update({
        agreement_accepted: true,
        agreement_accepted_at: new Date().toISOString(),
      })
      .eq("pi_user_id", piUserId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Failed to update driver agreement:", updateError)
      throw new Error("Failed to accept agreement")
    }

    console.log("[v0] Driver accepted agreement:", driver.id)

    return NextResponse.json({
      success: true,
      message: "Agreement accepted successfully",
    })
  } catch (error: any) {
    console.error("[v0] Agreement acceptance error:", error)
    return NextResponse.json({ error: error.message || "Failed to accept agreement" }, { status: 500 })
  }
}
