import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const filter = searchParams.get("filter") || "recent"

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    let query = supabase.from("rides").select("*").eq("user_id", userId).order("created_at", { ascending: false })

    if (filter === "recent") {
      query = query.limit(5)
    } else if (filter === "month") {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      query = query.gte("created_at", oneMonthAgo.toISOString())
    }

    const { data: rides, error } = await query

    if (error) throw error

    return NextResponse.json({
      rides: rides.map((ride) => ({
        id: ride.id,
        pickup: ride.pickup_address,
        destination: ride.destination_address,
        price: ride.price,
        status: ride.status,
        createdAt: ride.created_at,
        rideType: ride.ride_type,
        rating: ride.rating,
      })),
    })
  } catch (error) {
    console.error("[v0] Ride history error:", error)
    return NextResponse.json({ error: "Failed to fetch ride history" }, { status: 500 })
  }
}
