"use client"

import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PiVolatilityDisclaimerProps {
  variant?: "default" | "compact" | "inline"
  className?: string
}

export function PiVolatilityDisclaimer({ variant = "default", className = "" }: PiVolatilityDisclaimerProps) {
  if (variant === "inline") {
    return (
      <p className={`text-xs text-muted-foreground ${className}`}>
        * Pi prices are converted from USD using current market rates. Actual Pi amount may vary due to price
        volatility.
      </p>
    )
  }

  if (variant === "compact") {
    return (
      <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-xs text-amber-800">
          <strong>Price Volatility Notice:</strong> Pi cryptocurrency prices fluctuate. USD amounts shown are estimates
          based on current exchange rates and may change at time of payment.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-sm text-amber-800">
        <strong>Important: Pi Price Volatility Notice</strong>
        <p className="mt-2">
          Pi cryptocurrency is subject to market volatility. The USD equivalent values shown are estimates based on
          current exchange rates at the time of display. The actual Pi amount required or received may differ at the
          time of transaction due to price fluctuations.
        </p>
        <p className="mt-2">
          By proceeding with this transaction, you acknowledge and accept that cryptocurrency values can change rapidly,
          and you agree to the Pi amount shown regardless of future price changes.
        </p>
      </AlertDescription>
    </Alert>
  )
}
