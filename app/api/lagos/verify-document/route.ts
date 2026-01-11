import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Verify Lagos-specific documents
export async function POST(req: NextRequest) {
  try {
    const { piUserId, documentType, documentId, expiryDate } = await req.json()

    if (!piUserId || !documentType || !documentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // In production, this would call actual verification APIs
    // For now, we'll simulate verification
    const verificationResult = await simulateVerification(documentType, documentId)

    if (!verificationResult.valid) {
      return NextResponse.json({ error: `Verification failed: ${verificationResult.reason}` }, { status: 400 })
    }

    // Update the driver waitlist record
    const updateData: any = {}

    switch (documentType) {
      case "hackney_permit":
        updateData.hackney_permit = documentId
        updateData.hackney_verified = true
        break
      case "lasdri":
        updateData.lasdri_certification = documentId
        updateData.lasdri_verified = true
        updateData.lasdri_expiry = expiryDate
        break
      case "insurance":
        updateData.vehicle_insurance = documentId
        updateData.insurance_verified = true
        updateData.insurance_expiry = expiryDate
        break
      case "vis":
        updateData.vis_certificate = documentId
        updateData.vis_verified = true
        updateData.vis_expiry = expiryDate
        break
      case "background_check":
        updateData.background_check_id = documentId
        updateData.background_check_status = "verified"
        updateData.background_check_verified = true
        break
      default:
        return NextResponse.json({ error: "Invalid document type" }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("lagos_driver_waitlist")
      .update(updateData)
      .eq("pi_user_id", piUserId)
      .select()
      .single()

    if (error) {
      console.error("[Lagos Verify] Error updating verification:", error)
      return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 })
    }

    console.log(`[Lagos Verify] ${documentType} verified for driver ${piUserId}`)

    return NextResponse.json({
      success: true,
      verified: true,
      data,
    })
  } catch (error: any) {
    console.error("[Lagos Verify] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Simulate verification (replace with actual API calls in production)
async function simulateVerification(documentType: string, documentId: string) {
  // Basic validation
  if (!documentId || documentId.length < 5) {
    return { valid: false, reason: "Invalid document ID format" }
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In production, call actual verification APIs:
  // - Hackney Permit: Lagos State Government API
  // - LASDRI: Lagos State Driver Institute API
  // - Insurance: NAICOM (National Insurance Commission) API
  // - VIS: Lagos State Vehicle Inspection Service API
  // - Background Check: Third-party background check service

  return { valid: true, reason: "Verified successfully" }
}
