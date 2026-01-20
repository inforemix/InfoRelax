import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BladePoint, TurbineConfig } from '@/state/useYachtStore'
import { interpolateSpline } from '@/editor/SplineUtils'
import { COLORS } from '@/utils/constants'

interface CustomTurbineProps {
  config: TurbineConfig
  deckHeight: number
  windSpeed: number
}

// Default blade profile if none provided
const DEFAULT_BLADE_PROFILE: BladePoint[] = [
  { x: 0.1, y: 0.0 },
  { x: 0.2, y: -0.3 },
  { x: 0.3, y: -0.5 },
  { x: 0.35, y: -0.7 },
  { x: 0.3, y: -0.9 },
]

// Generate blade mesh from 2D profile
function generateBladeMesh(
  profile: BladePoint[],
  height: number,
  diameter: number,
  bladeThickness: number = 0.08,
  helixTwist: number = 45
): THREE.BufferGeometry {
  const smoothProfile = interpolateSpline(profile.length > 1 ? profile : DEFAULT_BLADE_PROFILE, 8)

  if (smoothProfile.length < 2) {
    return new THREE.BoxGeometry(bladeThickness, height, diameter * 0.2)
  }

  // Convert normalized profile to 3D coordinates
  // Profile x = radial distance from center, y = height position (0 to -1)
  const vertices: number[] = []
  const indices: number[] = []

  const twistRad = (helixTwist * Math.PI) / 180

  for (let i = 0; i < smoothProfile.length; i++) {
    const point = smoothProfile[i]
    const t = i / (smoothProfile.length - 1)

    // Height along the turbine (0 at top, height at bottom)
    const y = ((point.y + 1) / 2) * height

    // Radial distance from center
    const radius = (point.x * diameter) / 2

    // Apply helical twist based on height
    const twist = t * twistRad

    // Calculate positions with twist
    const cos = Math.cos(twist)
    const sin = Math.sin(twist)

    // Outer edge
    vertices.push(
      radius * cos,
      y,
      radius * sin + bladeThickness / 2
    )

    // Inner edge (slightly closer to center)
    const innerRadius = Math.max(0.05, radius - bladeThickness)
    vertices.push(
      innerRadius * cos,
      y,
      innerRadius * sin - bladeThickness / 2
    )
  }

  // Create faces
  for (let i = 0; i < smoothProfile.length - 1; i++) {
    const base = i * 2
    // Front face
    indices.push(base, base + 2, base + 1)
    indices.push(base + 1, base + 2, base + 3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

export function CustomTurbine({ config, deckHeight, windSpeed }: CustomTurbineProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bladesRef = useRef<THREE.Group>(null)

  const { height, diameter, bladeCount, bladeProfile, material } = config

  // Generate blade geometry from profile
  const bladeGeometry = useMemo(() => {
    return generateBladeMesh(
      bladeProfile.length > 0 ? bladeProfile : DEFAULT_BLADE_PROFILE,
      height * 0.85,
      diameter,
      0.08,
      50
    )
  }, [bladeProfile, height, diameter])

  // Material based on config
  const bladeMaterial = useMemo(() => {
    const colors = {
      solar: COLORS.turbinePurple,
      chrome: '#94a3b8',
      led: COLORS.cyanAccent,
    }
    return new THREE.MeshStandardMaterial({
      color: colors[material],
      metalness: material === 'chrome' ? 0.9 : 0.5,
      roughness: material === 'chrome' ? 0.1 : 0.3,
      side: THREE.DoubleSide,
    })
  }, [material])

  // Animate turbine rotation
  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.y += windSpeed * 0.03 * delta * 60
    }
  })

  const turbineY = deckHeight + height / 2 + 0.5

  return (
    <group ref={groupRef} position={[0, turbineY, 0]}>
      {/* Central shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.15, height, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rotating blade assembly */}
      <group ref={bladesRef}>
        {Array.from({ length: bladeCount }).map((_, i) => {
          const angle = (i / bladeCount) * Math.PI * 2
          return (
            <mesh
              key={i}
              geometry={bladeGeometry}
              material={bladeMaterial}
              rotation={[0, angle, 0]}
              castShadow
            />
          )
        })}
      </group>

      {/* Top cap */}
      <mesh position={[0, height / 2 + 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.15, 16]} />
        <meshStandardMaterial color={COLORS.cyanAccent} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Bottom mount */}
      <mesh position={[0, -height / 2 - 0.1, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Decorative rings */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <mesh key={i} position={[0, height * (t - 0.5), 0]}>
          <torusGeometry args={[0.18, 0.02, 8, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}
