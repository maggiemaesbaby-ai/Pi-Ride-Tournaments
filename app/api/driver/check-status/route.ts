import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const piUserId = searchParams.get("piUserId")

    if (!piUserId) {
      return NextResponse.json({ error: "Pi User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user is an approved driver
    const { data: driver, error } = await supabase.from("drivers").select("*").eq("pi_user_id", piUserId).single()

    if (error || !driver) {
      return NextResponse.json({ isDriver: false }, { status: 200 })
    }

    // Return driver status
    return NextResponse.json({
      isDriver: true,
      needsAgreement: !driver.agreement_accepted,
      driverId: driver.id,
      driverName: driver.name,
    })
  } catch (error) {
    console.error("[v0] Driver status check error:", error)
    return NextResponse.json({ error: "Failed to check driver status" }, { status: 500 })
  }
}
