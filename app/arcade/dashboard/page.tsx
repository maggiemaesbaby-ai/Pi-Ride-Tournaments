"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Coins, Plus, ArrowDownToLine, History, TrendingUp, X } from "lucide-react"
import { setPWAUser } from "@/lib/pwa-auth"
import { toast } from "react-toastify"

declare global {
  interface Window {
    Pi?: {
      createPayment: (payment: any, callbacks: any) => void
      authenticate: (scopes: string[], onIncompletePaymentFound: (payment: any) => void) => Promise<any>
    }
  }
}

interface Transaction {
  id: string
  type: "win" | "entry" | "deposit" | "cashout"
  amount: number
  description: string
  created_at: string
}

export default function ArcadeDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showCashout, setShowCashout] = useState(false)
  const [addAmount, setAddAmount] = useState("")
  const [cashoutAmount, setCashoutAmount] = useState("")
  const [processing, setProcessing] = useState(false)
  const [isPWA, setIsPWA] = useState(false)
  const [showPWAMessage, setShowPWAMessage] = useState(false)
  const [showPWACashoutMessage, setShowPWACashoutMessage] = useState(false)

  useEffect(() => {
    console.log("[v0] ========== DASHBOARD MOUNTED ==========")

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const userIdFromUrl = urlParams.get("userId")
      const usernameFromUrl = urlParams.get("username")

      console.log("[v0] Dashboard loaded with URL params:", { userIdFromUrl, usernameFromUrl })

      if (userIdFromUrl) {
        console.log("[v0] Storing userId from URL in localStorage:", userIdFromUrl)
        localStorage.setItem("pwa_user_id", userIdFromUrl)
        if (usernameFromUrl) {
          localStorage.setItem("pwa_username", usernameFromUrl)
        }

        // Clean up URL
        window.history.replaceState({}, "", "/arcade/dashboard")
      }

      const isPWAMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://")

      setIsPWA(isPWAMode)
      console.log("[v0] Dashboard isPWA mode:", isPWAMode)
    }

    initializeDashboard()
  }, [])

  const initializeDashboard = async () => {
    console.log("[v0] Initializing dashboard")
    setLoading(true)

    try {
      let userId = null
      let username = null

      if (typeof window !== "undefined") {
        try {
          userId = localStorage.getItem("pwa_user_id")
          username = localStorage.getItem("pwa_username")
          console.log("[v0] Found in localStorage:", { userId, username })

          if (userId) {
            console.log("[v0] localStorage userId found, verifying it's valid")
            // Verify it's not empty or corrupted
            if (userId.trim().length > 0) {
              console.log("[v0] Using stored userId:", userId)
              setUser({ uid: userId, username: username || "User" })
              await fetchBalance(userId)
              await fetchTransactions(userId)
              setLoading(false)
              return
            } else {
              console.error("[v0] localStorage userId is empty, clearing it")
              localStorage.removeItem("pwa_user_id")
              localStorage.removeItem("pwa_username")
              userId = null
            }
          }
        } catch (error) {
          console.error("[v0] Error reading localStorage:", error)
          userId = null
        }
      }

      const isPWAMode =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
          (window.navigator as any).standalone ||
          document.referrer.includes("android-app://"))

      console.log("[v0] isPWA:", isPWAMode)

      if (isPWAMode && !userId) {
        console.log("[v0] PWA mode without userId, showing linking message")
        setLoading(false)
        return
      }

      if (!isPWAMode && typeof window !== "undefined" && window.Pi) {
        console.log("[v0] Attempting Pi Browser authentication")
        try {
          const auth = await window.Pi.authenticate(["username", "payments"], async (payment) => {
            console.log("[v0] Incomplete payment found during authentication:", payment)

            // If there's an incomplete payment, try to complete it
            if (payment && payment.identifier) {
              console.log("[v0] Attempting to complete incomplete payment:", payment.identifier)

              try {
                // Complete the payment through the Pi API
                const completeResponse = await fetch("/api/pi/complete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    paymentId: payment.identifier,
                    txid: payment.transaction?.txid || "incomplete",
                  }),
                })

                if (completeResponse.ok) {
                  console.log("[v0] Successfully completed incomplete payment")
                }
              } catch (error) {
                console.error("[v0] Error completing incomplete payment:", error)
              }
            }
          })
          console.log("[v0] Pi auth successful:", auth.user.uid)
          setUser(auth.user)

          if (typeof window !== "undefined") {
            localStorage.setItem("pwa_user_id", auth.user.uid)
            localStorage.setItem("pwa_username", auth.user.username)
          }
          setPWAUser(auth.user.uid, auth.user.username)

          try {
            const syncResponse = await fetch("/api/auth/sync-pi-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                piUid: auth.user.uid,
                piUsername: auth.user.username,
                walletAddress: auth.user.uid, // Use Pi UID as wallet address for arcade users
              }),
            })

            if (syncResponse.ok) {
              console.log("[v0] Pi user synced to database successfully")
            } else {
              console.warn("[v0] Failed to sync Pi user to database")
            }
          } catch (syncError) {
            console.error("[v0] Error syncing Pi user to database:", syncError)
          }

          await fetchBalance(auth.user.uid)
          await fetchTransactions(auth.user.uid)
          setLoading(false)
          return
        } catch (error) {
          console.error("[v0] Pi authentication failed:", error)
        }
      }

      console.log("[v0] No authentication available")
      setLoading(false)
    } catch (error) {
      console.error("[v0] Dashboard initialization error:", error)
      setLoading(false)
    }
  }

  const fetchBalance = async (userId: string) => {
    try {
      console.log("[v0] Fetching balance for userId:", userId)
      const response = await fetch(`/api/arcade/user/balance?userId=${userId}`)

      console.log("[v0] Balance API response status:", response.status)

      if (!response.ok) {
        console.error("[v0] Balance API error:", response.statusText)
        setBalance(0)
        return
      }

      const data = await response.json()
      console.log("[v0] Balance API response data:", data)

      const balanceValue = typeof data.balance === "number" ? data.balance : typeof data === "number" ? data : 0

      console.log("[v0] Setting balance to:", balanceValue)
      setBalance(balanceValue)
    } catch (error) {
      console.error("[v0] Error fetching balance:", error)
      setBalance(0)
    }
  }

  const fetchTransactions = async (userId: string) => {
    try {
      const response = await fetch(`/api/arcade/user/transactions?userId=${userId}`)
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error("[v0] Error fetching transactions:", error)
    }
  }

  const handleAddFunds = async () => {
    const amount = Number.parseFloat(addAmount)
    console.log("[v0] handleAddFunds called with amount:", amount)

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    console.log("[v0] User object:", user)
    console.log("[v0] Pi SDK available:", typeof window !== "undefined" && !!window.Pi)

    setProcessing(true)

    try {
      if (typeof window !== "undefined" && window.Pi) {
        console.log("[v0] Creating Pi payment for amount:", amount)

        window.Pi.createPayment(
          {
            amount: amount,
            memo: `Add ${amount} π to Arcade Balance`,
            metadata: { type: "add_funds", userId: user.uid },
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
              console.log("[v0] User ID:", user.uid)

              try {
                console.log("[v0] Calling add-funds API...")
                const response = await fetch("/api/arcade/user/add-funds", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: user.uid, amount, piPaymentId: paymentId }),
                })

                console.log("[v0] Add funds response status:", response.status)
                const data = await response.json()
                console.log("[v0] Add funds response data:", data)

                if (response.ok && data.success) {
                  console.log("[v0] Add funds successful, completing Pi payment...")

                  const completeResponse = await fetch("/api/pi/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentId, txid }),
                  })

                  console.log("[v0] Pi complete response status:", completeResponse.status)

                  console.log("[v0] Refreshing balance and transactions...")
                  await fetchBalance(user.uid)
                  await fetchTransactions(user.uid)

                  setShowAddFunds(false)
                  setAddAmount("")
                  setProcessing(false)

                  toast.success(`✨ Successfully added ${amount} π to your balance!`)
                } else {
                  console.error("[v0] Add funds API failed:", data.error)
                  setProcessing(false)
                  toast.error(`Failed to add funds: ${data.error || "Unknown error"}. Please try again.`)
                }
              } catch (error) {
                console.error("[v0] Add funds error:", error)
                setProcessing(false)
                toast.error("Failed to add funds. Please try again.")
              }
            },
            onCancel: () => {
              console.log("[v0] ===== PAYMENT CANCELLED =====")
              setProcessing(false)
            },
            onError: (error: any) => {
              console.error("[v0] ===== PAYMENT ERROR =====")
              console.error("[v0] Error:", error)
              setProcessing(false)
              toast.error(`Payment failed: ${error.message || "Unknown error"}`)
            },
          },
        )

        console.log("[v0] Pi payment creation initiated")
      } else {
        console.error("[v0] Pi SDK not available")
        toast.error("Pi SDK not available. Please open in Pi Browser.")
        setProcessing(false)
      }
    } catch (error) {
      console.error("[v0] Add funds outer error:", error)
      toast.error("Failed to add funds. Please try again.")
      setProcessing(false)
    }
  }

  const handleCashout = async () => {
    console.log("[v0] ========== CASHOUT INITIATED ==========")
    console.log("[v0] Cashout button clicked, amount:", cashoutAmount, "balance:", balance)
    console.log("[v0] User:", user?.uid)

    const amount = Number.parseFloat(cashoutAmount)

    if (!user || !user.uid) {
      console.error("[v0] No user object or uid found")
      toast.error("User not authenticated")
      return
    }

    console.log("[v0] User object:", user)
    console.log("[v0] Balance:", balance)
    console.log("[v0] Cashout amount:", cashoutAmount)
    console.log("[v0] Processing state:", processing)

    if (!amount || amount <= 0) {
      console.log("[v0] ❌ Invalid amount:", amount)
      toast.error("Please enter a valid amount")
      return
    }

    if (amount < 1) {
      console.log("[v0] ❌ Amount below minimum:", amount)
      toast.error("Minimum cashout is 1 π")
      return
    }

    if (amount > balance) {
      console.log("[v0] ❌ Insufficient balance. Amount:", amount, "Balance:", balance)
      toast.error(`Insufficient balance. Your current balance is ${balance.toFixed(2)} π`)
      return
    }

    console.log("[v0] ✅ Validations passed, checking Pi authentication...")
    setProcessing(true)

    let piUid: string | undefined

    try {
      if (!window.Pi) {
        console.log("[v0] ❌ Pi SDK not available")
        setProcessing(false)
        toast.error("Please use Pi Browser to cash out")
        return
      }

      console.log("[v0] Authenticating with Pi to get user ID...")
      const auth = await window.Pi.authenticate(["username", "payments", "wallet_address"], (payment: any) => {
        console.log("[v0] Incomplete payment found:", payment)
      })

      console.log("[v0] Pi authentication successful:", auth)
      piUid = auth.user.uid

      if (!piUid) {
        console.log("[v0] ❌ No Pi UID received from authentication")
        setProcessing(false)
        toast.error("Failed to get Pi user ID. Please try again.")
        return
      }

      console.log("[v0] ✅ Pi UID obtained:", piUid)
    } catch (authError) {
      console.error("[v0] Pi authentication failed:", authError)
      setProcessing(false)
      toast.error("Failed to authenticate with Pi. Please try again.")
      return
    }

    console.log("[v0] All validations passed, initiating A2U cashout payment")

    try {
      console.log("[v0] Calling server-side A2U cashout API with pi_uid...")

      const cashoutRes = await fetch("/api/arcade/user/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          amount,
          piUid, // Pass the pi_uid from Pi authentication
        }),
      })

      const cashoutData = await cashoutRes.json()
      console.log("[v0] Cashout API response:", cashoutRes.status, cashoutData)

      if (!cashoutRes.ok) {
        console.error("[v0] Cashout failed:", cashoutData.error)
        toast.error(cashoutData.error || "Cashout failed. Please try again.")
        setProcessing(false)
        return
      }

      console.log("[v0] A2U Cashout successful, refreshing balance")
      await fetchBalance(user.uid)
      await fetchTransactions(user.uid)
      setShowCashout(false)
      setCashoutAmount("")
      setProcessing(false)
      toast.success(`✨ Successfully cashed out ${amount} π to your Pi wallet!`)

      if (cashoutData.txid) {
        console.log("[v0] Pi blockchain transaction ID:", cashoutData.txid)
      }
    } catch (error: any) {
      console.error("[v0] Cashout error:", error)
      setProcessing(false)
      toast.error("Failed to process cashout. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl text-white mb-4">Loading Dashboard...</div>
          <div className="text-white/60 text-sm">Syncing your account...</div>
        </div>
      </div>
    )
  }

  if (!user && isPWA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-black/60 backdrop-blur-lg border-purple-500/50 p-8">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-3xl font-bold text-white">Link Your Account</h2>
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 text-left">
              <p className="text-yellow-300 font-semibold mb-3">⚠️ PWA Not Linked</p>
              <p className="text-white/80 mb-4">
                To use the dashboard in PWA, you need to link your account from Pi Browser first.
              </p>
              <ol className="text-white/70 text-sm space-y-2 list-decimal list-inside">
                <li>
                  Open this app in <strong>Pi Browser</strong>
                </li>
                <li>
                  Go to <strong>View Tournaments</strong>
                </li>
                <li>Pay for a tournament entry (with Pi or balance)</li>
                <li>
                  When the platform choice appears, click <strong>"Play on PWA"</strong>
                </li>
                <li>Open that link in your PWA browser</li>
              </ol>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                💡 <strong>Tip:</strong> After linking once, your PWA will remember your account and show your balance
                and tournament entries automatically!
              </p>
            </div>
            <Button
              onClick={() => router.push("/arcade")}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
            >
              ← Back to Arcade
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 flex items-center justify-center p-4">
        <Card className="bg-white/10 border-2 border-white/20 p-8 max-w-md">
          <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
            {isPWA ? "🔗 Link Your Account" : "🔐 Connect Wallet"}
          </h2>
          <p className="text-white/80 mb-6 text-center">
            {isPWA
              ? "To use the dashboard in PWA mode, you need to link your account first. Open Pi Browser, make a payment, and click 'Play on PWA' to link your account."
              : "Please connect your Pi wallet to access the dashboard."}
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => router.push("/arcade")}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              ← Back to Arcade
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 p-4 pb-24">
      <div className="max-w-4xl mx-auto mb-6">
        <Button
          onClick={() => router.push("/arcade")}
          className="mb-4 bg-white/10 hover:bg-white/20 text-white font-bold border border-white/30"
        >
          ← Back to Arcade
        </Button>

        <h1 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
          Arcade Dashboard
        </h1>
        <p className="text-center text-white/80">Manage your balance and view game history</p>
      </div>

      <div className="max-w-4xl mx-auto mb-6">
        <Card className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 border-4 border-yellow-400 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Available Balance</p>
              <div className="flex items-center gap-2">
                <Coins className="w-8 h-8 text-white" />
                <span className="text-5xl font-bold text-white">{balance.toFixed(2)}</span>
                <span className="text-2xl text-white">π</span>
              </div>
            </div>
            <Trophy className="w-16 h-16 text-white/30" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button
              onClick={() => {
                if (isPWA) {
                  setShowPWAMessage(true)
                } else {
                  setShowAddFunds(true)
                }
              }}
              className="bg-white text-orange-600 hover:bg-white/90 font-bold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add π
            </Button>
            <Button
              onClick={() => {
                console.log("[v0] Cash Out button clicked - opening dialog")
                setShowCashout(true)
              }}
              disabled={processing}
              className="bg-white/20 text-white hover:bg-white/30 font-bold"
            >
              <ArrowDownToLine className="w-5 h-5 mr-2" />
              Cash Out
            </Button>
          </div>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <Card className="bg-white/10 border-2 border-white/20 p-6 text-center">
              <p className="text-white/60">No transactions yet. Start playing to see your history!</p>
            </Card>
          ) : (
            transactions.map((tx) => (
              <Card key={tx.id} className="bg-white/10 border-2 border-white/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {tx.type === "win" && <TrendingUp className="w-5 h-5 text-green-400" />}
                    {tx.type === "entry" && <Trophy className="w-5 h-5 text-blue-400" />}
                    {tx.type === "deposit" && <Plus className="w-5 h-5 text-yellow-400" />}
                    {tx.type === "cashout" && <ArrowDownToLine className="w-5 h-5 text-purple-400" />}
                    <div>
                      <p className="text-white font-medium">{tx.description}</p>
                      <p className="text-white/60 text-sm">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div
                    className={`text-xl font-bold ${tx.type === "win" || tx.type === "deposit" ? "text-green-400" : "text-red-400"}`}
                  >
                    {tx.type === "win" || tx.type === "deposit" ? "+" : "-"}
                    {Math.abs(tx.amount).toFixed(2)} π
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {showAddFunds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <Card className="bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 border-4 border-cyan-500 p-8 max-w-md w-full">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Add π to Balance</h2>

            <div className="mb-6">
              <label className="text-white/80 mb-2 block">Amount (π)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full p-4 rounded-lg bg-white/10 border-2 border-white/20 text-white text-2xl text-center font-bold"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 5, 10].map((amt) => (
                <Button
                  key={amt}
                  onClick={() => setAddAmount(amt.toString())}
                  variant="outline"
                  className="text-white border-white/50 bg-white/10 hover:bg-white/20 font-bold text-lg"
                >
                  +{amt} π
                </Button>
              ))}
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleAddFunds}
                disabled={processing || !addAmount}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-xl"
              >
                {processing ? "Processing..." : "Add Funds"}
              </Button>
              <Button
                onClick={() => {
                  setShowAddFunds(false)
                  setAddAmount("")
                }}
                variant="outline"
                className="w-full text-white border-white/50 bg-white/10 hover:bg-white/20 font-bold"
              >
                Return
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showCashout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <Card className="bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 border-4 border-cyan-500 p-8 max-w-md w-full">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Cash Out to Pi Wallet</h2>

            <div className="mb-4 p-4 bg-white/10 rounded-lg">
              <p className="text-white/80 text-sm mb-1">Available Balance</p>
              <p className="text-3xl font-bold text-white">{balance.toFixed(2)} π</p>
            </div>

            <div className="mb-6">
              <label className="text-white/80 mb-2 block">Cashout Amount (min 1π)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                max={balance}
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full p-4 rounded-lg bg-white/10 border-2 border-white/20 text-white text-2xl text-center font-bold"
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCashout}
                disabled={processing || !cashoutAmount || Number.parseFloat(cashoutAmount) < 1}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 text-xl"
              >
                {processing ? "Processing..." : "Cash Out"}
              </Button>
              <Button
                onClick={() => {
                  setShowCashout(false)
                  setCashoutAmount("")
                }}
                variant="outline"
                className="w-full text-white border-white/50 bg-white/10 hover:bg-white/20 font-bold"
              >
                Return
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showPWAMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <Card className="bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 border-4 border-cyan-500 p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowPWAMessage(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-orange-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Add π to Your Balance</h2>
                <p className="text-white/80 text-lg leading-relaxed">
                  To add more Pi to your balance, please return to Pi Browser and add funds from there, then return to
                  the PWA.
                </p>
              </div>

              <Button
                onClick={() => setShowPWAMessage(false)}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-4"
              >
                Got it
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showPWACashoutMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <Card className="bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 border-4 border-cyan-500 p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowPWACashoutMessage(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Cash Out</h2>
            <p className="text-white/90 text-lg text-center mb-8">
              To cash out your Pi balance, please return to Pi Browser and access the dashboard from there.
            </p>
            <Button
              onClick={() => setShowPWACashoutMessage(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 text-lg"
            >
              Got it
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}

console.log("[v0] ============ DASHBOARD PAGE MODULE LOADED ============")
