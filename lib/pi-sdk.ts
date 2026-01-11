declare global {
  interface Window {
    Pi?: any
  }
}

class PiSDKManager {
  private initialized = false
  private piAvailable = false

  isInitialized() {
    return this.initialized
  }

  isPiBrowserAvailable() {
    return this.piAvailable
  }

  async initialize() {
    if (this.initialized || typeof window === "undefined") {
      return
    }

    try {
      console.log("[v0] Pi SDK initializing...")
      if (!window.Pi) {
        console.warn(
          "[v0] Pi SDK not loaded - app is running outside Pi Browser (this is normal in preview/development mode)",
        )
        this.piAvailable = false
        this.initialized = true
        return
      }

      this.piAvailable = true
      const hostname = window.location.hostname
      const isSandbox =
        !hostname.includes("vercel.app") &&
        (hostname.includes("localhost") ||
          hostname.includes("vusercontent.net") ||
          hostname.includes("sandbox") ||
          window.location.search.includes("sandbox=true"))

      console.log("[v0] Pi SDK init config:", { hostname, isSandbox })
      window.Pi.init({ version: "2.0", sandbox: isSandbox })
      this.initialized = true
      console.log("[v0] Pi SDK initialized successfully")
    } catch (error) {
      console.error("[v0] Pi SDK initialization failed:", error)
      this.initialized = true
      this.piAvailable = false
    }
  }

  async authenticate(scopes?: string[], onIncompletePaymentFound?: any) {
    console.log("[v0] authenticate() called, initialized:", this.initialized)

    if (!this.initialized) {
      console.log("[v0] Not initialized, initializing now...")
      await this.initialize()
    }

    if (!this.piAvailable || !window.Pi) {
      throw new Error("Pi Browser is not available. Please open this app in the Pi Browser to use Pi Network features.")
    }

    const authScopes = scopes || ["username", "payments"]
    console.log("[v0] Calling window.Pi.authenticate with scopes:", authScopes)

    try {
      console.log("[v0] Requesting authentication...")
      const authPromise = onIncompletePaymentFound
        ? window.Pi.authenticate(authScopes, onIncompletePaymentFound)
        : window.Pi.authenticate(authScopes)
      console.log("[v0] Auth promise created, waiting for response...")

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error("[v0] Authentication timeout after 30 seconds")
          reject(new Error("Authentication timed out. This URL must be registered in your Pi Developer Portal."))
        }, 30000)
      })

      const auth = (await Promise.race([authPromise, timeoutPromise])) as any

      console.log("[v0] Authentication successful:", {
        username: auth.user?.username,
        uid: auth.user?.uid,
        accessToken: auth.accessToken ? "present" : "missing",
      })

      if (authScopes.includes("payments") && !auth.accessToken) {
        console.warn("[v0] ⚠️ WARNING: Payments scope requested but no accessToken received!")
        console.warn("[v0] This means user may have denied payments permission")
      } else if (auth.accessToken) {
        console.log("[v0] ✓ Access token received - payments scope granted")
      }

      return auth
    } catch (error: any) {
      console.error("[v0] Pi authentication failed:", error)
      console.error("[v0] Error type:", typeof error, "Error message:", error?.message)
      throw error
    }
  }

  createPayment(paymentData: any, callbacks: any) {
    if (!this.piAvailable || !this.initialized) {
      throw new Error("Pi Browser is not available. Please open this app in the Pi Browser to make payments.")
    }

    if (!window.Pi) {
      throw new Error("Pi SDK not available")
    }

    return window.Pi.createPayment(paymentData, callbacks)
  }
}

export { PiSDKManager }
export const piSDK = new PiSDKManager()
