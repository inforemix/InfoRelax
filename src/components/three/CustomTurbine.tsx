import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import { BladePoint, TurbineConfig } from '@/state/useYachtStore'
import { interpolateSpline } from '@/editor/SplineUtils'
import { COLORS } from '@/utils/constants'

interface CustomTurbineProps {
  config: TurbineConfig
  deckHeight: number
  windSpeed: number
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

// Simplex noise for wind-driven motion
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n)) * 2 - 1
}

function smoothNoise(x: number, y: number, octaves: number = 3): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, y * frequency) * amplitude
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  return value / maxValue
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

export function CustomTurbine({ config, deckHeight, windSpeed }: CustomTurbineProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bladesRef = useRef<THREE.Group>(null)
  const bladeRefs = useRef<(THREE.Mesh | null)[]>([])

  // Wind state for smooth wind-driven motion
  const windState = useRef({
    value: 0,
    target: 0,
    bladeWinds: [] as number[],
  })

  // Parametric animation controls
  const animControls = useControls('Turbine Animation', {
    'Motion Type': folder({
      animationMode: {
        value: 'unified',
        options: ['unified', 'differential', 'ripple', 'breathing', 'wobble', 'lissajous', 'windDriven'],
        label: 'Mode',
      },
    }),
    'Differential Speed': folder({
      speedVariation: { value: 0.3, min: 0, max: 1, step: 0.05, label: 'Speed Variation' },
      phaseSpread: { value: 0.5, min: 0, max: 2, step: 0.1, label: 'Phase Spread' },
    }),
    'Ripple Effect': folder({
      rippleAmplitude: { value: 0.15, min: 0, max: 0.5, step: 0.01, label: 'Amplitude' },
      rippleFrequency: { value: 2.0, min: 0.5, max: 5, step: 0.1, label: 'Frequency' },
    }),
    'Breathing': folder({
      breathAmplitude: { value: 0.2, min: 0, max: 0.5, step: 0.01, label: 'Amplitude' },
      breathFrequency: { value: 0.8, min: 0.2, max: 3, step: 0.1, label: 'Frequency' },
    }),
    'Wobble': folder({
      wobbleX: { value: 0.08, min: 0, max: 0.3, step: 0.01, label: 'X Amplitude' },
      wobbleY: { value: 0.05, min: 0, max: 0.3, step: 0.01, label: 'Y Amplitude' },
      wobbleZ: { value: 0.08, min: 0, max: 0.3, step: 0.01, label: 'Z Amplitude' },
      wobbleSpeed: { value: 1.5, min: 0.5, max: 4, step: 0.1, label: 'Speed' },
    }),
    'Lissajous': folder({
      lissajousA: { value: 3, min: 1, max: 7, step: 1, label: 'Frequency A' },
      lissajousB: { value: 2, min: 1, max: 7, step: 1, label: 'Frequency B' },
      lissajousAmplitude: { value: 0.3, min: 0.1, max: 1, step: 0.05, label: 'Amplitude' },
    }),
    'Wind Driven': folder({
      windInfluence: { value: 0.7, min: 0, max: 1, step: 0.05, label: 'Wind Influence' },
      gustiness: { value: 0.4, min: 0, max: 1, step: 0.05, label: 'Gustiness' },
      damping: { value: 0.95, min: 0.8, max: 0.99, step: 0.01, label: 'Damping' },
    }),
  })

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

  // Initialize blade wind states
  if (windState.current.bladeWinds.length !== bladeCount) {
    windState.current.bladeWinds = Array(bladeCount).fill(0)
  }

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const baseSpeed = windSpeed * 0.03 * delta * 60

    // Update wind noise
    const windNoise = smoothNoise(time * 0.1, 0, 3)
    windState.current.target = windNoise * animControls.gustiness
    windState.current.value += (windState.current.target - windState.current.value) * (1 - animControls.damping)

    // Update per-blade wind
    for (let i = 0; i < bladeCount; i++) {
      const bladeNoise = smoothNoise(time * 0.15, i * 0.7, 2)
      windState.current.bladeWinds[i] = bladeNoise * animControls.gustiness * 0.5
    }

    switch (animControls.animationMode) {
      case 'unified':
        // Standard unified spinning
        if (bladesRef.current) {
          bladesRef.current.rotation.y += baseSpeed
        }
        // Reset individual blade transforms
        bladeRefs.current.forEach((blade, i) => {
          if (blade) {
            const baseAngle = (i / bladeCount) * Math.PI * 2
            blade.rotation.set(0, baseAngle, 0)
            blade.position.set(0, 0, 0)
            blade.scale.set(1, 1, 1)
          }
        })
        break

      case 'differential':
        // Different angular speeds per blade
        if (bladesRef.current) {
          bladesRef.current.rotation.y = 0 // Reset group rotation
        }
        bladeRefs.current.forEach((blade, i) => {
          if (blade) {
            const baseAngle = (i / bladeCount) * Math.PI * 2
            // ω_i = ω_0 + a * sin(i * k) for slow drifting interference
            const speedMod = 1 + animControls.speedVariation * Math.sin(i * animControls.phaseSpread)
            const phase = i * animControls.phaseSpread
            blade.rotation.y = baseAngle + time * baseSpeed * 60 * speedMod + phase
            blade.rotation.x = 0
            blade.rotation.z = 0
            blade.position.set(0, 0, 0)
            blade.scale.set(1, 1, 1)
          }
        })
        break

      case 'ripple':
        // Phase-offset wave - blades "ripple" instead of rotating as rigid disk
        if (bladesRef.current) {
          bladesRef.current.rotation.y += baseSpeed * 0.5
        }
        bladeRefs.current.forEach((blade, i) => {
          if (blade) {
            const baseAngle = (i / bladeCount) * Math.PI * 2
            // θ_i(t) = α_i + A * sin(Ωt + α_i)
            const rippleOffset = animControls.rippleAmplitude * Math.sin(
              time * animControls.rippleFrequency + baseAngle
            )
            // Also add tilt modulation: β_i(t) = B * sin(Ωt + α_i)
            const tiltOffset = animControls.rippleAmplitude * 0.5 * Math.sin(
              time * animControls.rippleFrequency * 1.3 + baseAngle
            )
            blade.rotation.set(tiltOffset, baseAngle + rippleOffset, 0)
            blade.position.set(0, 0, 0)
            blade.scale.set(1, 1, 1)
          }
        })
        break

      case 'breathing':
        // Radial breathing - sculpture "breathes" in and out like a flower
        if (bladesRef.current) {
          bladesRef.current.rotation.y += baseSpeed * 0.3
        }
        bladeRefs.current.forEach((blade, i) => {
          if (blade) {
            const baseAngle = (i / bladeCount) * Math.PI * 2
            // r_i(t) = R_0 + C * sin(Ωt + α_i)
            const breathScale = 1 + animControls.breathAmplitude * Math.sin(
              time * animControls.breathFrequency + baseAngle
            )
            // Also add slight vertical movement
            const verticalOffset = animControls.breathAmplitude * 0.3 * Math.sin(
              time * animControls.breathFrequency * 0.7 + baseAngle
            )
            blade.rotation.set(0, baseAngle, 0)
            blade.position.set(0, verticalOffset, 0)
            blade.scale.set(breathScale, 1, breathScale)
          }
        })
        break

      case 'wobble':
        // Multi-axis wobble (no uniformity)
        if (bladesRef.current) {
          bladesRef.current.rotation.y += baseSpeed * 0.4
        }
        bladeRefs.current.forEach((blade, i) => {
          if (blade) {
            const baseAngle = (i / bladeCount) * Math.PI * 2
            const ws = animControls.wobbleSpeed
            // rotX = sin(time * a + i) * xAmp
            // rotY = sin(time * b + i) * yAmp
            // rotZ = sin(time * c + i) * zAmp
            const rotX = Math.sin(time * ws * 1.1 + i * 1.3) * animControls.wobbleX
            const rotY = baseAngle + Math.sin(time * ws * 0.7 + i * 0.9) * animControls.wobbleY
            const rotZ = Math.sin(time * ws * 1.5 + i * 1.7) * animControls.wobbleZ
            blade.rotation.set(rotX, rotY, rotZ)
            blade.position.set(0, 0, 0)
            blade.scale.set(1, 1, 1)
          }
        })
        break

      case 'lissajous':
        // Lissajous parametric curves - orbit + drift
        if (bladesRef.current) {
          bladesRef.current.rotation.y = 0
        }
        bladeRefs.current.forEach((blade, i) => {
          if (blade) {
            const baseAngle = (i / bladeCount) * Math.PI * 2
            const a = animControls.lissajousA
            const b = animControls.lissajousB
            const amp = animControls.lissajousAmplitude
            const phase = baseAngle

            // Lissajous figure: x = A*sin(at + phase), y = B*sin(bt)
            const lissX = amp * Math.sin(a * time + phase)
            const lissZ = amp * Math.sin(b * time)

            // Orbital rotation based on lissajous
            const orbitalAngle = baseAngle + time * baseSpeed * 30

            blade.rotation.set(lissX * 0.3, orbitalAngle, lissZ * 0.3)
            blade.position.set(lissX * 0.5, 0, lissZ * 0.5)
            blade.scale.set(1, 1, 1)
          }
        })
        break

      case 'windDriven':
        // Wind-driven motion with noise and damping
        const windMod = windState.current.value
        if (bladesRef.current) {
          // Base rotation affected by wind
          const windSpeedMod = 1 + windMod * animControls.windInfluence
          bladesRef.current.rotation.y += baseSpeed * windSpeedMod
        }
        bladeRefs.current.forEach((blade, i) => {
          if (blade) {
            const baseAngle = (i / bladeCount) * Math.PI * 2
            const bladeWind = windState.current.bladeWinds[i] || 0

            // Each blade flutters slightly differently based on local wind
            const flutter = bladeWind * animControls.windInfluence * 0.15
            const tilt = bladeWind * animControls.windInfluence * 0.1

            blade.rotation.set(
              tilt * Math.sin(time * 2 + i),
              baseAngle + flutter,
              flutter * Math.cos(time * 1.5 + i * 0.5)
            )
            blade.position.set(0, 0, 0)
            blade.scale.set(1, 1, 1)
          }
        })
        break
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
