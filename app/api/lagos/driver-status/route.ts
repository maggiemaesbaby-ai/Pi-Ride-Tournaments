import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const pi_user_id = searchParams.get("pi_user_id")

  if (!pi_user_id) {
    return NextResponse.json({ success: false, error: "Missing pi_user_id" }, { status: 400 })
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  try {
    const { data: driver, error } = await supabase
      .from("lagos_driver_waitlist")
      .select("*")
      .eq("pi_user_id", pi_user_id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ success: true, driver: null })
      }
      throw error
    }

    return NextResponse.json({ success: true, driver })
  } catch (error: any) {
    console.error("Error fetching Lagos driver status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
