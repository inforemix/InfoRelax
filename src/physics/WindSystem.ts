/**
 * Wind System
 * Manages dynamic wind direction, speed, gusts, and weather patterns
 */

export type Weather = 'clear' | 'cloudy' | 'trade-winds' | 'storm' | 'doldrums'

export interface WindState {
  direction: number      // 0-360 degrees (0 = North, 90 = East)
  speed: number          // m/s
  gustSpeed: number      // Current gust speed
  gustFactor: number     // 0-1 (variation amount)
  apparentDirection: number  // Relative to boat heading
  apparentSpeed: number      // Combined with boat movement
}

// Weather presets with wind characteristics
export const WEATHER_PRESETS: Record<Weather, {
  baseSpeed: [number, number]  // [min, max] m/s
  gustFactor: number           // Gust variation
  directionVariation: number   // Degrees of random drift
  description: string
}> = {
  'clear': {
    baseSpeed: [3, 8],
    gustFactor: 0.15,
    directionVariation: 15,
    description: 'Light and variable winds',
  },
  'cloudy': {
    baseSpeed: [5, 12],
    gustFactor: 0.25,
    directionVariation: 25,
    description: 'Moderate winds with occasional gusts',
  },
  'trade-winds': {
    baseSpeed: [10, 18],
    gustFactor: 0.12,
    directionVariation: 8,
    description: 'Steady, reliable trade winds',
  },
  'storm': {
    baseSpeed: [18, 30],
    gustFactor: 0.5,
    directionVariation: 45,
    description: 'Strong, unpredictable storm winds',
  },
  'doldrums': {
    baseSpeed: [0, 3],
    gustFactor: 0.3,
    directionVariation: 60,
    description: 'Calm, nearly windless conditions',
  },
}

/**
 * Calculate apparent wind (wind relative to moving boat)
 */
export function calculateApparentWind(
  trueWindSpeed: number,      // m/s
  trueWindDirection: number,  // degrees (0 = North)
  boatSpeed: number,          // knots
  boatHeading: number         // degrees (0 = North)
): { speed: number; direction: number } {
  // Convert boat speed from knots to m/s
  const boatSpeedMs = boatSpeed * 0.514

  // Convert directions to radians
  const trueWindRad = (trueWindDirection * Math.PI) / 180
  const boatHeadingRad = (boatHeading * Math.PI) / 180

  // True wind vector components
  const trueWindX = trueWindSpeed * Math.sin(trueWindRad)
  const trueWindY = trueWindSpeed * Math.cos(trueWindRad)

  // Boat velocity vector components (opposite to movement creates apparent wind)
  const boatVelX = -boatSpeedMs * Math.sin(boatHeadingRad)
  const boatVelY = -boatSpeedMs * Math.cos(boatHeadingRad)

  // Apparent wind = true wind - boat velocity
  const apparentX = trueWindX + boatVelX
  const apparentY = trueWindY + boatVelY

  // Calculate apparent wind speed and direction
  const apparentSpeed = Math.sqrt(apparentX * apparentX + apparentY * apparentY)
  let apparentDirection = (Math.atan2(apparentX, apparentY) * 180) / Math.PI

  // Normalize to 0-360
  if (apparentDirection < 0) apparentDirection += 360

  return { speed: apparentSpeed, direction: apparentDirection }
}

/**
 * Generate smooth noise for wind variation
 */
class PerlinNoise {
  private permutation: number[]

  constructor(seed: number = 42) {
    this.permutation = this.generatePermutation(seed)
  }

  private generatePermutation(seed: number): number[] {
    const p = Array.from({ length: 256 }, (_, i) => i)
    // Simple shuffle using seed
    for (let i = 255; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      const j = seed % (i + 1)
      ;[p[i], p[j]] = [p[j], p[i]]
    }
    return [...p, ...p]
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }

  private grad(hash: number, x: number): number {
    return (hash & 1) === 0 ? x : -x
  }

  noise1D(x: number): number {
    const xi = Math.floor(x) & 255
    const xf = x - Math.floor(x)

    const u = this.fade(xf)

    const a = this.permutation[xi]
    const b = this.permutation[xi + 1]

    return this.lerp(this.grad(a, xf), this.grad(b, xf - 1), u)
  }
}

const windNoise = new PerlinNoise(Date.now())

/**
 * Wind system state manager
 */
export class WindSystemManager {
  private baseDirection: number
  private weather: Weather
  private time: number = 0

  constructor(initialDirection: number = 45, weather: Weather = 'trade-winds') {
    this.baseDirection = initialDirection
    this.weather = weather
  }

  setWeather(weather: Weather): void {
    this.weather = weather
  }

  setBaseDirection(direction: number): void {
    this.baseDirection = direction % 360
  }

  update(deltaTime: number, boatSpeed: number, boatHeading: number): WindState {
    this.time += deltaTime

    const preset = WEATHER_PRESETS[this.weather]

    // Generate smooth variations using noise
    const speedNoise = windNoise.noise1D(this.time * 0.1)
    const directionNoise = windNoise.noise1D(this.time * 0.05 + 100)
    const gustNoise = windNoise.noise1D(this.time * 0.5 + 200)

    // Calculate current speed with noise
    const [minSpeed, maxSpeed] = preset.baseSpeed
    const speedRange = maxSpeed - minSpeed
    const currentSpeed = minSpeed + (speedRange / 2) + (speedNoise * speedRange / 2)

    // Calculate gusts
    const gustMultiplier = 1 + gustNoise * preset.gustFactor
    const gustSpeed = currentSpeed * gustMultiplier

    // Calculate direction with drift
    const directionOffset = directionNoise * preset.directionVariation
    const currentDirection = (this.baseDirection + directionOffset + 360) % 360

    // Calculate apparent wind
    const apparent = calculateApparentWind(gustSpeed, currentDirection, boatSpeed, boatHeading)

    return {
      direction: currentDirection,
      speed: currentSpeed,
      gustSpeed,
      gustFactor: preset.gustFactor,
      apparentDirection: apparent.direction,
      apparentSpeed: apparent.speed,
    }
  }
}

/**
 * Get wind effect on yacht (for physics integration)
 */
export interface WindEffect {
  lateralForce: number   // Sideways force (N)
  forwardForce: number   // Forward/backward force (N)
  heelMoment: number     // Heeling moment (N·m)
}

export function calculateWindEffect(
  apparentSpeed: number,
  apparentAngle: number,  // Relative to boat heading (0 = head wind)
  sailArea: number,       // m² (if yacht has sails, otherwise superstructure)
  hullBeam: number        // m (for heel calculation)
): WindEffect {
  const AIR_DENSITY = 1.225

  // Convert angle to radians
  const angleRad = (apparentAngle * Math.PI) / 180

  // Wind pressure
  const pressure = 0.5 * AIR_DENSITY * apparentSpeed * apparentSpeed

  // Force components
  const totalForce = pressure * sailArea * 0.3 // Drag coefficient ~0.3 for superstructure

  // Forward component (negative for headwind)
  const forwardForce = totalForce * Math.cos(angleRad) * -0.2 // Small forward effect

  // Lateral component (beam wind causes most force)
  const lateralForce = totalForce * Math.sin(angleRad)

  // Heeling moment (force × lever arm)
  // Assume force acts at center of superstructure
  const heelMoment = lateralForce * (hullBeam / 2) * 0.5

  return {
    lateralForce,
    forwardForce,
    heelMoment,
  }
}
