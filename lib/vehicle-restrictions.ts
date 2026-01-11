// Vehicle age restrictions based on Uber/Lyft standards by location

export interface VehicleAgeRestriction {
  location: string // Country, state, or city
  locationType: "country" | "state" | "city"
  maxVehicleAge: number // Years from current year
  minVehicleYear?: number // Absolute minimum year (overrides maxAge if newer)
  exceptions?: string[] // Vehicle types that may have different rules
}

// Current year for calculations
const CURRENT_YEAR = new Date().getFullYear()

// Vehicle age restrictions database (based on Uber/Lyft standards)
export const VEHICLE_RESTRICTIONS: VehicleAgeRestriction[] = [
  // United States - Default
  { location: "US", locationType: "country", maxVehicleAge: 15, minVehicleYear: 2010 },

  // US States with stricter requirements
  { location: "California", locationType: "state", maxVehicleAge: 12, minVehicleYear: 2013 },
  { location: "New York", locationType: "state", maxVehicleAge: 10, minVehicleYear: 2015 },
  { location: "Washington", locationType: "state", maxVehicleAge: 15, minVehicleYear: 2010 },
  { location: "Massachusetts", locationType: "state", maxVehicleAge: 12, minVehicleYear: 2013 },
  { location: "Illinois", locationType: "state", maxVehicleAge: 12, minVehicleYear: 2013 },
  { location: "Texas", locationType: "state", maxVehicleAge: 15, minVehicleYear: 2010 },
  { location: "Florida", locationType: "state", maxVehicleAge: 15, minVehicleYear: 2010 },

  // International - Country defaults
  { location: "GB", locationType: "country", maxVehicleAge: 10, minVehicleYear: 2015 },
  { location: "IN", locationType: "country", maxVehicleAge: 10, minVehicleYear: 2015 },
  { location: "BR", locationType: "country", maxVehicleAge: 12, minVehicleYear: 2013 },
  { location: "MX", locationType: "country", maxVehicleAge: 12, minVehicleYear: 2013 },
  { location: "VN", locationType: "country", maxVehicleAge: 10, minVehicleYear: 2015 },
  { location: "NG", locationType: "country", maxVehicleAge: 15, minVehicleYear: 2010 },
  { location: "ID", locationType: "country", maxVehicleAge: 10, minVehicleYear: 2015 },
  { location: "KR", locationType: "country", maxVehicleAge: 8, minVehicleYear: 2017 },
  { location: "FR", locationType: "country", maxVehicleAge: 10, minVehicleYear: 2015 },
  { location: "PH", locationType: "country", maxVehicleAge: 12, minVehicleYear: 2013 },

  // Major city overrides
  { location: "London", locationType: "city", maxVehicleAge: 8, minVehicleYear: 2017 },
  { location: "Mumbai", locationType: "city", maxVehicleAge: 8, minVehicleYear: 2017 },
  { location: "São Paulo", locationType: "city", maxVehicleAge: 10, minVehicleYear: 2015 },
  { location: "Mexico City", locationType: "city", maxVehicleAge: 10, minVehicleYear: 2015 },
  { location: "Ho Chi Minh City", locationType: "city", maxVehicleAge: 8, minVehicleYear: 2017 },
  { location: "Jakarta", locationType: "city", maxVehicleAge: 8, minVehicleYear: 2017 },
  { location: "Seoul", locationType: "city", maxVehicleAge: 7, minVehicleYear: 2018 },
  { location: "Paris", locationType: "city", maxVehicleAge: 8, minVehicleYear: 2017 },
  { location: "Manila", locationType: "city", maxVehicleAge: 10, minVehicleYear: 2015 },
]

export interface VehicleValidationResult {
  isValid: boolean
  minYear: number
  maxYear: number
  message: string
  restriction?: VehicleAgeRestriction
}

/**
 * Validates vehicle year against location-specific restrictions
 * Priority: City > State > Country
 */
export function validateVehicleYear(
  vehicleYear: number,
  country: string,
  state?: string,
  city?: string,
): VehicleValidationResult {
  // Find applicable restriction (most specific first)
  let applicableRestriction: VehicleAgeRestriction | undefined

  // Check city first (most specific)
  if (city) {
    applicableRestriction = VEHICLE_RESTRICTIONS.find((r) => r.locationType === "city" && r.location === city)
  }

  // Check state if no city match
  if (!applicableRestriction && state) {
    applicableRestriction = VEHICLE_RESTRICTIONS.find((r) => r.locationType === "state" && r.location === state)
  }

  // Check country if no state match
  if (!applicableRestriction && country) {
    applicableRestriction = VEHICLE_RESTRICTIONS.find((r) => r.locationType === "country" && r.location === country)
  }

  // Default restriction if no match found (15 years old, 2010+)
  if (!applicableRestriction) {
    applicableRestriction = {
      location: "Default",
      locationType: "country",
      maxVehicleAge: 15,
      minVehicleYear: 2010,
    }
  }

  // Calculate minimum year based on restriction
  const minYearByAge = CURRENT_YEAR - applicableRestriction.maxVehicleAge
  const minYear = Math.max(minYearByAge, applicableRestriction.minVehicleYear || minYearByAge)
  const maxYear = CURRENT_YEAR + 1 // Allow next year's models

  // Validate
  const isValid = vehicleYear >= minYear && vehicleYear <= maxYear

  let message = ""
  if (!isValid) {
    if (vehicleYear < minYear) {
      const locationName = city || state || country || "this location"
      message = `Vehicle must be ${applicableRestriction.maxVehicleAge} years old or newer (${minYear}+) for ${locationName}`
    } else if (vehicleYear > maxYear) {
      message = `Vehicle year cannot be more than ${maxYear}`
    }
  } else {
    message = `Vehicle year ${vehicleYear} meets requirements`
  }

  return {
    isValid,
    minYear,
    maxYear,
    message,
    restriction: applicableRestriction,
  }
}

/**
 * Get human-readable restriction info for a location
 */
export function getVehicleRequirements(
  country: string,
  state?: string,
  city?: string,
): {
  minYear: number
  maxAge: number
  location: string
} {
  // Find applicable restriction (same logic as validation)
  let applicableRestriction: VehicleAgeRestriction | undefined

  if (city) {
    applicableRestriction = VEHICLE_RESTRICTIONS.find((r) => r.locationType === "city" && r.location === city)
  }

  if (!applicableRestriction && state) {
    applicableRestriction = VEHICLE_RESTRICTIONS.find((r) => r.locationType === "state" && r.location === state)
  }

  if (!applicableRestriction && country) {
    applicableRestriction = VEHICLE_RESTRICTIONS.find((r) => r.locationType === "country" && r.location === country)
  }

  if (!applicableRestriction) {
    applicableRestriction = {
      location: "Default",
      locationType: "country",
      maxVehicleAge: 15,
      minVehicleYear: 2010,
    }
  }

  const minYearByAge = CURRENT_YEAR - applicableRestriction.maxVehicleAge
  const minYear = Math.max(minYearByAge, applicableRestriction.minVehicleYear || minYearByAge)

  return {
    minYear,
    maxAge: applicableRestriction.maxVehicleAge,
    location: city || state || country || "your location",
  }
}
