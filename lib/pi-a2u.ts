interface A2UPaymentData {
  amount: number
  memo: string
  metadata: Record<string, any>
  uid: string
}

interface A2UPaymentResponse {
  identifier: string
  user_uid: string
  amount: number
  memo: string
  metadata: Record<string, any>
  to_address: string
  created_at: string
}

export async function createA2UPayment(paymentData: A2UPaymentData): Promise<string> {
  console.log("[A2U] ========== CREATE PAYMENT ==========")

  const apiKey = process.env.PI_API_KEY
  const walletSeed = process.env.PI_WALLET_PRIVATE_SEED

  console.log("[A2U] Checking environment variables...")
  console.log("[A2U] PI_API_KEY exists:", !!apiKey)
  console.log("[A2U] PI_WALLET_PRIVATE_SEED exists:", !!walletSeed)

  if (!apiKey || !walletSeed) {
    console.error("[A2U] ❌ Missing Pi credentials!")
    throw new Error("Missing Pi credentials for A2U payments")
  }

  console.log("[A2U] Creating payment for user:", paymentData.uid, "amount:", paymentData.amount)
  console.log("[A2U] Payment memo:", paymentData.memo)
  console.log("[A2U] Payment metadata:", paymentData.metadata)

  console.log("[A2U] Making API request to Pi Network...")
  const response = await fetch("https://api.minepi.com/v2/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      payment: {
        amount: paymentData.amount,
        memo: paymentData.memo,
        metadata: paymentData.metadata,
        uid: paymentData.uid,
      },
    }),
  })

  console.log("[A2U] Pi API response status:", response.status)

  if (!response.ok) {
    const error = await response.json()
    console.error("[A2U] ❌ Create payment failed!")
    console.error("[A2U] Status:", response.status)
    console.error("[A2U] Error response:", error)

    if (error.error === "feature_not_available") {
      throw new Error(
        "A2U payments are not enabled for this app. Please contact Pi Network support to enable App-to-User payments.",
      )
    }

    throw new Error(error.error_message || error.message || "Failed to create A2U payment")
  }

  const data: A2UPaymentResponse = await response.json()
  console.log("[A2U] ✅ Payment created successfully!")
  console.log("[A2U] Payment ID:", data.identifier)
  console.log("[A2U] To address:", data.to_address)
  return data.identifier
}

export async function submitA2UPayment(paymentId: string): Promise<string> {
  console.log("[A2U] ========== SUBMIT PAYMENT ==========")
  console.log("[A2U] Payment ID:", paymentId)

  const apiKey = process.env.PI_API_KEY

  if (!apiKey) {
    console.error("[A2U] ❌ Missing Pi API key!")
    throw new Error("Missing Pi API key")
  }

  console.log("[A2U] Submitting payment to Pi blockchain...")
  const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
  })

  console.log("[A2U] Pi API response status:", response.status)

  if (!response.ok) {
    const error = await response.json()
    console.error("[A2U] ❌ Submit payment failed!")
    console.error("[A2U] Status:", response.status)
    console.error("[A2U] Error response:", error)
    throw new Error(error.error_message || error.message || "Failed to submit A2U payment")
  }

  const data = await response.json()
  console.log("[A2U] ✅ Payment submitted successfully!")
  console.log("[A2U] TXID:", data.txid)
  return data.txid
}

export async function completeA2UPayment(paymentId: string, txid: string): Promise<any> {
  console.log("[A2U] ========== COMPLETE PAYMENT ==========")
  console.log("[A2U] Payment ID:", paymentId)
  console.log("[A2U] TXID:", txid)

  const apiKey = process.env.PI_API_KEY

  if (!apiKey) {
    console.error("[A2U] ❌ Missing Pi API key!")
    throw new Error("Missing Pi API key")
  }

  console.log("[A2U] Completing payment...")
  const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({ txid }),
  })

  console.log("[A2U] Pi API response status:", response.status)

  if (!response.ok) {
    const error = await response.json()
    console.error("[A2U] ❌ Complete payment failed!")
    console.error("[A2U] Status:", response.status)
    console.error("[A2U] Error response:", error)
    throw new Error(error.error_message || error.message || "Failed to complete A2U payment")
  }

  const result = await response.json()
  console.log("[A2U] ✅ Payment completed successfully!")
  console.log("[A2U] Result:", result)
  return result
}
