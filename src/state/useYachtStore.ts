import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

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

// Full yacht configuration
export interface YachtConfig {
  id: string
  name: string
  hull: HullConfig
  turbine: TurbineConfig
  solar: SolarConfig
  battery: BatteryConfig
  deckModules: string[]  // ['dj-booth', 'cargo', etc.]
}

// Calculated stats based on config
export interface YachtStats {
  dragCoefficient: number
  stability: number
  maxSpeed: number          // knots
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
    style: 'helix',
    height: 8,
    diameter: 2,
    bladeCount: 3,
    bladeProfile: [],
    material: 'solar',
    twist: 45,
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
  solar: {
    deckCoverage: 60,
    turbineIntegrated: true,
    canopyEnabled: false,
  },
  battery: {
    capacity: 100,
    currentCharge: 75,
  },
  deckModules: [],
}

// Store state interface
interface YachtState {
  // Current yacht being edited/sailed
  currentYacht: YachtConfig
  
  // Calculated stats (derived from config)
  stats: YachtStats
  
  // Saved yacht designs
  savedYachts: YachtConfig[]
  
  // Actions
  setHull: (hull: Partial<HullConfig>) => void
  setTurbine: (turbine: Partial<TurbineConfig>) => void
  setSolar: (solar: Partial<SolarConfig>) => void
  setBattery: (battery: Partial<BatteryConfig>) => void
  setBladeProfile: (points: BladePoint[]) => void
  addDeckModule: (module: string) => void
  removeDeckModule: (module: string) => void
  saveYacht: () => void
  loadYacht: (id: string) => void
  resetYacht: () => void
  
  // Internal
  recalculateStats: () => void
}

// Calculate yacht stats from configuration
function calculateStats(yacht: YachtConfig): YachtStats {
  const { hull, turbine, solar, battery } = yacht
  
  // Hull drag based on type and proportions
  const hullTypeModifiers: Record<HullType, number> = {
    monohull: 1.0,
    catamaran: 0.85,
    trimaran: 0.75,
    hydrofoil: 0.5,
  }
  const dragCoefficient = 0.3 * (hull.beam / hull.length) * hullTypeModifiers[hull.type]
  
  // Stability based on beam and draft
  const stability = hull.beam * hull.draft * hullTypeModifiers[hull.type] * 10
  
  // Max speed (simplified)
  const maxSpeed = Math.sqrt(100 / dragCoefficient) * (hull.type === 'hydrofoil' ? 1.5 : 1)
  
  // Turbine efficiency based on design
  const bladeCountBonus = Math.min(turbine.bladeCount / 3, 1.2)
  const turbineEfficiency = 0.25 * bladeCountBonus // Base 25% efficiency
  
  // Solar output based on coverage
  const solarOutput = (solar.deckCoverage / 100) * 2 + (solar.turbineIntegrated ? 0.5 : 0)
  
  // Range based on battery and efficiency
  const avgConsumption = 2 // kW at cruise
  const avgGeneration = solarOutput * 0.5 + turbineEfficiency * 1.5
  const netConsumption = Math.max(0.5, avgConsumption - avgGeneration)
  const range = (battery.capacity * (battery.currentCharge / 100)) / netConsumption * 10
  
  return {
    dragCoefficient,
    stability,
    maxSpeed,
    turbineEfficiency,
    solarOutput,
    range,
  }
}

// Create the store
export const useYachtStore = create<YachtState>()(
  immer((set, get) => ({
    currentYacht: defaultYacht,
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
    
    setBladeProfile: (points) => {
      set((state) => {
        state.currentYacht.turbine.bladeProfile = points
      })
      get().recalculateStats()
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
