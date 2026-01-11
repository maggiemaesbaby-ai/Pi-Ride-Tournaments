import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const applicationData = await request.json()

    console.log("[v0] Business application API received data:", applicationData)

    if (!applicationData.piUserId) {
      return NextResponse.json({ error: "Pi User ID is required. Please connect your Pi wallet." }, { status: 400 })
    }

    const supabase = await createClient()

    const businessId = `business_${applicationData.piUserId}_${Date.now()}`

    const { data: businessRecord, error: businessError } = await supabase
      .from("marketplace_business_settings")
      .insert({
        business_id: businessId,
        user_id: applicationData.piUserId,
        business_name: applicationData.businessName,
        category: applicationData.category,
        description: applicationData.description,
        phone: applicationData.phone,
        email: applicationData.email,
        website: applicationData.website || null,
        fee_structure: applicationData.feeStructure,
        status: "pending_approval",
        pi_username: applicationData.piUsername,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (businessError) {
      console.error("[v0] Failed to create business record:", businessError)
      return NextResponse.json(
        { error: "Failed to create business record", details: businessError.message },
        { status: 500 },
      )
    }

    console.log("[v0] Business record created successfully:", businessRecord.business_id)

    const { error: balanceError } = await supabase.from("seller_balances").insert({
      seller_id: applicationData.piUserId,
      business_id: businessId,
      available_balance: 0,
      pending_balance: 0,
      total_earnings: 0,
      total_withdrawn: 0,
      last_updated: new Date().toISOString(),
    })

    if (balanceError) {
      console.log("[v0] Seller balance initialization note:", balanceError.message)
    }

    const adminEmail = process.env.PARTNER_APPLICATIONS_EMAIL

    if (adminEmail && process.env.RESEND_API_KEY) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Pi Ride <noreply@piride.app>",
            to: adminEmail,
            subject: `🏪 New Business Application - ${applicationData.businessName}`,
            html: `
              <h2>New Business Application Received</h2>
              
              <h3>Business Information</h3>
              <p><strong>Business ID:</strong> ${businessId}</p>
              <p><strong>Business Name:</strong> ${applicationData.businessName}</p>
              <p><strong>Category:</strong> ${applicationData.category}</p>
              <p><strong>Contact Email:</strong> ${applicationData.email}</p>
              <p><strong>Phone:</strong> ${applicationData.phone}</p>
              <p><strong>Website:</strong> ${applicationData.website || "N/A"}</p>
              
              <h3>Pi Wallet Information</h3>
              <p><strong>Pi User ID:</strong> ${applicationData.piUserId}</p>
              <p><strong>Pi Username:</strong> ${applicationData.piUsername || "N/A"}</p>
              <p><strong>Fee Structure:</strong> ${applicationData.feeStructure === "upfront" ? "Upfront Fee ($150, 3% commission)" : "No Upfront ($0 setup, 5% commission)"}</p>
              
              <h3>Business Description</h3>
              <p>${applicationData.description}</p>
              
              <p><strong>Application Time:</strong> ${applicationData.timestamp}</p>
              <p><strong>Status:</strong> Pending Approval</p>
              
              <p><em>Business record has been created in database and awaiting admin approval.</em></p>
            `,
          }),
        })

        const emailResult = await emailResponse.json()
        console.log("[v0] Email API response:", emailResult)
      } catch (emailError) {
        console.error("[v0] Failed to send admin email:", emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Application received successfully",
      businessId: businessRecord.business_id,
    })
  } catch (error: any) {
    console.error("[v0] Business application API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process application",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
