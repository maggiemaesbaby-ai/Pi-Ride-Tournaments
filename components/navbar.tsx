"use client"

import { useEffect, useState } from "react"

const Navbar = () => {
  const [piPrice, setPiPrice] = useState(0.5)

  useEffect(() => {
    const fetchPiPrice = async () => {
      // Check cache first (5 minute cache)
      const cachedPrice = localStorage.getItem("pi_price_cache")
      const cachedTime = localStorage.getItem("pi_price_cache_time")

      if (cachedPrice && cachedTime) {
        const age = Date.now() - Number.parseInt(cachedTime)
        if (age < 5 * 60 * 1000) {
          // 5 minutes
          setPiPrice(Number.parseFloat(cachedPrice))
          return
        }
      }

      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd")

        if (response.status === 429) {
          console.log("[v0] CoinGecko rate limit hit, using fallback price")
          setPiPrice(0.5) // Fallback price
          return
        }

        const data = await response.json()
        const price = data["pi-network"]?.usd || 0.5
        setPiPrice(price)

        // Cache the price
        localStorage.setItem("pi_price_cache", price.toString())
        localStorage.setItem("pi_price_cache_time", Date.now().toString())
      } catch (error) {
        console.error("[v0] Error fetching Pi price:", error)
        setPiPrice(0.5) // Fallback price
      }
    }

    fetchPiPrice()
  }, [])
}

export default Navbar
