import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Join Lagos driver waitlist
export async function POST(req: NextRequest) {
  try {
    const {
      piUserId,
      email,
      fullName,
      phone,
      dateOfBirth,
      vehicleInfo,
      locationLagosAdjacent,
      hasHackneyPermit,
      hasLasdriCert,
      hasInsurancePolicy,
      hasVisCertificate,
      passBackgroundCheck,
    } = await req.json()

    console.log("[v0] Lagos API received:", { piUserId, email, fullName, phone, dateOfBirth, vehicleInfo })

    if (!piUserId || !email || !fullName || !dateOfBirth) {
      console.log("[v0] Lagos API missing fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / 31557600000)

    if (age < 21) {
      console.log("[v0] Lagos API age check failed:", age)
      return NextResponse.json({ error: "You must be at least 21 years old to apply as a driver" }, { status: 400 })
    }

    const insertData = {
      pi_user_id: piUserId,
      email,
      full_name: fullName,
      phone,
      date_of_birth: dateOfBirth,
      vehicles: vehicleInfo ? [vehicleInfo] : [],
      license_anniversary_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split("T")[0],
      location_lagos_adjacent: locationLagosAdjacent || false,
      has_hackney_permit: hasHackneyPermit || false,
      has_lasdri_cert: hasLasdriCert || false,
      has_insurance_policy: hasInsurancePolicy || false,
      has_vis_certificate: hasVisCertificate || false,
      pass_background_check: passBackgroundCheck || false,
    }

    console.log("[v0] Inserting into lagos_driver_waitlist:", insertData)

    const { data, error } = await supabase.from("lagos_driver_waitlist").insert(insertData).select().single()

    if (error) {
      if (error.code === "23505") {
        // Duplicate
        console.log("[v0] Lagos API duplicate entry")
        return NextResponse.json({ error: "You are already on the Lagos waitlist" }, { status: 400 })
      }
      console.error("[v0] Lagos Waitlist Supabase Error:", error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    console.log(`[v0] Lagos Waitlist Driver ${piUserId} joined waitlist successfully`)

    return NextResponse.json({
      success: true,
      message: "Successfully joined Lagos driver waitlist!",
      data,
    })
  } catch (error: any) {
    console.error("[v0] Lagos Waitlist Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Join Lagos rider waitlist
export async function PUT(req: NextRequest) {
  try {
    const { piUserId, email } = await req.json()

    if (!piUserId) {
      return NextResponse.json({ error: "Missing piUserId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("lagos_rider_waitlist")
      .insert({
        pi_user_id: piUserId,
        email,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already on rider waitlist" }, { status: 400 })
      }
      console.error("[Lagos Rider Waitlist] Error:", error)
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined Lagos rider waitlist!",
      data,
    })
  } catch (error: any) {
    console.error("[Lagos Rider Waitlist] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET waitlist status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const piUserId = searchParams.get("piUserId")
    const type = searchParams.get("type") || "driver" // driver or rider

    if (!piUserId) {
      return NextResponse.json({ error: "Missing piUserId" }, { status: 400 })
    }

    const supabase = await createClient()

    if (type === "driver") {
      const { data, error } = await supabase
        .from("lagos_driver_waitlist")
        .select("*")
        .eq("pi_user_id", piUserId)
        .single()

      if (error && error.code !== "PGRST116") {
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
      }

      return NextResponse.json({ onWaitlist: !!data, data: data || null })
    } else {
      const { data, error } = await supabase
        .from("lagos_rider_waitlist")
        .select("*")
        .eq("pi_user_id", piUserId)
        .single()

      if (error && error.code !== "PGRST116") {
        return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
      }

      return NextResponse.json({ onWaitlist: !!data, data: data || null })
    }
  } catch (error: any) {
    console.error("[Lagos Waitlist Status] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
