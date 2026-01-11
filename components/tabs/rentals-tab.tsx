"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "@/lib/icons"

export function RentalsTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-center">
            <Clock className="w-6 h-6 text-blue-600 mx-auto" />
            <span className="w-full">Rentals Coming Soon</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg mb-4">Scooter, bike, car, and van rentals will be available soon!</p>
            <p className="text-slate-500 text-sm">
              We're working on integrating rental services in your area. Check back soon for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
