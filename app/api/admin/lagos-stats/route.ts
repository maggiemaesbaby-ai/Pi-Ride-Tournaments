import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Get Lagos rollout statistics
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get driver waitlist stats
    const { data: driverWaitlist } = await supabase.from("lagos_driver_waitlist").select("*")

    const driverStats = {
      total: driverWaitlist?.length || 0,
      profileCompleted: driverWaitlist?.filter((d) => d.profile_completed).length || 0,
      allVerified: driverWaitlist?.filter((d) => d.all_verifications_complete).length || 0,
      readyForActivation: driverWaitlist?.filter((d) => d.ready_for_activation).length || 0,
      activated: driverWaitlist?.filter((d) => d.activated).length || 0,
      appFeesPaid: driverWaitlist?.filter((d) => d.app_signup_fee_paid).length || 0,
      yearlyFeesPaid: driverWaitlist?.filter((d) => d.yearly_license_fee_paid).length || 0,
    }

    // Get rider waitlist stats
    const { count: riderCount } = await supabase
      .from("lagos_rider_waitlist")
      .select("*", { count: "exact", head: true })

    // Get drive pot stats
    const { data: drivePot } = await supabase
      .from("drive_pot_wallet")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single()

    // Get pending verifications
    const pendingVerifications = driverWaitlist?.filter(
      (d) =>
        !d.hackney_verified ||
        !d.lasdri_verified ||
        !d.insurance_verified ||
        !d.vis_verified ||
        !d.background_check_verified,
    ).length

    // Get expiring documents (30 days warning)
    const expiringDocs = driverWaitlist?.filter((d) => {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      return (
        (d.lasdri_expiry && new Date(d.lasdri_expiry) <= thirtyDaysFromNow) ||
        (d.insurance_expiry && new Date(d.insurance_expiry) <= thirtyDaysFromNow) ||
        (d.vis_expiry && new Date(d.vis_expiry) <= thirtyDaysFromNow) ||
        (d.license_anniversary_date && new Date(d.license_anniversary_date) <= thirtyDaysFromNow)
      )
    }).length

    return NextResponse.json({
      drivers: driverStats,
      riders: { total: riderCount || 0 },
      drivePot: {
        totalBalance: drivePot?.total_balance || 0,
        lockedBalance: drivePot?.locked_balance || 0,
        signupFeesCollected: drivePot?.total_signup_fees_collected || 0,
        yearlyFeesCollected: drivePot?.total_yearly_fees_collected || 0,
        commissionCollected: drivePot?.total_commission_collected || 0,
      },
      alerts: {
        pendingVerifications,
        expiringDocuments: expiringDocs,
      },
    })
  } catch (error: any) {
    console.error("[Lagos Stats] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
