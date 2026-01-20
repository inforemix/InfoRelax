/**
 * Water Physics System
 * Calculates drag, stability, and hydrodynamic forces for different hull types
 */

// Physical constants
export const WATER_DENSITY = 1025 // kg/m³ (seawater)
export const AIR_DENSITY = 1.225 // kg/m³
export const GRAVITY = 9.81 // m/s²

// Hull type coefficients
export interface HullCoefficients {
  dragCoefficient: number      // Cd - form drag
  frictionCoefficient: number  // Cf - skin friction
  waveCoefficient: number      // Cw - wave-making resistance
  stabilityFactor: number      // GM/beam ratio (metacentric height)
  heelingResistance: number    // Resistance to roll
  pitchingMoment: number       // Resistance to pitch
  liftCoefficient: number      // For hydrofoils
}

export const HULL_COEFFICIENTS: Record<string, HullCoefficients> = {
  monohull: {
    dragCoefficient: 0.45,
    frictionCoefficient: 0.003,
    waveCoefficient: 0.15,
    stabilityFactor: 0.8,
    heelingResistance: 0.6,
    pitchingMoment: 0.7,
    liftCoefficient: 0,
  },
  catamaran: {
    dragCoefficient: 0.35,      // Less form drag due to slim hulls
    frictionCoefficient: 0.0035, // More wetted surface
    waveCoefficient: 0.12,      // Less wave-making
    stabilityFactor: 1.5,       // Very stable due to wide beam
    heelingResistance: 1.2,     // High roll resistance
    pitchingMoment: 0.9,
    liftCoefficient: 0,
  },
  trimaran: {
    dragCoefficient: 0.32,
    frictionCoefficient: 0.004,
    waveCoefficient: 0.10,
    stabilityFactor: 1.8,       // Most stable
    heelingResistance: 1.4,
    pitchingMoment: 1.0,
    liftCoefficient: 0,
  },
  hydrofoil: {
    dragCoefficient: 0.20,      // Lowest drag when foiling
    frictionCoefficient: 0.002,
    waveCoefficient: 0.02,      // Almost no wave drag when foiling
    stabilityFactor: 0.6,       // Less stable, requires active control
    heelingResistance: 0.4,
    pitchingMoment: 0.5,
    liftCoefficient: 0.8,       // Can generate lift
  },
}

// Bow shape modifiers
export const BOW_MODIFIERS: Record<string, { drag: number; wave: number; pitch: number }> = {
  piercing: { drag: 0.85, wave: 0.80, pitch: 1.1 },  // Cuts through waves, less drag
  flared: { drag: 1.05, wave: 1.10, pitch: 0.85 },   // More buoyancy, reduces pitching
  bulbous: { drag: 0.90, wave: 0.70, pitch: 1.0 },   // Reduces wave resistance at speed
}

export interface HullDimensions {
  length: number      // meters
  beam: number        // meters (width)
  draft: number       // meters (depth below waterline)
  displacement: number // kg
}

export interface DragResult {
  totalDrag: number           // Newtons
  formDrag: number            // Pressure drag
  frictionDrag: number        // Skin friction
  waveDrag: number            // Wave-making resistance
  inducedDrag: number         // For hydrofoils
  effectiveSpeed: number      // Speed accounting for drag
}

export interface StabilityResult {
  metacentricHeight: number   // GM in meters (higher = more stable)
  rollPeriod: number          // Natural roll period in seconds
  maxSafeHeelAngle: number    // Degrees before capsizing risk
  stabilityIndex: number      // 0-100 rating
  pitchStability: number      // 0-100 rating
  overallRating: string       // 'Excellent' | 'Good' | 'Fair' | 'Poor'
}

/**
 * Calculate wetted surface area for drag calculations
 */
export function calculateWettedSurface(
  hullType: string,
  dimensions: HullDimensions
): number {
  const { length, beam, draft } = dimensions

  // Simplified wetted surface approximation
  // S ≈ L × (B + 2D) × Cs where Cs is a shape coefficient
  const shapeCoefficients: Record<string, number> = {
    monohull: 0.75,
    catamaran: 0.85,  // Two hulls = more surface
    trimaran: 0.95,   // Three hulls
    hydrofoil: 0.60,  // Less hull in water when foiling
  }

  const Cs = shapeCoefficients[hullType] || 0.75
  return length * (beam + 2 * draft) * Cs
}

/**
 * Calculate total hydrodynamic drag
 */
export function calculateDrag(
  hullType: string,
  bowShape: string,
  dimensions: HullDimensions,
  speed: number, // m/s
  isHydrofoiling: boolean = false
): DragResult {
  const coeffs = HULL_COEFFICIENTS[hullType] || HULL_COEFFICIENTS.monohull
  const bowMod = BOW_MODIFIERS[bowShape] || BOW_MODIFIERS.piercing

  const wettedSurface = calculateWettedSurface(hullType, dimensions)
  const speedSq = speed * speed

  // Form drag: Fd = 0.5 × ρ × Cd × A × v²
  const frontalArea = dimensions.beam * dimensions.draft
  let formDrag = 0.5 * WATER_DENSITY * coeffs.dragCoefficient * bowMod.drag * frontalArea * speedSq

  // Skin friction: Ff = 0.5 × ρ × Cf × S × v²
  let frictionDrag = 0.5 * WATER_DENSITY * coeffs.frictionCoefficient * wettedSurface * speedSq

  // Wave-making resistance: increases with Froude number
  // Fn = v / √(g × L)
  const froudeNumber = speed / Math.sqrt(GRAVITY * dimensions.length)
  const waveResistanceCoeff = coeffs.waveCoefficient * bowMod.wave * Math.pow(froudeNumber, 2)
  let waveDrag = 0.5 * WATER_DENSITY * waveResistanceCoeff * wettedSurface * speedSq

  // Induced drag for hydrofoils
  let inducedDrag = 0
  if (hullType === 'hydrofoil' && isHydrofoiling) {
    // When foiling, reduce other drags but add induced drag
    formDrag *= 0.3
    frictionDrag *= 0.4
    waveDrag *= 0.1

    // Induced drag from foil lift
    const liftRequired = dimensions.displacement * GRAVITY
    const foilArea = dimensions.length * 0.5 // Approximate foil area
    const aspectRatio = 8 // Typical hydrofoil AR
    inducedDrag = (liftRequired * liftRequired) / (0.5 * WATER_DENSITY * speedSq * Math.PI * aspectRatio * foilArea)
  }

  const totalDrag = formDrag + frictionDrag + waveDrag + inducedDrag

  // Effective speed considering drag (simplified)
  const dragDeceleration = totalDrag / dimensions.displacement
  const effectiveSpeed = Math.max(0, speed - dragDeceleration * 0.1)

  return {
    totalDrag,
    formDrag,
    frictionDrag,
    waveDrag,
    inducedDrag,
    effectiveSpeed,
  }
}

/**
 * Calculate stability characteristics
 */
export function calculateStability(
  hullType: string,
  dimensions: HullDimensions
): StabilityResult {
  const coeffs = HULL_COEFFICIENTS[hullType] || HULL_COEFFICIENTS.monohull
  const { length, beam, draft, displacement } = dimensions

  // Metacentric height (GM) calculation
  // GM = KB + BM - KG
  // KB ≈ draft/2 (center of buoyancy)
  // BM = I/V where I is second moment of waterplane area
  // KG ≈ draft (center of gravity, simplified)

  const KB = draft * 0.53 // Slightly above half draft
  const I = (length * Math.pow(beam, 3)) / 12 // Second moment of area
  const V = displacement / WATER_DENSITY // Volume of displacement
  const BM = I / V
  const KG = draft * 0.6 + 1.5 // Center of gravity (includes superstructure)

  let metacentricHeight = KB + BM - KG

  // Apply hull type stability factor
  metacentricHeight *= coeffs.stabilityFactor

  // Catamarans and trimarans have much wider effective beam
  if (hullType === 'catamaran') {
    metacentricHeight = beam * 0.4 // Very stable due to wide stance
  } else if (hullType === 'trimaran') {
    metacentricHeight = beam * 0.5
  }

  // Roll period: T = 2π × √(k² / (g × GM))
  // k is radius of gyration, approximately beam/2.4
  const k = beam / 2.4
  const rollPeriod = 2 * Math.PI * Math.sqrt((k * k) / (GRAVITY * Math.max(metacentricHeight, 0.1)))

  // Maximum safe heel angle before capsizing risk
  // Higher GM = higher safe angle
  const maxSafeHeelAngle = Math.min(45, 15 + metacentricHeight * 20)

  // Stability index (0-100)
  const stabilityIndex = Math.min(100, Math.max(0,
    metacentricHeight * 30 + coeffs.heelingResistance * 20 + (beam / length) * 50
  ))

  // Pitch stability
  const pitchStability = Math.min(100, Math.max(0,
    (length / beam) * 15 + coeffs.pitchingMoment * 30 + 20
  ))

  // Overall rating
  let overallRating: string
  const avgStability = (stabilityIndex + pitchStability) / 2
  if (avgStability >= 80) overallRating = 'Excellent'
  else if (avgStability >= 60) overallRating = 'Good'
  else if (avgStability >= 40) overallRating = 'Fair'
  else overallRating = 'Poor'

  return {
    metacentricHeight,
    rollPeriod,
    maxSafeHeelAngle,
    stabilityIndex,
    pitchStability,
    overallRating,
  }
}

/**
 * Calculate maximum theoretical hull speed (displacement mode)
 * Hull speed = 1.34 × √(LWL in feet)
 */
export function calculateHullSpeed(lengthMeters: number): number {
  const lengthFeet = lengthMeters * 3.281
  const hullSpeedKnots = 1.34 * Math.sqrt(lengthFeet)
  return hullSpeedKnots * 0.5144 // Convert to m/s
}

/**
 * Calculate hydrofoil takeoff speed
 */
export function calculateFoilTakeoffSpeed(
  displacement: number,
  foilArea: number = 2 // m²
): number {
  // Lift = 0.5 × ρ × Cl × A × v²
  // At takeoff, Lift = Weight
  const weight = displacement * GRAVITY
  const Cl = 0.8 // Lift coefficient
  const takeoffSpeed = Math.sqrt((2 * weight) / (WATER_DENSITY * Cl * foilArea))
  return takeoffSpeed
}

/**
 * Get performance summary for hull configuration
 */
export function getHullPerformanceSummary(
  hullType: string,
  bowShape: string,
  dimensions: HullDimensions
): {
  drag: DragResult
  stability: StabilityResult
  hullSpeed: number
  foilTakeoffSpeed?: number
  performanceScore: number
} {
  const testSpeed = 5 // m/s test speed for drag comparison
  const drag = calculateDrag(hullType, bowShape, dimensions, testSpeed)
  const stability = calculateStability(hullType, dimensions)
  const hullSpeed = calculateHullSpeed(dimensions.length)

  let foilTakeoffSpeed: number | undefined
  if (hullType === 'hydrofoil') {
    foilTakeoffSpeed = calculateFoilTakeoffSpeed(dimensions.displacement)
  }

  // Overall performance score (balance of speed and stability)
  const dragScore = Math.max(0, 100 - drag.totalDrag / 100)
  const stabilityScore = stability.stabilityIndex
  const performanceScore = (dragScore * 0.5 + stabilityScore * 0.5)

  return {
    drag,
    stability,
    hullSpeed,
    foilTakeoffSpeed,
    performanceScore,
  }
}
