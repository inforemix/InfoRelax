import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../../state/useWorldStore'
import { Iceberg } from '../../world/WorldGenerator'

// Single iceberg mesh component
function IcebergMesh({ iceberg }: { iceberg: Iceberg }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    // Create iceberg geometry with irregular shape
    const geo = new THREE.ConeGeometry(
      iceberg.radius,
      iceberg.height,
      8 + Math.floor(iceberg.seed % 4), // 8-11 segments
      4
    )

    // Deform vertices for irregular shape
    const positions = geo.getAttribute('position').array as Float32Array
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000
      return x - Math.floor(x)
    }

    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1]

      // More deformation at top, less at base
      const heightFactor = (y + iceberg.height / 2) / iceberg.height
      const deformAmount = heightFactor * 0.4

      positions[i] += (seededRandom(iceberg.seed + i) - 0.5) * iceberg.radius * deformAmount
      positions[i + 2] += (seededRandom(iceberg.seed + i + 1000) - 0.5) * iceberg.radius * deformAmount
    }

    geo.computeVertexNormals()
    return geo
  }, [iceberg])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xd0e8f0,
      roughness: 0.15,
      metalness: 0.05,
      transparent: true,
      opacity: 0.95,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
    })
  }, [])

  // Subtle bobbing animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        iceberg.height * 0.3 + Math.sin(state.clock.elapsedTime * 0.3 + iceberg.seed) * 0.5
      meshRef.current.rotation.y += 0.0005
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[iceberg.position[0], iceberg.height * 0.3, iceberg.position[1]]}
      rotation={[0, (iceberg.seed % 360) * Math.PI / 180, 0]}
      castShadow
      receiveShadow
    />
  )
}

// Main component that renders all world icebergs
export function Icebergs() {
  const world = useWorldStore((state) => state.world)

  const icebergs = useMemo(() => {
    if (!world) return []
    return world.icebergs
  }, [world])

  if (icebergs.length === 0) return null

  return (
    <group name="world-icebergs">
      {icebergs.map((iceberg) => (
        <IcebergMesh key={iceberg.id} iceberg={iceberg} />
      ))}
    </group>
  )
}
