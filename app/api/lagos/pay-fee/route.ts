import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Handle Lagos driver fee payments
export async function POST(req: NextRequest) {
  try {
    const { piUserId, feeType, amount, paymentId } = await req.json()

    if (!piUserId || !feeType || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get drive pot
    const { data: drivePot } = await supabase
      .from("drive_pot_wallet")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single()

    if (!drivePot) {
      return NextResponse.json({ error: "Drive pot not found" }, { status: 500 })
    }

    const updateData: any = {}
    let transactionType = ""
    let description = ""

    switch (feeType) {
      case "app_signup":
        updateData.app_signup_fee_paid = true
        transactionType = "signup_fee"
        description = "$150 app signup fee"

        // Update drive pot
        await supabase
          .from("drive_pot_wallet")
          .update({
            total_balance: Number(drivePot.total_balance) + Number(amount),
            total_signup_fees_collected: Number(drivePot.total_signup_fees_collected) + Number(amount),
            updated_at: new Date().toISOString(),
          })
          .eq("id", "00000000-0000-0000-0000-000000000001")
        break

      case "yearly_license":
        updateData.yearly_license_fee_paid = true
        updateData.license_anniversary_date = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          .toISOString()
          .split("T")[0]
        transactionType = "yearly_fee"
        description = "$30 yearly license fee"

        // Update drive pot
        await supabase
          .from("drive_pot_wallet")
          .update({
            total_balance: Number(drivePot.total_balance) + Number(amount),
            total_yearly_fees_collected: Number(drivePot.total_yearly_fees_collected) + Number(amount),
            updated_at: new Date().toISOString(),
          })
          .eq("id", "00000000-0000-0000-0000-000000000001")
        break

      default:
        return NextResponse.json({ error: "Invalid fee type" }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    // Update driver waitlist record
    const { data: driver, error: driverError } = await supabase
      .from("lagos_driver_waitlist")
      .update(updateData)
      .eq("pi_user_id", piUserId)
      .select()
      .single()

    if (driverError) {
      console.error("[Lagos Fee Payment] Error updating driver:", driverError)
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
    }

    // Log transaction
    await supabase.from("drive_pot_transactions").insert({
      transaction_type: transactionType,
      amount: Number(amount),
      driver_pi_user_id: piUserId,
      description,
      balance_before: drivePot.total_balance,
      balance_after: Number(drivePot.total_balance) + Number(amount),
      locked_before: drivePot.locked_balance,
      locked_after: drivePot.locked_balance,
      metadata: { payment_id: paymentId, fee_type: feeType },
    })

    console.log(`[Lagos Fee Payment] ${piUserId} paid ${feeType}: ${amount}π`)

    return NextResponse.json({
      success: true,
      message: `Payment of ${amount}π received for ${description}`,
      driver,
    })
  } catch (error: any) {
    console.error("[Lagos Fee Payment] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET fee status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const piUserId = searchParams.get("piUserId")

    if (!piUserId) {
      return NextResponse.json({ error: "Missing piUserId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: driver } = await supabase
      .from("lagos_driver_waitlist")
      .select("app_signup_fee_paid, yearly_license_fee_paid, license_anniversary_date, fee_package_choice")
      .eq("pi_user_id", piUserId)
      .single()

    if (!driver) {
      return NextResponse.json({ error: "Driver not found on waitlist" }, { status: 404 })
    }

    // Check if yearly fee is due
    const isYearlyFeeDue = driver.license_anniversary_date && new Date(driver.license_anniversary_date) <= new Date()

    return NextResponse.json({
      appSignupFeePaid: driver.app_signup_fee_paid,
      yearlyLicenseFeePaid: driver.yearly_license_fee_paid,
      licenseAnniversaryDate: driver.license_anniversary_date,
      feePackageChoice: driver.fee_package_choice,
      isYearlyFeeDue,
    })
  } catch (error: any) {
    console.error("[Lagos Fee Status] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
