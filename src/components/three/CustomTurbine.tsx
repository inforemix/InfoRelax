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

interface BladeShapeParams {
  twist: number
  taper: number
  sweep: number
  widthTop: number
  widthMid: number
  widthBottom: number
  angleTop: number
  angleMid: number
  angleBottom: number
}

// Interpolate width at a given height position (0 = bottom, 1 = top)
function getWidthAtHeight(t: number, params: BladeShapeParams): number {
  if (t < 0.5) {
    // Bottom to mid
    const localT = t * 2
    return THREE.MathUtils.lerp(params.widthBottom, params.widthMid, localT)
  } else {
    // Mid to top
    const localT = (t - 0.5) * 2
    return THREE.MathUtils.lerp(params.widthMid, params.widthTop, localT)
  }
}

// Interpolate chord angle at a given height position
function getAngleAtHeight(t: number, params: BladeShapeParams): number {
  if (t < 0.5) {
    const localT = t * 2
    return THREE.MathUtils.lerp(params.angleBottom, params.angleMid, localT)
  } else {
    const localT = (t - 0.5) * 2
    return THREE.MathUtils.lerp(params.angleMid, params.angleTop, localT)
  }
}

// Generate blade mesh from 2D profile with advanced parameters
function generateBladeMesh(
  profile: BladePoint[],
  height: number,
  diameter: number,
  bladeThickness: number = 0.08,
  shapeParams: BladeShapeParams
): THREE.BufferGeometry {
  const smoothProfile = interpolateSpline(profile.length > 1 ? profile : DEFAULT_BLADE_PROFILE, 8)

  if (smoothProfile.length < 2) {
    return new THREE.BoxGeometry(bladeThickness, height, diameter * 0.2)
  }

  const vertices: number[] = []
  const indices: number[] = []

  const twistRad = (shapeParams.twist * Math.PI) / 180
  const sweepRad = (shapeParams.sweep * Math.PI) / 180

  for (let i = 0; i < smoothProfile.length; i++) {
    const point = smoothProfile[i]
    const t = i / (smoothProfile.length - 1) // 0 at start (top), 1 at end (bottom)

    // Height along the turbine (0 at top, height at bottom)
    const y = ((point.y + 1) / 2) * height

    // Get width multiplier for this height
    const widthMult = getWidthAtHeight(1 - t, shapeParams) // Invert t for bottom-to-top

    // Apply taper (top is thinner)
    const taperMult = THREE.MathUtils.lerp(1, shapeParams.taper, 1 - t)

    // Radial distance from center with width and taper
    const baseRadius = (point.x * diameter) / 2
    const radius = baseRadius * widthMult * taperMult

    // Apply helical twist based on height
    const twist = t * twistRad

    // Apply sweep offset
    const sweepOffset = t * Math.tan(sweepRad) * height * 0.1

    // Get chord angle at this height
    const chordAngle = (getAngleAtHeight(1 - t, shapeParams) * Math.PI) / 180

    // Calculate positions with twist, sweep, and chord angle
    const cos = Math.cos(twist)
    const sin = Math.sin(twist)

    // Thickness varies with chord angle
    const effectiveThickness = bladeThickness * Math.cos(chordAngle)
    const thicknessOffset = bladeThickness * Math.sin(chordAngle) * 0.5

    // Outer edge
    vertices.push(
      radius * cos + sweepOffset,
      y + thicknessOffset,
      radius * sin + effectiveThickness / 2
    )

    // Inner edge
    const innerRadius = Math.max(0.05, radius - bladeThickness * widthMult)
    vertices.push(
      innerRadius * cos + sweepOffset,
      y - thicknessOffset,
      innerRadius * sin - effectiveThickness / 2
    )
  }

  // Create faces
  for (let i = 0; i < smoothProfile.length - 1; i++) {
    const base = i * 2
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

  const {
    height, diameter, bladeCount, bladeProfile, material,
    twist, taper, sweep,
    widthTop, widthMid, widthBottom,
    angleTop, angleMid, angleBottom
  } = config

  // Shape parameters object
  const shapeParams: BladeShapeParams = {
    twist: twist ?? 45,
    taper: taper ?? 0.8,
    sweep: sweep ?? 0,
    widthTop: widthTop ?? 1.0,
    widthMid: widthMid ?? 1.0,
    widthBottom: widthBottom ?? 1.0,
    angleTop: angleTop ?? 0,
    angleMid: angleMid ?? 0,
    angleBottom: angleBottom ?? 0,
  }

  // Generate blade geometry from profile with shape params
  const bladeGeometry = useMemo(() => {
    return generateBladeMesh(
      bladeProfile.length > 0 ? bladeProfile : DEFAULT_BLADE_PROFILE,
      height * 0.85,
      diameter,
      0.1,
      shapeParams
    )
  }, [bladeProfile, height, diameter, shapeParams.twist, shapeParams.taper, shapeParams.sweep,
      shapeParams.widthTop, shapeParams.widthMid, shapeParams.widthBottom,
      shapeParams.angleTop, shapeParams.angleMid, shapeParams.angleBottom])

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
