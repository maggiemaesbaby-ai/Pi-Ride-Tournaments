"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, MapPin } from "@/lib/icons"

interface FindingDriverModalProps {
  open: boolean
  rideId: string
  pickupAddress: string
  dropoffAddress: string
  onDriverFound: (driverId: string, driverName: string) => void
  onTimeout: () => void
  onCancel: () => void
}

export function FindingDriverModal({
  open,
  rideId,
  pickupAddress,
  dropoffAddress,
  onDriverFound,
  onTimeout,
  onCancel,
}: FindingDriverModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(90)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    if (!open) {
      setTimeRemaining(90)
      return
    }

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Poll for driver acceptance every 2 seconds
    const pollInterval = setInterval(async () => {
      if (checkingStatus) return

      setCheckingStatus(true)
      try {
        const response = await fetch(`/api/rides/check-status?rideId=${rideId}`)
        const data = await response.json()

        if (data.status === "accepted") {
          clearInterval(pollInterval)
          clearInterval(countdownInterval)
          onDriverFound(data.driverId, data.driverName)
        } else if (data.status === "expired" || data.timeElapsed >= 90) {
          clearInterval(pollInterval)
          clearInterval(countdownInterval)
          onTimeout()
        }
      } catch (error) {
        console.error("[v0] Error checking ride status:", error)
      } finally {
        setCheckingStatus(false)
      }
    }, 2000)

    return () => {
      clearInterval(countdownInterval)
      clearInterval(pollInterval)
    }
  }, [open, rideId, onDriverFound, onTimeout, checkingStatus])

  const progress = (timeRemaining / 90) * 100

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Finding Your Driver
          </DialogTitle>
          <DialogDescription>Searching for nearby drivers...</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Countdown */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{timeRemaining}s</div>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              {timeRemaining > 60
                ? "Notifying drivers..."
                : timeRemaining > 30
                  ? "Waiting for response..."
                  : "Almost there..."}
            </p>
          </div>

          {/* Trip Details */}
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Pickup</p>
                <p className="text-sm font-medium truncate">{pickupAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Dropoff</p>
                <p className="text-sm font-medium truncate">{dropoffAddress}</p>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <Button onClick={onCancel} variant="outline" className="w-full bg-transparent">
            Cancel Request
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            If no driver accepts within 90 seconds, your payment will be automatically refunded.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
