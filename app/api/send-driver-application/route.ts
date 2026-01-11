import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const applicationData = await request.json()

    console.log("[v0] Driver application received:", applicationData)

    if (applicationData.username && applicationData.fullName) {
      const walletName = applicationData.username.toLowerCase().trim()
      const applicationName = applicationData.fullName.toLowerCase().trim()

      // Check if names match (case-insensitive, allowing for slight variations)
      const namesMatch = walletName.includes(applicationName) || applicationName.includes(walletName)

      if (!namesMatch) {
        console.warn("[v0] Name mismatch detected:", { walletName, applicationName })

        // Send alert email to administrator
        const adminEmail = process.env.PARTNER_APPLICATIONS_EMAIL
        if (adminEmail) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Pi Ride <noreply@piride.app>",
                to: adminEmail,
                subject: "⚠️ Driver Application - Name Mismatch Alert",
                html: `
                  <h2>Name Verification Failed</h2>
                  <p><strong>Application Name:</strong> ${applicationData.fullName}</p>
                  <p><strong>Pi Wallet Username:</strong> ${applicationData.username}</p>
                  <p><strong>User ID:</strong> ${applicationData.userId}</p>
                  <p><strong>Email:</strong> ${applicationData.email}</p>
                  <p><strong>Phone:</strong> ${applicationData.phone}</p>
                  <p><strong>City:</strong> ${applicationData.city}</p>
                  <hr>
                  <p style="color: red;"><strong>Action Required:</strong> Please investigate this application for potential fraud or identity mismatch.</p>
                `,
              }),
            })
            console.log("[v0] Admin alert email sent for name mismatch")
          } catch (emailError) {
            console.error("[v0] Failed to send admin alert email:", emailError)
          }
        }
      }
    }

    const adminEmail = process.env.PARTNER_APPLICATIONS_EMAIL
    if (adminEmail) {
      try {
        const isFreeSignup = applicationData.freeSignup || applicationData.signupFee?.includes("FREE")
        const packageInfo = applicationData.selectedFeePackage
          ? `<p><strong>Fee Package:</strong> ${applicationData.selectedFeePackage === "upfront" ? "Upfront Plan (3% commission)" : "No Upfront Plan (5% commission)"}</p>`
          : ""

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Pi Ride <noreply@piride.app>",
            to: adminEmail,
            subject: `🚗 New Driver Application - ${applicationData.fullName}`,
            html: `
              <h2>New Driver Application Received</h2>
              ${isFreeSignup ? '<p style="color: green; font-weight: bold;">✓ FREE PROMOTIONAL SIGNUP</p>' : ""}
              
              <h3>Personal Information</h3>
              <p><strong>Name:</strong> ${applicationData.fullName}</p>
              <p><strong>Email:</strong> ${applicationData.email}</p>
              <p><strong>Phone:</strong> ${applicationData.phone}</p>
              <p><strong>Pi Username:</strong> ${applicationData.username || "N/A"}</p>
              <p><strong>User ID:</strong> ${applicationData.userId || "N/A"}</p>
              
              <h3>Location</h3>
              <p><strong>City:</strong> ${applicationData.city}</p>
              ${applicationData.country ? `<p><strong>Country:</strong> ${applicationData.country}</p>` : ""}
              ${applicationData.state ? `<p><strong>State:</strong> ${applicationData.state}</p>` : ""}
              
              <h3>Vehicle Information</h3>
              <p><strong>Type:</strong> ${applicationData.vehicleType || "N/A"}</p>
              <p><strong>Make/Model:</strong> ${applicationData.vehicleMake} ${applicationData.vehicleModel}</p>
              <p><strong>Year:</strong> ${applicationData.vehicleYear || "N/A"}</p>
              <p><strong>License Plate:</strong> ${applicationData.licensePlate || "N/A"}</p>
              
              <h3>Services</h3>
              <p>${applicationData.services?.join(", ") || "None selected"}</p>
              
              <h3>Fee Information</h3>
              ${packageInfo}
              <p><strong>Signup Fee:</strong> ${applicationData.signupFee}</p>
              ${applicationData.promoCode ? `<p><strong>Promo Code:</strong> ${applicationData.promoCode}</p>` : ""}
              
              <p><strong>Application Time:</strong> ${new Date(applicationData.timestamp).toLocaleString()}</p>
            `,
          }),
        })
        console.log("[v0] Driver application email sent to admin")
      } catch (emailError) {
        console.error("[v0] Failed to send admin email:", emailError)
      }
    }

    // Store application in localStorage (simulating database)
    // In production, this would save to a real database
    console.log("[v0] Driver application processed successfully")

    return NextResponse.json({
      success: true,
      message: "Application received successfully",
    })
  } catch (error) {
    console.error("[v0] Error processing driver application:", error)
    return NextResponse.json({ success: false, error: "Failed to process application" }, { status: 500 })
  }
}
