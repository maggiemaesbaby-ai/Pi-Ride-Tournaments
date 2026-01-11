"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
// Using Safari-compatible fallback icon from @/lib/icons
import { Car } from "@/lib/icons"

export function AnimatedLogo() {
  const [animating, setAnimating] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimating(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!animating) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <Image src="/images/pi-ride-logo.png" alt="Pi Ride Logo" width={48} height={48} className="rounded-xl" />
          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-1">
            <Car className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xl leading-tight">Pi Ride</span>
          <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">Traveling Made Easy</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-[400px] h-[200px] overflow-visible">
      {/* Logo spinning in */}
      <div className="absolute top-0 left-0">
        <div className="logo-spin">
          <Image src="/images/pi-ride-logo.png" alt="Pi Ride" width={80} height={80} className="drop-shadow-2xl" />
        </div>
      </div>

      {/* Car with spinning tires and smoke */}
      <div className="absolute top-8 left-0">
        <div className="car-entrance">
          <div className="relative">
            <div className="car-spin">
              <Image
                src="/images/corvette.jpg"
                alt="Corvette Sports Car"
                width={250}
                height={125}
                className="drop-shadow-2xl"
              />
            </div>

            {/* Tire smoke effects */}
            <div className="smoke smoke-1"></div>
            <div className="smoke smoke-2"></div>
            <div className="smoke smoke-3"></div>
            <div className="smoke smoke-4"></div>
          </div>
        </div>
      </div>

      {/* Tagline fading in */}
      <div className="absolute top-32 left-0">
        <div className="tagline-fade">
          <p className="text-sm font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent whitespace-nowrap">
            Traveling Made Easy - All In Pi
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes logoSpin {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          30% {
            transform: scale(1.2) rotate(360deg);
            opacity: 1;
          }
          50% {
            transform: scale(1) rotate(360deg);
            opacity: 1;
          }
          60% {
            transform: scale(0.8) rotate(360deg);
            opacity: 0;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes carEntrance {
          0% {
            transform: translateX(-150px) scale(0.8);
            opacity: 0;
          }
          40% {
            transform: translateX(-150px) scale(0.8);
            opacity: 0;
          }
          60% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          80% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 0;
          }
        }

        @keyframes carSpin {
          0%,
          40% {
            transform: rotate(0deg);
          }
          50%,
          70% {
            transform: rotate(-3deg);
          }
          55%,
          75% {
            transform: rotate(3deg);
          }
          60%,
          80% {
            transform: rotate(-2deg);
          }
          65%,
          85% {
            transform: rotate(2deg);
          }
          70%,
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes smokeRise {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-80px) scale(2);
            opacity: 0;
          }
        }

        @keyframes taglineFade {
          0%,
          70% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logo-spin {
          animation: logoSpin 3s ease-in-out forwards;
        }

        .car-entrance {
          animation: carEntrance 3s ease-out forwards;
        }

        .car-spin {
          animation: carSpin 3s ease-in-out forwards;
        }

        .smoke {
          position: absolute;
          bottom: 5px;
          width: 50px;
          height: 50px;
          background: radial-gradient(circle, rgba(156, 163, 175, 0.9) 0%, rgba(156, 163, 175, 0) 70%);
          border-radius: 50%;
          animation: smokeRise 1.2s ease-out forwards;
        }

        .smoke-1 {
          left: 15px;
          animation-delay: 1.2s;
        }

        .smoke-2 {
          left: 40px;
          animation-delay: 1.35s;
        }

        .smoke-3 {
          left: 100px;
          animation-delay: 1.25s;
        }

        .smoke-4 {
          left: 125px;
          animation-delay: 1.4s;
        }

        .tagline-fade {
          animation: taglineFade 3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
