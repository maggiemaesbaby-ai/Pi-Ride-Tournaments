import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: waitlist, error } = await supabase
      .from("driver_waitlist")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch waitlist:", error)
      throw new Error("Failed to fetch waitlist")
    }

    return NextResponse.json({
      success: true,
      waitlist: waitlist || [],
    })
  } catch (error: any) {
    console.error("[v0] Admin waitlist API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch waitlist" }, { status: 500 })
  }
}
