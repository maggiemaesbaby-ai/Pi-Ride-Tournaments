"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Bus, Train, Bike, MapPin } from "lucide-react"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/contexts/currency-provider"

const transitOptions = [
  { id: 1, type: "Bus", route: "Route 42", from: "Downtown", to: "Airport", price: 1.5, duration: "45 min", icon: Bus },
  {
    id: 2,
    type: "Train",
    route: "Blue Line",
    from: "Central Station",
    to: "North Terminal",
    price: 2.8,
    duration: "25 min",
    icon: Train,
  },
  { id: 3, type: "Bus", route: "Route 15", from: "Mall", to: "University", price: 1.2, duration: "30 min", icon: Bus },
  {
    id: 4,
    type: "Train",
    route: "Red Line",
    from: "South Station",
    to: "City Center",
    price: 3.0,
    duration: "20 min",
    icon: Train,
  },
]

export function TransitTab() {
  const [selectedTransit, setSelectedTransit] = useState<number | null>(null)
  const [passengers, setPassengers] = useState(1)
  const { isConnected, connect } = usePiWallet()
  const { toast } = useToast()
  const { formatPriceWithUSD } = useCurrency()

  const handleConnectOrBook = async () => {
    console.log("[v0] Transit - Connect or Book clicked", { isConnected })

    if (!isConnected) {
      console.log("[v0] Transit - Wallet not connected, initiating connection...")
      await connect()
      return
    }

    await handleBookTransit()
  }

  const handleBookTransit = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Pi wallet to book transit.",
        variant: "destructive",
      })
      return
    }

    if (selectedTransit === null) {
      toast({
        title: "No transit selected",
        description: "Please select a transit option.",
        variant: "destructive",
      })
      return
    }

    const transit = transitOptions.find((t) => t.id === selectedTransit)
    if (!transit) return

    const baseAmount = transit.price * passengers
    const platformFee = baseAmount * 0.02
    const totalAmount = baseAmount + platformFee

    try {
      if (typeof window === "undefined" || !window.Pi || typeof window.Pi.createPayment !== "function") {
        toast({
          title: "Pi SDK not available",
          description: "Please make sure you're accessing this app through the Pi Browser.",
          variant: "destructive",
        })
        return
      }

      const paymentData = {
        amount: totalAmount,
        memo: `Transit: ${transit.route} - ${transit.from} to ${transit.to}`,
        metadata: {
          service: "transit",
          route: transit.route,
          passengers,
        },
      }

      window.Pi.createPayment(paymentData, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[v0] Transit - Payment ready for approval:", paymentId)
          try {
            const response = await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            })

            if (!response.ok) {
              throw new Error("Failed to approve payment")
            }

            console.log("[v0] Transit - Payment approved successfully")
          } catch (error) {
            console.error("[v0] Transit - Error approving payment:", error)
            toast({
              title: "Approval Failed",
              description: "Failed to approve payment. Please try again.",
              variant: "destructive",
            })
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("[v0] Transit - Payment completed:", { paymentId, txid })
          try {
            const response = await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            })

            if (!response.ok) {
              throw new Error("Failed to complete payment")
            }

            toast({
              title: "Tickets purchased!",
              description: `Successfully purchased ${passengers} ticket(s) for ${transit.route}`,
            })
          } catch (error) {
            console.error("[v0] Transit - Error completing payment:", error)
            toast({
              title: "Completion Failed",
              description: "Payment processed but completion failed. Contact support.",
              variant: "destructive",
            })
          }
        },
        onCancel: (paymentId: string) => {
          console.log("[v0] Transit - Payment cancelled:", paymentId)
          toast({
            title: "Payment cancelled",
            description: "You cancelled the payment.",
            variant: "destructive",
          })
        },
        onError: (error: Error, payment?: any) => {
          console.error("[v0] Transit - Payment error:", error)
          toast({
            title: "Payment failed",
            description: error.message || "Something went wrong with the payment.",
            variant: "destructive",
          })
        },
      })
    } catch (error: any) {
      console.error("[v0] Transit - Exception in handleBookTransit:", error)
      toast({
        title: "Booking failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const selectedOption = transitOptions.find((t) => t.id === selectedTransit)
  const totalCost = selectedOption ? selectedOption.price * passengers : 0
  const platformFee = totalCost * 0.02

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
          <Train className="w-6 h-6 text-primary" />
          Public Transit
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            <Bus className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Bus Transit</h3>
            <p className="text-slate-600 mb-4">City buses, express routes, and long-distance travel</p>
            <div className="inline-block px-4 py-2 bg-primary/20 text-primary font-semibold rounded-lg">
              Coming Soon
            </div>
          </Card>

          <Card className="p-8 text-center bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-2 border-blue-500/20">
            <Train className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Train Transit</h3>
            <p className="text-slate-600 mb-4">Subway, metro, and regional rail services</p>
            <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-600 font-semibold rounded-lg">
              Coming Soon
            </div>
          </Card>

          <Card className="p-8 text-center bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/20">
            <Bike className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Bike & Scooter</h3>
            <p className="text-slate-600 mb-4">Electric bikes and scooters for short trips</p>
            <div className="inline-block px-4 py-2 bg-green-500/20 text-green-600 font-semibold rounded-lg">
              Coming Soon
            </div>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border-2 border-slate-300">
          <div className="flex items-start gap-4">
            <MapPin className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Transit Partnerships in Development</h3>
              <p className="text-slate-700">
                We're negotiating with transit authorities and mobility providers to bring you seamless public
                transportation booking with Pi. Soon you'll be able to purchase bus tickets, train passes, and
                bike/scooter rentals all within the Pi Ride ecosystem.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
