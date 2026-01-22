import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWorldStore } from '../../state/useWorldStore'
import { Iceberg, FloatingIce } from '../../world/WorldGenerator'

// Create procedural ice normal map for better surface detail
function createIceNormalMap(size: number = 512): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4

      // Multi-octave noise for ice cracks and surface variation
      const scale1 = 0.02, scale2 = 0.05, scale3 = 0.1
      const nx1 = Math.sin(x * scale1 + y * scale1 * 0.7) * 0.3
      const ny1 = Math.cos(y * scale1 + x * scale1 * 0.5) * 0.3
      const nx2 = Math.sin(x * scale2 * 1.3 + y * scale2) * 0.2
      const ny2 = Math.cos(y * scale2 * 1.1 + x * scale2 * 0.8) * 0.2
      const nx3 = Math.sin(x * scale3 + y * scale3 * 1.2) * 0.1
      const ny3 = Math.cos(y * scale3 * 0.9 + x * scale3) * 0.1

      // Combine octaves
      const nx = nx1 + nx2 + nx3
      const ny = ny1 + ny2 + ny3

      // Convert to normal map format (128 is neutral)
      data[i] = Math.floor((nx + 1) * 0.5 * 255)     // R - X normal
      data[i + 1] = Math.floor((ny + 1) * 0.5 * 255) // G - Y normal
      data[i + 2] = 255                               // B - Z normal (pointing up)
      data[i + 3] = 255                               // A
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
  return texture
}

// Shared ice normal map (created once, reused)
let sharedIceNormalMap: THREE.DataTexture | null = null
function getIceNormalMap(): THREE.DataTexture {
  if (!sharedIceNormalMap) {
    sharedIceNormalMap = createIceNormalMap(256)
  }
  return sharedIceNormalMap
}

// Single iceberg mesh component (large mountains)
function IcebergMesh({ iceberg }: { iceberg: Iceberg }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()

  const geometry = useMemo(() => {
    // Create iceberg geometry with irregular shape - more polygons for detail
    const geo = new THREE.ConeGeometry(
      iceberg.radius,
      iceberg.height,
      12 + Math.floor(iceberg.seed % 6), // 12-17 segments for smoother look
      6
    )

    // Add UV coordinates for normal mapping
    const positions = geo.getAttribute('position').array as Float32Array
    const uvs = geo.getAttribute('uv').array as Float32Array
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000
      return x - Math.floor(x)
    }

    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1]

      // More deformation at top, less at base - creates jagged peaks
      const heightFactor = (y + iceberg.height / 2) / iceberg.height
      const deformAmount = heightFactor * 0.5

      // Add layered deformation for more natural ice formation look
      const baseDeform = (seededRandom(iceberg.seed + i) - 0.5) * iceberg.radius * deformAmount
      const detailDeform = (seededRandom(iceberg.seed + i * 7) - 0.5) * iceberg.radius * 0.1

      positions[i] += baseDeform + detailDeform
      positions[i + 2] += (seededRandom(iceberg.seed + i + 1000) - 0.5) * iceberg.radius * deformAmount
      positions[i + 2] += (seededRandom(iceberg.seed + i * 13 + 500) - 0.5) * iceberg.radius * 0.1
    }

    // Scale UVs based on iceberg size for consistent normal detail
    const uvScale = Math.max(1, iceberg.radius / 20)
    for (let i = 0; i < uvs.length; i += 2) {
      uvs[i] *= uvScale
      uvs[i + 1] *= uvScale
    }

    geo.computeVertexNormals()
    return geo
  }, [iceberg])

  const material = useMemo(() => {
    const normalMap = getIceNormalMap()

    // Get environment map from scene for reflections
    const envMap = scene.environment

    return new THREE.MeshPhysicalMaterial({
      color: 0xc8e8f8,
      roughness: 0.25,
      metalness: 0.0,
      transparent: true,
      opacity: 0.92,
      transmission: 0.1,  // Slight subsurface light transmission
      thickness: 2.0,     // For transmission
      ior: 1.31,          // Index of refraction for ice
      clearcoat: 0.3,     // Glossy ice surface
      clearcoatRoughness: 0.2,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      envMap: envMap,
      envMapIntensity: 0.4,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
    })
  }, [scene.environment])

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
  const { scene } = useThree()

  const geometry = useMemo(() => {
    // Irregular polyhedron shape for floating ice - higher detail
    const geo = new THREE.IcosahedronGeometry(ice.radius, 1)

    // Flatten and deform for ice chunk look
    const positions = geo.getAttribute('position').array as Float32Array
    const uvs = geo.getAttribute('uv')?.array as Float32Array | undefined
    const seededRandom = (s: number) => {
      const x = Math.sin(s) * 10000
      return x - Math.floor(x)
    }

    for (let i = 0; i < positions.length; i += 3) {
      // Flatten vertically (ice floats low)
      positions[i + 1] *= 0.35

      // Add irregular deformation with multiple layers
      const baseX = 0.75 + seededRandom(ice.seed + i) * 0.5
      const baseZ = 0.75 + seededRandom(ice.seed + i + 500) * 0.5
      const detailX = (seededRandom(ice.seed + i * 11) - 0.5) * 0.15
      const detailZ = (seededRandom(ice.seed + i * 17 + 300) - 0.5) * 0.15

      positions[i] *= baseX + detailX
      positions[i + 2] *= baseZ + detailZ
    }

    // Scale UVs if they exist
    if (uvs) {
      const uvScale = Math.max(1, ice.radius / 4)
      for (let i = 0; i < uvs.length; i += 2) {
        uvs[i] *= uvScale
        uvs[i + 1] *= uvScale
      }
    }

    geo.computeVertexNormals()
    return geo
  }, [ice])

  const material = useMemo(() => {
    const normalMap = getIceNormalMap()
    const envMap = scene.environment

    return new THREE.MeshPhysicalMaterial({
      color: 0xe0f4ff,
      roughness: 0.15,
      metalness: 0.0,
      transparent: true,
      opacity: 0.88,
      transmission: 0.15,  // More transmission for smaller ice
      thickness: 1.0,
      ior: 1.31,
      clearcoat: 0.4,
      clearcoatRoughness: 0.15,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      envMap: envMap,
      envMapIntensity: 0.5,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
    })
  }, [scene.environment])

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
