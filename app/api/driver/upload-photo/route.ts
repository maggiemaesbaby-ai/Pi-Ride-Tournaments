import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { piUserId, photoBase64 } = body

    if (!piUserId || !photoBase64) {
      return NextResponse.json({ error: "Pi User ID and photo required" }, { status: 400 })
    }

    // Validate base64 image
    if (!photoBase64.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get driver
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, full_name")
      .eq("pi_user_id", piUserId)
      .single()

    if (driverError || !driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    // Update driver photo
    const { error: updateError } = await supabase
      .from("drivers")
      .update({ photo_url: photoBase64 })
      .eq("pi_user_id", piUserId)

    if (updateError) {
      console.error("[v0] Failed to update driver photo:", updateError)
      return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 })
    }

    console.log(`[v0] Driver ${driver.full_name} photo uploaded successfully`)

    return NextResponse.json({
      success: true,
      message: "Photo uploaded successfully",
      photoUrl: photoBase64,
    })
  } catch (error: any) {
    console.error("[v0] Driver photo upload error:", error)
    return NextResponse.json({ error: error.message || "Failed to upload photo" }, { status: 500 })
  }
}
