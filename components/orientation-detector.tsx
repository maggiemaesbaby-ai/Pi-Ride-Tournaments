"use client"

import { useEffect, useRef } from "react"

export function OrientationDetector() {
  const isUpdatingRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const updateOrientation = () => {
      if (isUpdatingRef.current) {
        return
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        isUpdatingRef.current = true

        const isLandscape = window.innerWidth > window.innerHeight
        const aspectRatio = window.innerWidth / window.innerHeight

        document.documentElement.setAttribute("data-orientation", isLandscape ? "landscape" : "portrait")

        // Only add/remove classes, no DOM queries or style manipulations that trigger resize
        if (isLandscape) {
          document.body.classList.add("landscape-mode")
          document.body.classList.remove("portrait-mode")
        } else {
          document.body.classList.add("portrait-mode")
          document.body.classList.remove("landscape-mode")
        }

        setTimeout(() => {
          isUpdatingRef.current = false
        }, 100)
      }, 150) // 150ms debounce
    }

    updateOrientation()
    window.addEventListener("resize", updateOrientation, { passive: true })
    window.addEventListener("orientationchange", updateOrientation, { passive: true })

    return () => {
      window.removeEventListener("resize", updateOrientation)
      window.removeEventListener("orientationchange", updateOrientation)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return null
}
