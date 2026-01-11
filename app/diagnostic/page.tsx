"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function DiagnosticPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [piSDKStatus, setPiSDKStatus] = useState<string>("checking...")

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    addLog("Diagnostic page loaded")
    addLog(`Environment: ${typeof window !== "undefined" ? "Browser" : "Server"}`)
    addLog(`Hostname: ${typeof window !== "undefined" ? window.location.hostname : "N/A"}`)

    // Check Pi SDK
    if (typeof window !== "undefined" && window.Pi) {
      addLog("Pi SDK detected")
      setPiSDKStatus("Available")
    } else {
      addLog("Pi SDK NOT detected")
      setPiSDKStatus("Not Available")
    }
  }, [])

  const testPayment = async () => {
    addLog("Testing payment...")
    try {
      if (typeof window === "undefined") {
        addLog("ERROR: Window not available")
        return
      }

      if (!window.Pi) {
        addLog("ERROR: Pi SDK not loaded")
        return
      }

      addLog("Creating test payment...")

      const payment = window.Pi.createPayment(
        {
          amount: 1,
          memo: "Test payment",
          metadata: { test: true },
        },
        {
          onReadyForServerApproval: (paymentId) => {
            addLog(`onReadyForServerApproval: ${paymentId}`)
          },
          onReadyForServerCompletion: (paymentId, txid) => {
            addLog(`onReadyForServerCompletion: ${paymentId}, ${txid}`)
          },
          onCancel: (paymentId) => {
            addLog(`onCancel: ${paymentId}`)
          },
          onError: (error, payment) => {
            addLog(`onError: ${JSON.stringify(error)}`)
          },
        },
      )

      addLog("Payment created successfully")
      addLog(`Payment object: ${JSON.stringify(payment)}`)
    } catch (error: any) {
      addLog(`CATCH ERROR: ${error.message}`)
      addLog(`Stack: ${error.stack}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Pi Ride App Diagnostics</h1>

        <div className="mb-6 p-4 border rounded-lg">
          <p className="font-semibold">
            Pi SDK Status:{" "}
            <span className={piSDKStatus === "Available" ? "text-green-500" : "text-red-500"}>{piSDKStatus}</span>
          </p>
        </div>

        <Button onClick={testPayment} className="mb-6">
          Test Payment
        </Button>

        <div className="border rounded-lg p-4 bg-muted">
          <h2 className="text-xl font-semibold mb-2">Logs:</h2>
          <div className="font-mono text-sm space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-xs">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
