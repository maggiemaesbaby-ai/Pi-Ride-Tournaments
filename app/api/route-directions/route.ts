import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { waypoints } = await req.json()

    if (!waypoints || waypoints.length < 2) {
      return NextResponse.json({ error: "At least 2 waypoints required" }, { status: 400 })
    }

    // Use Nominatim/OpenRouteService for free routing (no API key needed)
    const coordinates = waypoints.map((wp: { lat: number; lng: number }) => `${wp.lng},${wp.lat}`).join(";")

    // OpenRouteService free tier for routing
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`,
      {
        headers: {
          "User-Agent": "PiRide/1.0",
        },
      },
    )

    if (!response.ok) {
      throw new Error("Routing API failed")
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: "No route found" }, { status: 404 })
    }

    const route = data.routes[0]
    const coordinates_route = route.geometry.coordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }))

    // Extract turn-by-turn instructions
    const instructions = route.legs.flatMap((leg: any) =>
      leg.steps.map((step: any) => ({
        instruction: step.maneuver.instruction || "Continue",
        distance: step.distance,
        duration: step.duration,
        location: {
          lat: step.maneuver.location[1],
          lng: step.maneuver.location[0],
        },
      })),
    )

    return NextResponse.json({
      success: true,
      route: coordinates_route,
      distance: route.distance, // in meters
      duration: route.duration, // in seconds
      instructions,
    })
  } catch (error) {
    console.error("Route directions error:", error)
    return NextResponse.json({ error: "Failed to get route directions" }, { status: 500 })
  }
}
