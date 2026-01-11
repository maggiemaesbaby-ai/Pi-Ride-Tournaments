import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email-service"
import { validateVehicleYear } from "@/lib/vehicle-restrictions"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      fullName,
      phone,
      email,
      city,
      country,
      state,
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleColor,
      licensePlate,
      driversLicense,
      serviceCities,
      piUserId,
      selectedFeePackage,
      commission,
      upfrontFeeOwed,
    } = body

    if (vehicleYear) {
      const yearNum = Number.parseInt(vehicleYear)
      const validation = validateVehicleYear(yearNum, country, state, city)

      if (!validation.isValid) {
        console.error("[v0] Vehicle year validation failed:", validation.message)
        return NextResponse.json({ error: validation.message }, { status: 400 })
      }
    }

    const supabase = await createClient()

    const { data: application, error: appError } = await supabase
      .from("driver_applications")
      .insert({
        pi_user_id: piUserId,
        email,
        full_name: fullName,
        phone,
        service_cities: serviceCities || [city],
        vehicle_info: {
          make: vehicleMake,
          model: vehicleModel,
          year: vehicleYear,
          color: vehicleColor,
          plate: licensePlate,
          type: vehicleType,
        },
        drivers_license: driversLicense,
        status: "pending",
        metadata: {
          selectedFeePackage: selectedFeePackage || "no-upfront",
          commission: commission || 0.05,
          upfrontFeeOwed: upfrontFeeOwed || 0,
        },
      })
      .select()
      .single()

    if (appError) {
      console.error("[v0] Failed to create driver application:", appError)
      throw new Error("Failed to submit application")
    }

    console.log("[v0] Driver application created:", application.id)

    await sendEmail({
      to: email,
      subject: "Pi Ride Driver Application Received",
      html: `
        <h2>Thank you for applying to drive with Pi Ride!</h2>
        <p>Hi ${fullName},</p>
        <p>We've received your driver application and will review it within 24-48 hours.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Application Summary</h3>
          <p><strong>Cities:</strong> ${serviceCities?.join(", ") || city}</p>
          <p><strong>Vehicle:</strong> ${vehicleYear} ${vehicleMake} ${vehicleModel}</p>
          ${
            selectedFeePackage === "upfront"
              ? `
            <p><strong>Fee Package:</strong> Upfront Plan (${commission * 100}% commission)</p>
            <p><strong>Signup Fee:</strong> ${upfrontFeeOwed}π (deducted from first ride)</p>
          `
              : `
            <p><strong>Fee Package:</strong> No Upfront Fee (${commission * 100}% commission per ride)</p>
          `
          }
        </div>

        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>We'll verify your information and vehicle details</li>
          <li>You'll receive an approval email with your driver dashboard access</li>
          <li>Complete your profile setup and start accepting rides!</li>
        </ol>

        <p>Questions? Reply to this email or visit our help center.</p>
      `,
    })

    if (process.env.PARTNER_APPLICATIONS_EMAIL) {
      await sendEmail({
        to: process.env.PARTNER_APPLICATIONS_EMAIL,
        subject: `New Driver Application - ${city}`,
        html: `
          <h2>New Driver Application Received</h2>
          <p><strong>Applicant:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Cities:</strong> ${serviceCities?.join(", ") || city}</p>
          <p><strong>Vehicle:</strong> ${vehicleYear} ${vehicleMake} ${vehicleModel} (${vehicleType})</p>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Fee Package Selected</h3>
            ${
              selectedFeePackage === "upfront"
                ? `
              <p><strong>Plan:</strong> Upfront Fee Package</p>
              <p><strong>Commission:</strong> ${commission * 100}%</p>
              <p><strong>Upfront Fee:</strong> ${upfrontFeeOwed}π (to be deducted from first ride)</p>
            `
                : `
              <p><strong>Plan:</strong> No Upfront Fee Package</p>
              <p><strong>Commission:</strong> ${commission * 100}%</p>
              <p><strong>Upfront Fee:</strong> None</p>
            `
            }
          </div>

          <p><strong>Application ID:</strong> ${application.id}</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/drivers" style="display: inline-block; padding: 10px 20px; background-color: #7C3AED; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Review Application
          </a>
        `,
      })
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      status: "pending",
    })
  } catch (error: any) {
    console.error("[v0] Driver application error:", error)
    return NextResponse.json({ error: error.message || "Failed to submit application" }, { status: 500 })
  }
}
