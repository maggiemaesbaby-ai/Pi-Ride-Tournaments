// Driver promotion tracking database
// Tracks free signup slots used per city

export interface CityPromoData {
  city: string
  country: string
  totalSlots: number
  usedSlots: number
  drivers: string[] // Pi usernames who claimed free slots
}

const PROMO_CITIES = [
  // Top 10 US Rideshare Cities
  { city: "New York City", country: "United States" },
  { city: "San Francisco", country: "United States" },
  { city: "Los Angeles", country: "United States" },
  { city: "Seattle", country: "United States" },
  { city: "Chicago", country: "United States" },
  { city: "Miami", country: "United States" },
  { city: "Boston", country: "United States" },
  { city: "Washington DC", country: "United States" },
  { city: "Philadelphia", country: "United States" },
  { city: "Atlanta", country: "United States" },

  // Top 10 International Cities (Pi Network adoption + Rideshare markets)
  { city: "Mumbai", country: "India" },
  { city: "São Paulo", country: "Brazil" },
  { city: "London", country: "United Kingdom" },
  { city: "Ho Chi Minh City", country: "Vietnam" },
  { city: "Lagos", country: "Nigeria" },
  { city: "Jakarta", country: "Indonesia" },
  { city: "Seoul", country: "South Korea" },
  { city: "Paris", country: "France" },
  { city: "Mexico City", country: "Mexico" },
  { city: "Manila", country: "Philippines" },
]

class DriverPromoDB {
  private storageKey = "pi_ride_driver_promos"

  private getPromoData(): Record<string, CityPromoData> {
    if (typeof window === "undefined") return {}

    const stored = localStorage.getItem(this.storageKey)
    if (!stored) {
      // Initialize with 10 slots per city
      const initial: Record<string, CityPromoData> = {}
      PROMO_CITIES.forEach(({ city, country }) => {
        const key = `${city}, ${country}`
        initial[key] = {
          city,
          country,
          totalSlots: 10,
          usedSlots: 0,
          drivers: [],
        }
      })
      localStorage.setItem(this.storageKey, JSON.stringify(initial))
      return initial
    }

    return JSON.parse(stored)
  }

  private savePromoData(data: Record<string, CityPromoData>) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  getPromoCities(): Array<{ city: string; country: string; displayName: string }> {
    return PROMO_CITIES.map(({ city, country }) => ({
      city,
      country,
      displayName: `${city}, ${country}`,
    }))
  }

  // Check if a city is eligible for free signup
  isCityEligible(city: string): boolean {
    const normalized = this.normalizeCity(city)
    const data = this.getPromoData()
    const cityData = data[normalized]

    if (!cityData) return false
    return cityData.usedSlots < cityData.totalSlots
  }

  // Get remaining slots for a city
  getRemainingSlots(city: string): number {
    const normalized = this.normalizeCity(city)
    const data = this.getPromoData()
    const cityData = data[normalized]

    if (!cityData) return 0
    return cityData.totalSlots - cityData.usedSlots
  }

  // Claim a free slot for a driver
  claimFreeSlot(city: string, driverUsername: string): boolean {
    const normalized = this.normalizeCity(city)
    const data = this.getPromoData()
    const cityData = data[normalized]

    if (!cityData) return false
    if (cityData.usedSlots >= cityData.totalSlots) return false
    if (cityData.drivers.includes(driverUsername)) return false // Already claimed

    cityData.usedSlots++
    cityData.drivers.push(driverUsername)
    data[normalized] = cityData
    this.savePromoData(data)

    return true
  }

  // Check if a driver already claimed a free slot
  hasDriverClaimed(city: string, driverUsername: string): boolean {
    const normalized = this.normalizeCity(city)
    const data = this.getPromoData()
    const cityData = data[normalized]

    if (!cityData) return false
    return cityData.drivers.includes(driverUsername)
  }

  // Get all promo data for display
  getAllPromoData(): CityPromoData[] {
    const data = this.getPromoData()
    return Object.values(data)
  }

  private normalizeCity(city: string): string {
    const cityLower = city.toLowerCase().trim()

    // Map common variations to standard names with country
    const cityMap: Record<string, string> = {
      // United States
      nyc: "New York City, United States",
      "new york": "New York City, United States",
      "new york city": "New York City, United States",
      "new york usa": "New York City, United States",

      "san francisco": "San Francisco, United States",
      sf: "San Francisco, United States",
      "san fran": "San Francisco, United States",

      "los angeles": "Los Angeles, United States",
      la: "Los Angeles, United States",

      seattle: "Seattle, United States",
      "seattle wa": "Seattle, United States",

      chicago: "Chicago, United States",
      "chicago il": "Chicago, United States",

      miami: "Miami, United States",
      "miami fl": "Miami, United States",

      boston: "Boston, United States",
      "boston ma": "Boston, United States",

      "washington dc": "Washington DC, United States",
      dc: "Washington DC, United States",
      "washington d.c.": "Washington DC, United States",

      philadelphia: "Philadelphia, United States",
      philly: "Philadelphia, United States",

      atlanta: "Atlanta, United States",
      "atlanta ga": "Atlanta, United States",

      // India
      mumbai: "Mumbai, India",
      "mumbai india": "Mumbai, India",
      bombay: "Mumbai, India",

      // Brazil
      "sao paulo": "São Paulo, Brazil",
      "são paulo": "São Paulo, Brazil",
      "sao paulo brazil": "São Paulo, Brazil",

      // United Kingdom
      london: "London, United Kingdom",
      "london uk": "London, United Kingdom",
      "london england": "London, United Kingdom",

      // Vietnam
      "ho chi minh": "Ho Chi Minh City, Vietnam",
      "ho chi minh city": "Ho Chi Minh City, Vietnam",
      hcmc: "Ho Chi Minh City, Vietnam",
      saigon: "Ho Chi Minh City, Vietnam",

      // Nigeria
      lagos: "Lagos, Nigeria",
      "lagos nigeria": "Lagos, Nigeria",

      // Indonesia
      jakarta: "Jakarta, Indonesia",
      "jakarta indonesia": "Jakarta, Indonesia",

      // South Korea
      seoul: "Seoul, South Korea",
      "seoul korea": "Seoul, South Korea",
      "seoul south korea": "Seoul, South Korea",

      // France
      paris: "Paris, France",
      "paris france": "Paris, France",

      // Mexico
      "mexico city": "Mexico City, Mexico",
      cdmx: "Mexico City, Mexico",
      "ciudad de mexico": "Mexico City, Mexico",

      // Philippines
      manila: "Manila, Philippines",
      "manila philippines": "Manila, Philippines",
    }

    return cityMap[cityLower] || city
  }
}

export const driverPromoDB = new DriverPromoDB()
