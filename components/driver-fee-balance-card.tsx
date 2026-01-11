"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { driverDB } from "@/lib/driver-db"
import { usePiUser } from "@/hooks/use-pi-user"

export function DriverFeeBalanceCard() {
  const { user } = usePiUser()
  const [feeBalance, setFeeBalance] = useState<any>(null)

  useEffect(() => {
    if (!user?.username) return

    const driver = driverDB.getDriverByPiUsername(user.username)
    if (!driver) return

    const balance = driverDB.getDriverFeeBalance(driver.id)
    setFeeBalance(balance)
  }, [user])

  if (!feeBalance) return null

  // Don't show card if no-upfront plan or already paid off
  if (feeBalance.feePackage === "no-upfront" || feeBalance.isPaidOff) {
    return null
  }

  const progressPercent = (feeBalance.upfrontFeePaid / feeBalance.upfrontFeeOwed) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upfront Fee Balance</CardTitle>
        <CardDescription>
          Your {feeBalance.upfrontFeeOwed}π upfront fee will be deducted from your ride earnings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Paid</span>
            <span className="font-semibold">
              {feeBalance.upfrontFeePaid.toFixed(3)}π / {feeBalance.upfrontFeeOwed}π
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining Balance</span>
            <span className="font-semibold text-orange-600">{feeBalance.remainingBalance.toFixed(3)}π</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commission Rate</span>
            <span className="font-semibold">{feeBalance.commission}%</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          After each ride, your earnings (minus {feeBalance.commission}% commission) will be used to pay off this
          balance. Once paid, you'll start receiving full payments.
        </p>
      </CardContent>
    </Card>
  )
}
