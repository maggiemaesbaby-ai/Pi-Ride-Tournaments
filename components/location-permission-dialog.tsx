"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, X } from "lucide-react"

interface LocationPermissionDialogProps {
  onAllow: () => void
  onDeny: () => void
  show: boolean
}

export function LocationPermissionDialog({ onAllow, onDeny, show }: LocationPermissionDialogProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 bg-white shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Enable Location Services</h3>
              <p className="text-sm text-slate-600">Pi Ride needs your location</p>
            </div>
          </div>
          <Button onClick={onDeny} size="icon" variant="ghost" className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm font-semibold text-amber-900 mb-1">📍 Please Enable Location Services</p>
          <p className="text-xs text-amber-700">
            Make sure your device's location services are turned ON before allowing access. If disabled, go to your
            device settings to enable them first.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-slate-700">We need access to your location to:</p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Show you nearby services and businesses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Calculate accurate routes and distances</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Auto-fill pickup addresses for rides</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600">✓</span>
              <span>Find Pi-accepting businesses near you</span>
            </li>
          </ul>
          <p className="text-xs text-slate-500 mt-4">
            Your location data is only used to provide services and is never shared with third parties.
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={onAllow} className="flex-1 bg-purple-600 hover:bg-purple-700">
            <MapPin className="w-4 h-4 mr-2" />
            Allow Location Access
          </Button>
          <Button onClick={onDeny} variant="outline" className="flex-1 bg-transparent">
            Not Now
          </Button>
        </div>
      </Card>
    </div>
  )
}
