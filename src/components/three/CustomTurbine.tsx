import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BladePoint, TurbineConfig, TurbineAnimation } from '@/state/useYachtStore'
import { interpolateSpline } from '@/editor/SplineUtils'
import { COLORS } from '@/utils/constants'

interface CustomTurbineProps {
  config: TurbineConfig
  deckHeight: number
  windSpeed: number
  animation?: TurbineAnimation
}

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
  thickness: number
  camber: number
  widthTop: number
  widthMid: number
  widthBottom: number
  angleTop: number
  angleMid: number
  angleBottom: number
}

function getWidthAtHeight(t: number, params: BladeShapeParams): number {
  if (t < 0.5) {
    const localT = t * 2
    return THREE.MathUtils.lerp(params.widthBottom, params.widthMid, localT)
  } else {
    const localT = (t - 0.5) * 2
    return THREE.MathUtils.lerp(params.widthMid, params.widthTop, localT)
  }
}

function getAngleAtHeight(t: number, params: BladeShapeParams): number {
  if (t < 0.5) {
    const localT = t * 2
    return THREE.MathUtils.lerp(params.angleBottom, params.angleMid, localT)
  } else {
    const localT = (t - 0.5) * 2
    return THREE.MathUtils.lerp(params.angleMid, params.angleTop, localT)
  }
}

function generateBladeMesh(
  profile: BladePoint[],
  height: number,
  diameter: number,
  shapeParams: BladeShapeParams
): THREE.BufferGeometry {
  const smoothProfile = interpolateSpline(profile.length > 1 ? profile : DEFAULT_BLADE_PROFILE, 8)

  if (smoothProfile.length < 2) {
    return new THREE.BoxGeometry(shapeParams.thickness, height, diameter * 0.2)
  }

  const vertices: number[] = []
  const indices: number[] = []

  const twistRad = (shapeParams.twist * Math.PI) / 180
  const sweepRad = (shapeParams.sweep * Math.PI) / 180
  const bladeThickness = shapeParams.thickness

  for (let i = 0; i < smoothProfile.length; i++) {
    const point = smoothProfile[i]
    const t = i / (smoothProfile.length - 1)

    const y = ((point.y + 1) / 2) * height
    const widthMult = getWidthAtHeight(1 - t, shapeParams)
    const taperMult = THREE.MathUtils.lerp(1, shapeParams.taper, 1 - t)

    const baseRadius = (point.x * diameter) / 2
    const radius = baseRadius * widthMult * taperMult

    const twist = t * twistRad
    const sweepOffset = t * Math.tan(sweepRad) * height * 0.1
    const chordAngle = (getAngleAtHeight(1 - t, shapeParams) * Math.PI) / 180

    // Apply camber - curve the blade surface
    const camberOffset = shapeParams.camber * Math.sin(t * Math.PI) * bladeThickness * 2

    const cos = Math.cos(twist)
    const sin = Math.sin(twist)

    const effectiveThickness = bladeThickness * Math.cos(chordAngle)
    const thicknessOffset = bladeThickness * Math.sin(chordAngle) * 0.5

    // Outer edge with camber
    vertices.push(
      radius * cos + sweepOffset,
      y + thicknessOffset + camberOffset,
      radius * sin + effectiveThickness / 2
    )

    // Inner edge with camber
    const innerRadius = Math.max(0.05, radius - bladeThickness * widthMult)
    vertices.push(
      innerRadius * cos + sweepOffset,
      y - thicknessOffset + camberOffset * 0.5,
      innerRadius * sin - effectiveThickness / 2
    )
  }

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

export function CustomTurbine({ config, deckHeight, windSpeed, animation }: CustomTurbineProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bladesRef = useRef<THREE.Group>(null)
  const bladeRefs = useRef<(THREE.Mesh | null)[]>([])

  // Default animation values
  const breathAmplitude = animation?.breathAmplitude ?? 0.2
  const breathFrequency = animation?.breathFrequency ?? 0.8
  const zCascade = animation?.zCascade ?? 0

  const {
    height, diameter, bladeCount, bladeProfile, material,
    twist, taper, sweep, thickness, camber,
    widthTop, widthMid, widthBottom,
    angleTop, angleMid, angleBottom
  } = config

  const shapeParams: BladeShapeParams = {
    twist: twist ?? 45,
    taper: taper ?? 0.8,
    sweep: sweep ?? 0,
    thickness: thickness ?? 0.08,
    camber: camber ?? 0,
    widthTop: widthTop ?? 1.0,
    widthMid: widthMid ?? 1.0,
    widthBottom: widthBottom ?? 1.0,
    angleTop: angleTop ?? 0,
    angleMid: angleMid ?? 0,
    angleBottom: angleBottom ?? 0,
  }

  const bladeGeometry = useMemo(() => {
    return generateBladeMesh(
      bladeProfile.length > 0 ? bladeProfile : DEFAULT_BLADE_PROFILE,
      height * 0.85,
      diameter,
      shapeParams
    )
  }, [bladeProfile, height, diameter,
      shapeParams.twist, shapeParams.taper, shapeParams.sweep,
      shapeParams.thickness, shapeParams.camber,
      shapeParams.widthTop, shapeParams.widthMid, shapeParams.widthBottom,
      shapeParams.angleTop, shapeParams.angleMid, shapeParams.angleBottom])

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

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const baseSpeed = windSpeed * 0.03 * delta * 60

    // Breathing animation with z-cascade
    if (bladesRef.current) {
      bladesRef.current.rotation.y += baseSpeed * 0.3
    }

    bladeRefs.current.forEach((blade, i) => {
      if (blade) {
        const baseAngle = (i / bladeCount) * Math.PI * 2

        // Breathing: radial scale pulsing like a flower
        const breathScale = 1 + breathAmplitude * Math.sin(
          time * breathFrequency + baseAngle
        )

        // Vertical breathing movement
        const verticalOffset = breathAmplitude * 0.3 * Math.sin(
          time * breathFrequency * 0.7 + baseAngle
        )

        // Z-cascade: each blade shifts by cumulative z offset
        // Blade 0: 0, Blade 1: zCascade, Blade 2: zCascade*2, etc.
        const zOffset = i * zCascade

        blade.rotation.set(0, baseAngle, 0)
        blade.position.set(0, verticalOffset, zOffset)
        blade.scale.set(breathScale, 1, breathScale)
      }
    })
  })

  const turbineY = deckHeight + height / 2 + 0.5

  return (
    <group ref={groupRef} position={[0, turbineY, 0]}>
      {/* Central shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.15, height, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Blades group */}
      <group ref={bladesRef}>
        {Array.from({ length: bladeCount }).map((_, i) => {
          const angle = (i / bladeCount) * Math.PI * 2
          return (
            <mesh
              key={i}
              ref={(el) => { bladeRefs.current[i] = el }}
              geometry={bladeGeometry}
              material={bladeMaterial}
              rotation={[0, angle, 0]}
              castShadow
            />
          )
        })}
      </group>

      {/* Top hub cap */}
      <mesh position={[0, height / 2 + 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.15, 16]} />
        <meshStandardMaterial color={COLORS.cyanAccent} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Bottom hub */}
      <mesh position={[0, -height / 2 - 0.1, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.2, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Reinforcing rings */}
      {[0.25, 0.5, 0.75].map((t, i) => (
        <mesh key={i} position={[0, height * (t - 0.5), 0]}>
          <torusGeometry args={[0.18, 0.02, 8, 24]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}
