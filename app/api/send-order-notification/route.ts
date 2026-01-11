import { type NextRequest, NextResponse } from "next/server"

let resend: any = null

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured")
  }
  if (!resend) {
    const { Resend } = require("resend")
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function POST(request: NextRequest) {
  try {
    const { order, product, sellerEmail } = await request.json()

    if (!sellerEmail || !order || !product) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.log("[v0] Resend API key not configured - skipping email notification")
      return NextResponse.json({
        success: true,
        message: "Order created (email skipped - no API key)",
      })
    }

    const shippingInfo = order.shippingAddress
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You Made a Sale!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Congratulations! You have a new order to fulfill.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px;">Order Details</h2>
              <p style="margin: 8px 0;"><strong>Order ID:</strong> #${order.id.slice(-8)}</p>
              <p style="margin: 8px 0;"><strong>Product:</strong> ${product.title}</p>
              <p style="margin: 8px 0;"><strong>Amount:</strong> ${order.amount}π</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            </div>

            ${
              shippingInfo
                ? `
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0 0 12px 0; color: #111827;">Shipping Address:</h3>
              <p style="margin: 4px 0;"><strong>${shippingInfo.fullName}</strong></p>
              <p style="margin: 4px 0;">${shippingInfo.addressLine1}</p>
              ${shippingInfo.addressLine2 ? `<p style="margin: 4px 0;">${shippingInfo.addressLine2}</p>` : ""}
              <p style="margin: 4px 0;">${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}</p>
              <p style="margin: 4px 0;">${shippingInfo.country}</p>
              <p style="margin: 4px 0;"><strong>Phone:</strong> ${shippingInfo.phone}</p>
            </div>
            `
                : `<p><strong>Delivery Method:</strong> Local Pickup</p>`
            }

            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                <strong>⏰ Action Required:</strong> Please ship this item within the appropriate time frame to maintain your seller rating.
              </p>
            </div>

            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://piride.app"}/business-dashboard" 
                 style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                View in Dashboard
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>This is an automated notification from Pi Ride Marketplace</p>
              <p>Questions? Contact support at ${process.env.PARTNER_APPLICATIONS_EMAIL}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const resendClient = getResendClient()

    await resendClient.emails.send({
      from: "Pi Ride Marketplace <noreply@piride.app>",
      to: sellerEmail,
      subject: `🎉 New Order: ${product.title}`,
      html: emailHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Order notification error:", error)
    return NextResponse.json({
      success: true,
      message: "Order created (email failed)",
    })
  }
}
