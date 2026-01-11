"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TestPiPaymentPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addLog = (message: string) => {
    console.log(`[v0] Mock Test: ${message}`)
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const simulatePaymentFlow = async () => {
    setIsProcessing(true)
    addLog("Starting mock payment flow...")

    try {
      // Simulate Pi.createPayment with callbacks
      addLog("Calling Pi.createPayment (simulated)...")

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          addLog(`🔥 onReadyForServerApproval fired! Payment ID: ${paymentId}`)

          try {
            addLog("Calling /api/pi/approve...")
            const response = await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            })

            const data = await response.json()
            addLog(`Approve response: ${JSON.stringify(data)}`)

            if (!response.ok) {
              throw new Error(data.error || "Approval failed")
            }

            addLog("✅ Payment approved successfully")
          } catch (error: any) {
            addLog(`❌ Approval error: ${error.message}`)
            throw error
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          addLog(`🎉 onReadyForServerCompletion fired! Payment ID: ${paymentId}, TX: ${txid}`)

          try {
            addLog("Calling /api/pi/complete...")
            const response = await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            })

            const data = await response.json()
            addLog(`Complete response: ${JSON.stringify(data)}`)

            if (!response.ok) {
              throw new Error(data.error || "Completion failed")
            }

            addLog("✅ Payment completed successfully")
          } catch (error: any) {
            addLog(`❌ Completion error: ${error.message}`)
            throw error
          }
        },

        onCancel: (paymentId: string) => {
          addLog(`⚠️ onCancel fired! Payment ID: ${paymentId}`)
        },

        onError: (error: Error, payment: any) => {
          addLog(`❌ onError fired! Error: ${error.message}`)
        },
      }

      addLog("Payment callbacks registered:")
      addLog(`- onReadyForServerApproval: ${typeof paymentCallbacks.onReadyForServerApproval}`)
      addLog(`- onReadyForServerCompletion: ${typeof paymentCallbacks.onReadyForServerCompletion}`)
      addLog(`- onCancel: ${typeof paymentCallbacks.onCancel}`)
      addLog(`- onError: ${typeof paymentCallbacks.onError}`)

      // Simulate the flow
      addLog("Simulating payment approval stage...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockPaymentId = `mock_payment_${Date.now()}`
      await paymentCallbacks.onReadyForServerApproval(mockPaymentId)

      addLog("Simulating payment completion stage...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockTxid = `mock_txid_${Date.now()}`
      await paymentCallbacks.onReadyForServerCompletion(mockPaymentId, mockTxid)

      addLog("✅ Mock payment flow completed successfully!")
    } catch (error: any) {
      addLog(`❌ Mock payment flow failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8">
      <Card className="max-w-4xl mx-auto p-6 bg-black/50 backdrop-blur-sm border-purple-500/50">
        <h1 className="text-3xl font-bold text-white mb-6">Pi Payment Flow Mock Test</h1>

        <div className="space-y-4 mb-6">
          <Button onClick={simulatePaymentFlow} disabled={isProcessing} className="w-full" size="lg">
            {isProcessing ? "Running Test..." : "Run Mock Payment Flow"}
          </Button>

          <Button onClick={clearLogs} variant="outline" className="w-full bg-transparent">
            Clear Logs
          </Button>
        </div>

        <div className="bg-black/80 rounded-lg p-4 border border-purple-500/30">
          <h2 className="text-xl font-semibold text-white mb-4">Test Logs:</h2>
          <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs yet. Click the button above to run the test.</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes("❌")
                      ? "text-red-400"
                      : log.includes("✅")
                        ? "text-green-400"
                        : log.includes("🔥") || log.includes("🎉")
                          ? "text-yellow-400"
                          : log.includes("⚠️")
                            ? "text-orange-400"
                            : "text-gray-300"
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
          <h3 className="text-lg font-semibold text-white mb-2">What This Tests:</h3>
          <ul className="text-gray-300 space-y-1 text-sm">
            <li>✓ Payment callback functions are properly defined</li>
            <li>✓ onReadyForServerApproval callback executes and calls /api/pi/approve</li>
            <li>✓ onReadyForServerCompletion callback executes and calls /api/pi/complete</li>
            <li>✓ Error handling in both callbacks</li>
            <li>✓ API endpoint responses</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
