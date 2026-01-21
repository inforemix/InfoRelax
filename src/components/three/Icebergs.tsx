import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRaceStore } from '../../state/useRaceStore'

export type RaceDifficulty = 'peaceful' | 'moderate' | 'challenging'

interface IcebergData {
  id: string
  position: [number, number, number]
  radius: number
  height: number
  rotation: number
  seed: number
}

interface IcebergsProps {
  difficulty?: RaceDifficulty
}

// Generate icebergs based on race checkpoints and difficulty
function generateIcebergs(
  checkpoints: Array<{ position: [number, number]; radius: number }>,
  difficulty: RaceDifficulty,
  seed: number
): IcebergData[] {
  const icebergs: IcebergData[] = []

  // Iceberg count based on difficulty
  const countMultiplier = {
    peaceful: 3,
    moderate: 8,
    challenging: 15,
  }

  // Iceberg size based on difficulty
  const sizeMultiplier = {
    peaceful: 0.6,
    moderate: 1.0,
    challenging: 1.4,
  }

  const baseCount = countMultiplier[difficulty]
  const baseSize = sizeMultiplier[difficulty]

  // Seeded random for consistent generation
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000
    return x - Math.floor(x)
  }

  let currentSeed = seed

  // Generate icebergs along the race path
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const cp1 = checkpoints[i]
    const cp2 = checkpoints[i + 1]

    // Distance between checkpoints
    const dx = cp2.position[0] - cp1.position[0]
    const dz = cp2.position[1] - cp1.position[1]
    const distance = Math.sqrt(dx * dx + dz * dz)

    // Number of icebergs between these checkpoints
    const numIcebergs = Math.floor((distance / 500) * baseCount)

    for (let j = 0; j < numIcebergs; j++) {
      currentSeed++

      // Position along the path with random offset
      const t = seededRandom(currentSeed) * 0.8 + 0.1 // 10%-90% along path
      const pathX = cp1.position[0] + dx * t
      const pathZ = cp1.position[1] + dz * t

      // Random offset perpendicular to path
      const perpX = -dz / distance
      const perpZ = dx / distance
      const offsetDist = (seededRandom(currentSeed + 1000) - 0.5) * 400 * baseSize

      const x = pathX + perpX * offsetDist
      const z = pathZ + perpZ * offsetDist

      // Skip if too close to checkpoint
      const distToCP1 = Math.sqrt(
        Math.pow(x - cp1.position[0], 2) + Math.pow(z - cp1.position[1], 2)
      )
      const distToCP2 = Math.sqrt(
        Math.pow(x - cp2.position[0], 2) + Math.pow(z - cp2.position[1], 2)
      )

      if (distToCP1 < cp1.radius * 1.5 || distToCP2 < cp2.radius * 1.5) {
        continue
      }

      // Iceberg properties
      const radius = (15 + seededRandom(currentSeed + 2000) * 35) * baseSize
      const height = (10 + seededRandom(currentSeed + 3000) * 30) * baseSize
      const rotation = seededRandom(currentSeed + 4000) * Math.PI * 2

      icebergs.push({
        id: `iceberg-${i}-${j}`,
        position: [x, 0, z],
        radius,
        height,
        rotation,
        seed: currentSeed,
      })
    }
  }

  return icebergs
}

// Single iceberg mesh component
function IcebergMesh({ iceberg }: { iceberg: IcebergData }) {
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
      position={[iceberg.position[0], iceberg.height * 0.3, iceberg.position[2]]}
      rotation={[0, iceberg.rotation, 0]}
      castShadow
      receiveShadow
    />
  )
}

export function Icebergs({ difficulty = 'moderate' }: IcebergsProps) {
  const currentRace = useRaceStore((state) => state.currentRace)
  const isRacing = useRaceStore((state) => state.isRacing)

  const icebergs = useMemo(() => {
    if (!currentRace || !isRacing) return []

    // Use race ID as seed for consistent generation
    const seed = currentRace.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

    return generateIcebergs(currentRace.checkpoints, difficulty, seed)
  }, [currentRace, isRacing, difficulty])

  if (!isRacing || icebergs.length === 0) return null

  return (
    <group name="icebergs">
      {icebergs.map((iceberg) => (
        <IcebergMesh key={iceberg.id} iceberg={iceberg} />
      ))}
    </group>
  )
}

// Export iceberg data getter for collision detection
export function getIcebergPositions(
  checkpoints: Array<{ position: [number, number]; radius: number }>,
  difficulty: RaceDifficulty,
  raceId: string
): IcebergData[] {
  const seed = raceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return generateIcebergs(checkpoints, difficulty, seed)
}
