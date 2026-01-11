"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "@/lib/icons"

interface PaymentModalProps {
  game: {
    name: string
    icon: string
    entry: number
    prize: number
  }
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function PaymentModal({ game, onConfirm, onCancel }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } catch (error) {
      console.error("[v0] Payment error:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gray-800 border-4 border-cyan-500 max-w-md w-full relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          disabled={isProcessing}
        >
          <X className="w-6 h-6" />
        </button>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-7xl mb-4">{game.icon}</div>
            <h3 className="text-2xl font-bold mb-2">{game.name} Tournament</h3>
            <div className="bg-blue-900/30 rounded-lg p-4 mb-6 border border-blue-500">
              <p className="text-sm text-gray-300 mb-2">Entry Fee</p>
              <p className="text-4xl font-bold text-cyan-400">{game.entry}π</p>
            </div>
            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <p className="flex justify-between">
                <span>1st Place:</span>
                <span className="text-yellow-400 font-bold">{game.prize}π</span>
              </p>
              <p className="flex justify-between">
                <span>2nd Place:</span>
                <span className="text-gray-400 font-bold">{(game.prize * 0.5).toFixed(1)}π</span>
              </p>
              <p className="flex justify-between">
                <span>3rd Place:</span>
                <span className="text-orange-400 font-bold">{(game.prize * 0.3).toFixed(1)}π</span>
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xl py-6"
              >
                {isProcessing ? "Processing..." : `Pay ${game.entry}π & Join`}
              </Button>
              <Button
                onClick={onCancel}
                disabled={isProcessing}
                variant="outline"
                className="w-full border-gray-500 text-gray-300 hover:bg-gray-700 bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
