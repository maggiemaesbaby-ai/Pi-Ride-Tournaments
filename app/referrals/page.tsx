import { Header } from "@/components/header"
import { ReferralStats } from "@/components/referrals/referral-stats"
import { ReferralCode } from "@/components/referrals/referral-code"
import { ReferralList } from "@/components/referrals/referral-list"

export default function ReferralsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Referral Program</h1>
        <div className="space-y-6">
          <ReferralStats />
          <ReferralCode />
          <ReferralList />
        </div>
      </main>
    </div>
  )
}
