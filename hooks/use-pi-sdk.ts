"use client"

import { useEffect, useState } from "react"
import { piSDK } from "@/lib/pi-sdk"

export function usePiSDK() {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const checkInitialization = () => {
      setIsInitialized(piSDK.isInitialized())
    }

    checkInitialization()

    // Check periodically for initialization
    const interval = setInterval(checkInitialization, 500)

    return () => clearInterval(interval)
  }, [])

  return {
    isInitialized: () => piSDK.isInitialized(),
    createPayment: (paymentData: any, callbacks: any) => piSDK.createPayment(paymentData, callbacks),
    authenticate: (scopes: string[], onIncompletePaymentFound: any) =>
      piSDK.authenticate(scopes, onIncompletePaymentFound),
  }
}
