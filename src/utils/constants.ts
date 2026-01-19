// Physics constants
export const PHYSICS = {
  // Environment
  AIR_DENSITY: 1.225,           // kg/m³
  WATER_DENSITY: 1025,          // kg/m³
  GRAVITY: 9.81,                // m/s²
  
  // Solar
  SOLAR_IRRADIANCE_PEAK: 1000,  // W/m²
  PANEL_EFFICIENCY: 0.18,
  
  // Turbine
  BETZ_LIMIT: 0.593,
  TURBINE_EFFICIENCY_BASE: 0.25,
  
  // Movement
  SPEED_SCALE: 1.94384,         // m/s to knots
  MAX_TURN_RATE: 45,            // degrees/second
  
  // Energy
  SYSTEMS_DRAW: 0.2,            // kW constant
  BATTERY_C_RATE: 0.5,          // max charge rate
} as const

// UI constants
export const UI = {
  HUD_UPDATE_RATE: 100,         // ms
  BUILDER_DEBOUNCE: 200,        // ms
} as const

// Colors from E-Cat design
export const COLORS = {
  hullWhite: '#F8FAFC',
  oceanDeep: '#0C4A6E',
  oceanMid: '#0E7490',
  cyanAccent: '#06B6D4',
  sunsetOrange: '#F97316',
  sunsetGold: '#FBBF24',
  turbinePurple: '#8B5CF6',
  speakerGold: '#D4A574',
} as const

// Unlock costs (Energy Credits)
export const UNLOCK_COSTS = {
  // Hull types
  catamaran: 0,      // Starter
  trimaran: 500,
  hydrofoil: 5000,
  
  // Turbine styles
  helix: 0,          // Starter
  infinity: 1000,
  ribbon: 5000,
  
  // Battery capacity
  battery100: 0,     // Starter (100 kWh)
  battery200: 2000,
  battery500: 10000,
  
  // Deck modules
  djBooth: 1500,
  cargo: 500,
  fishing: 800,
  solarCanopy: 3000,
} as const

// Weather presets
export const WEATHER_PRESETS = {
  clear: {
    windSpeed: [2, 6] as [number, number],
    gustFactor: 0.1,
    cloudCover: 0.1,
    solarMultiplier: 1.0,
  },
  cloudy: {
    windSpeed: [4, 10] as [number, number],
    gustFactor: 0.2,
    cloudCover: 0.6,
    solarMultiplier: 0.5,
  },
  tradeWinds: {
    windSpeed: [8, 15] as [number, number],
    gustFactor: 0.15,
    cloudCover: 0.3,
    solarMultiplier: 0.8,
  },
  storm: {
    windSpeed: [15, 25] as [number, number],
    gustFactor: 0.5,
    cloudCover: 0.9,
    solarMultiplier: 0.2,
  },
  doldrums: {
    windSpeed: [0, 2] as [number, number],
    gustFactor: 0.05,
    cloudCover: 0.2,
    solarMultiplier: 1.0,
  },
} as const
