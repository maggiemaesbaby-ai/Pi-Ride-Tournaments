"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Wallet, Clock } from "@/lib/icons"
import { BusinessFeesManager, type SellerBalance } from "@/lib/business-fees"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ShopOwnerBalanceDashboardProps {
  sellerId: string
  onClose: () => void
}

export function ShopOwnerBalanceDashboard({ sellerId, onClose }: ShopOwnerBalanceDashboardProps) {
  const [balance, setBalance] = useState<SellerBalance | null>(null)
  const [showCashout, setShowCashout] = useState(false)
  const [showAddPi, setShowAddPi] = useState(false)
  const [cashoutAmount, setCashoutAmount] = useState("")
  const [addPiAmount, setAddPiAmount] = useState("")
  const [platformWallet, setPlatformWallet] = useState<any>(null)
  const [isPiSdkReady, setIsPiSdkReady] = useState(false)

  useEffect(() => {
    loadBalance()
    checkPiSdk()
  }, [sellerId])

  const checkPiSdk = () => {
    if (typeof window !== "undefined" && window.Pi) {
      console.log("[v0] Pi SDK is available for shop owner payments")
      setIsPiSdkReady(true)
    } else {
      console.log("[v0] Pi SDK not available yet")
      setTimeout(checkPiSdk, 1000) // Retry after 1 second
    }
  }

  const loadBalance = () => {
    const sellerBalance = BusinessFeesManager.getSellerBalance(sellerId)
    setBalance(sellerBalance)
    const wallet = BusinessFeesManager.getPlatformWallet()
    setPlatformWallet(wallet)
  }

  const handleCashout = async () => {
    const amount = Number.parseFloat(cashoutAmount)

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (amount < 1) {
      alert("Minimum cashout is 1 π")
      return
    }

    if (amount > balance.availableBalance) {
      alert("Insufficient balance")
      return
    }

    if (!isPiSdkReady || typeof window === "undefined" || !window.Pi) {
      alert("Pi Browser required. Please open this app in the Pi Browser to cash out.")
      return
    }

    try {
      console.log("[v0] Creating Pi payment for shop cashout:", amount)

      window.Pi.createPayment(
        {
          amount: amount,
          memo: `Cashout ${amount} π from Shop Balance`,
          metadata: { type: "shop_cashout", sellerId: sellerId, amount: amount },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log("[v0] Shop cashout payment ready for approval:", paymentId)

            try {
              // Call cashout API with Pi payment ID
              const response = await fetch("/api/arcade/user/cashout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: sellerId,
                  amount: amount,
                  piPaymentId: paymentId,
                  userWalletAddress: sellerId,
                }),
              })

              const data = await response.json()
              console.log("[v0] Shop cashout API response:", data)

              if (!response.ok) {
                throw new Error(data.error || "Cashout failed")
              }
            } catch (error: any) {
              console.error("[v0] Shop cashout API error:", error)
              alert(`Cashout failed: ${error.message}`)
              throw error
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log("[v0] Shop cashout completed, txid:", txid)

            // Update balance locally after successful Pi payment
            const updatedBalance = BusinessFeesManager.getSellerBalance(sellerId)
            updatedBalance.availableBalance -= amount
            updatedBalance.totalWithdrawn += amount
            updatedBalance.lastUpdated = Date.now()

            const balancesData = localStorage.getItem("seller_balances")
            const balances = balancesData ? JSON.parse(balancesData) : {}
            balances[sellerId] = updatedBalance
            localStorage.setItem("seller_balances", JSON.stringify(balances))

            loadBalance()
            setShowCashout(false)
            setCashoutAmount("")
            alert(`✨ Successfully cashed out ${amount} π to your Pi wallet!`)
          },
          onCancel: (paymentId: string) => {
            console.log("[v0] Shop cashout cancelled")
            alert("Cashout cancelled")
          },
          onError: (error: any) => {
            console.error("[v0] Shop cashout payment error:", error)
            alert(`Payment failed: ${error.message || "Unknown error"}`)
          },
        },
      )
    } catch (error) {
      console.error("[v0] Shop cashout error:", error)
      alert("Failed to cash out. Please try again.")
    }
  }

  const handleAddPi = async () => {
    const amount = Number.parseFloat(addPiAmount)
    console.log("[v0] handleAddPi called with amount:", amount)

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount")
      return
    }

    console.log("[v0] Seller ID:", sellerId)
    console.log("[v0] Pi SDK available:", typeof window !== "undefined" && !!window.Pi)

    try {
      if (typeof window !== "undefined" && window.Pi) {
        console.log("[v0] Creating Pi payment for amount:", amount)

        window.Pi.createPayment(
          {
            amount: amount,
            memo: `Add ${amount} π to Shop Balance`,
            metadata: { type: "shop_add_funds", sellerId: sellerId },
          },
          {
            onReadyForServerApproval: async (paymentId: string) => {
              console.log("[v0] ===== PAYMENT READY FOR APPROVAL =====")
              console.log("[v0] Payment ID:", paymentId)

              try {
                const approveResponse = await fetch("/api/pi/approve", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ paymentId }),
                })
                console.log("[v0] Approval response status:", approveResponse.status)

                const approveData = await approveResponse.json()
                console.log("[v0] Approval response data:", approveData)
              } catch (error) {
                console.error("[v0] Approval error:", error)
              }
            },
            onReadyForServerCompletion: async (paymentId: string, txid: string) => {
              console.log("[v0] ===== PAYMENT READY FOR COMPLETION =====")
              console.log("[v0] Payment ID:", paymentId)
              console.log("[v0] Transaction ID:", txid)
              console.log("[v0] Seller ID:", sellerId)

              try {
                console.log("[v0] Updating seller balance...")

                // Update balance locally (same as arcade pattern)
                BusinessFeesManager.updateSellerBalance(sellerId, amount, "available")

                // Complete the Pi payment
                const completeResponse = await fetch("/api/pi/complete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ paymentId, txid }),
                })

                console.log("[v0] Pi complete response status:", completeResponse.status)

                console.log("[v0] Refreshing balance...")
                loadBalance()

                setShowAddPi(false)
                setAddPiAmount("")

                alert(`✨ Successfully added ${amount} π to your balance!`)
              } catch (error) {
                console.error("[v0] Add funds error:", error)
                alert("Failed to add funds. Please try again.")
              }
            },
            onCancel: () => {
              console.log("[v0] ===== PAYMENT CANCELLED =====")
            },
            onError: (error: any) => {
              console.error("[v0] ===== PAYMENT ERROR =====")
              console.error("[v0] Error:", error)
              alert(`Payment failed: ${error.message || "Unknown error"}`)
            },
          },
        )

        console.log("[v0] Pi payment creation initiated")
      } else {
        console.error("[v0] Pi SDK not available")
        alert("Pi SDK not available. Please open in Pi Browser.")
      }
    } catch (error) {
      console.error("[v0] Add funds outer error:", error)
      alert("Failed to add funds. Please try again.")
    }
  }

  if (!balance) {
    return <div className="p-4">Loading balance...</div>
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wallet className="w-6 h-6 text-primary" />
            Shop Balance Dashboard
          </DialogTitle>
          <DialogDescription>Manage your earnings, withdrawals, and shop finances</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Balance Overview */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Available Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {balance.availableBalance.toFixed(2)}π
                </div>
                <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {balance.pendingBalance.toFixed(2)}π
                </div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting delivery confirmation</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {balance.totalEarnings.toFixed(2)}π
                </div>
                <p className="text-xs text-muted-foreground mt-1">Lifetime sales revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              onClick={() => setShowCashout(true)}
              disabled={balance.availableBalance <= 0 || !isPiSdkReady}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <ArrowDownToLine className="w-5 h-5 mr-2" />
              Cash Out to Wallet
            </Button>
            <Button
              onClick={() => setShowAddPi(true)}
              disabled={!isPiSdkReady}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <ArrowUpFromLine className="w-5 h-5 mr-2" />
              Add Pi Balance
            </Button>
          </div>

          {/* Withdrawal Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>Track your total withdrawals and earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Withdrawn</p>
                  <p className="text-2xl font-bold text-primary">{balance.totalWithdrawn.toFixed(2)}π</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                  <p className="text-sm font-medium">{new Date(balance.lastUpdated).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Wallet Info (for transparency) */}
          {platformWallet && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">Platform Revenue (Transparency)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Platform has collected <strong>{platformWallet.balance.toFixed(2)}π</strong> in transaction fees
                </p>
              </CardContent>
            </Card>
          )}

          {!isPiSdkReady && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">⏳ Initializing Pi SDK... Please wait.</p>
            </div>
          )}
        </div>

        {/* Cashout Dialog */}
        <Dialog open={showCashout} onOpenChange={setShowCashout}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cash Out to Wallet</DialogTitle>
              <DialogDescription>Withdraw your available balance to your Pi wallet</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Available Balance</Label>
                <p className="text-2xl font-bold text-green-600">{balance.availableBalance.toFixed(2)}π</p>
              </div>
              <div>
                <Label htmlFor="cashout-amount">Withdrawal Amount</Label>
                <Input
                  id="cashout-amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCashout} className="flex-1 bg-green-600 hover:bg-green-700">
                  Confirm Withdrawal
                </Button>
                <Button onClick={() => setShowCashout(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Pi Dialog */}
        <Dialog open={showAddPi} onOpenChange={setShowAddPi}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Pi to Balance</DialogTitle>
              <DialogDescription>Add Pi from your wallet to your shop balance</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="add-pi-amount">Amount to Add</Label>
                <Input
                  id="add-pi-amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={addPiAmount}
                  onChange={(e) => setAddPiAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPi} className="flex-1">
                  Confirm Payment
                </Button>
                <Button onClick={() => setShowAddPi(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
