import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rideId, driverId, driverName } = body

    const supabase = await createClient()

    // Get ride details
    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    if (rideError || !ride) {
      throw new Error("Ride not found")
    }

    if (ride.status !== "pending") {
      return NextResponse.json({ error: "This ride has already been accepted by another driver" }, { status: 400 })
    }

    // Check if 90-second window has expired
    const rideCreatedAt = new Date(ride.created_at).getTime()
    const elapsedSeconds = (Date.now() - rideCreatedAt) / 1000

    if (elapsedSeconds > 90) {
      await supabase.from("rides").update({ status: "expired" }).eq("id", rideId)
      return NextResponse.json({ error: "Ride request has expired. Refund initiated for rider." }, { status: 400 })
    }

    // Get driver details including commission tier
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("*")
      .eq("pi_user_id", driverId)
      .single()

    if (driverError || !driver) {
      throw new Error("Driver not found")
    }

    const commissionRate = driver.commission_rate || 0.05
    const driverEarnings = ride.price_pi * (1 - commissionRate)

    // Update ride with driver info
    const { data: updatedRide, error: updateError } = await supabase
      .from("rides")
      .update({
        driver_id: driver.id,
        driver_pi_user_id: driverId,
        driver_name: driver.full_name || driverName,
        driver_email: driver.email,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", rideId)
      .eq("status", "pending")
      .select()
      .single()

    if (updateError || !updatedRide) {
      console.error("[v0] Failed to update ride:", updateError)
      return NextResponse.json({ error: "Another driver just accepted this ride" }, { status: 409 })
    }

    await supabase
      .from("ride_notifications")
      .update({
        status: "accepted",
        accepted_by: driverId,
        accepted_at: new Date().toISOString(),
      })
      .eq("ride_id", rideId)
      .eq("status", "pending")

    console.log(
      `[v0] Ride ${rideId} accepted by driver ${driverId} with ${(commissionRate * 100).toFixed(0)}% commission`,
    )

    // Send confirmation emails with correct earnings
    if (ride.rider_email) {
      await sendEmail({
        to: ride.rider_email,
        subject: "Your Pi Ride Driver is on the way!",
        html: `
          <h2>Driver Assigned to Your Ride</h2>
          <p>Great news! ${driver.full_name} has accepted your ride request.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Driver:</strong> ${driver.full_name}</p>
            <p><strong>Rating:</strong> ${driver.rating?.toFixed(1) || "5.0"} ⭐</p>
            ${
              driver.vehicle_info
                ? `
              <p><strong>Vehicle:</strong> ${driver.vehicle_info.color} ${driver.vehicle_info.make} ${driver.vehicle_info.model}</p>
              <p><strong>License Plate:</strong> ${driver.vehicle_info.plate}</p>
            `
                : ""
            }
          </div>
          <p><strong>Pickup:</strong> ${ride.pickup_location.address}</p>
          <p><strong>Dropoff:</strong> ${ride.dropoff_location.address}</p>
          <p><strong>Total Paid:</strong> ${ride.price_pi}π</p>
          <p>Track your ride in real-time on the Pi Ride app.</p>
        `,
      })
    }

    await sendEmail({
      to: driver.email,
      subject: "Ride Accepted - Rider has paid. Proceed to pickup",
      html: `
        <h2>Ride Assignment Confirmed</h2>
        <p>You have successfully accepted a ride request. The rider has already completed payment.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Pickup Location:</strong> ${ride.pickup_location.address}</p>
          <p><strong>Dropoff Location:</strong> ${ride.dropoff_location.address}</p>
          <p><strong>Ride Type:</strong> ${ride.ride_type}</p>
          <p><strong>Your Earnings:</strong> ${driverEarnings.toFixed(2)}π (after ${(commissionRate * 100).toFixed(0)}% app fee)</p>
          <p><strong>Total Payment:</strong> ${ride.price_pi}π</p>
        </div>
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Click "Start Pickup Now" in your dashboard</li>
          <li>Navigate to the pickup location</li>
          <li>Update status when passenger is picked up</li>
          <li>Complete dropoff to receive payment</li>
        </ol>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/driver-dashboard" style="display: inline-block; padding: 10px 20px; background-color: #7C3AED; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
          View Active Ride
        </a>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Ride accepted successfully. Rider has been notified.",
      ride: {
        ...updatedRide,
        driverEarnings,
        commissionRate,
      },
    })
  } catch (error: any) {
    console.error("[v0] Ride acceptance error:", error)
    return NextResponse.json({ error: error.message || "Failed to accept ride" }, { status: 500 })
  }
}
