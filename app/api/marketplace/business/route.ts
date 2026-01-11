import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get("businessId")

    if (businessId) {
      // Get specific business settings
      const { data, error } = await supabase
        .from("marketplace_business_settings")
        .select("*")
        .eq("business_id", businessId)
        .single()

      if (error) {
        console.error("[v0] Error fetching business settings:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ business: data })
    }

    // Get all businesses
    const { data, error } = await supabase
      .from("marketplace_business_settings")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching businesses:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ businesses: data || [] })
  } catch (error: any) {
    console.error("[v0] Error in GET /api/marketplace/business:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const businessData = await request.json()

    console.log("[v0] Creating/updating marketplace business settings:", businessData.business_id)

    const { data, error } = await supabase
      .from("marketplace_business_settings")
      .upsert(
        {
          business_id: businessData.business_id,
          business_name: businessData.business_name,
          description: businessData.description,
          logo_url: businessData.logo_url,
          banner_url: businessData.banner_url,
          category: businessData.category,
          address: businessData.address,
          city: businessData.city,
          state: businessData.state,
          country: businessData.country,
          phone: businessData.phone,
          email: businessData.email,
          website: businessData.website,
          social_links: businessData.social_links,
          business_hours: businessData.business_hours,
          accepts_returns: businessData.accepts_returns,
          return_policy: businessData.return_policy,
          shipping_policy: businessData.shipping_policy,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" },
      )
      .select()
      .single()

    if (error) {
      console.error("[v0] Error upserting business settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Business settings saved successfully")
    return NextResponse.json({ business: data })
  } catch (error: any) {
    console.error("[v0] Error in POST /api/marketplace/business:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient()

    const updateData = await request.json()
    const businessId = updateData.business_id

    if (!businessId) {
      return NextResponse.json({ error: "Business ID required" }, { status: 400 })
    }

    console.log("[v0] Updating marketplace business settings:", businessId)

    const { data, error } = await supabase
      .from("marketplace_business_settings")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", businessId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating business settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ business: data })
  } catch (error: any) {
    console.error("[v0] Error in PUT /api/marketplace/business:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
