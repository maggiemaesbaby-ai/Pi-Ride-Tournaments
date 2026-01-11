"use client"
import { forwardRef, useImperativeHandle, useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Using Safari-compatible fallback icons from @/lib/icons
import {
  Car as CarIcon,
  Package as PackageIcon,
  UtensilsCrossed as UtensilsCrossedIcon,
  Bitcoin as BitcoinIcon,
  MapPin as MapIcon,
  ShoppingCart,
  Bike,
  Zap,
  Bus,
  Hotel,
  Fuel,
  ShieldCheck,
  Wrench,
  Compass,
} from "@/lib/icons"
import { RidesTab } from "@/components/tabs/rides-tab"
import { RentalsTab } from "@/components/tabs/rentals-tab"
import { ChargingTab } from "@/components/tabs/charging-tab"
import { TransitTab } from "@/components/tabs/transit-tab"
import { MapTab } from "@/components/tabs/map-tab"
import { FoodTab } from "@/components/tabs/food-tab"
import { GasTab } from "@/components/tabs/gas-tab"
import { AccommodationTab } from "@/components/tabs/accommodation-tab"
import { TravelEssentialsTab } from "@/components/tabs/travel-essentials-tab"
import { OnRoadTab } from "@/components/tabs/on-road-tab"
import { EntertainmentTab } from "@/components/tabs/entertainment-tab"
import { VehiclesTab } from "@/components/tabs/vehicles-tab"
import { PackagesTab } from "@/components/tabs/packages-tab"
import { CryptoTab } from "@/components/tabs/crypto-tab"
import { ShoppingTab } from "@/components/tabs/shopping-tab"

interface ServiceTabsProps {
  onTabChange?: (tab: string) => void
}

export const ServiceTabs = forwardRef<{ setTab: (tab: string) => void; scrollToTabs: () => void }, ServiceTabsProps>(
  ({ onTabChange }, ref) => {
    const [value, setValue] = useState("rides")
    const tabsRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      setTab: (tab: string) => {
        setValue(tab)
        if (onTabChange) {
          onTabChange(tab)
        }
      },
      scrollToTabs: () => {
        if (tabsRef.current) {
          try {
            const element = tabsRef.current
            const headerOffset = 100 // Increased offset to account for header
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset

            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            })

            console.log("[v0] Scrolled to service tabs")
          } catch (error) {
            console.error("[v0] Error scrolling to tabs:", error)
          }
        } else {
          console.warn("[v0] Tabs ref not available for scrolling")
        }
      },
    }))

    const handleValueChange = (newValue: string) => {
      console.log("[v0] Tab changed to:", newValue)
      setValue(newValue)
      if (onTabChange) {
        onTabChange(newValue)
      }
    }

    return (
      <Tabs value={value} onValueChange={handleValueChange} className="w-full" id="services-section" ref={tabsRef}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-8 h-auto p-1 gap-1">
          <TabsTrigger value="rides" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <CarIcon className="w-5 h-5" />
            <span className="text-xs md:text-sm">Rides</span>
          </TabsTrigger>
          <TabsTrigger value="food" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <UtensilsCrossedIcon className="w-5 h-5" />
            <span className="text-xs md:text-sm">Food</span>
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <PackageIcon className="w-5 h-5" />
            <span className="text-xs md:text-sm">Packages</span>
          </TabsTrigger>
          <TabsTrigger value="accommodation" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <Hotel className="w-5 h-5" />
            <span className="text-xs md:text-sm">Stay</span>
          </TabsTrigger>
          <TabsTrigger value="rentals" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <Bike className="w-5 h-5" />
            <span className="text-xs md:text-sm">Rentals</span>
          </TabsTrigger>
          <TabsTrigger value="charging" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <Zap className="w-5 h-5" />
            <span className="text-xs md:text-sm">EV</span>
          </TabsTrigger>
          <TabsTrigger value="gas" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <Fuel className="w-5 h-5" />
            <span className="text-xs md:text-sm">Gas</span>
          </TabsTrigger>
          <TabsTrigger value="travel-essentials" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs md:text-sm">Essentials</span>
          </TabsTrigger>
          <TabsTrigger value="transit" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <Bus className="w-5 h-5" />
            <span className="text-xs md:text-sm">Transit</span>
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <CarIcon className="w-5 h-5" />
            <span className="text-xs md:text-sm">Vehicles</span>
          </TabsTrigger>
          <TabsTrigger value="on-road" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <Wrench className="w-5 h-5" />
            <span className="text-xs md:text-sm">On Road</span>
          </TabsTrigger>
          <TabsTrigger value="entertainment" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <Compass className="w-5 h-5" />
            <span className="text-xs md:text-sm">Fun</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <MapIcon className="w-5 h-5" />
            <span className="text-xs md:text-sm">Map</span>
          </TabsTrigger>
          <TabsTrigger value="crypto" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <BitcoinIcon className="w-5 h-5" />
            <span className="text-xs md:text-sm">Crypto</span>
          </TabsTrigger>
          <TabsTrigger value="shopping" className="flex flex-col md:flex-row items-center gap-2 py-3">
            <ShoppingCart className="w-5 h-5" />
            <span className="text-xs md:text-sm">Shop</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rides" className="mt-6">
          <RidesTab />
        </TabsContent>

        <TabsContent value="food" className="mt-6">
          <FoodTab />
        </TabsContent>

        <TabsContent value="packages" className="mt-6">
          <PackagesTab />
        </TabsContent>

        <TabsContent value="accommodation" className="mt-6">
          <AccommodationTab />
        </TabsContent>

        <TabsContent value="rentals" className="mt-6">
          <RentalsTab />
        </TabsContent>

        <TabsContent value="charging" className="mt-6">
          <ChargingTab />
        </TabsContent>

        <TabsContent value="gas" className="mt-6">
          <GasTab />
        </TabsContent>

        <TabsContent value="travel-essentials" className="mt-6">
          <TravelEssentialsTab />
        </TabsContent>

        <TabsContent value="transit" className="mt-6">
          <TransitTab />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6">
          <VehiclesTab />
        </TabsContent>

        <TabsContent value="on-road" className="mt-6">
          <OnRoadTab />
        </TabsContent>

        <TabsContent value="entertainment" className="mt-6">
          <EntertainmentTab />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          {value === "map" ? <MapTab /> : null}
        </TabsContent>

        <TabsContent value="crypto" className="mt-6">
          <CryptoTab />
        </TabsContent>

        <TabsContent value="shopping" className="mt-6">
          <ShoppingTab />
        </TabsContent>
      </Tabs>
    )
  },
)

ServiceTabs.displayName = "ServiceTabs"
