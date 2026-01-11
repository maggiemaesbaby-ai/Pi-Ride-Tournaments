import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get driver info
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("rating, total_rides")
      .eq("id", driverId)
      .single()

    if (driverError || !driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    // Get rewards data
    const { data: rewards, error: rewardsError } = await supabase
      .from("driver_rewards")
      .select("*")
      .eq("driver_id", driverId)
      .single()

    if (rewardsError && rewardsError.code !== "PGRST116") {
      console.error("[v0] Rewards fetch error:", rewardsError)
    }

    const rewardsData = rewards || {
      rides_completed: driver.total_rides || 0,
      commission_free_rides_remaining: 0,
      last_reward_milestone: 0,
      eligible_for_rewards: driver.rating >= 4.5,
    }

    // Calculate progress to next reward
    const ridesCompleted = rewardsData.rides_completed
    const nextMilestone = Math.ceil(ridesCompleted / 20) * 20
    const ridesToNextReward = nextMilestone - ridesCompleted

    return NextResponse.json({
      success: true,
      rewards: {
        eligibleForRewards: driver.rating >= 4.5,
        currentRating: driver.rating,
        ridesCompleted,
        commissionFreeRidesRemaining: rewardsData.commission_free_rides_remaining,
        ridesToNextReward,
        nextMilestone,
        lastRewardMilestone: rewardsData.last_reward_milestone,
      },
    })
  } catch (error: any) {
    console.error("[v0] Rewards API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch rewards" }, { status: 500 })
  }
}
