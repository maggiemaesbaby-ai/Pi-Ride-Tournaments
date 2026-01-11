"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Share2, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TripShareDialogProps {
  pickup: string
  destination: string
  driverName?: string
  isOpen: boolean
  onClose: () => void
}

export function TripShareDialog({ pickup, destination, driverName, isOpen, onClose }: TripShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const shareLink = `${window.location.origin}/track/${btoa(JSON.stringify({ pickup, destination, timestamp: Date.now() }))}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Link copied!",
      description: "Share this with friends or family to track your ride",
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Track my Pi Ride",
          text: `I'm taking a ride from ${pickup} to ${destination}. Track me here:`,
          url: shareLink,
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopy()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Trip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-medium mb-2">Trip Details</p>
            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>From:</strong> {pickup}
              </p>
              <p>
                <strong>To:</strong> {destination}
              </p>
              {driverName && (
                <p>
                  <strong>Driver:</strong> {driverName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Share this link with friends or family so they can track your ride in real-time
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 text-xs border-2 rounded-lg bg-white border-slate-300 text-slate-900"
              />
              <Button onClick={handleCopy} variant="outline" className="shrink-0 bg-transparent">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <Button onClick={handleShare} className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Share Trip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
