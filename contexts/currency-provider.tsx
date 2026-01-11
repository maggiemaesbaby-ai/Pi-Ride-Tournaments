"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface UserStats {
  totalRides: number
  referralCount: number
  firstRideUsed: boolean
}

interface CurrencyContextType {
  userStats: UserStats
  setUserStats: (stats: Partial<UserStats>) => void
  calculateFee: (baseAmount: number) => {
    baseFee: number
    referralDiscount: number
    firstRideDiscount: number
    totalFee: number
    feePercentage: number
  }
  formatPrice: (amount: number) => string
  formatPriceWithUSD: (piAmount: number) => { pi: string; usd: string }
  piPrice: number
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const PI_PRICE_CACHE_KEY = "piRidePiPriceCache"
const CACHE_DURATION = 2 * 60 * 60 * 1000 // Cache for 2 hours
const RATE_LIMIT_COOLDOWN = 24 * 60 * 60 * 1000 // 24 hour cooldown after rate limit

interface PriceCache {
  price: number
  timestamp: number
  rateLimited?: boolean
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [piPrice, setPiPrice] = useState(0.22)
  const [userStats, setUserStatsState] = useState<UserStats>({
    totalRides: 0,
    referralCount: 0,
    firstRideUsed: false,
  })

  useEffect(() => {
    const fetchPiPrice = async () => {
      try {
        // Check localStorage cache first
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(PI_PRICE_CACHE_KEY)
          if (cached) {
            const cacheData: PriceCache = JSON.parse(cached)
            const now = Date.now()

            // If rate limited, use cache for 24 hours
            if (cacheData.rateLimited && now - cacheData.timestamp < RATE_LIMIT_COOLDOWN) {
              console.log("[v0] Rate limited, using cached price:", cacheData.price)
              setPiPrice(cacheData.price)
              return
            }

            // Normal cache check
            if (now - cacheData.timestamp < CACHE_DURATION) {
              setPiPrice(cacheData.price)
              return
            }
          }
        }

        // Fetch fresh price from API
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd")

        if (!response.ok) {
          // Handle rate limiting specifically
          if (response.status === 429) {
            console.log("[v0] CoinGecko rate limit hit, caching for 24 hours")
            if (typeof window !== "undefined") {
              const cached = localStorage.getItem(PI_PRICE_CACHE_KEY)
              if (cached) {
                const cacheData: PriceCache = JSON.parse(cached)
                // Mark as rate limited
                cacheData.rateLimited = true
                cacheData.timestamp = Date.now()
                localStorage.setItem(PI_PRICE_CACHE_KEY, JSON.stringify(cacheData))
                setPiPrice(cacheData.price)
                return
              }
            }
          }

          // Try to use expired cache if available
          if (typeof window !== "undefined") {
            const cached = localStorage.getItem(PI_PRICE_CACHE_KEY)
            if (cached) {
              const cacheData: PriceCache = JSON.parse(cached)
              console.log("[v0] CoinGecko API error, using cached price:", cacheData.price)
              setPiPrice(cacheData.price)
              return
            }
          }
          // Fall back to default
          console.log("[v0] CoinGecko API error, using fallback price")
          return
        }

        const data = await response.json()
        const price = data["pi-network"]?.usd || 0.22
        setPiPrice(price)

        // Cache the price
        if (typeof window !== "undefined") {
          const cacheData: PriceCache = {
            price,
            timestamp: Date.now(),
            rateLimited: false,
          }
          localStorage.setItem(PI_PRICE_CACHE_KEY, JSON.stringify(cacheData))
        }
      } catch (error) {
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem(PI_PRICE_CACHE_KEY)
          if (cached) {
            try {
              const cacheData: PriceCache = JSON.parse(cached)
              console.log("[v0] Network error, using cached price:", cacheData.price)
              setPiPrice(cacheData.price)
              return
            } catch (e) {}
          }
        }
        console.log("[v0] Failed to fetch Pi price, using fallback")
        setPiPrice(0.22)
      }
    }

    // Fetch immediately on mount
    fetchPiPrice()

    const interval = setInterval(fetchPiPrice, CACHE_DURATION)
    return () => clearInterval(interval)
  }, [])

  // Load user stats from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem("piRideUserStats")
    if (saved) {
      try {
        setUserStatsState(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  // Save user stats to localStorage
  const setUserStats = (stats: Partial<UserStats>) => {
    setUserStatsState((prev) => {
      const updated = { ...prev, ...stats }
      if (typeof window !== "undefined") {
        localStorage.setItem("piRideUserStats", JSON.stringify(updated))
      }
      return updated
    })
  }

  const calculateFee = (baseAmount: number) => {
    let feePercentage = 0
    if (userStats.totalRides === 0) {
      feePercentage = 2
    } else if (userStats.totalRides <= 10) {
      feePercentage = 2 + (userStats.totalRides / 10) * 3 // 2% to 5%
    } else {
      feePercentage = 5
    }

    const baseFee = baseAmount * (feePercentage / 100)

    // First ride discount: 2% off
    let firstRideDiscount = 0
    if (!userStats.firstRideUsed) {
      firstRideDiscount = baseAmount * 0.02
    }

    // Referral discount: 1% off per referral
    let referralDiscount = 0
    if (userStats.referralCount > 0) {
      referralDiscount = baseAmount * (userStats.referralCount * 0.01)
    }

    const totalFee = Math.max(0, baseFee - firstRideDiscount - referralDiscount)

    return {
      baseFee,
      referralDiscount,
      firstRideDiscount,
      totalFee,
      feePercentage,
    }
  }

  const formatPrice = (amount: number) => {
    return `${amount.toFixed(2)} π`
  }

  const formatPriceWithUSD = (piAmount: number) => {
    const usdAmount = piAmount * piPrice
    return {
      pi: `${piAmount.toFixed(2)} π`,
      usd: `$${usdAmount.toFixed(2)}`,
    }
  }

  return (
    <CurrencyContext.Provider
      value={{
        userStats,
        setUserStats,
        calculateFee,
        formatPrice,
        formatPriceWithUSD,
        piPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider")
  }
  return context
}
