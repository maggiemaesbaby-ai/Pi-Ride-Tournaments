import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const driver_id = searchParams.get("driver_id")

  if (!driver_id) {
    return NextResponse.json({ success: false, error: "Missing driver_id" }, { status: 400 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  try {
    // Get driver's internal ID from pi_user_id
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("pi_user_id", driver_id)
      .single()

    if (driverError) throw driverError

    // Get earnings balance
    const { data: wallet, error: walletError } = await supabase
      .from("driver_earnings_wallet")
      .select("balance_pi")
      .eq("driver_id", driver.id)
      .single()

    if (walletError && walletError.code !== "PGRST116") throw walletError

    return NextResponse.json({
      success: true,
      balance: wallet?.balance_pi || 0,
    })
  } catch (error: any) {
    console.error("Error fetching driver earnings:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
