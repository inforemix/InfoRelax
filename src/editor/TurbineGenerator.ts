import * as THREE from 'three'
import { BladePoint } from '@/state/useYachtStore'
import { interpolateSpline } from './SplineUtils'

interface TurbineParams {
  height: number
  diameter: number
  bladeCount: number
  bladeProfile: BladePoint[]
  bladeThickness?: number
  helixTwist?: number // Degrees of twist from bottom to top
}

/**
 * Generate a 3D turbine mesh from 2D blade profile
 * The blade profile is extruded vertically and twisted to create the VAWT shape
 */

// Generate a single blade geometry from 2D profile
export function generateBladeGeometry(
  profile: BladePoint[],
  height: number,
  diameter: number,
  thickness: number = 0.05,
  helixTwist: number = 0
): THREE.BufferGeometry {
  // Interpolate the profile for smooth curves
  const smoothProfile = interpolateSpline(profile, 8)

  if (smoothProfile.length < 2) {
    // Return a simple box if no valid profile
    return new THREE.BoxGeometry(thickness, height, thickness)
  }

  // Convert normalized profile to actual dimensions
  // Profile x maps to radial distance, y maps to height position
  const scaledProfile = smoothProfile.map((p) => ({
    x: (p.x * diameter) / 2, // Radial distance from center
    y: ((p.y + 1) / 2) * height, // Height along turbine (0 to height)
  }))

  // Create the blade shape as a series of connected quads
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []

  const halfThickness = thickness / 2

  // For each segment along the height
  for (let i = 0; i < scaledProfile.length; i++) {
    const point = scaledProfile[i]
    const t = i / (scaledProfile.length - 1)
    const twist = t * helixTwist * (Math.PI / 180)

    // Create front and back faces at this height level
    const cos = Math.cos(twist)
    const sin = Math.sin(twist)

    // Front vertex (outer edge)
    const frontX = point.x * cos
    const frontZ = point.x * sin
    vertices.push(frontX, point.y, frontZ + halfThickness)
    normals.push(0, 0, 1)
    uvs.push(t, 0)

    // Back vertex (outer edge)
    vertices.push(frontX, point.y, frontZ - halfThickness)
    normals.push(0, 0, -1)
    uvs.push(t, 1)

    // Inner edge vertices (closer to center)
    const innerX = (point.x - thickness) * cos
    const innerZ = (point.x - thickness) * sin
    vertices.push(innerX, point.y, innerZ + halfThickness)
    normals.push(0, 0, 1)
    uvs.push(t, 0.3)

    vertices.push(innerX, point.y, innerZ - halfThickness)
    normals.push(0, 0, -1)
    uvs.push(t, 0.7)
  }

  // Create faces connecting the vertices
  const vertsPerLevel = 4
  for (let i = 0; i < scaledProfile.length - 1; i++) {
    const base = i * vertsPerLevel

    // Front face (outer)
    indices.push(base, base + vertsPerLevel, base + 2)
    indices.push(base + 2, base + vertsPerLevel, base + vertsPerLevel + 2)

    // Back face (outer)
    indices.push(base + 1, base + 3, base + vertsPerLevel + 1)
    indices.push(base + 3, base + vertsPerLevel + 3, base + vertsPerLevel + 1)

    // Outer edge
    indices.push(base, base + 1, base + vertsPerLevel)
    indices.push(base + 1, base + vertsPerLevel + 1, base + vertsPerLevel)

    // Inner edge
    indices.push(base + 2, base + vertsPerLevel + 2, base + 3)
    indices.push(base + 3, base + vertsPerLevel + 2, base + vertsPerLevel + 3)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

// Generate complete turbine with all blades
export function generateTurbineGeometry(params: TurbineParams): THREE.Group {
  const {
    height,
    diameter,
    bladeCount,
    bladeProfile,
    bladeThickness = 0.08,
    helixTwist = 30,
  } = params

  const group = new THREE.Group()

  // Central shaft
  const shaftGeometry = new THREE.CylinderGeometry(0.1, 0.1, height, 16)
  const shaftMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a5568,
    metalness: 0.8,
    roughness: 0.2,
  })
  const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial)
  shaft.position.y = height / 2
  group.add(shaft)

  // Generate blades
  const angleStep = (2 * Math.PI) / bladeCount

  // Use default profile if none provided
  const profile = bladeProfile.length > 0 ? bladeProfile : [
    { x: 0.1, y: 0.0 },
    { x: 0.2, y: -0.3 },
    { x: 0.3, y: -0.5 },
    { x: 0.35, y: -0.7 },
    { x: 0.3, y: -0.9 },
  ]

  const bladeGeometry = generateBladeGeometry(
    profile,
    height,
    diameter,
    bladeThickness,
    helixTwist
  )

  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    metalness: 0.5,
    roughness: 0.3,
    side: THREE.DoubleSide,
  })

  for (let i = 0; i < bladeCount; i++) {
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial)
    blade.rotation.y = angleStep * i
    group.add(blade)
  }

  // Top cap
  const capGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.1, 16)
  const capMaterial = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    metalness: 0.7,
    roughness: 0.3,
  })
  const topCap = new THREE.Mesh(capGeometry, capMaterial)
  topCap.position.y = height + 0.05
  group.add(topCap)

  // Bottom mount
  const mountGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.15, 16)
  const mount = new THREE.Mesh(mountGeometry, shaftMaterial)
  mount.position.y = -0.075
  group.add(mount)

  return group
}

// Simple helix blade generator for the placeholder turbine
export function generateHelixBlades(
  height: number,
  diameter: number,
  bladeCount: number,
  twist: number = 60
): THREE.BufferGeometry[] {
  const blades: THREE.BufferGeometry[] = []
  const segments = 24
  const bladeWidth = 0.15

  for (let b = 0; b < bladeCount; b++) {
    const vertices: number[] = []
    const indices: number[] = []

    const baseAngle = (b / bladeCount) * Math.PI * 2
    const twistRad = (twist * Math.PI) / 180

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const y = t * height
      const angle = baseAngle + t * twistRad
      const radius = diameter / 2

      // Outer edge
      const outerX = Math.cos(angle) * radius
      const outerZ = Math.sin(angle) * radius
      vertices.push(outerX, y, outerZ)

      // Inner edge
      const innerRadius = radius - bladeWidth
      const innerX = Math.cos(angle) * innerRadius
      const innerZ = Math.sin(angle) * innerRadius
      vertices.push(innerX, y, innerZ)
    }

    // Create faces
    for (let i = 0; i < segments; i++) {
      const base = i * 2
      indices.push(base, base + 2, base + 1)
      indices.push(base + 1, base + 2, base + 3)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    blades.push(geometry)
  }

  return blades
}

// ============================================================
// ADVANCED PROCEDURAL TURBINE GENERATOR
// Uses the section-based configuration system
// ============================================================

import {
  ProceduralTurbineConfig,
  BladeSection,
  BladeStyle,
  DEFAULT_BLADE_SECTION,
  DEFAULT_TURBINE_CONFIG,
} from './TurbineTypes'

// Interpolate between blade sections
function interpolateSectionValue(sections: BladeSection[], position: number, property: keyof BladeSection): number {
  if (sections.length === 0) return (DEFAULT_BLADE_SECTION as Record<string, unknown>)[property] as number
  if (sections.length === 1) return (sections[0] as Record<string, unknown>)[property] as number

  const sorted = [...sections].sort((a, b) => a.position - b.position)

  // Find surrounding sections
  let lower = sorted[0]
  let upper = sorted[sorted.length - 1]

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].position <= position && sorted[i + 1].position >= position) {
      lower = sorted[i]
      upper = sorted[i + 1]
      break
    }
  }

  if (lower.position === upper.position) {
    return (lower as Record<string, unknown>)[property] as number
  }

  const t = (position - lower.position) / (upper.position - lower.position)
  const lowerVal = (lower as Record<string, unknown>)[property] as number
  const upperVal = (upper as Record<string, unknown>)[property] as number

  // Smooth interpolation
  const smoothT = t * t * (3 - 2 * t)
  return lowerVal + (upperVal - lowerVal) * smoothT
}

// Generate airfoil cross-section points
function generateAirfoilProfile(
  chord: number,
  thickness: number,
  camber: number,
  leadingEdge: number,
  trailingEdge: number,
  resolution: number = 12
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []

  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution
    const x = t * chord

    // NACA-style thickness distribution
    const thicknessDistribution =
      5 * thickness * (
        0.2969 * Math.sqrt(t) -
        0.1260 * t -
        0.3516 * t * t +
        0.2843 * t * t * t -
        0.1015 * t * t * t * t
      )

    // Camber line
    const camberY = camber * 4 * t * (1 - t)

    // Leading edge rounding
    const leadingFactor = t < 0.1 ? Math.sqrt(t * 10) * leadingEdge : 1
    // Trailing edge sharpening
    const trailingFactor = t > 0.9 ? (1 - (t - 0.9) * 10) * trailingEdge + (1 - trailingEdge) : 1

    const adjustedThickness = thicknessDistribution * leadingFactor * trailingFactor

    // Upper surface
    points.push({ x: x - chord / 2, y: camberY + adjustedThickness })
  }

  // Lower surface (reverse direction)
  for (let i = resolution; i >= 0; i--) {
    const t = i / resolution
    const x = t * chord

    const thicknessDistribution =
      5 * thickness * (
        0.2969 * Math.sqrt(t) -
        0.1260 * t -
        0.3516 * t * t +
        0.2843 * t * t * t -
        0.1015 * t * t * t * t
      )

    const camberY = camber * 4 * t * (1 - t)
    const leadingFactor = t < 0.1 ? Math.sqrt(t * 10) : 1
    const trailingFactor = t > 0.9 ? (1 - (t - 0.9) * 10) : 1
    const adjustedThickness = thicknessDistribution * leadingFactor * trailingFactor

    // Lower surface
    points.push({ x: x - chord / 2, y: camberY - adjustedThickness })
  }

  return points
}

// Generate blade shape based on style
function getBladeRadialOffset(style: BladeStyle, t: number, diameter: number): number {
  const radius = diameter / 2

  switch (style) {
    case 'helix':
      return radius * 0.9
    case 'darrieus':
      // Troposkein curve (catenary-like)
      return radius * (0.3 + 0.7 * Math.sin(t * Math.PI))
    case 'savonius':
      // S-curve offset
      return radius * (0.5 + 0.3 * Math.sin(t * Math.PI * 2))
    case 'h-rotor':
      return radius * 0.95
    case 'giromill':
      return radius * 0.9
    case 'ribbon':
      return radius * (0.4 + 0.5 * Math.sin(t * Math.PI))
    case 'infinity':
      // Figure-8 pattern
      const phase = t * Math.PI * 2
      return radius * (0.3 + 0.5 * Math.abs(Math.sin(phase)))
    case 'troposkein':
      // Optimal shape for centrifugal loads
      const tropT = (t - 0.5) * 2
      return radius * (0.95 - 0.6 * tropT * tropT)
    case 'hybrid':
      return radius * (0.5 + 0.4 * Math.sin(t * Math.PI))
    default:
      return radius * 0.85
  }
}

// Generate a single advanced blade geometry
function generateAdvancedBladeGeometry(
  config: ProceduralTurbineConfig,
  segments: number = 32
): THREE.BufferGeometry {
  const { height, diameter, blade } = config
  const vertices: number[] = []
  const indices: number[] = []
  const uvs: number[] = []

  const chordResolution = 8
  const totalVertsPerLevel = (chordResolution + 1) * 2

  // Generate vertices for each height level
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const y = t * height

    // Interpolate section properties
    const width = interpolateSectionValue(blade.sections, t, 'width')
    const thickness = interpolateSectionValue(blade.sections, t, 'thickness')
    const pitch = interpolateSectionValue(blade.sections, t, 'pitch')
    const sweep = interpolateSectionValue(blade.sections, t, 'sweep')
    const camber = interpolateSectionValue(blade.sections, t, 'camber')
    const leadingEdge = interpolateSectionValue(blade.sections, t, 'leadingEdge')
    const trailingEdge = interpolateSectionValue(blade.sections, t, 'trailingEdge')

    // Calculate radial position based on style
    const radialOffset = getBladeRadialOffset(blade.style, t, diameter)

    // Calculate twist at this height
    const twistAngle = (blade.twist * t * Math.PI) / 180
    const pitchAngle = (pitch * Math.PI) / 180
    const sweepOffset = (sweep * Math.PI) / 180

    // Generate airfoil profile
    const chord = blade.chord * diameter * width * (1 - (1 - blade.taper) * t)
    const airfoilThickness = blade.thickness * thickness
    const airfoil = generateAirfoilProfile(chord, airfoilThickness, camber, leadingEdge, trailingEdge, chordResolution)

    // Transform airfoil points to 3D
    for (let j = 0; j < airfoil.length; j++) {
      const ap = airfoil[j]

      // Apply pitch rotation
      const pitchedX = ap.x * Math.cos(pitchAngle) - ap.y * Math.sin(pitchAngle)
      const pitchedY = ap.x * Math.sin(pitchAngle) + ap.y * Math.cos(pitchAngle)

      // Apply twist and position
      const finalAngle = twistAngle + sweepOffset
      const worldX = radialOffset * Math.cos(finalAngle) + pitchedX * Math.sin(finalAngle)
      const worldZ = radialOffset * Math.sin(finalAngle) - pitchedX * Math.cos(finalAngle)

      vertices.push(worldX, y, worldZ + pitchedY)
      uvs.push(t, j / (airfoil.length - 1))
    }
  }

  // Generate indices
  const vertsPerLevel = (chordResolution + 1) * 2
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < vertsPerLevel - 1; j++) {
      const a = i * vertsPerLevel + j
      const b = a + 1
      const c = a + vertsPerLevel
      const d = c + 1

      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

// Generate hub geometry
function generateHubGeometry(config: ProceduralTurbineConfig): THREE.BufferGeometry {
  const { height, hub } = config
  const hubRadius = (hub.diameter * config.diameter) / 2
  const hubHeight = height * hub.length * 0.1

  switch (hub.type) {
    case 'sphere':
      return new THREE.SphereGeometry(hubRadius * 1.5, 16, 12)
    case 'cone':
      return new THREE.ConeGeometry(hubRadius * 1.2, hubHeight * 2, 16)
    case 'streamlined':
      // Teardrop shape using lathe
      const points: THREE.Vector2[] = []
      for (let i = 0; i <= 12; i++) {
        const t = i / 12
        const r = hubRadius * Math.sin(t * Math.PI) * (1 - t * 0.3)
        const y = t * hubHeight * 1.5
        points.push(new THREE.Vector2(r, y))
      }
      return new THREE.LatheGeometry(points, 16)
    case 'none':
      return new THREE.BufferGeometry()
    default:
      return new THREE.CylinderGeometry(hubRadius, hubRadius, hubHeight, 16)
  }
}

// Generate complete procedural turbine
export function generateProceduralTurbine(config: ProceduralTurbineConfig): THREE.Group {
  const group = new THREE.Group()
  const { height, diameter, bladeCount, blade, hub, shaft, supportArms, material } = config

  // Create material based on config
  const bladeMaterial = new THREE.MeshStandardMaterial({
    color: material.primaryColor,
    metalness: material.metalness,
    roughness: material.roughness,
    side: THREE.DoubleSide,
    transparent: material.opacity < 1,
    opacity: material.opacity,
  })

  if (material.emissive) {
    bladeMaterial.emissive = new THREE.Color(material.emissiveColor)
    bladeMaterial.emissiveIntensity = material.emissiveIntensity
  }

  // Generate and add blades
  const bladeGeometry = generateAdvancedBladeGeometry(config, 24)
  const angleStep = (Math.PI * 2) / bladeCount

  for (let i = 0; i < bladeCount; i++) {
    const bladeMesh = new THREE.Mesh(bladeGeometry, bladeMaterial)
    bladeMesh.rotation.y = angleStep * i
    bladeMesh.castShadow = true
    group.add(bladeMesh)
  }

  // Add shaft
  if (shaft.visible) {
    const shaftRadius = (shaft.diameter * diameter) / 2
    let shaftGeometry: THREE.BufferGeometry

    if (shaft.style === 'tapered') {
      shaftGeometry = new THREE.CylinderGeometry(shaftRadius * 0.8, shaftRadius, height, 16)
    } else if (shaft.style === 'reinforced') {
      shaftGeometry = new THREE.CylinderGeometry(shaftRadius * 1.2, shaftRadius * 1.2, height, 16)
    } else {
      shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, height, 16)
    }

    const shaftMaterial = new THREE.MeshStandardMaterial({
      color: shaft.color,
      metalness: 0.8,
      roughness: 0.2,
    })

    const shaftMesh = new THREE.Mesh(shaftGeometry, shaftMaterial)
    shaftMesh.position.y = height / 2
    group.add(shaftMesh)
  }

  // Add hub
  if (hub.type !== 'none') {
    const hubGeometry = generateHubGeometry(config)
    const hubMaterial = new THREE.MeshStandardMaterial({
      color: hub.material === 'matching' ? material.primaryColor : material.secondaryColor,
      metalness: hub.material === 'metal' ? 0.9 : 0.5,
      roughness: hub.material === 'metal' ? 0.1 : 0.4,
    })

    // Top hub
    if (hub.topCap) {
      const topHub = new THREE.Mesh(hubGeometry, hubMaterial)
      topHub.position.y = height
      group.add(topHub)
    }

    // Bottom mount
    if (hub.bottomMount) {
      const bottomHub = new THREE.Mesh(hubGeometry, hubMaterial)
      bottomHub.position.y = 0
      bottomHub.rotation.x = Math.PI
      group.add(bottomHub)
    }
  }

  // Add support arms for H-rotor style
  if (supportArms.count > 0 && supportArms.type !== 'hidden') {
    const armRadius = (diameter / 2) * 0.9
    const armWidth = 0.05 * diameter * supportArms.width

    supportArms.positions.forEach(pos => {
      const armY = pos * height

      for (let i = 0; i < bladeCount; i++) {
        const angle = (i / bladeCount) * Math.PI * 2

        let armGeometry: THREE.BufferGeometry
        if (supportArms.type === 'airfoil' && supportArms.fairing) {
          // Streamlined arm
          const armShape = new THREE.Shape()
          armShape.moveTo(0, 0)
          armShape.quadraticCurveTo(armRadius * 0.3, armWidth, armRadius * 0.5, armWidth * 0.5)
          armShape.lineTo(armRadius, 0)
          armShape.lineTo(armRadius * 0.5, -armWidth * 0.5)
          armShape.quadraticCurveTo(armRadius * 0.3, -armWidth, 0, 0)
          armGeometry = new THREE.ExtrudeGeometry(armShape, { steps: 1, depth: armWidth * 0.3, bevelEnabled: false })
        } else if (supportArms.type === 'curved') {
          // Curved tube
          const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(armRadius * 0.5, armWidth * 2, 0),
            new THREE.Vector3(armRadius, 0, 0)
          )
          armGeometry = new THREE.TubeGeometry(curve, 8, armWidth * 0.3, 8, false)
        } else {
          // Simple box arm
          armGeometry = new THREE.BoxGeometry(armRadius, armWidth * 0.4, armWidth * 0.6)
        }

        const armMaterial = new THREE.MeshStandardMaterial({
          color: shaft.color,
          metalness: 0.7,
          roughness: 0.3,
        })

        const arm = new THREE.Mesh(armGeometry, armMaterial)
        arm.position.set(
          Math.cos(angle) * armRadius * 0.5,
          armY,
          Math.sin(angle) * armRadius * 0.5
        )
        arm.rotation.y = angle
        arm.castShadow = true
        group.add(arm)
      }
    })
  }

  return group
}

// Create default procedural turbine config
export function createDefaultProceduralTurbineConfig(): ProceduralTurbineConfig {
  return { ...DEFAULT_TURBINE_CONFIG }
}
