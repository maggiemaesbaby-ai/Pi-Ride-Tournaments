import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get("businessId")
    const id = searchParams.get("id")

    if (id) {
      const { data, error } = await supabase.from("marketplace_products").select("*").eq("id", id).single()

      if (error) {
        console.error("[v0] Error fetching product:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ product: data })
    }

    let query = supabase
      .from("marketplace_products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (businessId) {
      query = query.eq("business_id", businessId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products: data || [] })
  } catch (error: any) {
    console.error("[v0] Error in GET /api/marketplace/products:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const productData = await request.json()

    console.log("[v0] ========== CREATING MARKETPLACE PRODUCT ==========")
    console.log("[v0] Product title:", productData.title)
    console.log("[v0] Product price:", productData.price)
    console.log("[v0] Product has 3D photos:", productData.has_3d, Object.keys(productData.photos3D || {}))
    console.log("[v0] Business ID:", productData.business_id)
    console.log("[v0] Business name:", productData.business_name)

    const productId = `mp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log("[v0] Generated product ID:", productId)

    const insertData = {
      id: productId,
      business_id: productData.business_id,
      business_name: productData.business_name,
      title: productData.title,
      description: productData.description,
      price: productData.price,
      price_usd: productData.price_usd || 0,
      category: productData.category,
      images: productData.images || [],
      photos_3d: productData.photos3D || null,
      has_3d: productData.has_3d || false,
      color_variants: productData.colorVariants || null,
      keywords: productData.keywords || [],
      location: productData.location,
      city: productData.city || "",
      state: productData.state || "",
      country: productData.country,
      shipping_regions: productData.shippingRegions || [],
      accepts_offers: productData.acceptsOffers || false,
      offer_range: productData.offerRange || null,
      stock: productData.stock || 1,
      condition: productData.condition,
      shipping: productData.shipping || { available: false, cost: 0, estimatedDays: "3-5", service: "owner-delivery" },
      status: "active",
    }

    console.log("[v0] Insert data prepared")
    console.log("[v0] Shipping data:", insertData.shipping)

    const { data, error } = await supabase.from("marketplace_products").insert(insertData).select().single()

    if (error) {
      console.error("[v0] ❌ Supabase error creating product:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      console.error("[v0] ❌ No data returned from insert")
      return NextResponse.json({ error: "Product created but no data returned" }, { status: 500 })
    }

    console.log("[v0] ✓ Product inserted into database:", data.id)

    await new Promise((resolve) => setTimeout(resolve, 500))

    // Verify product exists and is active
    const { data: verifyData, error: verifyError } = await supabase
      .from("marketplace_products")
      .select("id, title, business_id, status")
      .eq("id", data.id)
      .single()

    if (verifyError || !verifyData) {
      console.error("[v0] ❌ Product verification failed:", verifyError)
      return NextResponse.json({ error: "Product may not have been saved properly" }, { status: 500 })
    }

    console.log("[v0] ✓ Product verified in database:", {
      id: verifyData.id,
      title: verifyData.title,
      status: verifyData.status,
      businessId: verifyData.business_id,
    })
    console.log("[v0] ========== PRODUCT CREATION COMPLETE ==========")

    return NextResponse.json({ product: data })
  } catch (error: any) {
    console.error("[v0] ❌ Error in POST /api/marketplace/products:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createServerClient()

    const updateData = await request.json()
    const productId = updateData.id

    console.log("[v0] Updating marketplace product:", productId)
    console.log(
      "[v0] 3D images being updated:",
      updateData.photos3D ? Object.keys(updateData.photos3D).filter((k) => updateData.photos3D[k]).length : 0,
    )

    const allowedFields = [
      "title",
      "description",
      "price",
      "price_usd",
      "category",
      "images",
      "photos_3d",
      "has_3d",
      "color_variants",
      "keywords",
      "location",
      "city",
      "state",
      "country",
      "shipping_regions",
      "accepts_offers",
      "offer_range",
      "stock",
      "condition",
      "brand",
      "weight_kg",
      "dimensions",
      "model_3d",
      "shipping",
      "pickup",
    ]

    const updates: any = {}
    for (const field of allowedFields) {
      if (field === "photos_3d" && "photos3D" in updateData) {
        updates[field] = updateData.photos3D
        console.log("[v0] Mapped photos3D to photos_3d for database")
      } else if (field in updateData) {
        updates[field] = updateData[field]
      }
    }

    console.log("[v0] Filtered update fields:", Object.keys(updates))

    const { data, error } = await supabase
      .from("marketplace_products")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating product:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Product updated successfully with 3D images")
    return NextResponse.json({ product: data })
  } catch (error: any) {
    console.error("[v0] Error in PUT /api/marketplace/products:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    console.log("[v0] Deleting marketplace product:", id)

    const { error } = await supabase.from("marketplace_products").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting product:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in DELETE /api/marketplace/products:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
