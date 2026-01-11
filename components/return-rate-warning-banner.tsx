"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, AlertCircle } from "@/lib/icons"
import { Button } from "@/components/ui/button"

interface ReturnRateWarningProps {
  sellerId: string
}

export function ReturnRateWarningBanner({ sellerId }: ReturnRateWarningProps) {
  const [returnRate, setReturnRate] = useState<number>(0)
  const [totalSales, setTotalSales] = useState<number>(0)
  const [totalReturns, setTotalReturns] = useState<number>(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetchReturnRate()
    const interval = setInterval(fetchReturnRate, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [sellerId])

  const fetchReturnRate = async () => {
    try {
      const response = await fetch(`/api/marketplace/seller/return-rate?sellerId=${sellerId}`)
      const data = await response.json()

      if (data.success) {
        setReturnRate(data.returnRate || 0)
        setTotalSales(data.totalSales || 0)
        setTotalReturns(data.totalReturns || 0)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch return rate:", error)
    }
  }

  if (dismissed || returnRate < 10) {
    return null
  }

  const isCritical = returnRate >= 25
  const isWarning = returnRate >= 10 && returnRate < 25

  return (
    <Alert
      variant={isCritical ? "destructive" : "default"}
      className={`mb-6 ${isCritical ? "border-red-600 bg-red-50 dark:bg-red-950/20" : "border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20"}`}
    >
      {isCritical ? (
        <AlertTriangle className="h-5 w-5 text-red-600" />
      ) : (
        <AlertCircle className="h-5 w-5 text-yellow-600" />
      )}
      <AlertTitle className={isCritical ? "text-red-900 dark:text-red-200" : "text-yellow-900 dark:text-yellow-200"}>
        {isCritical ? "CRITICAL: High Return Rate Detected" : "Warning: Elevated Return Rate"}
      </AlertTitle>
      <AlertDescription
        className={isCritical ? "text-red-800 dark:text-red-300" : "text-yellow-800 dark:text-yellow-300"}
      >
        <p className="mb-2">
          Your return rate is currently <strong>{returnRate.toFixed(1)}%</strong> ({totalReturns} returns out of{" "}
          {totalSales} sales).
        </p>
        {isCritical ? (
          <p className="text-sm">
            <strong>Action Required:</strong> If this rate continues to increase, the selling of products will be
            limited to certain categories. Please review your product quality, descriptions, and shipping practices
            immediately.
          </p>
        ) : (
          <p className="text-sm">
            Please be aware of this trend and adjust your product listings, quality control, or descriptions as
            necessary to improve customer satisfaction.
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant={isCritical ? "destructive" : "outline"}
            onClick={() => {
              // Open help or quality improvement guide
              window.open("/help/improve-quality", "_blank")
            }}
          >
            Quality Improvement Tips
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
