import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(req: NextRequest) {
  try {
    const { businessId } = await req.json()

    if (!businessId) {
      return NextResponse.json({ error: "Business ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Mark business as deleted (soft delete) - keep sales/tax records
    const { error: businessError } = await supabase
      .from("businesses")
      .update({
        deleted_at: new Date().toISOString(),
        business_name: "[DELETED BUSINESS]",
        email: null,
        phone: null,
        approved: false,
      })
      .eq("pi_wallet_address", businessId)

    if (businessError) {
      console.error("[v0] Failed to delete business:", businessError)
      throw new Error("Failed to delete business account")
    }

    // Remove products from marketplace
    await supabase.from("products").update({ deleted_at: new Date().toISOString() }).eq("business_id", businessId)

    console.log("[v0] Business account deleted:", businessId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Delete business account error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete business account" }, { status: 500 })
  }
}
