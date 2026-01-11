interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    // Using a simple email API - you can replace this with SendGrid, Resend, etc.
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: options.from || "Pi Ride <noreply@piride.app>",
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Email send failed:", error)
      throw new Error("Failed to send email")
    }

    console.log(`[v0] Email sent successfully to ${options.to}`)
  } catch (error) {
    console.error("[v0] Email service error:", error)
    // Don't throw - email failures shouldn't break the ride flow
  }
}
