"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Store, MapPin, Package } from "@/lib/icons"
import Link from "next/link"

export function PiBusinessesBanner() {
  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">Pi-Accepting Businesses</h3>
            </div>
            <p className="text-amber-800 dark:text-amber-200 text-balance">
              Accept Pi payments and reach millions of Pi users! Get listed on our map for free or open a full
              marketplace store.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <MapPin className="h-4 w-4" />
                <span>Free Map Listing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                <Package className="h-4 w-4" />
                <span>Marketplace Store (3-5% fee)</span>
              </div>
            </div>
          </div>

          <Link href="/marketplace-business-application">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg whitespace-nowrap">
              Apply Now
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
