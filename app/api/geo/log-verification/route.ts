import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const { piUserId, verificationType, locationData, isRestricted, restrictionReason, attemptedAction } =
      await request.json()

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
      },
    })

    const { error } = await supabase.from("geo_verification_log").insert({
      pi_user_id: piUserId,
      verification_type: verificationType,
      location_data: locationData,
      is_restricted: isRestricted,
      restriction_reason: restrictionReason,
      attempted_action: attemptedAction,
    })

    if (error) {
      console.error("[GEO LOG] Failed to log verification:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GEO LOG] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to log verification" }, { status: 500 })
  }
}
