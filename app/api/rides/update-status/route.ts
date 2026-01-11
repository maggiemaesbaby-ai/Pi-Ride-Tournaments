import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rideId, driverId, status } = body

    const validStatuses = ["accepted", "en_route", "arrived", "picked_up", "completed", "cancelled"]

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    if (rideError || !ride) {
      throw new Error("Ride not found")
    }

    if (ride.driver_pi_user_id !== driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update ride status
    const { data: updatedRide, error: updateError } = await supabase
      .from("rides")
      .update({ status })
      .eq("id", rideId)
      .select()
      .single()

    if (updateError) {
      throw new Error("Failed to update ride status")
    }

    // Send notification to rider based on status
    if (ride.rider_email) {
      let subject = ""
      let message = ""

      switch (status) {
        case "en_route":
          subject = "Your driver is on the way!"
          message = `${ride.driver_name} is heading to your pickup location.`
          break
        case "arrived":
          subject = "Your driver has arrived"
          message = `${ride.driver_name} is at your pickup location.`
          break
        case "picked_up":
          subject = "Ride in progress"
          message = `You're on your way to ${ride.dropoff_location.address}`
          break
      }

      if (subject && message) {
        await sendEmail({
          to: ride.rider_email,
          subject,
          html: `<h2>${subject}</h2><p>${message}</p>`,
        })
      }
    }

    console.log(`[v0] Ride ${rideId} status updated to ${status}`)

    return NextResponse.json({
      success: true,
      ride: updatedRide,
    })
  } catch (error: any) {
    console.error("[v0] Status update error:", error)
    return NextResponse.json({ error: error.message || "Failed to update status" }, { status: 500 })
  }
}
