import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  calculateDrag,
  calculateStability,
  calculateHullSpeed,
  calculateFoilTakeoffSpeed,
  WATER_DENSITY,
} from '../physics/WaterPhysics'
import type { ProceduralHullConfig } from '../editor/HullTypes'

// Hull Types
export type HullType = 'monohull' | 'catamaran' | 'trimaran' | 'hydrofoil'

// Turbine Types (from E-Cat concepts)
export type TurbineStyle = 'helix' | 'infinity' | 'ribbon'

// Blade profile point
export interface BladePoint {
  x: number
  y: number
}

// Hull configuration
export interface HullConfig {
  type: HullType
  length: number      // 6-20 meters
  beam: number        // 2-12 meters
  draft: number       // 0.5-2 meters
  bowShape: 'piercing' | 'flared' | 'bulbous'
}

// Turbine configuration
export interface TurbineConfig {
  style: TurbineStyle
  height: number      // 5-15 meters
  diameter: number    // 1-4 meters
  bladeCount: number  // 2-6 blades
  bladeProfile: BladePoint[]  // Custom blade shape from Kaleidoscope
  material: 'solar' | 'chrome' | 'led'

  // Global blade shape
  twist: number           // Helical twist angle (0-120 degrees)
  taper: number           // Top/bottom width ratio (0.3-1.0, 1.0 = no taper)
  sweep: number           // Blade sweep angle (-30 to 30 degrees)
  thickness: number       // Blade thickness (0.02-0.2)
  camber: number          // Blade curvature (-0.5 to 0.5)

  // Section widths (multiplier 0.5-2.0)
  widthTop: number
  widthMid: number
  widthBottom: number

  // Section chord angles (pitch, -45 to 45 degrees)
  angleTop: number
  angleMid: number
  angleBottom: number
}

// Solar panel configuration
export interface SolarConfig {
  deckCoverage: number    // 0-100%
  turbineIntegrated: boolean
  canopyEnabled: boolean
}

// Battery configuration
export interface BatteryConfig {
  capacity: number    // kWh (50, 100, 200, 500)
  currentCharge: number  // 0-100%
}

// Engine tier
export type EngineTier = 'standard' | 'performance' | 'racing'

// Engine configuration
export interface EngineConfig {
  tier: EngineTier
  powerMultiplier: number  // 1x, 2x, 3x
  maxSpeed: number        // knots
}

// Turbine position offset for placing turbine on boat
export interface TurbinePosition {
  x: number  // -5 to 5 (left/right)
  y: number  // 0 to 5 (height offset)
  z: number  // -10 to 10 (front/back)
}

// Turbine animation configuration
export interface TurbineAnimation {
  breathAmplitude: number   // 0 to 0.5 - scale breathing intensity
  breathFrequency: number   // 0.2 to 3 - breathing speed
  zCascade: number          // 0 to 2 - z-axis offset cascade per blade
}

// Full yacht configuration
export interface YachtConfig {
  id: string
  name: string
  hull: HullConfig
  turbine: TurbineConfig
  turbinePosition: TurbinePosition  // Position offset for turbine
  // Second turbine (stacked on same axis)
  secondTurbineEnabled: boolean
  secondTurbine: TurbineConfig
  secondTurbineYOffset: number  // Vertical offset from first turbine (negative = below)
  // Turbine animation
  turbineAnimation: TurbineAnimation
  solar: SolarConfig
  battery: BatteryConfig
  engine: EngineConfig
  deckModules: string[]  // ['dj-booth', 'cargo', etc.]
  useGLBModel: boolean   // Whether to use the uploaded GLB model
  glbModelScale: number  // Scale factor for GLB model
}

// Calculated stats based on config
export interface YachtStats {
  // Drag characteristics
  dragCoefficient: number
  totalDrag: number         // Newtons at test speed
  formDrag: number
  frictionDrag: number
  waveDrag: number

  // Stability characteristics
  stability: number
  metacentricHeight: number // meters
  rollPeriod: number        // seconds
  maxHeelAngle: number      // degrees
  stabilityRating: string   // 'Excellent' | 'Good' | 'Fair' | 'Poor'

  // Speed
  maxSpeed: number          // knots
  hullSpeed: number         // theoretical hull speed in knots
  foilTakeoffSpeed?: number // knots (hydrofoil only)

  // Energy
  turbineEfficiency: number // 0-1
  solarOutput: number       // kW at peak
  range: number             // km at cruise
}

// Default yacht (starter configuration)
const defaultYacht: YachtConfig = {
  id: 'default',
  name: 'E-Cat Starter',
  hull: {
    type: 'catamaran',
    length: 12,
    beam: 4,
    draft: 0.8,
    bowShape: 'piercing',
  },
  turbine: {
    style: 'ribbon',
    height: 6,
    diameter: 5,
    bladeCount: 5,
    bladeProfile: [],
    material: 'solar',
    twist: 25,
    taper: 0.8,
    sweep: 0,
    thickness: 0.08,
    camber: 0,
    widthTop: 1.0,
    widthMid: 1.0,
    widthBottom: 1.0,
    angleTop: 0,
    angleMid: 0,
    angleBottom: 0,
  },
  turbinePosition: {
    x: -5,
    y: 0,
    z: 0,
  },
  // Second turbine (below first by default)
  secondTurbineEnabled: false,
  secondTurbine: {
    style: 'ribbon',
    height: 4,
    diameter: 4,
    bladeCount: 4,
    bladeProfile: [],
    material: 'chrome',
    twist: 30,
    taper: 0.7,
    sweep: 0,
    thickness: 0.08,
    camber: 0,
    widthTop: 1.0,
    widthMid: 1.0,
    widthBottom: 1.0,
    angleTop: 0,
    angleMid: 0,
    angleBottom: 0,
  },
  secondTurbineYOffset: -1,  // Below the first turbine
  // Turbine animation defaults
  turbineAnimation: {
    breathAmplitude: 0.2,
    breathFrequency: 0.8,
    zCascade: 0,
  },
  solar: {
    deckCoverage: 60,
    turbineIntegrated: true,
    canopyEnabled: false,
  },
  battery: {
    capacity: 100,
    currentCharge: 50,
  },
  engine: {
    tier: 'performance',
    powerMultiplier: 2,
    maxSpeed: 40,
  },
  deckModules: [],
  useGLBModel: true,
  glbModelScale: 17,
}

// Store state interface
interface YachtState {
  // Current yacht being edited/sailed
  currentYacht: YachtConfig

  // Procedural hull config for advanced editor (optional)
  proceduralHullConfig: ProceduralHullConfig | null

  // Calculated stats (derived from config)
  stats: YachtStats

  // Saved yacht designs
  savedYachts: YachtConfig[]

  // Actions
  setHull: (hull: Partial<HullConfig>) => void
  setTurbine: (turbine: Partial<TurbineConfig>) => void
  setTurbinePosition: (position: Partial<TurbinePosition>) => void
  // Second turbine actions
  setSecondTurbineEnabled: (enabled: boolean) => void
  setSecondTurbine: (turbine: Partial<TurbineConfig>) => void
  setSecondTurbineYOffset: (offset: number) => void
  setSecondBladeProfile: (points: BladePoint[]) => void
  setTurbineAnimation: (animation: Partial<TurbineAnimation>) => void
  setSolar: (solar: Partial<SolarConfig>) => void
  setBattery: (battery: Partial<BatteryConfig>) => void
  setEngine: (tier: EngineTier) => void
  setBladeProfile: (points: BladePoint[]) => void
  setProceduralHullConfig: (config: ProceduralHullConfig | null) => void
  setUseGLBModel: (useGLB: boolean) => void
  setGLBModelScale: (scale: number) => void
  addDeckModule: (module: string) => void
  removeDeckModule: (module: string) => void
  saveYacht: () => void
  loadYacht: (id: string) => void
  resetYacht: () => void

  // Internal
  recalculateStats: () => void
}

// Calculate yacht stats from configuration using physics system
function calculateStats(yacht: YachtConfig): YachtStats {
  const { hull, turbine, solar, battery } = yacht

  // Calculate displacement (approximate based on hull volume)
  const hullVolume = hull.length * hull.beam * hull.draft * 0.4 // Block coefficient ~0.4
  const displacement = hullVolume * WATER_DENSITY * 0.6 // 60% submerged

  const dimensions = {
    length: hull.length,
    beam: hull.beam,
    draft: hull.draft,
    displacement,
  }

  // Calculate drag at test speed (5 m/s ≈ 10 knots)
  const testSpeed = 5
  const dragResult = calculateDrag(hull.type, hull.bowShape, dimensions, testSpeed)

  // Calculate stability
  const stabilityResult = calculateStability(hull.type, dimensions)

  // Hull speed and foil takeoff
  const hullSpeedMs = calculateHullSpeed(hull.length)
  const hullSpeed = hullSpeedMs * 1.944 // Convert m/s to knots

  let foilTakeoffSpeed: number | undefined
  if (hull.type === 'hydrofoil') {
    const foilTakeoffMs = calculateFoilTakeoffSpeed(displacement)
    foilTakeoffSpeed = foilTakeoffMs * 1.944 // Convert to knots
  }

  // Max speed based on drag and available power, scaled by engine tier
  // Simplified: lower drag = higher speed potential
  const dragCoefficient = dragResult.totalDrag / (0.5 * WATER_DENSITY * testSpeed * testSpeed * hull.beam * hull.draft)
  const baseMaxSpeed = Math.min(120, hullSpeed * (1.5 - dragCoefficient)) * (hull.type === 'hydrofoil' ? 1.8 : 1)
  const maxSpeed = baseMaxSpeed * yacht.engine.powerMultiplier

  // Stability score (0-100)
  const stability = stabilityResult.stabilityIndex

  // Turbine efficiency based on design parameters
  const bladeCountBonus = Math.min(turbine.bladeCount / 3, 1.2)
  const twistBonus = 1 + Math.abs(turbine.twist - 45) / 180 * 0.2 // Optimal around 45°
  const turbineEfficiency = 0.25 * bladeCountBonus * twistBonus

  // Solar output based on coverage and deck area
  const deckArea = hull.length * hull.beam * 0.6 // 60% usable deck
  const solarOutput = (solar.deckCoverage / 100) * deckArea * 0.15 + (solar.turbineIntegrated ? 0.5 : 0)

  // Range based on battery and efficiency
  const avgConsumption = 2 + (maxSpeed / 10) // Higher speed = more consumption
  const avgGeneration = solarOutput * 0.5 + turbineEfficiency * 2
  const netConsumption = Math.max(0.5, avgConsumption - avgGeneration)
  const range = (battery.capacity * (battery.currentCharge / 100)) / netConsumption * 10

  return {
    dragCoefficient,
    totalDrag: dragResult.totalDrag,
    formDrag: dragResult.formDrag,
    frictionDrag: dragResult.frictionDrag,
    waveDrag: dragResult.waveDrag,
    stability,
    metacentricHeight: stabilityResult.metacentricHeight,
    rollPeriod: stabilityResult.rollPeriod,
    maxHeelAngle: stabilityResult.maxSafeHeelAngle,
    stabilityRating: stabilityResult.overallRating,
    maxSpeed,
    hullSpeed,
    foilTakeoffSpeed,
    turbineEfficiency,
    solarOutput,
    range,
  }
}

// Create the store
export const useYachtStore = create<YachtState>()(
  immer((set, get) => ({
    currentYacht: defaultYacht,
    proceduralHullConfig: null,
    stats: calculateStats(defaultYacht),
    savedYachts: [],
    
    setHull: (hull) => {
      set((state) => {
        Object.assign(state.currentYacht.hull, hull)
      })
      get().recalculateStats()
    },
    
    setTurbine: (turbine) => {
      set((state) => {
        Object.assign(state.currentYacht.turbine, turbine)
      })
      get().recalculateStats()
    },

    setTurbinePosition: (position) => {
      set((state) => {
        Object.assign(state.currentYacht.turbinePosition, position)
      })
    },

    // Second turbine actions
    setSecondTurbineEnabled: (enabled) => {
      set((state) => {
        state.currentYacht.secondTurbineEnabled = enabled
      })
    },

    setSecondTurbine: (turbine) => {
      set((state) => {
        Object.assign(state.currentYacht.secondTurbine, turbine)
      })
      get().recalculateStats()
    },

    setSecondTurbineYOffset: (offset) => {
      set((state) => {
        state.currentYacht.secondTurbineYOffset = offset
      })
    },

    setSecondBladeProfile: (points) => {
      set((state) => {
        state.currentYacht.secondTurbine.bladeProfile = points
      })
    },

    setTurbineAnimation: (animation) => {
      set((state) => {
        Object.assign(state.currentYacht.turbineAnimation, animation)
      })
    },

    setSolar: (solar) => {
      set((state) => {
        Object.assign(state.currentYacht.solar, solar)
      })
      get().recalculateStats()
    },
    
    setBattery: (battery) => {
      set((state) => {
        Object.assign(state.currentYacht.battery, battery)
      })
      get().recalculateStats()
    },

    setEngine: (tier) => {
      const tierConfig = {
        standard: { powerMultiplier: 1, maxSpeed: 25 },
        performance: { powerMultiplier: 2, maxSpeed: 40 },
        racing: { powerMultiplier: 3, maxSpeed: 55 },
      }
      set((state) => {
        state.currentYacht.engine = {
          tier,
          ...tierConfig[tier],
        }
      })
      get().recalculateStats()
    },

    setBladeProfile: (points) => {
      set((state) => {
        state.currentYacht.turbine.bladeProfile = points
      })
      get().recalculateStats()
    },

    setProceduralHullConfig: (config) => {
      set((state) => {
        state.proceduralHullConfig = config
      })
    },

    setUseGLBModel: (useGLB) => {
      set((state) => {
        state.currentYacht.useGLBModel = useGLB
      })
    },

    setGLBModelScale: (scale) => {
      set((state) => {
        state.currentYacht.glbModelScale = scale
      })
    },

    addDeckModule: (module) => {
      set((state) => {
        if (!state.currentYacht.deckModules.includes(module)) {
          state.currentYacht.deckModules.push(module)
        }
      })
    },
    
    removeDeckModule: (module) => {
      set((state) => {
        state.currentYacht.deckModules = state.currentYacht.deckModules.filter(m => m !== module)
      })
    },
    
    saveYacht: () => {
      set((state) => {
        const yacht = { ...state.currentYacht, id: crypto.randomUUID() }
        state.savedYachts.push(yacht)
      })
    },
    
    loadYacht: (id) => {
      const yacht = get().savedYachts.find(y => y.id === id)
      if (yacht) {
        set((state) => {
          state.currentYacht = yacht
        })
        get().recalculateStats()
      }
    },
    
    resetYacht: () => {
      set((state) => {
        state.currentYacht = defaultYacht
      })
      get().recalculateStats()
    },
    
    recalculateStats: () => {
      set((state) => {
        state.stats = calculateStats(state.currentYacht)
      })
    },
  }))
)
