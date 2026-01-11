import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { applicationId, reviewedBy } = body

    console.log("[v0] Approving driver application:", applicationId)

    const supabase = await createClient()

    const { data: application, error: appError } = await supabase
      .from("driver_applications")
      .select("*")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      console.error("[v0] Application not found:", appError)
      throw new Error("Application not found")
    }

    console.log("[v0] Application found:", application.full_name)

    const metadata = application.metadata || {}
    const commissionTier = metadata.selectedFeePackage || "standard"
    const upfrontFeeAmount = metadata.upfrontFeeOwed || 0
    const commissionRate = commissionTier === "upfront" ? 0.03 : 0.05

    console.log("[v0] Fee package:", commissionTier, "Upfront:", upfrontFeeAmount, "Commission:", commissionRate)

    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .insert({
        pi_user_id: application.pi_user_id,
        email: application.email,
        full_name: application.full_name,
        phone: application.phone,
        service_cities: application.service_cities,
        vehicle_info: application.vehicle_info,
        is_on_duty: false,
        application_status: "approved",
      })
      .select()
      .single()

    if (driverError) {
      console.error("[v0] Failed to create driver account:", driverError)
      console.error("[v0] Error details:", JSON.stringify(driverError, null, 2))
      throw new Error(`Failed to create driver account: ${driverError.message}`)
    }

    console.log("[v0] Driver account created:", driver.id)

    const { error: updateError } = await supabase
      .from("driver_applications")
      .update({
        status: "approved",
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("[v0] Failed to update application:", updateError)
    }

    console.log("[v0] Sending approval email to:", driver.email)

    await sendEmail({
      to: driver.email,
      subject: "Welcome to Pi Ride - You're Approved!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">Congratulations ${driver.full_name}!</h2>
          <p>Your Pi Ride driver application has been approved. You're now part of the Pi Ride driver network!</p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #059669;">Your Driver Account Details</h3>
            <p><strong>Service Cities:</strong> ${driver.service_cities.join(", ")}</p>
            <p><strong>Vehicle:</strong> ${driver.vehicle_info.year} ${driver.vehicle_info.make} ${driver.vehicle_info.model}</p>
            <p><strong>Commission Rate:</strong> ${(commissionRate * 100).toFixed(0)}% platform fee</p>
            <p><strong>Your Earnings:</strong> You keep ${((1 - commissionRate) * 100).toFixed(0)}% of every ride!</p>
            ${
              commissionTier === "upfront"
                ? `<p style="color: #dc2626;"><strong>Upfront Fee:</strong> ${upfrontFeeAmount}π will be deducted from your first completed ride</p>`
                : `<p style="color: #059669;"><strong>No Upfront Fee:</strong> Standard ${(commissionRate * 100).toFixed(0)}% commission applies</p>`
            }
          </div>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2563eb;">How to Use Your Driver Dashboard</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li><strong>Log in:</strong> Access your driver dashboard using your Pi credentials</li>
              <li><strong>Accept Legal Agreement:</strong> Review and accept the driver agreement</li>
              <li><strong>Toggle "On Duty":</strong> Go online to start receiving ride requests</li>
              <li><strong>Accept Rides:</strong> You'll see incoming ride requests with pickup/dropoff details</li>
              <li><strong>Complete Rides:</strong> Navigate to pickup, complete the ride, and earn Pi!</li>
              <li><strong>Track Earnings:</strong> View your earnings and ride history in the dashboard</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://pi-ride-tournaments.vercel.app"}/driver-dashboard/legal-agreement" 
               style="display: inline-block; padding: 15px 30px; background-color: #7C3AED; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Accept Agreement & Start Driving
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">Questions? Contact our driver support team or check the help section in your dashboard.</p>
        </div>
      `,
    })

    console.log("[v0] Email sent successfully")

    for (const city of application.service_cities) {
      await notifyWaitlistedUsers(city)
    }

    return NextResponse.json({
      success: true,
      driverId: driver.id,
      message: "Driver approved successfully",
    })
  } catch (error: any) {
    console.error("[v0] Driver approval error:", error)
    return NextResponse.json({ error: error.message || "Failed to approve driver" }, { status: 500 })
  }
}

async function notifyWaitlistedUsers(city: string) {
  const supabase = await createClient()

  const { data: waitlistedUsers, error } = await supabase
    .from("driver_waitlist")
    .select("*")
    .eq("city", city)
    .eq("notified", false)

  if (error || !waitlistedUsers || waitlistedUsers.length === 0) {
    console.log(`[v0] No waitlisted users in ${city}`)
    return
  }

  console.log(`[v0] Notifying ${waitlistedUsers.length} waitlisted users in ${city}`)

  const notificationPromises = waitlistedUsers.map(async (user) => {
    try {
      await sendEmail({
        to: user.email,
        subject: `Great News! Pi Ride drivers are now in ${city}`,
        html: `
          <h2>Pi Ride is now available in ${city}!</h2>
          <p>Great news! Drivers have started servicing your area.</p>
          <p>You can now book rides with Pi cryptocurrency and enjoy lower fees than traditional ride-sharing apps.</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Why Pi Ride?</h3>
            <ul style="margin: 0;">
              <li>Pay with Pi cryptocurrency</li>
              <li>Only 3% platform fee (vs 30% on Uber/Lyft)</li>
              <li>Support local drivers earning more</li>
              <li>Transparent pricing, no surge fees</li>
            </ul>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL}?utm_source=waitlist&utm_medium=email&utm_campaign=${city}" style="display: inline-block; padding: 10px 20px; background-color: #7C3AED; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Book Your First Ride
          </a>

          <p style="margin-top: 20px;">Download the Pi Ride app and start riding today!</p>
        `,
      })

      await supabase.from("driver_waitlist").update({ notified: true }).eq("id", user.id)

      return { userId: user.id, success: true }
    } catch (error) {
      console.error(`[v0] Failed to notify user ${user.id}:`, error)
      return { userId: user.id, success: false }
    }
  })

  await Promise.all(notificationPromises)
}
