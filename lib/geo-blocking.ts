// Geo-blocking service for skill gaming compliance

export interface GeoLocation {
  country: string
  countryCode: string
  state?: string
  stateCode?: string
  city?: string
  latitude?: number
  longitude?: number
  ip?: string
}

export interface GeoRestriction {
  isRestricted: boolean
  allowFreePlay: boolean
  restrictionReason?: string
  location: GeoLocation
}

// Get location from IP address using ip-api.com (free, no API key needed)
export async function getLocationFromIP(ip?: string): Promise<GeoLocation | null> {
  try {
    const targetIp = ip || "check" // 'check' uses requester's IP
    const response = await fetch(
      `http://ip-api.com/json/${targetIp}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,query`,
    )

    if (!response.ok) {
      console.error("[GEO] IP lookup failed:", response.status)
      return null
    }

    const data = await response.json()

    if (data.status !== "success") {
      console.error("[GEO] IP lookup error:", data.message)
      return null
    }

    return {
      country: data.country,
      countryCode: data.countryCode,
      state: data.regionName,
      stateCode: data.region,
      city: data.city,
      latitude: data.lat,
      longitude: data.lon,
      ip: data.query,
    }
  } catch (error) {
    console.error("[GEO] IP lookup exception:", error)
    return null
  }
}

// Check if location is restricted for paid tournaments
export async function checkGeoRestriction(location: GeoLocation): Promise<GeoRestriction> {
  try {
    const response = await fetch("/api/geo/check-restriction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(location),
    })

    if (!response.ok) {
      console.error("[GEO] Restriction check failed:", response.status)
      // Default to restricted if check fails (safe default)
      return {
        isRestricted: true,
        allowFreePlay: true,
        restrictionReason: "Unable to verify location",
        location,
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[GEO] Restriction check exception:", error)
    return {
      isRestricted: true,
      allowFreePlay: true,
      restrictionReason: "Unable to verify location",
      location,
    }
  }
}

// Get GPS location from browser
export async function getGPSLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (!navigator.geolocation) {
    console.warn("[GEO] Geolocation not supported")
    return null
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        console.error("[GEO] GPS error:", error.message)
        resolve(null)
      },
      { timeout: 10000, maximumAge: 300000 },
    )
  })
}

// Reverse geocode GPS coordinates to get location
export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocation | null> {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${lat},${lon}?fields=status,message,country,countryCode,region,regionName,city`,
    )

    if (!response.ok) {
      console.error("[GEO] Reverse geocode failed:", response.status)
      return null
    }

    const data = await response.json()

    if (data.status !== "success") {
      console.error("[GEO] Reverse geocode error:", data.message)
      return null
    }

    return {
      country: data.country,
      countryCode: data.countryCode,
      state: data.regionName,
      stateCode: data.region,
      city: data.city,
      latitude: lat,
      longitude: lon,
    }
  } catch (error) {
    console.error("[GEO] Reverse geocode exception:", error)
    return null
  }
}

// Comprehensive location check with both IP and GPS
export async function verifyLocation(): Promise<GeoRestriction> {
  console.log("[GEO] Starting location verification...")

  // Try IP-based location first (faster, always available)
  let location = await getLocationFromIP()

  if (!location) {
    console.warn("[GEO] IP location failed, trying GPS...")
    // Fallback to GPS if IP fails
    const gpsCoords = await getGPSLocation()
    if (gpsCoords) {
      location = await reverseGeocode(gpsCoords.latitude, gpsCoords.longitude)
    }
  }

  if (!location) {
    console.error("[GEO] All location methods failed")
    return {
      isRestricted: true,
      allowFreePlay: true,
      restrictionReason: "Unable to determine location",
      location: { country: "Unknown", countryCode: "XX" },
    }
  }

  console.log("[GEO] Location determined:", location)

  // Check if location is restricted
  const restriction = await checkGeoRestriction(location)
  return restriction
}
