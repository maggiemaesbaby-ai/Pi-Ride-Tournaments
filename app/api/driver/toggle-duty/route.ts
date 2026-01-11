import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { piUserId, isOnDuty } = body

    if (!piUserId) {
      return NextResponse.json({ error: "Pi User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current driver data
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("*")
      .eq("pi_user_id", piUserId)
      .single()

    if (driverError || !driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    if (isOnDuty && !driver.photo_url) {
      return NextResponse.json(
        {
          error: "Photo required",
          message:
            "Please upload your profile photo before going on duty. This helps riders verify your identity for safety.",
        },
        { status: 400 },
      )
    }

    if (isOnDuty && !driver.vehicle_photo_url) {
      return NextResponse.json(
        {
          error: "Vehicle photo required",
          message:
            "Please upload your vehicle photo before going on duty. This helps riders identify your vehicle for safety.",
        },
        { status: 400 },
      )
    }

    const isFirstTimeOnDuty = !driver.first_duty_at && isOnDuty

    // Update driver duty status
    const updateData: any = { is_on_duty: isOnDuty }

    if (isFirstTimeOnDuty) {
      updateData.first_duty_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase.from("drivers").update(updateData).eq("pi_user_id", piUserId)

    if (updateError) {
      console.error("[v0] Failed to update driver duty status:", updateError)
      return NextResponse.json({ error: "Failed to update duty status" }, { status: 500 })
    }

    console.log(`[v0] Driver ${driver.full_name} duty status: ${isOnDuty ? "ON" : "OFF"}`)

    if (isOnDuty && driver.current_location) {
      console.log(`[v0] Driver going on duty - checking for waitlisted users within service radius`)
      await notifyWaitlistedUsersInRadius(driver, supabase)
    }

    return NextResponse.json({
      success: true,
      isOnDuty,
      isFirstTimeOnDuty,
      message: isFirstTimeOnDuty
        ? "You're now on duty! Waitlisted users in your area have been notified."
        : `Duty status updated to ${isOnDuty ? "ON" : "OFF"}`,
    })
  } catch (error: any) {
    console.error("[v0] Toggle duty error:", error)
    return NextResponse.json({ error: error.message || "Failed to toggle duty status" }, { status: 500 })
  }
}

async function notifyWaitlistedUsersInRadius(driver: any, supabase: any) {
  try {
    const driverLat = driver.current_location?.lat
    const driverLng = driver.current_location?.lng
    const serviceRadius = driver.service_radius || 10 // Default 10km

    if (!driverLat || !driverLng) {
      console.log("[v0] Driver location not available, skipping radius matching")
      return
    }

    // Get all unnotified waitlisted users
    const { data: waitlistedUsers, error } = await supabase.from("driver_waitlist").select("*").eq("notified", false)

    if (error || !waitlistedUsers || waitlistedUsers.length === 0) {
      console.log("[v0] No waitlisted users to notify")
      return
    }

    console.log(`[v0] Checking ${waitlistedUsers.length} waitlisted users against driver radius of ${serviceRadius}km`)

    // Filter users within driver's service radius
    const matchedUsers = waitlistedUsers.filter((user) => {
      if (!user.pickup_location?.lat || !user.pickup_location?.lng) {
        // Fallback to city matching for users without coordinates
        return driver.service_cities?.includes(user.city)
      }

      // Calculate distance using Haversine formula
      const distance = calculateDistance(driverLat, driverLng, user.pickup_location.lat, user.pickup_location.lng)

      return distance <= serviceRadius
    })

    console.log(`[v0] Found ${matchedUsers.length} users within service radius`)

    // Send notifications to matched users
    const notificationPromises = matchedUsers.map(async (user) => {
      try {
        await sendEmail({
          to: user.email,
          subject: `🚗 Drivers Now Available in Your Area!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7C3AED;">Great News! Drivers Are Now in Your Area</h2>
              <p>Hi there,</p>
              <p>You're receiving this email because you joined our waitlist for ride services in ${user.city}.</p>
              <p><strong>Good news!</strong> ${driver.full_name} and other drivers are now accepting rides near your requested pickup location.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Saved Ride Request:</h3>
                <p style="margin: 5px 0;"><strong>📍 Pickup:</strong> ${user.pickup_address || user.city}</p>
                ${user.dropoff_address ? `<p style="margin: 5px 0;"><strong>🎯 Destination:</strong> ${user.dropoff_address}</p>` : ""}
                <p style="margin: 5px 0;"><strong>🚗 Service:</strong> ${user.service_type || "Economy"}</p>
              </div>

              <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #7C3AED;">Why Choose Pi Ride?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>💰 Pay with Pi cryptocurrency</li>
                  <li>✨ Only 3% platform fee (vs 30% on competitors)</li>
                  <li>🤝 Support local drivers earning more</li>
                  <li>🔒 Transparent pricing, no surge fees</li>
                </ul>
              </div>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}?utm_source=waitlist&utm_medium=email&utm_campaign=driver_available&city=${encodeURIComponent(user.city)}" 
                 style="display: inline-block; padding: 15px 30px; background-color: #7C3AED; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold;">
                Book Your Ride Now
              </a>

              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                This notification was sent because you signed up for driver availability updates. 
                You won't receive more waitlist notifications for this area.
              </p>
            </div>
          `,
        })

        // Mark user as notified
        await supabase.from("driver_waitlist").update({ notified: true }).eq("id", user.id)

        console.log(`[v0] Notified waitlist user: ${user.email}`)
        return { userId: user.id, success: true }
      } catch (error) {
        console.error(`[v0] Failed to notify user ${user.id}:`, error)
        return { userId: user.id, success: false }
      }
    })

    await Promise.all(notificationPromises)
  } catch (error) {
    console.error("[v0] Error in notifyWaitlistedUsersInRadius:", error)
  }
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
