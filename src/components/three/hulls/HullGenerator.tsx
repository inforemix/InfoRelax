import * as THREE from 'three'
import { useMemo } from 'react'
import { HullConfig } from '@/state/useYachtStore'
import { COLORS } from '@/utils/constants'

interface HullProps {
  config: HullConfig
}

// Generate a parametric hull shape based on bow type
function generateHullShape(
  length: number,
  beam: number,
  _draft: number, // Reserved for future depth-based shape modifications
  bowShape: 'piercing' | 'flared' | 'bulbous'
): THREE.Shape {
  const shape = new THREE.Shape()
  const halfBeam = beam / 2
  const halfLength = length / 2

  // Start at stern, go clockwise
  shape.moveTo(-halfLength, 0)

  // Stern curve
  shape.quadraticCurveTo(-halfLength, halfBeam * 0.4, -halfLength * 0.9, halfBeam * 0.5)

  // Port side (left)
  shape.lineTo(halfLength * 0.6, halfBeam * 0.5)

  // Bow shape variations
  switch (bowShape) {
    case 'piercing':
      // Sharp, narrow bow for speed
      shape.quadraticCurveTo(halfLength * 0.9, halfBeam * 0.3, halfLength, 0)
      shape.quadraticCurveTo(halfLength * 0.9, -halfBeam * 0.3, halfLength * 0.6, -halfBeam * 0.5)
      break
    case 'flared':
      // Wide, flared bow for stability in waves
      shape.quadraticCurveTo(halfLength * 0.85, halfBeam * 0.6, halfLength * 0.95, halfBeam * 0.2)
      shape.lineTo(halfLength, 0)
      shape.lineTo(halfLength * 0.95, -halfBeam * 0.2)
      shape.quadraticCurveTo(halfLength * 0.85, -halfBeam * 0.6, halfLength * 0.6, -halfBeam * 0.5)
      break
    case 'bulbous':
      // Bulbous bow for efficiency
      shape.quadraticCurveTo(halfLength * 0.8, halfBeam * 0.35, halfLength * 0.9, halfBeam * 0.1)
      shape.bezierCurveTo(
        halfLength * 1.1, halfBeam * 0.15,
        halfLength * 1.1, -halfBeam * 0.15,
        halfLength * 0.9, -halfBeam * 0.1
      )
      shape.quadraticCurveTo(halfLength * 0.8, -halfBeam * 0.35, halfLength * 0.6, -halfBeam * 0.5)
      break
  }

  // Starboard side (right)
  shape.lineTo(-halfLength * 0.9, -halfBeam * 0.5)

  // Close at stern
  shape.quadraticCurveTo(-halfLength, -halfBeam * 0.4, -halfLength, 0)

  return shape
}

// Monohull - single hull design
function MonohullGeometry({ config }: HullProps) {
  const { length, beam, draft, bowShape } = config

  const geometry = useMemo(() => {
    const shape = generateHullShape(length, beam * 0.6, draft, bowShape)
    const extrudeSettings = {
      steps: 1,
      depth: draft,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3,
    }
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [length, beam, draft, bowShape])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, draft * 0.5, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.hullWhite} metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  )
}

// Catamaran - twin hull design
function CatamaranGeometry({ config }: HullProps) {
  const { length, beam, draft, bowShape } = config
  const hullSpacing = beam * 0.4 // Space between hulls

  const hullGeometry = useMemo(() => {
    const shape = generateHullShape(length, beam * 0.25, draft, bowShape)
    const extrudeSettings = {
      steps: 1,
      depth: draft,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 2,
    }
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [length, beam, draft, bowShape])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, draft * 0.5, 0]}>
      {/* Port hull */}
      <mesh geometry={hullGeometry} position={[0, -hullSpacing, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.hullWhite} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Starboard hull */}
      <mesh geometry={hullGeometry} position={[0, hullSpacing, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.hullWhite} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Cross beams */}
      <mesh position={[length * 0.2, 0, draft + 0.15]}>
        <boxGeometry args={[0.3, beam * 0.9, 0.25]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh position={[-length * 0.2, 0, draft + 0.15]}>
        <boxGeometry args={[0.3, beam * 0.9, 0.25]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.8} />
      </mesh>
    </group>
  )
}

// Trimaran - center hull with two outriggers
function TrimaranGeometry({ config }: HullProps) {
  const { length, beam, draft, bowShape } = config
  const outriggerSpacing = beam * 0.45

  const mainHullGeometry = useMemo(() => {
    const shape = generateHullShape(length, beam * 0.35, draft, bowShape)
    const extrudeSettings = {
      steps: 1,
      depth: draft,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3,
    }
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [length, beam, draft, bowShape])

  const outriggerGeometry = useMemo(() => {
    const shape = generateHullShape(length * 0.7, beam * 0.12, draft * 0.6, 'piercing')
    const extrudeSettings = {
      steps: 1,
      depth: draft * 0.6,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
    }
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [length, beam, draft])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, draft * 0.5, 0]}>
      {/* Main center hull */}
      <mesh geometry={mainHullGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.hullWhite} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Port outrigger */}
      <mesh
        geometry={outriggerGeometry}
        position={[-length * 0.05, -outriggerSpacing, draft * 0.2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={COLORS.hullWhite} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Starboard outrigger */}
      <mesh
        geometry={outriggerGeometry}
        position={[-length * 0.05, outriggerSpacing, draft * 0.2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={COLORS.hullWhite} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Cross beams connecting to outriggers */}
      <mesh position={[length * 0.1, -outriggerSpacing / 2, draft + 0.1]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.2, outriggerSpacing, 0.15]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[length * 0.1, outriggerSpacing / 2, draft + 0.1]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.2, outriggerSpacing, 0.15]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[-length * 0.15, -outriggerSpacing / 2, draft + 0.1]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.2, outriggerSpacing, 0.15]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[-length * 0.15, outriggerSpacing / 2, draft + 0.1]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.2, outriggerSpacing, 0.15]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  )
}

// Hydrofoil - hull with lifting foils
function HydrofoilGeometry({ config }: HullProps) {
  const { length, beam, draft, bowShape } = config
  const hullSpacing = beam * 0.35

  const hullGeometry = useMemo(() => {
    // Slimmer hulls for hydrofoil
    const shape = generateHullShape(length, beam * 0.2, draft * 0.7, bowShape)
    const extrudeSettings = {
      steps: 1,
      depth: draft * 0.7,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 2,
    }
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [length, beam, draft, bowShape])

  // Create foil shape (hydrofoil wing)
  const foilGeometry = useMemo(() => {
    const foilShape = new THREE.Shape()
    const foilLength = beam * 0.8
    const foilWidth = 0.3

    // Airfoil-like cross section
    foilShape.moveTo(-foilLength / 2, 0)
    foilShape.quadraticCurveTo(0, foilWidth, foilLength / 2, 0)
    foilShape.quadraticCurveTo(0, -foilWidth * 0.3, -foilLength / 2, 0)

    const extrudeSettings = {
      steps: 1,
      depth: 0.08,
      bevelEnabled: false,
    }
    return new THREE.ExtrudeGeometry(foilShape, extrudeSettings)
  }, [beam])

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, draft * 0.5, 0]}>
      {/* Port hull */}
      <mesh geometry={hullGeometry} position={[0, -hullSpacing, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.hullWhite} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Starboard hull */}
      <mesh geometry={hullGeometry} position={[0, hullSpacing, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={COLORS.hullWhite} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Front foil assembly */}
      <group position={[length * 0.25, 0, -draft * 0.8]}>
        {/* Vertical struts */}
        <mesh position={[0, -hullSpacing, draft * 0.5]}>
          <boxGeometry args={[0.1, 0.1, draft * 1.2]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, hullSpacing, draft * 0.5]}>
          <boxGeometry args={[0.1, 0.1, draft * 1.2]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Foil */}
        <mesh geometry={foilGeometry} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <meshStandardMaterial color={COLORS.cyanAccent} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Rear foil assembly */}
      <group position={[-length * 0.3, 0, -draft * 0.6]}>
        {/* Vertical struts */}
        <mesh position={[0, -hullSpacing, draft * 0.4]}>
          <boxGeometry args={[0.1, 0.1, draft * 1.0]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, hullSpacing, draft * 0.4]}>
          <boxGeometry args={[0.1, 0.1, draft * 1.0]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Foil */}
        <mesh geometry={foilGeometry} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <meshStandardMaterial color={COLORS.cyanAccent} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Cross beam */}
      <mesh position={[0, 0, draft * 0.7 + 0.15]}>
        <boxGeometry args={[length * 0.5, beam * 0.85, 0.2]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.8} />
      </mesh>
    </group>
  )
}

// Deck component shared by all hull types
export function Deck({ config }: HullProps) {
  const { length, beam, draft, type } = config
  const deckHeight = draft + 0.3

  // Adjust deck width based on hull type
  const deckWidth = type === 'monohull' ? beam * 0.5 : beam * 0.75

  return (
    <group position={[0, deckHeight, 0]}>
      {/* Main deck */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[length * 0.65, 0.1, deckWidth]} />
        <meshStandardMaterial color={COLORS.turbinePurple} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Cabin */}
      <mesh position={[length * 0.15, 0.35, 0]} castShadow>
        <boxGeometry args={[length * 0.25, 0.6, deckWidth * 0.5]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Windshield */}
      <mesh position={[length * 0.28, 0.5, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.05, 0.4, deckWidth * 0.45]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.9} roughness={0.1} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

// Main hull generator that switches based on type
export function ParametricHull({ config }: HullProps) {
  const HullComponent = {
    monohull: MonohullGeometry,
    catamaran: CatamaranGeometry,
    trimaran: TrimaranGeometry,
    hydrofoil: HydrofoilGeometry,
  }[config.type]

  return (
    <group>
      <HullComponent config={config} />
      <Deck config={config} />
    </group>
  )
}
