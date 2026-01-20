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
