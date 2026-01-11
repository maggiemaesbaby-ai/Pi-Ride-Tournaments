"use client"

import { useEffect, useState, useRef } from "react"
import { TrendingUp } from "@/lib/icons"

export function StatsBar() {
  const [piPrice, setPiPrice] = useState<number | null>(null)
  const [usdAmount, setUsdAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const fetchAttemptsRef = useRef(0)

  useEffect(() => {
    const fetchPiPrice = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd",
          { signal: controller.signal }
        )
        clearTimeout(timeoutId)
        
        const data = await response.json()
        const price = data["pi-network"]?.usd

        if (price) {
          setPiPrice(price)
          fetchAttemptsRef.current = 0
        } else {
          setPiPrice(0.22)
        }
      } catch (error) {
        fetchAttemptsRef.current += 1
        setPiPrice(0.22)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPiPrice()

    const intervalTime = fetchAttemptsRef.current > 3 ? 120000 : 30000
    const interval = setInterval(fetchPiPrice, intervalTime)
    return () => clearInterval(interval)
  }, []) // Empty dependency array to prevent infinite loop

  return (
    <div className="bg-yellow-400/95 backdrop-blur-md border-2 border-yellow-500 rounded-lg p-4 mb-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-yellow-900" />
          </div>
          <div>
            <p className="text-sm text-yellow-900/80">Pi Network Price</p>
            {isLoading ? (
              <p className="text-2xl font-bold text-yellow-950">Loading...</p>
            ) : (
              <p className="text-2xl font-bold text-yellow-950">
                ${piPrice?.toFixed(4)} USD
                {fetchAttemptsRef.current > 0 && <span className="text-xs ml-2">(fallback)</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 md:flex-none">
            <label className="text-xs text-yellow-900/80 block mb-1">Convert Pi to USD</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount in π"
                className="px-3 py-2 border-2 border-yellow-500 rounded-md text-sm w-full md:w-32 bg-yellow-50 text-yellow-950"
                disabled={isLoading || !piPrice}
                onChange={(e) => setUsdAmount(Number.parseFloat(e.target.value) * (piPrice || 0))}
              />
              <div className="px-3 py-2 bg-yellow-100 border-2 border-yellow-500 rounded-md text-sm font-medium min-w-24 flex items-center justify-center text-yellow-950">
                ${usdAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
