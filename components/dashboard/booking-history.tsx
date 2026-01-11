"use client"

import { Card } from "@/components/ui/card"
import { Car, Bike, Zap, Bus, Clock } from "lucide-react"

const bookings = [
  { id: 1, type: "Ride", service: "Economy", amount: 5.3, date: "2 hours ago", icon: Car, status: "completed" },
  { id: 2, type: "Rental", service: "Electric Bike", amount: 8.16, date: "1 day ago", icon: Bike, status: "completed" },
  {
    id: 3,
    type: "Charging",
    service: "Downtown Hub",
    amount: 4.59,
    date: "2 days ago",
    icon: Zap,
    status: "completed",
  },
  { id: 4, type: "Transit", service: "Blue Line", amount: 2.86, date: "3 days ago", icon: Bus, status: "completed" },
  { id: 5, type: "Ride", service: "Comfort", amount: 7.96, date: "4 days ago", icon: Car, status: "completed" },
]

export function BookingHistory() {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>

      <div className="space-y-3">
        {bookings.map((booking) => {
          const Icon = booking.icon
          return (
            <div
              key={booking.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{booking.type}</p>
                  <p className="text-sm text-muted-foreground">{booking.service}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-primary">{booking.amount} π</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{booking.date}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
