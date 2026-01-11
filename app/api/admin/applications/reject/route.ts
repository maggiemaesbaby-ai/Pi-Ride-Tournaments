import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { applicationId } = body

    const supabase = await createClient()

    // Get application details
    const { data: application, error: appError } = await supabase
      .from("driver_applications")
      .select("*")
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      throw new Error("Application not found")
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("driver_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (updateError) {
      console.error("[v0] Failed to update application:", updateError)
      throw new Error("Failed to reject application")
    }

    // Send rejection email
    await sendEmail({
      to: application.email,
      subject: "Pi Ride Driver Application Update",
      html: `
        <h2>Driver Application Status Update</h2>
        <p>Hi ${application.full_name},</p>
        <p>Thank you for your interest in driving with Pi Ride.</p>
        <p>After reviewing your application, we're unable to approve it at this time.</p>
        <p>This could be due to:</p>
        <ul>
          <li>Service area availability</li>
          <li>Vehicle requirements</li>
          <li>Documentation needs</li>
        </ul>
        <p>You're welcome to reapply in the future. If you have questions, please reply to this email.</p>
        <p>Thank you for your understanding.</p>
      `,
    })

    return NextResponse.json({
      success: true,
      message: "Application rejected and notification sent",
    })
  } catch (error: any) {
    console.error("[v0] Application rejection error:", error)
    return NextResponse.json({ error: error.message || "Failed to reject application" }, { status: 500 })
  }
}
