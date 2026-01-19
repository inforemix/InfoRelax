import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

import { useGameStore } from '@/state/useGameStore'

export function WindIndicator() {
  const arrowRef = useRef<THREE.Group>(null)
  const { wind } = useGameStore()
  
  useFrame(() => {
    if (arrowRef.current) {
      // Point arrow in wind direction
      arrowRef.current.rotation.y = (wind.direction * Math.PI) / 180
    }
  })
  
  return (
    <group position={[0, 15, 0]}>
      {/* Wind arrow */}
      <group ref={arrowRef}>
        <mesh position={[0, 0, 2]}>
          <coneGeometry args={[0.5, 2, 8]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 4, 8]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.2} />
        </mesh>
      </group>
      
      {/* Wind speed label */}
      <Html center position={[0, 2, 0]}>
        <div className="bg-slate-900/80 px-3 py-1 rounded-lg text-white text-sm font-mono whitespace-nowrap">
          <span className="text-cyan-400">{wind.speed.toFixed(1)}</span> m/s
        </div>
      </Html>
    </group>
  )
}
