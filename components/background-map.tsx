"use client"

import { useEffect, useRef, useState } from "react"
import { getMapboxToken } from "@/app/actions/get-mapbox-token"

export function BackgroundMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [map, setMap] = useState<any>(null)
  const lastUpdateRef = useRef<number>(0)
  const markerRef = useRef<any>(null)
  const isInitializedRef = useRef(false)
  const isMountedRef = useRef(true)
  const [mapboxToken, setMapboxToken] = useState<string>("")

  useEffect(() => {
    getMapboxToken().then((token) => setMapboxToken(token))
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMountedRef.current) {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            setUserLocation(location)
          }
        },
        (error) => {
          if (isMountedRef.current) {
            setUserLocation({ lat: 37.7749, lng: -122.4194 })
          }
        },
      )
    } else {
      setUserLocation({ lat: 37.7749, lng: -122.4194 })
    }

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!userLocation || !mapRef.current || isInitializedRef.current || !isMountedRef.current || !mapboxToken) return

    isInitializedRef.current = true

    import("leaflet").then((L) => {
      if (!isMountedRef.current || !mapRef.current) return

      const mapInstance = L.map(mapRef.current!, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        dragging: false, // Disabled to prevent flickering
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false, // Disabled to prevent flickering
        fadeAnimation: false,
        zoomAnimation: false,
        markerZoomAnimation: false,
        keyboard: false,
        boxZoom: false,
      })

      L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
        maxZoom: 19,
        tileSize: 512,
        zoomOffset: -1,
        updateWhenIdle: true,
        keepBuffer: 2,
        attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>',
      }).addTo(mapInstance)

      const userIcon = L.divIcon({
        className: "user-location-marker",
        html: `<div style="width: 20px; height: 20px; background: #8b5cf6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
      }).addTo(mapInstance)

      markerRef.current = marker
      setMap(mapInstance)

      const watchId = navigator.geolocation?.watchPosition(
        (position) => {
          const now = Date.now()
          if (now - lastUpdateRef.current < 10000) {
            return
          }
          lastUpdateRef.current = now

          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }

          const distance = Math.sqrt(
            Math.pow(newLocation.lat - userLocation.lat, 2) + Math.pow(newLocation.lng - userLocation.lng, 2),
          )

          if (distance > 0.001 && markerRef.current && isMountedRef.current) {
            markerRef.current.setLatLng([newLocation.lat, newLocation.lng])
          }
        },
        (error) => {},
        {
          enableHighAccuracy: false,
          maximumAge: 15000,
          timeout: 20000,
        },
      )

      return () => {
        if (watchId) {
          navigator.geolocation?.clearWatch(watchId)
        }
        if (mapInstance) {
          mapInstance.remove()
        }
        isInitializedRef.current = false
      }
    })
  }, [userLocation, mapboxToken])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div
        ref={mapRef}
        className="absolute inset-0"
        style={{
          opacity: 0.5,
          filter: "brightness(0.9) contrast(1.1)",
          pointerEvents: "none", // Prevent interaction that causes flickering
        }}
      />
    </>
  )
}
