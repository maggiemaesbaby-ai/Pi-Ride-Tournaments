import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { piUserId, email, city, location } = body

    if (!piUserId || !email || !city) {
      return NextResponse.json({ error: "Missing required fields: piUserId, email, city" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user is already on waitlist for this city
    const { data: existing, error: checkError } = await supabase
      .from("driver_waitlist")
      .select("id")
      .eq("pi_user_id", piUserId)
      .eq("city", city)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking waitlist:", checkError)
      return NextResponse.json({ error: "Failed to check waitlist status" }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ error: "Already on waitlist for this city", alreadyOnWaitlist: true }, { status: 409 })
    }

    // Insert new waitlist entry
    const { data, error } = await supabase
      .from("driver_waitlist")
      .insert([
        {
          pi_user_id: piUserId,
          email,
          city,
          location,
          notified: false,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Waitlist insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      entry: data[0],
    })
  } catch (error: any) {
    console.error("[v0] Waitlist join error:", error)
    return NextResponse.json({ error: error.message || "Failed to join waitlist" }, { status: 500 })
  }
}
