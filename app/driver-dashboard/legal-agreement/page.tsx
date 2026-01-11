"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { Shield, AlertTriangle, FileText, CheckCircle2 } from "lucide-react"

export default function DriverLegalAgreementPage() {
  const [hasRead, setHasRead] = useState(false)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const { user, isConnected, connect } = usePiWallet()
  const { toast } = useToast()
  const router = useRouter()

  const handleAcceptAgreement = async () => {
    if (!user || !isConnected) {
      toast({
        title: "Connect Your Pi Wallet",
        description: "Please connect your Pi Wallet to accept the agreement",
        variant: "destructive",
      })
      return
    }

    if (!agreementAccepted || !hasRead) {
      toast({
        title: "Please Review Agreement",
        description: "You must read and accept the agreement to continue",
        variant: "destructive",
      })
      return
    }

    setIsAccepting(true)

    try {
      const response = await fetch("/api/driver-application/accept-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          piUserId: user?.uid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept agreement")
      }

      toast({
        title: "Agreement Accepted! 🎉",
        description: "Welcome to Pi Ride! You can now access your driver dashboard.",
      })

      router.push("/driver-dashboard")
    } catch (error: any) {
      console.error("[v0] Agreement acceptance error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to accept agreement",
        variant: "destructive",
      })
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        {!isConnected || !user ? (
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Connect Your Pi Wallet</CardTitle>
              <CardDescription>Please connect your Pi Wallet to review and accept the driver agreement</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Button
                onClick={connect}
                size="lg"
                className="bg-gradient-to-r from-[#6B4DE6] to-[#8B5CF6] hover:opacity-90"
              >
                Connect Pi Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Pi Ride Driver Agreement</CardTitle>
              <CardDescription>
                Please review and accept the following terms before accessing your driver dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agreement Content */}
              <div className="bg-muted/50 rounded-lg p-6 max-h-[400px] overflow-y-auto space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Independent Contractor Agreement
                  </h3>
                  <p className="text-muted-foreground">
                    By accepting this agreement, you acknowledge and agree to the following terms and conditions:
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">1. Independent Contractor Status</h4>
                    <p className="text-muted-foreground">
                      You are an independent contractor, not an employee of Pi Ride. You maintain complete control over
                      when, where, and how often you provide driver services through the Pi Ride platform.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">2. Vehicle and Insurance Requirements</h4>
                    <p className="text-muted-foreground">
                      You represent that you own or have legal right to operate the vehicle(s) used for Pi Ride
                      services, and maintain valid insurance coverage, registration, and all required licenses and
                      permits as required by local law.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">3. Service Standards</h4>
                    <p className="text-muted-foreground">
                      You agree to provide safe, professional, and courteous transportation services. You will maintain
                      your vehicle in good working condition, follow all traffic laws, and treat passengers with
                      respect.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">4. Payment and Fees</h4>
                    <p className="text-muted-foreground">
                      Pi Ride charges a platform fee (commission) based on your selected payment plan. You understand
                      and accept the fee structure you selected during registration. All payments are processed through
                      the Pi Network blockchain.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">5. Liability and Risk</h4>
                    <p className="text-muted-foreground">
                      <strong>IMPORTANT:</strong> You acknowledge that providing transportation services involves
                      inherent risks. You assume all liability and responsibility for:
                    </p>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>Vehicle accidents, damage, or mechanical failures</li>
                      <li>Personal injury to yourself, passengers, or third parties</li>
                      <li>Property damage during service</li>
                      <li>Lost or stolen items</li>
                      <li>Any other incidents occurring during rides</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Limitation of Liability</h4>
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm mt-1">
                          <strong>Pi Ride (the platform) accepts NO responsibility or liability</strong> for any
                          accidents, injuries, damages, losses, or claims arising from your use of the platform or
                          provision of driver services. Pi Ride is a technology platform that connects drivers and
                          passengers. We do not provide transportation services directly and are not liable for the
                          actions or omissions of drivers or passengers using the platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold">6. Indemnification</h4>
                    <p className="text-muted-foreground">
                      You agree to indemnify and hold harmless Pi Ride, its officers, directors, employees, and agents
                      from any claims, damages, liabilities, costs, or expenses (including legal fees) arising from your
                      use of the platform or provision of driver services.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">7. Compliance with Laws</h4>
                    <p className="text-muted-foreground">
                      You agree to comply with all applicable federal, state, and local laws, regulations, and
                      ordinances relating to transportation services, including but not limited to licensing
                      requirements, insurance requirements, and vehicle safety standards.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">8. Termination</h4>
                    <p className="text-muted-foreground">
                      Either party may terminate this agreement at any time. Pi Ride reserves the right to deactivate
                      your driver account for violations of platform policies, safety concerns, or poor service ratings.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">9. Dispute Resolution</h4>
                    <p className="text-muted-foreground">
                      Any disputes arising from this agreement shall be resolved through binding arbitration in
                      accordance with the rules of the American Arbitration Association.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold">10. Entire Agreement</h4>
                    <p className="text-muted-foreground">
                      This agreement constitutes the entire agreement between you and Pi Ride regarding your use of the
                      platform as a driver and supersedes all prior agreements and understandings.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Confirmation Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="hasRead"
                    checked={hasRead}
                    onCheckedChange={(checked) => setHasRead(checked as boolean)}
                  />
                  <label htmlFor="hasRead" className="text-sm cursor-pointer leading-relaxed">
                    I have read and understand the entire Driver Agreement above, including the sections regarding
                    liability, risk, and indemnification.
                  </label>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="agreementAccepted"
                    checked={agreementAccepted}
                    onCheckedChange={(checked) => setAgreementAccepted(checked as boolean)}
                  />
                  <label htmlFor="agreementAccepted" className="text-sm cursor-pointer leading-relaxed">
                    <strong>I accept this agreement</strong> and acknowledge that I am an independent contractor
                    responsible for my own vehicle, insurance, and liability. I understand that Pi Ride accepts no
                    responsibility for incidents that occur during my provision of driver services.
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleAcceptAgreement}
                  disabled={!hasRead || !agreementAccepted || isAccepting}
                  className="flex-1"
                  size="lg"
                >
                  {isAccepting ? (
                    "Processing..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Accept Agreement & Continue
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => router.push("/")} disabled={isAccepting} size="lg">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
