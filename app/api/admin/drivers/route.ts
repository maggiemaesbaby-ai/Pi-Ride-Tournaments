import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: drivers, error } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch drivers:", error)
      throw new Error("Failed to fetch drivers")
    }

    return NextResponse.json({
      success: true,
      drivers: drivers || [],
    })
  } catch (error: any) {
    console.error("[v0] Admin drivers API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch drivers" }, { status: 500 })
  }
}
