"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "@/lib/icons"

export function OnRoadTab() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-center">
            <Clock className="w-6 h-6 text-orange-600 mx-auto" />
            <span className="w-full">On Road Services Coming Soon</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg mb-4">
              Roadside assistance, truck stops, and rest area information will be available soon!
            </p>
            <p className="text-slate-500 text-sm">
              We're working on integrating comprehensive roadside services. Check back soon for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
