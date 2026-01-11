import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: applications, error } = await supabase
      .from("driver_applications")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch applications:", error)
      throw new Error("Failed to fetch applications")
    }

    return NextResponse.json({
      success: true,
      applications: applications || [],
    })
  } catch (error: any) {
    console.error("[v0] Admin applications API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch applications" }, { status: 500 })
  }
}
