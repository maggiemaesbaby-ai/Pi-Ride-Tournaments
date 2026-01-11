"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Compass, CloudRain, MapPinIcon, Star, Film, Info } from "lucide-react"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  getAMCTheaters,
  getIMAXTheaters,
  getMoviesForTheater,
  getAPIStatus,
  type Theater,
  type Movie,
} from "@/app/actions/theater-api"

export function EntertainmentTab() {
  const [serviceType, setServiceType] = useState<
    "attractions" | "restaurants" | "events" | "weather" | "poi" | "amc" | "imax"
  >("attractions")
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [amcTheaters, setAmcTheaters] = useState<Theater[]>([])
  const [imaxTheaters, setImaxTheaters] = useState<Theater[]>([])
  const [currentMovies, setCurrentMovies] = useState<Movie[]>([])
  const [isLoadingTheaters, setIsLoadingTheaters] = useState(false)
  const [isLoadingMovies, setIsLoadingMovies] = useState(false)
  const [apiStatusMessage, setApiStatusMessage] = useState("")
  const [isLiveAPI, setIsLiveAPI] = useState(false)
  const { isConnected, connect } = usePiWallet()
  const { toast } = useToast()
  const bookingFormRef = useRef<HTMLDivElement>(null)
  const theatersListRef = useRef<HTMLDivElement>(null)

  const [citySearch, setCitySearch] = useState("")
  const [eventResults, setEventResults] = useState<any[]>([])
  const [isSearchingEvents, setIsSearchingEvents] = useState(false)

  useEffect(() => {
    getAPIStatus().then((status) => {
      setApiStatusMessage(status.message)
      setIsLiveAPI(status.isLive)
    })
  }, [])

  useEffect(() => {
    if (serviceType === "amc") {
      setIsLoadingTheaters(true)
      getAMCTheaters().then((theaters) => {
        setAmcTheaters(theaters)
        setIsLoadingTheaters(false)
      })

      setTimeout(() => {
        theatersListRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 100)
    } else if (serviceType === "imax") {
      setIsLoadingTheaters(true)
      getIMAXTheaters().then((theaters) => {
        setImaxTheaters(theaters)
        setIsLoadingTheaters(false)
      })

      setTimeout(() => {
        theatersListRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 100)
    }
  }, [serviceType])

  useEffect(() => {
    if (selectedTheater) {
      setIsLoadingMovies(true)
      const isIMAX = serviceType === "imax"
      getMoviesForTheater(selectedTheater.id, isIMAX).then((movies) => {
        setCurrentMovies(movies)
        setIsLoadingMovies(false)
      })
    }
  }, [selectedTheater, serviceType])

  const handleBooking = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    if (selectedMovie && selectedTheater) {
      const basePrice = selectedMovie.price
      const appFee = basePrice * 0.05
      const totalPrice = basePrice + appFee

      toast({
        title: "Ticket Booked!",
        description: `${selectedMovie.title} at ${selectedTheater.name} - ${totalPrice.toFixed(2)} Pi (includes ${appFee.toFixed(2)} Pi app fee)`,
      })
      setSelectedMovie(null)
      setSelectedTheater(null)
    } else if (selectedItem) {
      const basePrice = selectedItem.basePrice || selectedItem.price
      const appFee = basePrice * 0.05
      const totalPrice = basePrice + appFee

      toast({
        title: "Booking Confirmed!",
        description: `${selectedItem.name} - ${totalPrice.toFixed(2)} Pi (includes ${appFee.toFixed(2)} Pi app fee)`,
      })
      setSelectedItem(null)
    }
  }

  const handleTheaterSelect = (theater: Theater) => {
    setSelectedTheater(theater)
    setSelectedMovie(null) // Reset movie selection when theater changes
    toast({
      title: "Theater Selected",
      description: theater.name,
    })
  }

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie)
    toast({
      title: "Movie Selected",
      description: movie.title,
    })

    setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
  }

  const handleEventSearch = async () => {
    if (!citySearch.trim()) {
      toast({
        title: "Enter a city",
        description: "Please enter a city name to search for events",
        variant: "destructive",
      })
      return
    }

    setIsSearchingEvents(true)

    // Simulate API call (replace with real API when available)
    setTimeout(() => {
      setEventResults([
        {
          id: "ev1",
          name: `${citySearch} Summer Festival`,
          date: "June 15-17, 2025",
          type: "Music & Arts",
          location: `${citySearch} Downtown`,
          price: "Free",
        },
        {
          id: "ev2",
          name: `${citySearch} Food & Wine Week`,
          date: "July 22-28, 2025",
          type: "Food & Beverage",
          location: `${citySearch} Convention Center`,
          price: "Free",
        },
        {
          id: "ev3",
          name: `${citySearch} Farmers Market`,
          date: "Every Saturday",
          type: "Community Event",
          location: `${citySearch} City Square`,
          price: "Free",
        },
        {
          id: "ev4",
          name: `${citySearch} Community Concert Series`,
          date: "Every Friday Evening",
          type: "Live Music",
          location: `${citySearch} City Park`,
          price: "Free",
        },
        {
          id: "ev5",
          name: `${citySearch} Art Walk`,
          date: "First Thursday Monthly",
          type: "Art & Culture",
          location: `${citySearch} Arts District`,
          price: "Free",
        },
      ])
      setIsSearchingEvents(false)
    }, 1000)
  }

  const attractions = [
    {
      id: "a1",
      name: "City Museum Tour",
      description: "Explore local history and culture",
      price: 26.25,
      basePrice: 25,
      fee: 1.25,
      rating: 4.7,
      duration: "2 hours",
    },
    {
      id: "a2",
      name: "Harbor Boat Cruise",
      description: "Scenic waterfront experience",
      price: 52.5,
      basePrice: 50,
      fee: 2.5,
      rating: 4.9,
      duration: "1.5 hours",
    },
  ]

  const restaurants = [
    {
      id: "r1",
      name: "The Gourmet Kitchen",
      cuisine: "French",
      price: 21,
      basePrice: 20,
      fee: 1,
      rating: 4.6,
      availableSlots: ["6:00 PM", "7:30 PM", "9:00 PM"],
    },
    {
      id: "r2",
      name: "Sushi Master",
      cuisine: "Japanese",
      price: 31.5,
      basePrice: 30,
      fee: 1.5,
      rating: 4.8,
      availableSlots: ["5:30 PM", "7:00 PM", "8:30 PM"],
    },
  ]

  const events: any[] = []

  const weatherData = {
    current: { temp: 72, condition: "Partly Cloudy", humidity: 65 },
    forecast: [
      { day: "Today", high: 75, low: 62, condition: "Sunny" },
      { day: "Tomorrow", high: 73, low: 60, condition: "Cloudy" },
      { day: "Wednesday", high: 68, low: 58, condition: "Rain" },
    ],
  }

  const pois = [
    {
      id: "p1",
      name: "Historic Downtown District",
      type: "Historic Site",
      distance: 1.2,
      rating: 4.6,
      description: "Colonial architecture and museums",
    },
    {
      id: "p2",
      name: "Riverside Park",
      type: "Nature",
      distance: 2.5,
      rating: 4.8,
      description: "Walking trails and picnic areas",
    },
    {
      id: "p3",
      name: "Art Gallery District",
      type: "Culture",
      distance: 0.8,
      rating: 4.7,
      description: "Contemporary and classic art",
    },
  ]

  return (
    <div className="space-y-6">
      {!isLiveAPI && (serviceType === "amc" || serviceType === "imax") && (
        <Card className="p-4 bg-blue-50 border-2 border-blue-300">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">Demo Mode Active</p>
              <p className="text-xs text-blue-700 mt-1">{apiStatusMessage}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AMC Theaters Box */}
        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-lg border-2 ${
            serviceType === "amc"
              ? "border-primary ring-4 ring-primary/20 bg-primary/10"
              : "border-slate-300 hover:border-primary/50 bg-white/95 backdrop-blur-md"
          }`}
          onClick={() => setServiceType("amc")}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Film className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">AMC Theaters</h3>
            <p className="text-sm text-slate-700">Find AMC theaters and book movie tickets</p>
          </div>
        </Card>

        {/* IMAX Theaters Box */}
        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-lg border-2 ${
            serviceType === "imax"
              ? "border-primary ring-4 ring-primary/20 bg-primary/10"
              : "border-slate-300 hover:border-primary/50 bg-white/95 backdrop-blur-md"
          }`}
          onClick={() => setServiceType("imax")}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Film className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">IMAX Theaters</h3>
            <p className="text-sm text-slate-700">Experience movies in stunning IMAX</p>
          </div>
        </Card>

        {/* Local Attractions & Tours Box */}
        <Card
          className={`p-6 cursor-pointer transition-all hover:shadow-lg border-2 ${
            serviceType === "attractions"
              ? "border-primary ring-4 ring-primary/20 bg-primary/10"
              : "border-slate-300 hover:border-primary/50 bg-white/95 backdrop-blur-md"
          }`}
          onClick={() => setServiceType("attractions")}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Compass className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Local Attractions</h3>
            <p className="text-sm text-slate-700">Discover tours and local attractions</p>
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <Select value={serviceType} onValueChange={(v) => setServiceType(v as any)}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="events">City Events & Festivals</SelectItem>
            <SelectItem value="attractions">Tourist Attractions</SelectItem>
            <SelectItem value="restaurants">Restaurant Reservations</SelectItem>
            <SelectItem value="amc">AMC Theaters</SelectItem>
            <SelectItem value="imax">IMAX Theaters</SelectItem>
            <SelectItem value="weather">Weather Forecast</SelectItem>
            <SelectItem value="poi">Points of Interest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {serviceType === "events" && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Free City Events & Festivals</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Discover free community activities, festivals, concerts, and events in your city
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter city name..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleEventSearch()}
                className="flex-1"
              />
              <Button onClick={handleEventSearch} disabled={isSearchingEvents}>
                {isSearchingEvents ? "Searching..." : "Search Events"}
              </Button>
            </div>
          </Card>

          {eventResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventResults.map((event) => (
                <Card key={event.id} className="p-4 hover:shadow-lg transition-shadow">
                  <h4 className="font-bold mb-2">{event.name}</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                      {event.location}
                    </p>
                    <p>{event.date}</p>
                    <p className="text-green-600 font-bold text-lg">{event.price}</p>
                  </div>
                  <Badge className="mt-2">{event.type}</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {serviceType === "amc" && (
        <>
          <Card ref={theatersListRef} className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Film className="w-6 h-6 text-primary" />
              AMC Theaters Near You
            </h3>
            {isLoadingTheaters ? (
              <div className="text-center py-8 text-slate-600">Loading theaters...</div>
            ) : (
              <div className="space-y-3">
                {amcTheaters.map((theater) => (
                  <Card
                    key={theater.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                      selectedTheater?.id === theater.id
                        ? "border-primary ring-4 ring-primary/20 bg-primary/5"
                        : "border-slate-300 hover:border-primary/50"
                    }`}
                    onClick={() => handleTheaterSelect(theater)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{theater.name}</h4>
                        <p className="text-sm text-slate-700 mt-1">{theater.address}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-700">
                          <span>{theater.distance} mi away</span>
                          {theater.hasIMAX && (
                            <span className="px-2 py-0.5 bg-primary/20 rounded-full text-xs font-semibold">IMAX</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {selectedTheater && (
            <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg" ref={bookingFormRef}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Now Showing at {selectedTheater.name}</h3>
              {isLoadingMovies ? (
                <div className="text-center py-8 text-slate-600">Loading movies...</div>
              ) : (
                <div className="space-y-3">
                  {currentMovies.map((movie) => (
                    <Card
                      key={movie.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                        selectedMovie?.id === movie.id
                          ? "border-primary ring-4 ring-primary/20 bg-primary/5"
                          : "border-slate-300 hover:border-primary/50"
                      }`}
                      onClick={() => handleMovieSelect(movie)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{movie.title}</h4>
                          <p className="text-sm text-slate-700 mt-1">
                            {movie.rating} • {movie.duration}
                            {movie.imax && <span className="ml-2 text-primary font-semibold">IMAX</span>}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {movie.showtimes.map((time, idx) => (
                              <span key={idx} className="px-2 py-1 bg-slate-100 rounded text-xs">
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{movie.price} Pi</p>
                          <p className="text-xs text-slate-600">+ 5% app fee</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {selectedMovie && (
                <Card className="p-4 bg-primary/10 border-2 border-primary mt-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Booking Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Ticket Price:</span>
                      <span>{selectedMovie.price} Pi</span>
                    </div>
                    <div className="flex justify-between text-primary">
                      <span>App Fee (5%):</span>
                      <span>{(selectedMovie.price * 0.05).toFixed(2)} Pi</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-1 mt-1">
                      <span>Total:</span>
                      <span className="text-primary">{(selectedMovie.price * 1.05).toFixed(2)} Pi</span>
                    </div>
                  </div>
                  <Button onClick={handleBooking} className="w-full mt-4">
                    {isConnected ? "Book Ticket with Pi" : "Connect Wallet to Book"}
                  </Button>
                </Card>
              )}
            </Card>
          )}
        </>
      )}

      {serviceType === "imax" && (
        <>
          <Card ref={theatersListRef} className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Film className="w-6 h-6 text-primary" />
              IMAX Theaters Near You
            </h3>
            {isLoadingTheaters ? (
              <div className="text-center py-8 text-slate-600">Loading theaters...</div>
            ) : (
              <div className="space-y-3">
                {imaxTheaters.map((theater) => (
                  <Card
                    key={theater.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                      selectedTheater?.id === theater.id
                        ? "border-primary ring-4 ring-primary/20 bg-primary/5"
                        : "border-slate-300 hover:border-primary/50"
                    }`}
                    onClick={() => handleTheaterSelect(theater)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{theater.name}</h4>
                        <p className="text-sm text-slate-700 mt-1">{theater.address}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-700">
                          <span>{theater.distance} mi away</span>
                          <span className="px-2 py-0.5 bg-primary/20 rounded-full text-xs font-semibold">
                            {theater.screens} IMAX {theater.screens && theater.screens > 1 ? "Screens" : "Screen"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>

          {selectedTheater && (
            <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg" ref={bookingFormRef}>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Now Showing in IMAX at {selectedTheater.name}</h3>
              {isLoadingMovies ? (
                <div className="text-center py-8 text-slate-600">Loading movies...</div>
              ) : (
                <div className="space-y-3">
                  {currentMovies.map((movie) => (
                    <Card
                      key={movie.id}
                      className={`p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                        selectedMovie?.id === movie.id
                          ? "border-primary ring-4 ring-primary/20 bg-primary/5"
                          : "border-slate-300 hover:border-primary/50"
                      }`}
                      onClick={() => handleMovieSelect(movie)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{movie.title}</h4>
                          <p className="text-sm text-slate-700 mt-1">
                            {movie.rating} • {movie.duration} • <span className="text-primary font-semibold">IMAX</span>
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {movie.showtimes.map((time, idx) => (
                              <span key={idx} className="px-2 py-1 bg-slate-100 rounded text-xs">
                                {time}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{movie.price} Pi</p>
                          <p className="text-xs text-slate-600">+ 5% app fee</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {selectedMovie && (
                <Card className="p-4 bg-primary/10 border-2 border-primary mt-4">
                  <h4 className="font-semibold text-slate-900 mb-2">Booking Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>IMAX Ticket:</span>
                      <span>{selectedMovie.price} Pi</span>
                    </div>
                    <div className="flex justify-between text-primary">
                      <span>App Fee (5%):</span>
                      <span>{(selectedMovie.price * 0.05).toFixed(2)} Pi</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-1 mt-1">
                      <span>Total:</span>
                      <span className="text-primary">{(selectedMovie.price * 1.05).toFixed(2)} Pi</span>
                    </div>
                  </div>
                  <Button onClick={handleBooking} className="w-full mt-4">
                    {isConnected ? "Book Ticket with Pi" : "Connect Wallet to Book"}
                  </Button>
                </Card>
              )}
            </Card>
          )}
        </>
      )}

      {serviceType === "weather" ? (
        <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CloudRain className="w-6 h-6 text-primary" />
            Route Weather Forecast
          </h3>

          <Card className="p-6 bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-300 mb-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">{weatherData.current.temp}°F</p>
              <p className="text-lg text-slate-700 mt-2">{weatherData.current.condition}</p>
              <p className="text-sm text-slate-600 mt-1">Humidity: {weatherData.current.humidity}%</p>
            </div>
          </Card>

          <h4 className="font-semibold text-slate-900 mb-3">5-Day Forecast</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {weatherData.forecast.map((day) => (
              <Card key={day.day} className="p-4 bg-slate-100 border-2 border-slate-300">
                <p className="font-semibold text-slate-900">{day.day}</p>
                <p className="text-sm text-slate-700 mt-2">{day.condition}</p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-slate-700">High: {day.high}°F</span>
                  <span className="text-slate-600">Low: {day.low}°F</span>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      ) : serviceType === "poi" ? (
        <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPinIcon className="w-6 h-6 text-primary" />
            Points of Interest
          </h3>

          <div className="space-y-3">
            {pois.map((poi) => (
              <Card
                key={poi.id}
                className="p-4 border-2 border-slate-300 hover:border-primary/50 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{poi.name}</h4>
                    <p className="text-sm text-slate-700 mt-1">{poi.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-700">
                      <span>{poi.distance} mi away</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {poi.rating}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-200 rounded-full text-xs">{poi.type}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Directions
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      ) : serviceType !== "amc" && serviceType !== "imax" ? (
        <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            {serviceType === "restaurants" ? "Restaurant Reservations" : "Events"}
          </h3>

          {selectedItem && (
            <Card className="p-4 bg-primary/10 border-2 border-primary mb-4">
              <h4 className="font-semibold text-slate-900 mb-2">Selected</h4>
              <p className="text-sm text-slate-900">{selectedItem.name}</p>
              <div className="pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span>{selectedItem.basePrice} Pi</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Pi Ride Fee (5%):</span>
                  <span>{selectedItem.fee} Pi</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-1">
                  <span>Total:</span>
                  <span className="text-primary">{selectedItem.price} Pi</span>
                </div>
              </div>
              <Button onClick={handleBooking} className="w-full mt-4">
                {isConnected ? "Book with Pi" : "Connect Wallet to Book"}
              </Button>
            </Card>
          )}

          <div className="space-y-3">
            {(serviceType === "restaurants" ? restaurants : events).map((item: any) => (
              <Card
                key={item.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-lg border-2 ${
                  selectedItem?.id === item.id
                    ? "border-primary ring-4 ring-primary/20 bg-primary/5"
                    : "border-slate-300 hover:border-primary/50"
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{item.name}</h4>
                    <p className="text-sm text-slate-700 mt-1">{item.description || item.cuisine || item.venue}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-slate-700">{item.rating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{item.price} Pi</p>
                    <p className="text-xs text-slate-600">includes 5% fee</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  )
}
