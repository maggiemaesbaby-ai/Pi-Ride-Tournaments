"use client"

import { Suspense, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { RotateCw, Move3D } from "@/lib/icons"

interface ThreeDModelViewerProps {
  modelUrl: string
  productName: string
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const meshRef = useRef<any>()

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
    }
  })

  return <primitive ref={meshRef} object={scene} scale={2} />
}

export function ThreeDModelViewer({ modelUrl, productName }: ThreeDModelViewerProps) {
  const [isRotating, setIsRotating] = useState(true)

  return (
    <div className="relative w-full h-96 bg-gradient-to-b from-background to-muted rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense
          fallback={
            <Html center>
              <div className="text-white bg-black/50 px-4 py-2 rounded">Loading 3D model...</div>
            </Html>
          }
        >
          <Model url={modelUrl} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={!isRotating} />
      </Canvas>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
        <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded text-white text-sm">
          <Move3D className="w-4 h-4 inline mr-2" />
          Drag to rotate • Scroll to zoom
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsRotating(!isRotating)}
          className="bg-black/60 backdrop-blur hover:bg-black/80"
        >
          <RotateCw className="w-4 h-4 mr-2" />
          {isRotating ? "Stop" : "Auto Rotate"}
        </Button>
      </div>
    </div>
  )
}
