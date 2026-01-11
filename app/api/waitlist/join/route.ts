import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  console.log("[v0] ===== WAITLIST API CALLED =====")
  try {
    const body = await req.json()
    console.log("[v0] Request body:", JSON.stringify(body, null, 2))

    const { piUserId, email, city, location, pickupLocation, destinationLocation } = body

    console.log("[v0] Parsed fields:", {
      piUserId,
      email,
      city,
      hasPickupLocation: !!pickupLocation,
      hasDestinationLocation: !!destinationLocation,
    })

    if (!piUserId || !email || !city) {
      console.log("[v0] ❌ Missing required fields:", { piUserId: !!piUserId, email: !!email, city: !!city })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    const waitlistData = {
      pi_user_id: piUserId,
      email,
      city,
      pickup_location: pickupLocation || location,
      destination_location: destinationLocation,
      notified: false,
    }

    console.log("[v0] Inserting into rider_waitlist:", JSON.stringify(waitlistData, null, 2))

    const { data, error } = await supabase.from("rider_waitlist").insert([waitlistData]).select().single()

    if (error) {
      console.error("[v0] ❌ Supabase insert error:", error)
      console.error("[v0] Error code:", error.code)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error details:", error.details)

      if (error.code === "23505") {
        console.log("[v0] Duplicate entry - user already on waitlist")
        return NextResponse.json(
          { error: "You're already on the waitlist for this city", alreadyOnWaitlist: true },
          { status: 400 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] ✅ Successfully added to waitlist:", data)
    console.log("[v0] ===== WAITLIST API SUCCESS =====")

    return NextResponse.json({
      success: true,
      message: "Successfully added to waitlist!",
      data,
    })
  } catch (error: any) {
    console.error("[v0] ===== WAITLIST API ERROR =====")
    console.error("[v0] ❌ Catch block error:", error)
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error stack:", error.stack)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
