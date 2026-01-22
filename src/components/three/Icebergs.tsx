import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../../state/useWorldStore'
import { Iceberg, FloatingIce } from '../../world/WorldGenerator'

// Single iceberg mesh component (large mountains)
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

// Floating ice chunk (smaller obstacles)
function FloatingIceMesh({ ice }: { ice: FloatingIce }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    // Irregular polyhedron shape for floating ice
    const geo = new THREE.IcosahedronGeometry(ice.radius, 0)

    // Flatten and deform for ice chunk look
    const positions = geo.getAttribute('position').array as Float32Array
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000
      return x - Math.floor(x)
    }

    for (let i = 0; i < positions.length; i += 3) {
      // Flatten vertically (ice floats low)
      positions[i + 1] *= 0.3

      // Add irregular deformation
      positions[i] *= 0.8 + seededRandom(ice.seed + i) * 0.4
      positions[i + 2] *= 0.8 + seededRandom(ice.seed + i + 500) * 0.4
    }

    geo.computeVertexNormals()
    return geo
  }, [ice])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0xe8f4fc,
      roughness: 0.1,
      metalness: 0.02,
      transparent: true,
      opacity: 0.85,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
    })
  }, [])

  // Floating/bobbing animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime
      meshRef.current.position.y = Math.sin(time * 0.5 + ice.seed) * 0.3 + 0.2
      meshRef.current.rotation.y += 0.002
      meshRef.current.rotation.x = Math.sin(time * 0.3 + ice.seed * 0.5) * 0.05
      meshRef.current.rotation.z = Math.cos(time * 0.4 + ice.seed * 0.3) * 0.05
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[ice.position[0], 0.2, ice.position[1]]}
      rotation={[0, (ice.seed % 360) * Math.PI / 180, 0]}
      castShadow
    />
  )
}

// Main component that renders all world icebergs and floating ice
export function Icebergs() {
  const world = useWorldStore((state) => state.world)

  const { icebergs, floatingIce } = useMemo(() => {
    if (!world) return { icebergs: [], floatingIce: [] }
    return {
      icebergs: world.icebergs,
      floatingIce: world.floatingIce || []
    }
  }, [world])

  if (icebergs.length === 0 && floatingIce.length === 0) return null

  return (
    <group name="world-ice">
      {/* Large icebergs (shown on map) */}
      {icebergs.map((iceberg) => (
        <IcebergMesh key={iceberg.id} iceberg={iceberg} />
      ))}

      {/* Smaller floating ice chunks (not on map, hazards only) */}
      {floatingIce.map((ice) => (
        <FloatingIceMesh key={ice.id} ice={ice} />
      ))}
    </group>
  )
}
