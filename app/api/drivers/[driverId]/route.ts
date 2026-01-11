import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: { driverId: string } }) {
  try {
    const { driverId } = params

    const supabase = await createClient()

    const { data: driver, error } = await supabase.from("drivers").select("*").eq("id", driverId).single()

    if (error || !driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.full_name,
        email: driver.email,
        phone: driver.phone,
        vehicle: {
          make: driver.vehicle_make,
          model: driver.vehicle_model,
          year: driver.vehicle_year,
          color: driver.vehicle_color,
          plate: driver.license_plate,
        },
        rating: 4.9, // TODO: Calculate from actual ratings
        totalRides: 0, // TODO: Get from rides table
      },
    })
  } catch (error: any) {
    console.error("[v0] Driver fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch driver" }, { status: 500 })
  }
}
