import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rideId, driverId } = body

    const supabase = await createClient()

    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    if (rideError || !ride) {
      throw new Error("Ride not found")
    }

    const { data: driver, error: driverError } = await supabase.from("drivers").select("*").eq("id", driverId).single()

    if (driverError || !driver) {
      throw new Error("Driver not found")
    }

    // Update ride status to completed
    const { error: updateError } = await supabase
      .from("rides")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", rideId)

    if (updateError) {
      throw new Error("Failed to complete ride")
    }

    const commissionRate = driver.commission_rate || 0.05
    let driverEarnings = ride.price_pi * (1 - commissionRate)
    const platformFee = ride.price_pi * commissionRate

    let upfrontFeeDeducted = 0
    if (driver.upfront_fee_paid === false && driver.upfront_fee_amount > 0) {
      upfrontFeeDeducted = driver.upfront_fee_amount
      driverEarnings = Math.max(0, driverEarnings - upfrontFeeDeducted)

      await supabase.from("drivers").update({ upfront_fee_paid: true }).eq("id", driverId)
    }

    const { error: driverUpdateError } = await supabase
      .from("drivers")
      .update({
        total_rides: driver.total_rides + 1,
        earnings_pi: driver.earnings_pi + driverEarnings,
      })
      .eq("id", driverId)

    if (driverUpdateError) {
      console.error("[v0] Failed to update driver stats:", driverUpdateError)
    }

    // Send receipt to rider
    if (ride.rider_email) {
      await sendEmail({
        to: ride.rider_email,
        subject: "Pi Ride Receipt - Trip Completed",
        html: `
          <h2>Trip Receipt</h2>
          <p>Thank you for riding with Pi Ride!</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Trip Details</h3>
            <p><strong>Date:</strong> ${new Date(ride.created_at).toLocaleString()}</p>
            <p><strong>Driver:</strong> ${driver.full_name}</p>
            <p><strong>From:</strong> ${ride.pickup_location.address}</p>
            <p><strong>To:</strong> ${ride.dropoff_location.address}</p>
            ${ride.distance_km ? `<p><strong>Distance:</strong> ${ride.distance_km.toFixed(1)} km</p>` : ""}
            ${ride.duration_minutes ? `<p><strong>Duration:</strong> ${ride.duration_minutes} minutes</p>` : ""}
          </div>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Payment Summary</h3>
            <p><strong>Total Paid:</strong> ${ride.price_pi}π</p>
            <p><strong>Transaction ID:</strong> ${ride.pi_payment_id}</p>
          </div>

          <p>How was your ride? Rate your driver and earn rewards for completing trips!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #7C3AED; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Rate Your Ride
          </a>
        `,
      })
    }

    await sendEmail({
      to: driver.email,
      subject: "Pi Ride Earnings - Trip Completed",
      html: `
        <h2>Trip Completed</h2>
        <p>Great job completing another ride!</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Earnings Summary</h3>
          <p><strong>Trip Earnings:</strong> ${(ride.price_pi * (1 - commissionRate)).toFixed(2)}π (${((1 - commissionRate) * 100).toFixed(0)}%)</p>
          <p><strong>Platform Fee:</strong> ${platformFee.toFixed(2)}π (${(commissionRate * 100).toFixed(0)}%)</p>
          ${
            upfrontFeeDeducted > 0
              ? `
            <p style="color: #d97706;"><strong>Upfront Fee Deducted:</strong> -${upfrontFeeDeducted.toFixed(2)}π</p>
            <p style="color: #059669;"><em>Upfront fee paid! Future rides will have no deductions.</em></p>
          `
              : ""
          }
          <p><strong>Net Earnings:</strong> ${driverEarnings.toFixed(2)}π</p>
          <p><strong>Total Trip Value:</strong> ${ride.price_pi}π</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Trip Details</h3>
          <p><strong>From:</strong> ${ride.pickup_location.address}</p>
          <p><strong>To:</strong> ${ride.dropoff_location.address}</p>
          ${ride.distance_km ? `<p><strong>Distance:</strong> ${ride.distance_km.toFixed(1)} km</p>` : ""}
          ${ride.duration_minutes ? `<p><strong>Duration:</strong> ${ride.duration_minutes} minutes</p>` : ""}
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Stats</h3>
          <p><strong>Total Trips:</strong> ${driver.total_rides + 1}</p>
          <p><strong>Total Earnings:</strong> ${(driver.earnings_pi + driverEarnings).toFixed(2)}π</p>
          <p><strong>Rating:</strong> ${driver.rating.toFixed(1)} ⭐</p>
        </div>

        <p>Keep up the great work! Your next ride request is just around the corner.</p>
      `,
    })

    return NextResponse.json({
      success: true,
      driverEarnings,
      upfrontFeeDeducted,
      totalRides: driver.total_rides + 1,
      totalEarnings: driver.earnings_pi + driverEarnings,
    })
  } catch (error: any) {
    console.error("[v0] Ride completion error:", error)
    return NextResponse.json({ error: error.message || "Failed to complete ride" }, { status: 500 })
  }
}
