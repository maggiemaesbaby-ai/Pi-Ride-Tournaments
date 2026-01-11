import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      riderPiUserId,
      riderEmail,
      pickupLocation,
      dropoffLocation,
      rideType,
      pricePi,
      piPaymentId,
      distanceKm,
      durationMinutes,
      payment_id,
      driver_id,
      platform_fee,
      is_lagos,
      fee_breakdown,
    } = body

    const isTestRide =
      pickupLocation.address?.toUpperCase().includes("TEST") && dropoffLocation.address?.toUpperCase().includes("TEST")

    console.log("[v0] Test mode detected:", isTestRide)

    const supabase = await createClient()

    const finalPrice = isTestRide ? 0.001 : pricePi
    console.log("[v0] Final price:", finalPrice, "(Test mode:", isTestRide, ")")

    // Create the ride with Lagos fee info
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .insert({
        rider_pi_user_id: riderPiUserId,
        driver_id: driver_id,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        ride_type: rideType,
        price_pi: finalPrice, // Use overridden price for test rides
        pi_payment_id: payment_id,
        distance_km: distanceKm,
        duration_minutes: durationMinutes,
        platform_fee: platform_fee,
        status: "pending",
        is_test_ride: isTestRide, // Mark as test ride
      })
      .select()
      .single()

    if (rideError) {
      console.error("[v0] Failed to create ride:", rideError)
      throw new Error("Failed to create ride in database")
    }

    console.log("[v0] Ride created:", ride.id, isTestRide ? "(TEST MODE)" : "")

    const totalAmount = pricePi + platform_fee

    // Add to drive pot
    await supabase.rpc("add_to_drive_pot", {
      amount: totalAmount,
      transaction_type: "rider_payment",
      ride_id: ride.id,
      driver_id: driver_id,
      fee_breakdown: is_lagos ? fee_breakdown : null,
    })

    // Lock driver earnings until ride completion
    if (driver_id) {
      await supabase.rpc("lock_driver_earnings", {
        driver_id: driver_id,
        ride_id: ride.id,
        amount: pricePi,
      })
    }

    // Track fees in drive pot for Lagos
    if (is_lagos && fee_breakdown) {
      await supabase
        .from("drive_pot_wallet")
        .update({
          vat_collected_pi: supabase.raw(`vat_collected_pi + ${fee_breakdown.vat}`),
          ops_fees_collected_pi: supabase.raw(`ops_fees_collected_pi + ${fee_breakdown.ops}`),
          incentive_reserve_pi: supabase.raw(`incentive_reserve_pi + ${fee_breakdown.incentives}`),
        })
        .eq("id", "00000000-0000-0000-0000-000000000001")
    }

    const pickupCity = isTestRide
      ? extractCityFromCoordinates(pickupLocation.lat, pickupLocation.lng)
      : extractCityFromAddress(pickupLocation.address)

    if (isTestRide) {
      console.log("[v0] TEST MODE: Finding drivers within 5 miles of user location")

      // Find drivers within 5-mile radius using location services
      const { data: availableDrivers, error: driversError } = await supabase.rpc("find_nearby_drivers", {
        user_lat: pickupLocation.lat,
        user_lng: pickupLocation.lng,
        radius_miles: 5,
      })

      if (driversError) {
        console.error("[v0] Failed to find nearby drivers:", driversError)
        // Fallback to city-based matching
        const { data: cityDrivers } = await supabase.from("drivers").select("*").eq("is_on_duty", true).limit(10)

        return handleDriverResponse(
          cityDrivers || [],
          ride,
          pickupCity,
          pickupLocation,
          dropoffLocation,
          rideType,
          finalPrice,
          true,
        )
      }

      return handleDriverResponse(
        availableDrivers || [],
        ride,
        pickupCity,
        pickupLocation,
        dropoffLocation,
        rideType,
        finalPrice,
        true,
      )
    }

    // Normal flow for production rides
    const { data: availableDrivers, error: driversError } = await supabase
      .from("drivers")
      .select("*")
      .eq("is_on_duty", true)
      .contains("service_cities", [pickupCity])

    if (driversError) {
      console.error("[v0] Failed to query drivers:", driversError)
    }

    return handleDriverResponse(
      availableDrivers || [],
      ride,
      pickupCity,
      pickupLocation,
      dropoffLocation,
      rideType,
      finalPrice,
      false,
    )
  } catch (error: any) {
    console.error("[v0] Ride creation error:", error)
    return NextResponse.json({ error: error.message || "Failed to create ride request" }, { status: 500 })
  }
}

async function handleDriverResponse(
  availableDrivers: any[],
  ride: any,
  pickupCity: string,
  pickupLocation: any,
  dropoffLocation: any,
  rideType: string,
  pricePi: number,
  isTestMode: boolean,
) {
  const driversFound = availableDrivers?.length || 0
  const supabase = await createClient()

  if (driversFound === 0) {
    console.log(`[v0] No drivers available in ${pickupCity}${isTestMode ? " (TEST MODE)" : ""}`)

    if (!isTestMode) {
      // Only add to waitlist for real rides
      const { error: waitlistError } = await supabase.from("driver_waitlist").insert({
        pi_user_id: ride.rider_pi_user_id,
        email: ride.rider_email,
        city: pickupCity,
        location: {
          lat: pickupLocation.lat,
          lng: pickupLocation.lng,
        },
      })

      if (waitlistError && waitlistError.code !== "23505") {
        console.error("[v0] Failed to add to waitlist:", waitlistError)
      }
    }

    return NextResponse.json({
      success: true,
      rideId: ride.id,
      driversAvailable: false,
      city: pickupCity,
      message: isTestMode
        ? "TEST MODE: No drivers found within 5 miles"
        : "No drivers currently available in your area",
      isTestMode,
    })
  }

  console.log(`[v0] Found ${driversFound} available drivers in ${pickupCity}${isTestMode ? " (TEST MODE)" : ""}`)

  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/drivers/notify-available`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rideId: ride.id,
        pickupCity,
        pickupLocation,
        dropoffLocation,
        rideType,
        pricePi,
        isTestMode,
      }),
    })
  } catch (notifyError) {
    console.error("[v0] Failed to notify drivers:", notifyError)
  }

  return NextResponse.json({
    success: true,
    rideId: ride.id,
    driversAvailable: true,
    driversCount: driversFound,
    message: isTestMode
      ? `TEST MODE: ${driversFound} driver(s) found within 5 miles (0.001 Pi charge)`
      : `Finding a driver for you (${driversFound} available)`,
    isTestMode,
  })
}

function extractCityFromAddress(address: string): string {
  const parts = address.split(",").map((p) => p.trim())

  if (parts.length >= 2) {
    return parts[parts.length - 2].split(" ")[0]
  }

  return parts[0]
}

function extractCityFromCoordinates(lat: number, lng: number): string {
  // For test mode, return a generic identifier based on rounded coordinates
  // In production, this could call a reverse geocoding service
  return `TestArea_${Math.round(lat)}_${Math.round(lng)}`
}
