"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
// Using Safari-compatible fallback icons from @/lib/icons
import { AlertTriangle, Phone, MapPin, Share2 } from '@/lib/icons'
import { useToast } from "@/hooks/use-toast"

interface EmergencySOSProps {
  isOpen: boolean
  onClose: () => void
  currentLocation?: { lat: number; lng: number }
  tripDetails?: {
    pickup: string
    destination: string
    driver?: string
  }
}

export function EmergencySOS({ isOpen, onClose, currentLocation, tripDetails }: EmergencySOSProps) {
  const { toast } = useToast()

  const emergencyContacts = [
    { name: "Emergency Services", number: "911", icon: "🚨" },
    { name: "Local Police", number: "911", icon: "👮" },
    { name: "Roadside Assistance", number: "1-800-AAA-HELP", icon: "🚗" },
  ]

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`
  }

  const handleShareLocation = () => {
    if (currentLocation) {
      const message = `Emergency: I need help at https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}${tripDetails ? ` - Trip from ${tripDetails.pickup} to ${tripDetails.destination}` : ''}`
      
      if (navigator.share) {
        navigator.share({
          title: "Emergency Location",
          text: message,
        })
      } else {
        navigator.clipboard.writeText(message)
        toast({
          title: "Location copied",
          description: "Share this with emergency contacts",
        })
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-6 h-6" />
            Emergency SOS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-destructive/10 border-2 border-destructive">
            <p className="text-sm font-semibold text-destructive mb-2">In case of emergency</p>
            <p className="text-xs text-slate-600">
              Call emergency services immediately. Your location and trip details are ready to share.
            </p>
          </Card>

          <div className="space-y-2">
            {emergencyContacts.map((contact) => (
              <Card key={contact.number} className="p-3 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handleCall(contact.number)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{contact.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{contact.name}</p>
                      <p className="text-xs text-slate-600">{contact.number}</p>
                    </div>
                  </div>
                  <Phone className="w-5 h-5 text-destructive" />
                </div>
              </Card>
            ))}
          </div>

          {currentLocation && (
            <Button onClick={handleShareLocation} variant="outline" className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Share Current Location
            </Button>
          )}

          {tripDetails && (
            <Card className="p-3 bg-slate-50 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">Trip Information</p>
              <p className="text-xs text-slate-600">From: {tripDetails.pickup}</p>
              <p className="text-xs text-slate-600">To: {tripDetails.destination}</p>
              {tripDetails.driver && <p className="text-xs text-slate-600">Driver: {tripDetails.driver}</p>}
            </Card>
          )}

          <Button onClick={onClose} variant="ghost" className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
