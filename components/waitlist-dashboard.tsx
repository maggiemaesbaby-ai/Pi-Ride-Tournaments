"use client"

import { useState, useEffect } from "react"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, X, Bell, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WaitlistEntry {
  id: string
  city: string
  pickup_address: string
  dropoff_address: string
  service_type: string
  created_at: string
  notified: boolean
}

export function WaitlistDashboard() {
  const { user } = usePiWallet()
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [notifiedEntries, setNotifiedEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!user?.wallet) return

    const fetchWaitlist = async () => {
      try {
        // Fetch all waitlist entries (notified and not notified)
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()

        const { data, error } = await supabase
          .from("driver_waitlist")
          .select("*")
          .eq("pi_user_id", user.wallet)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Supabase error:", error)
          throw error
        }

        console.log("[v0] Fetched waitlist entries:", data)

        const allEntries = data || []
        const notified = allEntries.filter((entry) => entry.notified)
        const pending = allEntries.filter((entry) => !entry.notified)

        console.log("[v0] Notified entries:", notified.length, "Pending entries:", pending.length)

        setNotifiedEntries(notified)
        setWaitlist(pending)

        // Show notification dialog if there are new notifications
        if (notified.length > 0) {
          setShowNotificationDialog(true)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch waitlist:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWaitlist()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchWaitlist, 30000)
    return () => clearInterval(interval)
  }, [user?.wallet])

  const handleAcknowledgeNotification = async (entryId: string) => {
    try {
      const response = await fetch("/api/rides/waitlist/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piUserId: user?.wallet, entryId }),
      })

      const data = await response.json()

      if (data.success) {
        // Remove from notified entries
        setNotifiedEntries((prev) => prev.filter((entry) => entry.id !== entryId))

        // Close dialog if no more notifications
        if (notifiedEntries.length === 1) {
          setShowNotificationDialog(false)
        }

        toast({
          title: "Great! Drivers are ready",
          description: "Head to the rides section to book your ride",
        })
      }
    } catch (error) {
      console.error("[v0] Failed to acknowledge notification:", error)
      toast({
        title: "Error",
        description: "Failed to acknowledge notification",
        variant: "destructive",
      })
    }
  }

  const handleRemove = async (entryId: string, city: string) => {
    try {
      const response = await fetch("/api/rides/waitlist/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piUserId: user?.wallet, city }),
      })

      const data = await response.json()

      if (data.success) {
        setWaitlist((prev) => prev.filter((entry) => entry.id !== entryId))
        toast({
          title: "Removed from waitlist",
          description: "You won't receive notifications for this ride request anymore",
        })
      }
    } catch (error) {
      console.error("[v0] Failed to remove from waitlist:", error)
      toast({
        title: "Error",
        description: "Failed to remove from waitlist",
        variant: "destructive",
      })
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">Loading waitlist...</CardContent>
      </Card>
    )
  }

  const totalEntries = waitlist.length + notifiedEntries.length

  if (totalEntries === 0) {
    return (
      <Card className="p-12 text-center">
        <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No Active Waitlist Requests</h3>
        <p className="text-muted-foreground mb-4">
          When you search for rides in areas without drivers, you'll see your waitlist requests here
        </p>
      </Card>
    )
  }

  return (
    <>
      {/* Notification Dialog for drivers available */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">Drivers Now Available!</DialogTitle>
                <DialogDescription>Great news for your ride requests</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {notifiedEntries.map((entry) => (
              <Card key={entry.id} className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs bg-white dark:bg-gray-900">
                      {entry.city}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="font-medium">From:</span>
                      <span className="text-muted-foreground">{entry.pickup_address || entry.city}</span>
                    </div>
                    {entry.dropoff_address && (
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-green-600" />
                        <span className="font-medium">To:</span>
                        <span className="text-muted-foreground">{entry.dropoff_address}</span>
                      </div>
                    )}
                  </div>
                  <Button size="sm" className="w-full mt-3" onClick={() => handleAcknowledgeNotification(entry.id)}>
                    Got it! Book My Ride
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              Closing this will mark notifications as read and remove them from your waitlist
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main waitlist dashboard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Waitlist Requests</h2>
          <div className="flex items-center gap-2">
            {notifiedEntries.length > 0 && (
              <Badge variant="default" className="bg-green-600 gap-1">
                <Bell className="w-3 h-3" />
                {notifiedEntries.length} Available
              </Badge>
            )}
            {waitlist.length > 0 && <Badge variant="secondary">{waitlist.length} Pending</Badge>}
          </div>
        </div>

        {/* Notified entries with green indicator */}
        {notifiedEntries.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Drivers Available - Ready to Book
            </h3>
            {notifiedEntries.map((entry) => (
              <Card key={entry.id} className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs bg-white dark:bg-gray-900">
                          {entry.city}
                        </Badge>
                        <Badge variant="default" className="text-xs bg-green-600">
                          {entry.service_type || "Economy"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="font-medium">From:</span>
                          <span className="text-muted-foreground">{entry.pickup_address || entry.city}</span>
                        </div>
                        {entry.dropoff_address && (
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-green-600" />
                            <span className="font-medium">To:</span>
                            <span className="text-muted-foreground">{entry.dropoff_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-3" onClick={() => handleAcknowledgeNotification(entry.id)}>
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pending waitlist entries */}
        {waitlist.length > 0 && (
          <div className="space-y-3">
            {notifiedEntries.length > 0 && (
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Waiting for Drivers
              </h3>
            )}
            {waitlist.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.city}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {entry.service_type || "Economy"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">From:</span>
                          <span className="text-muted-foreground">{entry.pickup_address || entry.city}</span>
                        </div>
                        {entry.dropoff_address && (
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-secondary" />
                            <span className="font-medium">To:</span>
                            <span className="text-muted-foreground">{entry.dropoff_address}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Added {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(entry.id, entry.city)}
                      className="ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      ✨ We'll notify you immediately when drivers become available in this area
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
