/**
 * Procedural Hull Generator - Converts hull configuration to 3D geometry
 * Uses cross-sections, waterline profiles, and parametric curves to generate hull mesh
 */

import * as THREE from 'three'
import {
  ProceduralHullConfig,
  HullPoint,
  BowConfig,
  SternConfig,
  KeelConfig,
  ChineConfig,
} from './HullTypes'

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

// Catmull-Rom spline interpolation
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t
  const t3 = t2 * t
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

// Interpolate a 1D value along a spline defined by control points
function interpolateSpline1D(values: number[], t: number): number {
  if (values.length === 0) return 0
  if (values.length === 1) return values[0]
  if (values.length === 2) return values[0] + (values[1] - values[0]) * t

  const n = values.length - 1
  const i = Math.min(Math.floor(t * n), n - 1)
  const localT = (t * n) - i

  const p0 = i > 0 ? values[i - 1] : values[0]
  const p1 = values[i]
  const p2 = values[i + 1]
  const p3 = i < n - 1 ? values[i + 2] : values[n]

  return catmullRom(p0, p1, p2, p3, localT)
}

// Interpolate 2D point along path
function interpolatePath2D(points: HullPoint[], t: number): HullPoint {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length === 1) return points[0]

  const n = points.length - 1
  const i = Math.min(Math.floor(t * n), n - 1)
  const localT = (t * n) - i

  if (points.length === 2) {
    return {
      x: points[0].x + (points[1].x - points[0].x) * localT,
      y: points[0].y + (points[1].y - points[0].y) * localT,
    }
  }

  const xVals = points.map(p => p.x)
  const yVals = points.map(p => p.y)

  return {
    x: interpolateSpline1D(xVals, t),
    y: interpolateSpline1D(yVals, t),
  }
}

// Smooth step function
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// Ease in/out
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// ============================================================
// BOW SHAPE GENERATORS
// ============================================================

function generateBowProfile(bow: BowConfig, t: number): { width: number; height: number } {
  // t goes from 0 (start of bow) to 1 (end/tip of bow)
  const entryAngle = (bow.angle * Math.PI) / 180
  const flareAngle = (bow.flare * Math.PI) / 180

  let width: number
  let height: number

  switch (bow.type) {
    case 'piercing':
      // Sharp entry, minimal volume
      width = (1 - t * t) * 0.8
      height = 1 - t * 0.3
      break

    case 'flared':
      // Wide at top, narrow at waterline
      const flareEffect = Math.sin(flareAngle) * 0.3
      width = (1 - t * 0.7) * (1 + flareEffect * (1 - t))
      height = 1 - t * 0.2
      break

    case 'bulbous':
      // Bulge below waterline
      const bulbT = smoothstep(0.6, 1, t)
      const bulb = Math.sin(bulbT * Math.PI) * bow.bulbSize
      width = (1 - t * 0.6) + bulb
      height = 1 - t * 0.25 + bulb * 0.5
      break

    case 'spoon':
      // Concave entry
      width = (1 - Math.pow(t, 1.5)) * 0.85
      height = 1 - t * 0.35 + Math.sin(t * Math.PI) * 0.1
      break

    case 'clipper':
      // Classic clipper bow with overhang
      const overhang = bow.overhang / 100
      width = (1 - t * 0.7) * (1 + overhang * t)
      height = 1 - t * 0.15 + overhang * t * 0.3
      break

    case 'plumb':
      // Vertical stem
      width = 1 - t * 0.9
      height = 1 - t * 0.1
      break

    case 'axe':
      // Inverted bow, narrow at waterline
      width = (1 - t * 0.85) * (0.7 + 0.3 * t)
      height = 1 - t * 0.05
      break

    case 'wave-piercing':
      // Ultra-fine entry
      width = Math.pow(1 - t, 2) * 0.6
      height = 1 - t * 0.4
      break

    default:
      width = 1 - t * 0.7
      height = 1 - t * 0.3
  }

  // Apply entry angle
  const angleEffect = Math.tan(entryAngle) * t * 0.2
  width *= (1 - angleEffect)

  return { width: Math.max(0.01, width), height: Math.max(0.1, height) }
}

// ============================================================
// STERN SHAPE GENERATORS
// ============================================================

function generateSternProfile(stern: SternConfig, t: number): { width: number; height: number } {
  // t goes from 0 (start of stern) to 1 (transom)
  const transomAngle = (stern.angle * Math.PI) / 180

  let width: number
  let height: number

  switch (stern.type) {
    case 'transom':
      // Flat transom
      width = stern.width * (1 - (1 - t) * 0.3)
      height = stern.height + (1 - stern.height) * (1 - t) * 0.5
      break

    case 'cruiser':
      // Rounded cruiser stern
      width = stern.width * (0.7 + 0.3 * Math.sin(t * Math.PI / 2))
      height = 0.8 + 0.2 * t
      break

    case 'canoe':
      // Pointed canoe stern
      width = stern.width * (1 - t * 0.7) * Math.cos(t * Math.PI / 3)
      height = 0.7 + 0.3 * (1 - t)
      break

    case 'double-ended':
      // Symmetric double-ender
      width = (1 - t * 0.85) * 0.6
      height = 0.6 + 0.4 * (1 - t * t)
      break

    case 'sugar-scoop':
      // Curved swim platform stern
      const scoop = Math.sin(t * Math.PI) * 0.15
      width = stern.width * (0.85 + 0.15 * t)
      height = 0.5 + scoop + t * 0.3
      break

    case 'reverse-transom':
      // Modern reverse angle transom
      const reverse = Math.sin(transomAngle) * t * 0.2
      width = stern.width * (0.9 + 0.1 * t)
      height = 0.6 + 0.4 * t - reverse
      break

    case 'ducktail':
      // Extended ducktail for lift
      width = stern.width * (0.8 + 0.2 * Math.pow(t, 0.5))
      height = 0.4 + 0.6 * easeInOutQuad(t)
      break

    default:
      width = stern.width * (0.9 + 0.1 * t)
      height = 0.7 + 0.3 * t
  }

  return { width: Math.max(0.01, width), height: Math.max(0.1, height) }
}

// ============================================================
// KEEL SHAPE GENERATORS
// ============================================================

function generateKeelProfile(keel: KeelConfig, t: number, xPos: number): number {
  // Returns the depth at position t (0-1 across beam) and xPos (0-1 along length)

  // Only apply keel in the appropriate length section
  const keelStart = keel.position - keel.length / 2
  const keelEnd = keel.position + keel.length / 2
  const inKeelZone = xPos >= keelStart && xPos <= keelEnd
  const keelFactor = inKeelZone
    ? smoothstep(keelStart, keelStart + 0.1, xPos) * smoothstep(keelEnd, keelEnd - 0.1, xPos)
    : 0

  let depth = 0

  switch (keel.type) {
    case 'flat':
      depth = 0
      break

    case 'v-hull':
      // Simple V shape
      depth = Math.abs(0.5 - t) * keel.depth * 2
      break

    case 'deep-v':
      // Deeper V with constant deadrise
      depth = Math.pow(Math.abs(0.5 - t) * 2, 0.8) * keel.depth * 1.5
      break

    case 'modified-v':
      // V at stern, flatter at bow
      const vAmount = xPos < 0.5 ? 0.5 + xPos : 1
      depth = Math.abs(0.5 - t) * keel.depth * 2 * vAmount
      break

    case 'round-bottom':
      // Circular section
      const roundT = (t - 0.5) * 2
      depth = Math.sqrt(1 - roundT * roundT) * keel.depth * 0.8
      break

    case 'multi-chine':
      // Multiple hard angles
      const chineT = Math.abs(0.5 - t) * 2
      depth = Math.floor(chineT * 4) / 4 * keel.depth
      break

    case 'tunnel':
      // Twin tunnel hulls
      const tunnelCenter = 0.3
      if (t < tunnelCenter || t > 1 - tunnelCenter) {
        depth = keel.depth * 0.5
      } else {
        depth = 0
      }
      break

    case 'cathedral':
      // Triple hull (cathedral)
      const triT = Math.abs(t - 0.5)
      if (triT < 0.15) {
        depth = keel.depth * 0.3
      } else {
        depth = Math.abs(triT - 0.35) < 0.15 ? keel.depth * 0.3 : 0
      }
      break

    default:
      depth = Math.abs(0.5 - t) * keel.depth
  }

  return depth * keelFactor
}

// ============================================================
// CHINE GENERATORS
// ============================================================

function applyChineToProfile(
  chine: ChineConfig,
  profile: THREE.Vector2[],
  depth: number
): THREE.Vector2[] {
  if (chine.type === 'none' || chine.count === 0) return profile

  const result: THREE.Vector2[] = []

  for (const point of profile) {
    const normalizedY = (point.y + depth) / (depth * 2 + 1)
    let modified = point.clone()

    for (let i = 0; i < chine.count; i++) {
      const chinePos = chine.positions[i] || 0.5
      const chineAngle = ((chine.angles[i] || 15) * Math.PI) / 180

      if (Math.abs(normalizedY - chinePos) < 0.1) {
        switch (chine.type) {
          case 'hard':
            // Sharp angle at chine
            modified.x *= 1 + Math.tan(chineAngle) * 0.05
            break
          case 'soft':
            // Rounded chine
            modified.x *= 1 + Math.sin(chineAngle) * 0.03
            break
          case 'reverse':
            // Reverse (inverted) chine
            modified.x *= 1 - Math.tan(chineAngle) * 0.03
            break
          case 'spray-rail':
            // Extended spray rail
            modified.x *= 1 + Math.tan(chineAngle) * 0.08
            break
        }
      }
    }

    result.push(modified)
  }

  return result
}

// ============================================================
// CROSS-SECTION GENERATOR
// ============================================================

function generateCrossSection(
  config: ProceduralHullConfig,
  position: number, // 0 = bow, 1 = stern
  resolution: number = 16
): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  const { beam, draft, freeboard, bow, stern, keel, chine } = config

  // Determine if we're in bow, midship, or stern region
  const bowEnd = 0.25
  const sternStart = 0.75

  let widthMultiplier: number
  let heightMultiplier: number

  if (position < bowEnd) {
    // Bow region
    const bowT = position / bowEnd
    const bowProfile = generateBowProfile(bow, 1 - bowT)
    widthMultiplier = bowProfile.width
    heightMultiplier = bowProfile.height
  } else if (position > sternStart) {
    // Stern region
    const sternT = (position - sternStart) / (1 - sternStart)
    const sternProfile = generateSternProfile(stern, sternT)
    widthMultiplier = sternProfile.width
    heightMultiplier = sternProfile.height
  } else {
    // Midship region - full beam
    widthMultiplier = 1
    heightMultiplier = 1
  }

  // Apply waterline profile if exists (affects beam/width)
  if (config.waterlineProfile.length > 0) {
    const waterlinePoint = interpolatePath2D(config.waterlineProfile, position)
    widthMultiplier *= Math.abs(waterlinePoint.y) + 0.5
  }

  // Apply buttock profile if exists (affects height/draft)
  if (config.buttockProfile.length > 0) {
    const buttockPoint = interpolatePath2D(config.buttockProfile, position)
    heightMultiplier *= Math.abs(buttockPoint.y) + 0.5
  }

  // Apply custom cross-section if exists for this position
  const sectionIndex = Math.round(position * 10)
  const customSection = config.crossSections[sectionIndex]
  if (customSection && customSection.profile.length > 0) {
    widthMultiplier *= customSection.beamMultiplier || 1
  }

  // Generate cross-section points
  const actualBeam = (beam / 2) * widthMultiplier
  const actualDraft = draft * heightMultiplier
  const actualFreeboard = freeboard * heightMultiplier

  // Create hull cross-section from keel to deck
  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution

    // Get keel depth at this transverse position
    const keelDepth = generateKeelProfile(keel, t, position)

    // Calculate point position
    const x = t * actualBeam
    let y: number

    if (t < 0.1) {
      // Keel area
      y = -actualDraft - keelDepth
    } else if (t < 0.8) {
      // Hull side
      const sideT = (t - 0.1) / 0.7
      y = -actualDraft * (1 - sideT) + actualFreeboard * sideT * 0.3
    } else {
      // Deck edge area
      const deckT = (t - 0.8) / 0.2
      y = actualFreeboard * (0.3 + deckT * 0.7)
    }

    points.push(new THREE.Vector2(x, y))
  }

  // Apply chine modifications
  return applyChineToProfile(chine, points, actualDraft)
}

// ============================================================
// MAIN HULL GEOMETRY GENERATOR
// ============================================================

export function generateProceduralHullGeometry(
  config: ProceduralHullConfig,
  longitudinalSegments: number = 32,
  transverseSegments: number = 16
): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const normals: number[] = []
  const uvs: number[] = []

  const sections: THREE.Vector2[][] = []

  // Generate cross-sections along the length
  for (let i = 0; i <= longitudinalSegments; i++) {
    const t = i / longitudinalSegments
    const section = generateCrossSection(config, t, transverseSegments)
    sections.push(section)
  }

  // Build vertices for one side of hull
  for (let i = 0; i <= longitudinalSegments; i++) {
    const section = sections[i]
    const x = (i / longitudinalSegments - 0.5) * config.length

    for (let j = 0; j < section.length; j++) {
      const point = section[j]

      // Starboard side
      vertices.push(x, point.y, point.x)
      uvs.push(i / longitudinalSegments, j / (section.length - 1))

      // Normal will be computed later
      normals.push(0, 0, 1)
    }
  }

  // Build vertices for port side (mirrored)
  const portOffset = vertices.length / 3
  for (let i = 0; i <= longitudinalSegments; i++) {
    const section = sections[i]
    const x = (i / longitudinalSegments - 0.5) * config.length

    for (let j = 0; j < section.length; j++) {
      const point = section[j]

      // Port side (mirrored Z)
      vertices.push(x, point.y, -point.x)
      uvs.push(i / longitudinalSegments, j / (section.length - 1))
      normals.push(0, 0, -1)
    }
  }

  // Build indices for starboard
  const vertsPerSection = transverseSegments + 1
  for (let i = 0; i < longitudinalSegments; i++) {
    for (let j = 0; j < transverseSegments; j++) {
      const a = i * vertsPerSection + j
      const b = a + 1
      const c = a + vertsPerSection
      const d = c + 1

      // Two triangles per quad
      indices.push(a, b, c)
      indices.push(b, d, c)
    }
  }

  // Build indices for port (reversed winding)
  for (let i = 0; i < longitudinalSegments; i++) {
    for (let j = 0; j < transverseSegments; j++) {
      const a = portOffset + i * vertsPerSection + j
      const b = a + 1
      const c = a + vertsPerSection
      const d = c + 1

      // Reversed winding for inside-out normals
      indices.push(a, c, b)
      indices.push(b, c, d)
    }
  }

  // Connect the two halves at keel (j=0) and deck (j=max)
  for (let i = 0; i < longitudinalSegments; i++) {
    // Keel connection
    const keelStbd1 = i * vertsPerSection
    const keelStbd2 = (i + 1) * vertsPerSection
    const keelPort1 = portOffset + i * vertsPerSection
    const keelPort2 = portOffset + (i + 1) * vertsPerSection

    indices.push(keelStbd1, keelPort1, keelStbd2)
    indices.push(keelPort1, keelPort2, keelStbd2)

    // Deck connection
    const deckJ = transverseSegments
    const deckStbd1 = i * vertsPerSection + deckJ
    const deckStbd2 = (i + 1) * vertsPerSection + deckJ
    const deckPort1 = portOffset + i * vertsPerSection + deckJ
    const deckPort2 = portOffset + (i + 1) * vertsPerSection + deckJ

    indices.push(deckStbd1, deckStbd2, deckPort1)
    indices.push(deckPort1, deckStbd2, deckPort2)
  }

  // Create geometry
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)

  // Compute proper normals
  geometry.computeVertexNormals()

  return geometry
}

// ============================================================
// CATAMARAN HULL GENERATOR
// ============================================================

export function generateCatamaranHulls(
  config: ProceduralHullConfig,
  hullSpacing: number = 0.4
): THREE.Group {
  const group = new THREE.Group()

  // Create narrower single hull config
  const singleHullConfig: ProceduralHullConfig = {
    ...config,
    beam: config.beam * 0.3,
  }

  const hullGeometry = generateProceduralHullGeometry(singleHullConfig, 24, 12)
  const material = new THREE.MeshStandardMaterial({
    color: config.colors.hull,
    metalness: 0.3,
    roughness: 0.7,
  })

  // Port hull
  const portHull = new THREE.Mesh(hullGeometry, material)
  portHull.position.z = -config.beam * hullSpacing
  group.add(portHull)

  // Starboard hull
  const stbdHull = new THREE.Mesh(hullGeometry.clone(), material)
  stbdHull.position.z = config.beam * hullSpacing
  group.add(stbdHull)

  // Cross beams
  const beamGeometry = new THREE.BoxGeometry(0.3, 0.25, config.beam * hullSpacing * 2 + config.beam * 0.3)
  const beamMaterial = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.2, roughness: 0.8 })

  const frontBeam = new THREE.Mesh(beamGeometry, beamMaterial)
  frontBeam.position.set(config.length * 0.2, config.draft + 0.3, 0)
  group.add(frontBeam)

  const rearBeam = new THREE.Mesh(beamGeometry, beamMaterial)
  rearBeam.position.set(-config.length * 0.2, config.draft + 0.3, 0)
  group.add(rearBeam)

  return group
}

// ============================================================
// TRIMARAN HULL GENERATOR
// ============================================================

export function generateTrimaranHulls(
  config: ProceduralHullConfig,
  amaSpacing: number = 0.45,
  amaScale: number = 0.6
): THREE.Group {
  const group = new THREE.Group()

  // Main hull
  const mainHullConfig: ProceduralHullConfig = {
    ...config,
    beam: config.beam * 0.4,
  }
  const mainGeometry = generateProceduralHullGeometry(mainHullConfig, 28, 14)
  const material = new THREE.MeshStandardMaterial({
    color: config.colors.hull,
    metalness: 0.3,
    roughness: 0.7,
  })

  const mainHull = new THREE.Mesh(mainGeometry, material)
  group.add(mainHull)

  // Amas (outriggers)
  const amaConfig: ProceduralHullConfig = {
    ...config,
    length: config.length * amaScale,
    beam: config.beam * 0.15,
    draft: config.draft * 0.7,
  }
  const amaGeometry = generateProceduralHullGeometry(amaConfig, 20, 10)

  const portAma = new THREE.Mesh(amaGeometry, material)
  portAma.position.set(-config.length * 0.05, config.draft * 0.2, -config.beam * amaSpacing)
  group.add(portAma)

  const stbdAma = new THREE.Mesh(amaGeometry.clone(), material)
  stbdAma.position.set(-config.length * 0.05, config.draft * 0.2, config.beam * amaSpacing)
  group.add(stbdAma)

  // Akas (cross beams)
  const akaMaterial = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.4, roughness: 0.6 })

  const positions = [0.15, -0.15]
  positions.forEach(xRatio => {
    const akaGeometry = new THREE.BoxGeometry(0.2, 0.15, config.beam * amaSpacing)

    const portAka = new THREE.Mesh(akaGeometry, akaMaterial)
    portAka.position.set(config.length * xRatio, config.draft + 0.2, -config.beam * amaSpacing / 2)
    portAka.rotation.z = 0.1
    group.add(portAka)

    const stbdAka = new THREE.Mesh(akaGeometry.clone(), akaMaterial)
    stbdAka.position.set(config.length * xRatio, config.draft + 0.2, config.beam * amaSpacing / 2)
    stbdAka.rotation.z = -0.1
    group.add(stbdAka)
  })

  return group
}

// ============================================================
// DECK GENERATOR
// ============================================================

export function generateDeck(config: ProceduralHullConfig): THREE.Group {
  const group = new THREE.Group()
  const { length, beam, draft, deck } = config

  const deckWidth = config.category === 'monohull' ? beam * 0.5 : beam * 0.75
  const deckHeight = draft + 0.3

  // Main deck with camber
  const deckShape = new THREE.Shape()
  const deckLength = length * 0.65
  const camberHeight = (deck.camber / 100) * deckWidth

  deckShape.moveTo(-deckLength / 2, -deckWidth / 2)
  deckShape.lineTo(deckLength / 2, -deckWidth / 2)
  deckShape.quadraticCurveTo(deckLength / 2, 0, deckLength / 2, deckWidth / 2)
  deckShape.lineTo(-deckLength / 2, deckWidth / 2)
  deckShape.quadraticCurveTo(-deckLength / 2, 0, -deckLength / 2, -deckWidth / 2)

  const deckGeometry = new THREE.ExtrudeGeometry(deckShape, {
    steps: 1,
    depth: 0.1 + camberHeight,
    bevelEnabled: false,
  })

  const deckMaterial = new THREE.MeshStandardMaterial({
    color: config.colors.deck,
    metalness: 0.5,
    roughness: 0.3,
  })

  const deckMesh = new THREE.Mesh(deckGeometry, deckMaterial)
  deckMesh.rotation.x = -Math.PI / 2
  deckMesh.position.y = deckHeight
  group.add(deckMesh)

  // Coach roof / Cabin
  if (deck.coachRoof) {
    const cabinLength = length * deck.coachRoofLength
    const cabinWidth = deckWidth * 0.5
    const cabinGeometry = new THREE.BoxGeometry(cabinLength, deck.coachRoofHeight, cabinWidth)
    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      metalness: 0.8,
      roughness: 0.2,
    })

    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial)
    cabin.position.set(length * 0.15, deckHeight + deck.coachRoofHeight / 2, 0)
    cabin.castShadow = true
    group.add(cabin)

    // Windshield
    const windshieldGeometry = new THREE.BoxGeometry(0.05, deck.coachRoofHeight * 0.6, cabinWidth * 0.9)
    const windshieldMaterial = new THREE.MeshStandardMaterial({
      color: config.colors.accent,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    })

    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial)
    windshield.position.set(
      length * 0.15 + cabinLength / 2 + 0.1,
      deckHeight + deck.coachRoofHeight * 0.5,
      0
    )
    windshield.rotation.z = 0.3
    group.add(windshield)
  }

  return group
}

// ============================================================
// COMPLETE HULL ASSEMBLY
// ============================================================

export function generateCompleteHull(config: ProceduralHullConfig): THREE.Group {
  const group = new THREE.Group()

  switch (config.category) {
    case 'catamaran':
      group.add(generateCatamaranHulls(config))
      break
    case 'trimaran':
      group.add(generateTrimaranHulls(config))
      break
    case 'monohull':
    default:
      const hullGeometry = generateProceduralHullGeometry(config)
      const hullMaterial = new THREE.MeshStandardMaterial({
        color: config.colors.hull,
        metalness: config.material === 'carbon' ? 0.7 : 0.3,
        roughness: config.finish === 'gloss' ? 0.2 : config.finish === 'matte' ? 0.8 : 0.5,
      })
      const hull = new THREE.Mesh(hullGeometry, hullMaterial)
      hull.castShadow = true
      hull.receiveShadow = true
      group.add(hull)
      break
  }

  // Add deck
  group.add(generateDeck(config))

  return group
}
