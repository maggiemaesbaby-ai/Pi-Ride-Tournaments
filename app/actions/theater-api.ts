"use server"

// Server-side Theater API Integration
// All API calls happen on the server to keep API keys secure

export interface Theater {
  id: string
  name: string
  distance: number
  address: string
  hasIMAX?: boolean
  screens?: number
}

export interface Movie {
  id: string
  title: string
  rating: string
  duration: string
  price: number
  showtimes: string[]
  imax?: boolean
  posterUrl?: string
}

const THEATER_API_CONFIG = {
  amc: {
    apiKey: process.env.AMC_API_KEY || "",
    endpoint: "", // Removed external endpoint
  },
  fandango: {
    apiKey: process.env.FANDANGO_API_KEY || "",
    endpoint: "", // Removed external endpoint
  },
  atom: {
    apiKey: process.env.ATOM_API_KEY || "",
    endpoint: "", // Removed external endpoint
  },
  activeProvider: "mock" as "mock" | "amc" | "fandango" | "atom",
}

// Mock data - used until real API is connected
const MOCK_AMC_THEATERS: Theater[] = [
  { id: "amc1", name: "AMC Downtown 16", distance: 2.3, address: "123 Main St", hasIMAX: true },
  { id: "amc2", name: "AMC Riverside 12", distance: 5.1, address: "456 River Rd", hasIMAX: false },
  { id: "amc3", name: "AMC Plaza IMAX", distance: 3.7, address: "789 Plaza Ave", hasIMAX: true },
]

const MOCK_IMAX_THEATERS: Theater[] = [
  { id: "imax1", name: "IMAX Science Center", distance: 4.2, address: "321 Science Dr", screens: 2 },
  { id: "imax2", name: "AMC Plaza IMAX", distance: 3.7, address: "789 Plaza Ave", screens: 1 },
]

const MOCK_MOVIES: Movie[] = [
  {
    id: "m1",
    title: "Action Hero Returns",
    rating: "PG-13",
    duration: "2h 15m",
    price: 15.75,
    showtimes: ["2:30 PM", "5:45 PM", "9:00 PM"],
  },
  {
    id: "m2",
    title: "Comedy Night",
    rating: "R",
    duration: "1h 45m",
    price: 13.65,
    showtimes: ["3:00 PM", "6:15 PM", "8:45 PM"],
  },
  {
    id: "m3",
    title: "Family Adventure",
    rating: "PG",
    duration: "1h 55m",
    price: 14.7,
    showtimes: ["1:00 PM", "4:00 PM", "7:00 PM"],
  },
  {
    id: "m4",
    title: "Sci-Fi Epic IMAX",
    rating: "PG-13",
    duration: "2h 45m",
    price: 21.0,
    showtimes: ["12:00 PM", "4:30 PM", "8:30 PM"],
    imax: true,
  },
]

// Server Actions - called from client components

export async function getAMCTheaters(latitude?: number, longitude?: number): Promise<Theater[]> {
  if (THEATER_API_CONFIG.activeProvider === "mock") {
    return MOCK_AMC_THEATERS
  }

  // When API is connected, replace with:
  // const response = await fetch(`${THEATER_API_CONFIG.amc.endpoint}/theaters?lat=${latitude}&lng=${longitude}`, {
  //   headers: { 'Authorization': `Bearer ${THEATER_API_CONFIG.amc.apiKey}` }
  // })
  // return await response.json()

  return MOCK_AMC_THEATERS
}

export async function getIMAXTheaters(latitude?: number, longitude?: number): Promise<Theater[]> {
  if (THEATER_API_CONFIG.activeProvider === "mock") {
    return MOCK_IMAX_THEATERS
  }

  // When API is connected, add real API call here
  return MOCK_IMAX_THEATERS
}

export async function getMoviesForTheater(theaterId: string, isIMAX = false): Promise<Movie[]> {
  if (THEATER_API_CONFIG.activeProvider === "mock") {
    return MOCK_MOVIES.filter((movie) => !isIMAX || movie.imax)
  }

  // When API is connected, replace with:
  // const response = await fetch(`${THEATER_API_CONFIG.amc.endpoint}/theaters/${theaterId}/movies`)
  // return await response.json()

  return MOCK_MOVIES.filter((movie) => !isIMAX || movie.imax)
}

export async function bookTicket(
  theaterId: string,
  movieId: string,
  showtime: string,
  userId: string,
): Promise<{ bookingId: string; qrCode: string }> {
  if (THEATER_API_CONFIG.activeProvider === "mock") {
    return {
      bookingId: `BOOK-${Date.now()}`,
      qrCode: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+PC9zdmc+`,
    }
  }

  // When API is connected, replace with real booking API call
  return {
    bookingId: `BOOK-${Date.now()}`,
    qrCode: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+PC9zdmc+`,
  }
}

export async function getAPIStatus() {
  return {
    provider: THEATER_API_CONFIG.activeProvider,
    isLive: THEATER_API_CONFIG.activeProvider !== "mock",
    message:
      THEATER_API_CONFIG.activeProvider !== "mock"
        ? `Connected to ${THEATER_API_CONFIG.activeProvider.toUpperCase()} API`
        : "Using sample data - connect AMC, Fandango, or Atom Tickets API to go live",
  }
}
