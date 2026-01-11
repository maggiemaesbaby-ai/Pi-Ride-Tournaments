type PiWalletState = {
  isConnected: boolean
  isConnecting: boolean
  user: any | null
  isDemoMode: boolean
}

type Listener = (state: PiWalletState) => void

class PiWalletManager {
  private state: PiWalletState = {
    isConnected: false,
    isConnecting: false,
    user: null,
    isDemoMode: false,
  }

  private listeners = new Set<Listener>()
  private isInitialized = false

  getState() {
    return this.state
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  private setState(updates: Partial<PiWalletState>) {
    this.state = { ...this.state, ...updates }
    this.notify()
  }

  async connect() {
    if (this.state.isConnecting || this.state.isConnected) {
      return
    }

    this.setState({ isConnecting: true })

    try {
      if (typeof window === "undefined" || !window.Pi) {
        throw new Error("Pi SDK not loaded")
      }

      const scopes = ["username", "payments"]
      const auth = await window.Pi.authenticate(scopes, () => {
        console.log("[v0] Incomplete payment found")
      })

      this.setState({
        isConnected: true,
        isConnecting: false,
        user: auth.user,
        isDemoMode: false,
      })

      console.log("[v0] Pi wallet connected:", auth.user)
    } catch (error) {
      console.error("[v0] Pi connection error:", error)
      this.setState({
        isConnecting: false,
        isConnected: false,
      })
      throw error
    }
  }

  disconnect() {
    this.setState({
      isConnected: false,
      user: null,
      isDemoMode: false,
    })
  }

  enableDemoMode() {
    this.setState({
      isDemoMode: true,
      isConnected: true,
      user: { username: "demo_user" },
    })
  }
}

export const piWalletManager = new PiWalletManager()
