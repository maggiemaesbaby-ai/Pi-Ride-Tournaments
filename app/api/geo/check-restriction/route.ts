import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function POST(request: NextRequest) {
  try {
    const location = await request.json()

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
      },
    })

    console.log("[GEO API] Checking restriction for:", location)

    // Check if country is restricted
    const { data: countryRestriction } = await supabase
      .from("geo_restrictions")
      .select("*")
      .eq("restriction_type", "country")
      .eq("code", location.countryCode)
      .single()

    if (countryRestriction) {
      console.log("[GEO API] Country restricted:", countryRestriction)
      return NextResponse.json({
        isRestricted: countryRestriction.blocked_for_paid,
        allowFreePlay: countryRestriction.allow_free_play,
        restrictionReason: `Paid tournaments are not available in ${location.country}`,
        location,
      })
    }

    // Check if US state is restricted (only if in US)
    if (location.countryCode === "US" && location.stateCode) {
      const { data: stateRestriction } = await supabase
        .from("geo_restrictions")
        .select("*")
        .eq("restriction_type", "state")
        .eq("code", location.stateCode)
        .single()

      if (stateRestriction) {
        console.log("[GEO API] State restricted:", stateRestriction)
        return NextResponse.json({
          isRestricted: stateRestriction.blocked_for_paid,
          allowFreePlay: stateRestriction.allow_free_play,
          restrictionReason: `Paid tournaments are not available in ${location.state}`,
          location,
        })
      }
    }

    console.log("[GEO API] Location not restricted")
    return NextResponse.json({
      isRestricted: false,
      allowFreePlay: true,
      location,
    })
  } catch (error) {
    console.error("[GEO API] Error:", error)
    return NextResponse.json(
      {
        isRestricted: true,
        allowFreePlay: true,
        restrictionReason: "Unable to verify location",
        location: { country: "Unknown", countryCode: "XX" },
      },
      { status: 500 },
    )
  }
}
