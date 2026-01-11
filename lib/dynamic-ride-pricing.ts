// Dynamic ride pricing system based on Uber/Lyft market rates

export interface PricingFactors {
  baseDistance: number // miles
  baseDuration: number // minutes
  timeOfDay: number // 0-23
  dayOfWeek: number // 0-6 (0 = Sunday)
  weatherCondition?: "clear" | "rain" | "snow" | "storm"
  specialEvents?: boolean
  driverAvailability: number // number of available drivers
  rideQueue: number // number of pending ride requests
}

export interface MarketRates {
  uberEconomy: number // cost per mile
  lyftStandard: number
  uberXL: number
  lyftLux: number
}

// Base rates per mile (in USD, will convert to Pi)
const BASE_RATES: MarketRates = {
  uberEconomy: 1.5,
  lyftStandard: 1.4,
  uberXL: 2.2,
  lyftLux: 3.5,
}

// Time-based surge multipliers
function getTimeMultiplier(hour: number, day: number): number {
  // Peak morning commute (Mon-Fri, 7-9am): 1.3x
  if (day >= 1 && day <= 5 && hour >= 7 && hour < 9) {
    return 1.3
  }

  // Peak evening commute (Mon-Fri, 5-7pm): 1.4x
  if (day >= 1 && day <= 5 && hour >= 17 && hour < 19) {
    return 1.4
  }

  // Late night (10pm-4am): 1.2x
  if (hour >= 22 || hour < 4) {
    return 1.2
  }

  // Weekend nights (Fri-Sat, 8pm-2am): 1.5x
  if ((day === 5 || day === 6) && hour >= 20) {
    return 1.5
  }

  // Regular hours: 1.0x
  return 1.0
}

// Supply/demand multiplier
function getSupplyDemandMultiplier(driverAvailability: number, rideQueue: number): number {
  if (driverAvailability === 0) return 2.0 // High surge when no drivers

  const demandRatio = rideQueue / driverAvailability

  if (demandRatio > 3) return 1.8 // Very high demand
  if (demandRatio > 2) return 1.5 // High demand
  if (demandRatio > 1) return 1.3 // Moderate demand
  if (demandRatio > 0.5) return 1.1 // Slight demand

  return 0.95 // Low demand discount
}

// Weather multiplier
function getWeatherMultiplier(condition?: string): number {
  switch (condition) {
    case "storm":
      return 1.5
    case "snow":
      return 1.4
    case "rain":
      return 1.2
    default:
      return 1.0
  }
}

// Calculate market-competitive price
export function calculateDynamicPrice(
  vehicleType: "economy" | "premium" | "xl",
  factors: PricingFactors,
  piPrice = 0.22, // Current Pi/USD rate
): {
  basePrice: number // in Pi
  surgeMultiplier: number
  finalPrice: number // in Pi
  breakdown: {
    baseFare: number
    timeMultiplier: number
    supplyDemandMultiplier: number
    weatherMultiplier: number
  }
} {
  // Get market base rate for vehicle type
  let marketRatePerMile: number
  switch (vehicleType) {
    case "economy":
      marketRatePerMile = (BASE_RATES.uberEconomy + BASE_RATES.lyftStandard) / 2
      break
    case "premium":
      marketRatePerMile = BASE_RATES.lyftLux
      break
    case "xl":
      marketRatePerMile = BASE_RATES.uberXL
      break
  }

  // Calculate base fare in USD
  const baseFareUSD = marketRatePerMile * factors.baseDistance + factors.baseDuration * 0.3 // $0.30 per minute

  // Apply multipliers
  const timeMultiplier = getTimeMultiplier(factors.timeOfDay, factors.dayOfWeek)
  const supplyDemandMultiplier = getSupplyDemandMultiplier(factors.driverAvailability, factors.rideQueue)
  const weatherMultiplier = getWeatherMultiplier(factors.weatherCondition)
  const eventMultiplier = factors.specialEvents ? 1.3 : 1.0

  // Calculate surge multiplier
  const surgeMultiplier = timeMultiplier * supplyDemandMultiplier * weatherMultiplier * eventMultiplier

  // Final price in USD
  const finalPriceUSD = baseFareUSD * surgeMultiplier

  // Convert to Pi (slightly undercut market to attract users)
  const piDiscount = 0.95 // 5% cheaper than traditional rideshare
  const finalPricePi = (finalPriceUSD / piPrice) * piDiscount

  return {
    basePrice: baseFareUSD / piPrice,
    surgeMultiplier,
    finalPrice: Math.round(finalPricePi * 100) / 100, // Round to 2 decimals
    breakdown: {
      baseFare: baseFareUSD,
      timeMultiplier,
      supplyDemandMultiplier,
      weatherMultiplier,
    },
  }
}

// Get current pricing for display
export function getCurrentRidePricing(
  distance: number,
  duration: number,
  availableDrivers: number,
  queueLength: number,
  piPrice: number,
): {
  economy: number
  premium: number
  xl: number
  surge: string
} {
  const now = new Date()
  const factors: PricingFactors = {
    baseDistance: distance,
    baseDuration: duration,
    timeOfDay: now.getHours(),
    dayOfWeek: now.getDay(),
    driverAvailability: availableDrivers,
    rideQueue: queueLength,
  }

  const economy = calculateDynamicPrice("economy", factors, piPrice)
  const premium = calculateDynamicPrice("premium", factors, piPrice)
  const xl = calculateDynamicPrice("xl", factors, piPrice)

  let surgeText = ""
  if (economy.surgeMultiplier > 1.5) surgeText = "High demand - Prices increased"
  else if (economy.surgeMultiplier > 1.2) surgeText = "Moderate demand"
  else if (economy.surgeMultiplier < 1.0) surgeText = "Low demand - Discounted prices!"

  return {
    economy: economy.finalPrice,
    premium: premium.finalPrice,
    xl: xl.finalPrice,
    surge: surgeText,
  }
}
