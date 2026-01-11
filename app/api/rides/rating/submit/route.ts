import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rideId, rating, feedback, riderPiUserId } = body

    if (!rideId || !rating || !riderPiUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the ride
    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 })
    }

    // Verify the rider owns this ride
    if (ride.rider_pi_user_id !== riderPiUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update ride with rating and feedback
    const { error: updateError } = await supabase
      .from("rides")
      .update({
        rider_rating: rating,
        rider_feedback: feedback || null,
      })
      .eq("id", rideId)

    if (updateError) {
      throw new Error("Failed to update ride rating")
    }

    // Update driver's average rating
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("rating, total_rides")
      .eq("id", ride.driver_id)
      .single()

    if (!driverError && driver) {
      // Calculate new average rating
      const currentTotal = driver.rating * driver.total_rides
      const newTotal = currentTotal + rating
      const newAverage = newTotal / (driver.total_rides + 1) // Note: total_rides was already incremented on completion

      await supabase
        .from("drivers")
        .update({ rating: Number(newAverage.toFixed(2)) })
        .eq("id", ride.driver_id)
    }

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
    })
  } catch (error: any) {
    console.error("[v0] Rating submission error:", error)
    return NextResponse.json({ error: error.message || "Failed to submit rating" }, { status: 500 })
  }
}
