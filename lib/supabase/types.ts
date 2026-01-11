export interface Driver {
  id: string
  pi_user_id: string
  email: string
  full_name: string
  phone: string | null
  service_cities: string[]
  is_on_duty: boolean
  current_location: {
    lat: number
    lng: number
    timestamp: string
  } | null
  vehicle_info: {
    make: string
    model: string
    year: number
    color: string
    plate: string
  } | null
  rating: number
  total_rides: number
  earnings_pi: number
  application_status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export interface Ride {
  id: string
  rider_pi_user_id: string
  driver_id: string | null
  pickup_location: {
    lat: number
    lng: number
    address: string
  }
  dropoff_location: {
    lat: number
    lng: number
    address: string
  }
  ride_type: "standard" | "premium" | "xl"
  status: "pending" | "matched" | "accepted" | "picked_up" | "completed" | "cancelled"
  price_pi: number
  distance_km: number | null
  duration_minutes: number | null
  pi_payment_id: string | null
  rider_email: string | null
  driver_email: string | null
  created_at: string
  completed_at: string | null
  cancelled_at: string | null
}

export interface DriverWaitlist {
  id: string
  pi_user_id: string
  email: string
  city: string
  location: {
    lat: number
    lng: number
  } | null
  notified: boolean
  created_at: string
}

export interface DriverApplication {
  id: string
  pi_user_id: string
  email: string
  full_name: string
  phone: string
  service_cities: string[]
  vehicle_info: {
    make: string
    model: string
    year: number
    color: string
    plate: string
  }
  drivers_license: {
    number: string
    state: string
    expiry: string
  } | null
  status: "pending" | "approved" | "rejected"
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
}
