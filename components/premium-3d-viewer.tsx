"use client"

import type React from "react"

import { Suspense, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Stage, ContactShadows, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Sun, Moon, Sparkles, Camera, RotateCw, Move3D } from "@/lib/icons"

interface Premium3DViewerProps {
  modelUrl?: string
  photos3D?: {
    front?: string
    back?: string
    left?: string
    right?: string
    top?: string
    bottom?: string
  }
  productTitle: string
  enableAR?: boolean
  startFullscreen?: boolean // Added prop to control initial fullscreen state
}

// Lighting presets for different moods
const LIGHTING_PRESETS = {
  studio: { env: "studio", intensity: 0.6, color: "#ffffff" },
  sunset: { env: "sunset", intensity: 0.8, color: "#ff9f50" },
  night: { env: "night", intensity: 0.4, color: "#6e8cc5" },
  outdoor: { env: "park", intensity: 1.0, color: "#ffffff" },
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const meshRef = useRef<any>()

  useFrame((state) => {
    if (meshRef.current) {
      // Smooth auto-rotation
      meshRef.current.rotation.y += 0.003
    }
  })

  return <primitive ref={meshRef} object={scene} scale={1.5} position={[0, 0, 0]} />
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 bg-black/80 backdrop-blur px-6 py-4 rounded-xl">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-sm font-medium">Loading 3D Model...</p>
      </div>
    </Html>
  )
}

export function Premium3DViewer({
  modelUrl,
  photos3D,
  productTitle,
  enableAR = true,
  startFullscreen = false, // Default to false for backward compatibility
}: Premium3DViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(startFullscreen)
  const [lightingPreset, setLightingPreset] = useState<keyof typeof LIGHTING_PRESETS>("studio")
  const [autoRotate, setAutoRotate] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleEnterFullscreen = () => {
    console.log("[v0] 3D Viewer - Entering fullscreen")
    setIsFullscreen(true)
    setShowControls(true)
  }

  const handleTouchOrClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isFullscreen) {
      console.log("[v0] 3D Viewer - Touch/click detected, entering fullscreen")
      handleEnterFullscreen()
    }
  }

  const handleExitFullscreen = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[v0] 3D Viewer - Exiting fullscreen")

    if (isFullscreen) {
      setIsFullscreen(false)
      setZoom(1)
      setAutoRotate(true)

      // Close the parent product details modal and return to listings
      setTimeout(() => {
        const closeButton = document.querySelector("[data-modal-close]") as HTMLElement
        if (closeButton) {
          closeButton.click()
        }
      }, 100)
    }
  }

  const handleInteraction = () => {
    if (isFullscreen) {
      setShowControls(true)
    }
  }

  const cycleLighting = () => {
    const presets = Object.keys(LIGHTING_PRESETS) as (keyof typeof LIGHTING_PRESETS)[]
    const currentIndex = presets.indexOf(lightingPreset)
    const nextIndex = (currentIndex + 1) % presets.length
    setLightingPreset(presets[nextIndex])
  }

  const handleARView = () => {
    // WebXR AR functionality
    if ("xr" in navigator && (navigator as any).xr) {
      ;(navigator as any).xr.isSessionSupported("immersive-ar").then((supported: boolean) => {
        if (supported) {
          console.log("[v0] Launching AR viewer")
        } else {
          alert("AR not supported on this device")
        }
      })
    } else {
      alert("AR requires a compatible device and browser")
    }
  }

  const currentPreset = LIGHTING_PRESETS[lightingPreset]

  const viewer3D = (
    <div
      ref={containerRef}
      onClick={handleTouchOrClick}
      onTouchEnd={handleTouchOrClick}
      className={`relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-[100]" : "rounded-xl aspect-square cursor-pointer"
      }`}
      style={{
        touchAction: isFullscreen ? "none" : "auto",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {!isFullscreen && (
        <div className="absolute inset-0 flex items-center justify-center z-[30] pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium">
            Tap to view in 3D
          </div>
        </div>
      )}

      <Canvas
        style={{ pointerEvents: isFullscreen ? "auto" : "none", position: "absolute", inset: 0 }}
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        onPointerMove={handleInteraction}
        onPointerDown={handleInteraction}
      >
        <color attach="background" args={["#18181b"]} />

        {/* Lighting */}
        <ambientLight intensity={currentPreset.intensity * 0.5} color={currentPreset.color} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={currentPreset.intensity} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        <Suspense fallback={<LoadingSpinner />}>
          {modelUrl ? (
            <Stage environment={currentPreset.env as any} intensity={0.5}>
              <Model url={modelUrl} />
            </Stage>
          ) : (
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={currentPreset.color} metalness={0.7} roughness={0.2} />
            </mesh>
          )}
          <Environment preset={currentPreset.env as any} />
          <ContactShadows position={[0, -1.4, 0]} opacity={0.4} scale={10} blur={2.5} />
        </Suspense>

        <OrbitControls
          enabled={isFullscreen}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          minDistance={2}
          maxDistance={10}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>

      {/* Fullscreen Controls Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
          {isFullscreen && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleExitFullscreen}
              onTouchEnd={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleExitFullscreen(e)
              }}
              className="bg-black/80 backdrop-blur hover:bg-black/90 text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          )}

          <Badge className="bg-black/80 backdrop-blur border-white/20 text-white ml-auto">
            <Sparkles className="w-3 h-3 mr-1" />
            Premium 3D View
          </Badge>
        </div>

        {/* Product Title */}
        <div className="absolute top-16 left-4 right-4 pointer-events-none">
          <h3 className="text-white font-semibold text-lg bg-black/60 backdrop-blur px-3 py-2 rounded-lg inline-block">
            {productTitle}
          </h3>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 pointer-events-auto">
          {/* Main Control Buttons */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                cycleLighting()
              }}
              className="bg-black/80 backdrop-blur hover:bg-black/90 text-white border border-white/20"
            >
              {lightingPreset === "studio" && <Sun className="w-4 h-4 mr-2" />}
              {lightingPreset === "sunset" && <Sparkles className="w-4 h-4 mr-2" />}
              {lightingPreset === "night" && <Moon className="w-4 h-4 mr-2" />}
              {lightingPreset === "outdoor" && <Sun className="w-4 h-4 mr-2" />}
              {lightingPreset.charAt(0).toUpperCase() + lightingPreset.slice(1)}
            </Button>

            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setAutoRotate(!autoRotate)
              }}
              className="bg-black/80 backdrop-blur hover:bg-black/90 text-white border border-white/20"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              {autoRotate ? "Stop" : "Auto Rotate"}
            </Button>

            {enableAR && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleARView()
                }}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                View in AR
              </Button>
            )}
          </div>

          {/* Instructions */}
          {isFullscreen && (
            <div className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-lg text-xs text-center pointer-events-none">
              <Move3D className="w-4 h-4 inline mr-2" />
              <span className="font-medium">Drag</span> to rotate • <span className="font-medium">Pinch/Scroll</span> to
              zoom • <span className="font-medium">Tap X</span> to exit
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return viewer3D
}
