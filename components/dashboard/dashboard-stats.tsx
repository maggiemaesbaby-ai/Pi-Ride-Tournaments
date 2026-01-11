"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, Calendar, Zap, DollarSign } from "lucide-react"

export function DashboardStats() {
  const stats = [
    { label: "Total Bookings", value: "24", icon: Calendar, change: "+12%", trend: "up" },
    { label: "Total Spent", value: "156.8 π", icon: DollarSign, change: "+8%", trend: "up" },
    { label: "Platform Fees Paid", value: "3.14 π", icon: Zap, change: "2%", trend: "neutral" },
    { label: "Savings", value: "12.5 π", icon: TrendingUp, change: "+15%", trend: "up" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-sm font-medium ${stat.trend === "up" ? "text-success" : "text-muted-foreground"}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </Card>
        )
      })}
    </div>
  )
}
