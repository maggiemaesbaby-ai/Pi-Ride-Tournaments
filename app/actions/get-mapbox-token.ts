"use server"

export async function getMapboxToken() {
  try {
    const token = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

    if (!token) {
      console.error("[v0] Server: MAPBOX_TOKEN environment variable is not set!")
      console.error(
        "[v0] Server: Available env vars:",
        Object.keys(process.env).filter((key) => key.includes("MAPBOX")),
      )
    } else {
      console.log("[v0] Server: Mapbox token found, length:", token.length)
    }

    return token
  } catch (error) {
    console.error("[v0] Server: Error getting Mapbox token:", error)
    return ""
  }
}
