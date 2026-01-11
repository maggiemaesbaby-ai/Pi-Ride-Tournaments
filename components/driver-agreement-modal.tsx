"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DriverAgreementModalProps {
  isOpen: boolean
  driverName: string
  onAccept: () => void
}

export function DriverAgreementModal({ isOpen, driverName, onAccept }: DriverAgreementModalProps) {
  const [hasRead, setHasRead] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)

  const handleAccept = async () => {
    if (!hasRead || !hasAccepted) return

    setIsAccepting(true)
    try {
      await onAccept()
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Welcome to Pi Ride, {driverName}!</DialogTitle>
          <DialogDescription className="text-base">
            You've been approved as a Pi Ride driver. Please review and accept the Driver Agreement below to activate
            your account.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-bold text-base mb-2">1. Independent Contractor Status</h3>
              <p>
                You are an independent contractor, not an employee of Pi Ride. You maintain complete control over when,
                where, and how often you provide driver services.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">2. Vehicle and Insurance Requirements</h3>
              <p>
                You represent that you own or have legal right to operate the vehicle(s), and maintain valid insurance
                coverage, registration, and all required licenses.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">3. Service Standards</h3>
              <p>
                You agree to provide safe, professional, and courteous transportation services. Maintain your vehicle in
                good working condition and follow all traffic laws.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">4. Payment and Fees</h3>
              <p>
                Pi Ride charges a platform fee (commission) based on your selected payment plan. All payments are
                processed through the Pi Network blockchain.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">5. Liability and Risk</h3>
              <p className="font-semibold mb-2">IMPORTANT: You assume all liability and responsibility for:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Vehicle accidents, damage, or mechanical failures</li>
                <li>Personal injury to yourself, passengers, or third parties</li>
                <li>Property damage during service</li>
                <li>Lost or stolen items</li>
                <li>Any other incidents occurring during rides</li>
              </ul>
            </section>

            <section className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="font-bold text-base mb-2 text-red-700 dark:text-red-400">⚠️ Limitation of Liability</h3>
              <p className="font-semibold">
                Pi Ride (the platform) accepts NO responsibility or liability for any accidents, injuries, damages,
                losses, or claims arising from your use of the platform or provision of driver services. Pi Ride is a
                technology platform that connects drivers and passengers. We do not provide transportation services
                directly and are not liable for the actions or omissions of drivers or passengers.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">6. Indemnification</h3>
              <p>
                You agree to indemnify and hold harmless Pi Ride from any claims, damages, liabilities, costs, or
                expenses arising from your provision of driver services.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">7. Compliance with Laws</h3>
              <p>
                You agree to comply with all applicable laws, regulations, and ordinances relating to transportation
                services.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">8. Termination</h3>
              <p>
                Either party may terminate at any time. Pi Ride reserves the right to deactivate your account for
                violations or safety concerns.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">9. Dispute Resolution</h3>
              <p>Disputes shall be resolved through binding arbitration.</p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">10. Entire Agreement</h3>
              <p>This constitutes the entire agreement between you and Pi Ride.</p>
            </section>
          </div>
        </ScrollArea>

        <div className="space-y-3 mt-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="read" checked={hasRead} onCheckedChange={(checked) => setHasRead(checked === true)} />
            <label
              htmlFor="read"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and understand the entire Driver Agreement, including sections regarding liability, risk, and
              indemnification.
            </label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="accept"
              checked={hasAccepted}
              onCheckedChange={(checked) => setHasAccepted(checked === true)}
            />
            <label
              htmlFor="accept"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <strong>I accept this agreement</strong> and acknowledge I am an independent contractor responsible for my
              own vehicle, insurance, and liability. I understand Pi Ride accepts no responsibility for incidents during
              my provision of driver services.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAccept} disabled={!hasRead || !hasAccepted || isAccepting} className="w-full">
            {isAccepting ? "Activating Account..." : "Accept Agreement & Activate Driver Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
