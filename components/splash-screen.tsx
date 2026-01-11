"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* Logo spinning in */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="logo-spin">
          <Image src="/images/pi-ride-logo.png" alt="Pi Ride" width={200} height={200} className="drop-shadow-2xl" />
        </div>
      </div>

      {/* Car with spinning tires and smoke */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="car-entrance">
          <div className="relative">
            {/* Sports car - bigger and more realistic */}
            <div className="car-spin">
              <svg width="300" height="150" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Car body */}
                <path
                  d="M50 90 L70 70 L100 60 L140 60 L170 70 L200 70 L230 80 L250 90 L250 110 L240 120 L60 120 L50 110 Z"
                  fill="url(#carGradient)"
                  stroke="#1e293b"
                  strokeWidth="2"
                />
                {/* Windshield */}
                <path
                  d="M100 60 L120 50 L160 50 L170 60 Z"
                  fill="#60a5fa"
                  opacity="0.6"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                {/* Side window */}
                <path
                  d="M175 65 L190 60 L210 65 L210 75 L175 75 Z"
                  fill="#60a5fa"
                  opacity="0.6"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />
                {/* Front wheel */}
                <circle cx="90" cy="120" r="20" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                <circle cx="90" cy="120" r="12" fill="#64748b" />
                <circle cx="90" cy="120" r="6" fill="#94a3b8" />
                {/* Back wheel */}
                <circle cx="220" cy="120" r="20" fill="#1e293b" stroke="#475569" strokeWidth="3" />
                <circle cx="220" cy="120" r="12" fill="#64748b" />
                <circle cx="220" cy="120" r="6" fill="#94a3b8" />
                {/* Headlight */}
                <circle cx="245" cy="95" r="6" fill="#fbbf24" opacity="0.9" />
                {/* Taillight */}
                <circle cx="55" cy="95" r="5" fill="#ef4444" opacity="0.9" />
                {/* Door line */}
                <line x1="140" y1="70" x2="140" y2="110" stroke="#1e293b" strokeWidth="2" />
                {/* Spoiler */}
                <path d="M50 85 L45 80 L45 75 L50 75 Z" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />

                <defs>
                  <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Tire smoke effects - positioned under wheels */}
            <div className="smoke smoke-1"></div>
            <div className="smoke smoke-2"></div>
            <div className="smoke smoke-3"></div>
            <div className="smoke smoke-4"></div>
          </div>
        </div>
      </div>

      {/* Tagline fading in */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="tagline-fade text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Traveling Made Easy
          </h1>
          <p className="text-2xl md:text-3xl font-semibold text-purple-300 mt-2">All In Pi</p>
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
            transform: translateX(-200%) scale(0.8);
            opacity: 0;
          }
          40% {
            transform: translateX(-200%) scale(0.8);
            opacity: 0;
          }
          60% {
            transform: translateX(0) scale(1.2);
            opacity: 1;
          }
          80% {
            transform: translateX(0) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateX(0) scale(1.2);
            opacity: 0;
          }
        }

        @keyframes carSpin {
          0%, 40% {
            transform: rotate(0deg);
          }
          50%, 70% {
            transform: rotate(-3deg);
          }
          55%, 75% {
            transform: rotate(3deg);
          }
          60%, 80% {
            transform: rotate(-2deg);
          }
          65%, 85% {
            transform: rotate(2deg);
          }
          70%, 100% {
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
            transform: translateY(-120px) scale(2.5);
            opacity: 0;
          }
        }

        @keyframes taglineFade {
          0%, 70% {
            opacity: 0;
            transform: translateY(20px);
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
          bottom: 10px;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(156, 163, 175, 0.9) 0%, rgba(156, 163, 175, 0) 70%);
          border-radius: 50%;
          animation: smokeRise 1.5s ease-out forwards;
        }

        .smoke-1 {
          left: 20px;
          animation-delay: 1.2s;
        }

        .smoke-2 {
          left: 60px;
          animation-delay: 1.35s;
        }

        .smoke-3 {
          left: 150px;
          animation-delay: 1.25s;
        }

        .smoke-4 {
          left: 190px;
          animation-delay: 1.4s;
        }

        .tagline-fade {
          animation: taglineFade 3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
