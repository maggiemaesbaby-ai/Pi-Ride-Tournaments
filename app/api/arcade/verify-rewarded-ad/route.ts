import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { adId } = await request.json()

    if (!adId) {
      return NextResponse.json({ rewarded: false, error: "No ad ID provided" }, { status: 400 })
    }

    // Verify the rewarded ad status with Pi Platform API
    const piApiKey = process.env.PI_API_KEY

    if (!piApiKey) {
      console.error("[v0] PI_API_KEY not configured")
      return NextResponse.json({ rewarded: false, error: "Server configuration error" }, { status: 500 })
    }

    const verifyResponse = await fetch(`https://api.minepi.com/v2/ads/rewarded/${adId}`, {
      method: "GET",
      headers: {
        Authorization: `Key ${piApiKey}`,
      },
    })

    if (!verifyResponse.ok) {
      return NextResponse.json({ rewarded: false, error: "Failed to verify ad" }, { status: 500 })
    }

    const verifyData = await verifyResponse.json()

    // Check if the ad was actually rewarded
    if (verifyData.mediator_ack_status === "granted") {
      // Grant the reward (customize based on your app's logic)
      const reward = "1 Free Tournament Entry"

      return NextResponse.json({
        rewarded: true,
        reward,
      })
    }

    return NextResponse.json({ rewarded: false, error: "Ad not verified as rewarded" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error verifying rewarded ad:", error)
    return NextResponse.json({ rewarded: false, error: "Internal server error" }, { status: 500 })
  }
}
