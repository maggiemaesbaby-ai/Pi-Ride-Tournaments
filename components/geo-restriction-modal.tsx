"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Globe, AlertTriangle } from "lucide-react"
import { verifyLocation, type GeoRestriction } from "@/lib/geo-blocking"

interface GeoRestrictionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: (restriction: GeoRestriction) => void
  attemptedAction: string
}

export function GeoRestrictionModal({ open, onOpenChange, onVerified, attemptedAction }: GeoRestrictionModalProps) {
  const [verifying, setVerifying] = useState(false)
  const [restriction, setRestriction] = useState<GeoRestriction | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && !restriction && !verifying) {
      handleVerify()
    }
  }, [open])

  const handleVerify = async () => {
    setVerifying(true)
    setError(null)

    try {
      const result = await verifyLocation()
      setRestriction(result)

      // Log verification
      await fetch("/api/geo/log-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          piUserId: null, // Will be set server-side from auth
          verificationType: "ip",
          locationData: result.location,
          isRestricted: result.isRestricted,
          restrictionReason: result.restrictionReason,
          attemptedAction,
        }),
      })

      onVerified(result)
    } catch (err) {
      console.error("[GEO MODAL] Verification failed:", err)
      setError("Failed to verify your location. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Verification Required
          </DialogTitle>
          <DialogDescription>
            We need to verify your location to ensure compliance with skill gaming regulations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {verifying && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Verifying your location...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {restriction && !verifying && (
            <>
              <div className="rounded-lg border bg-muted p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Location Detected:</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {restriction.location.city && `${restriction.location.city}, `}
                  {restriction.location.state && `${restriction.location.state}, `}
                  {restriction.location.country}
                </p>
              </div>

              {restriction.isRestricted ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-1">{restriction.restrictionReason}</p>
                    {restriction.allowFreePlay && (
                      <p className="text-sm">You can still play free games without entry fees.</p>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    Your location is verified! You can participate in paid tournaments.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {restriction?.isRestricted && restriction.allowFreePlay && (
            <Button onClick={() => onOpenChange(false)}>Continue to Free Play</Button>
          )}
          {!restriction?.isRestricted && restriction && <Button onClick={() => onOpenChange(false)}>Continue</Button>}
          {error && (
            <Button onClick={handleVerify} disabled={verifying}>
              Try Again
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
