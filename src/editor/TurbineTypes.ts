/**
 * Turbine Types - Comprehensive type definitions for procedural turbine generation
 * Supports creative mode with extensive customization options
 */

// Point type for blade profiles
export interface TurbinePoint {
  x: number  // Radial position (0-1, distance from center)
  y: number  // Height position (-1 to 1, bottom to top)
}

// Control point with curve handles
export interface TurbineControlPoint extends TurbinePoint {
  handleIn?: TurbinePoint
  handleOut?: TurbinePoint
  tension?: number  // 0-1, affects smoothness
}

// Individual blade section configuration
export interface BladeSection {
  position: number        // 0 = bottom, 1 = top
  width: number           // Width multiplier (0.2-3.0)
  thickness: number       // Thickness multiplier (0.5-2.0)
  pitch: number           // Local pitch angle (-60 to 60 degrees)
  twist: number           // Local twist offset (-45 to 45 degrees)
  sweep: number           // Sweep angle (-30 to 30 degrees)
  camber: number          // Airfoil camber (-0.5 to 0.5)
  leadingEdge: number     // Leading edge radius (0-1)
  trailingEdge: number    // Trailing edge sharpness (0-1)
  offset: TurbinePoint    // Position offset from center axis
}

// Blade airfoil profile type
export type AirfoilType =
  | 'flat'           // Simple flat plate
  | 'symmetric'      // Symmetric NACA-style
  | 'cambered'       // Single surface camber
  | 'double-surface' // Traditional airfoil
  | 'helical'        // Twisted helical
  | 's-curve'        // S-shaped for Savonius
  | 'cup'            // Cupped for drag turbines
  | 'custom'         // User-defined

// Blade style presets
export type BladeStyle =
  | 'helix'         // Classic helix VAWT
  | 'darrieus'      // Darrieus eggbeater
  | 'savonius'      // Savonius drag-based
  | 'h-rotor'       // H-rotor straight blades
  | 'giromill'      // Giromill/Cyclogyro
  | 'ribbon'        // Continuous ribbon
  | 'infinity'      // Figure-8 infinity
  | 'troposkein'    // Troposkein curve
  | 'hybrid'        // Mixed design
  | 'custom'        // User-defined

// Hub configuration
export interface HubConfig {
  type: 'cylinder' | 'sphere' | 'cone' | 'streamlined' | 'none'
  diameter: number      // Diameter relative to turbine (0.05-0.3)
  length: number        // Length multiplier (0.5-2.0)
  topCap: boolean       // Has top cap
  bottomMount: boolean  // Has bottom mount
  material: 'metal' | 'plastic' | 'carbon' | 'matching'
}

// Shaft configuration
export interface ShaftConfig {
  visible: boolean
  diameter: number      // 0.02-0.2 relative to turbine diameter
  style: 'straight' | 'tapered' | 'reinforced'
  sections: number      // Number of visible shaft sections
  color: string
}

// Support arm configuration (for H-rotor and similar)
export interface SupportArmConfig {
  count: number         // Number of support arms per blade (0-3)
  positions: number[]   // Vertical positions (0-1) for each arm
  type: 'straight' | 'curved' | 'airfoil' | 'hidden'
  width: number         // Arm width multiplier
  fairing: boolean      // Has aerodynamic fairing
}

// Blade tip configuration
export interface BladeTipConfig {
  type: 'square' | 'rounded' | 'tapered' | 'winglet' | 'endplate'
  size: number          // Size multiplier (0.5-2.0)
  angle: number         // Tip angle (-30 to 30)
}

// Full blade configuration
export interface BladeConfig {
  // Basic shape
  style: BladeStyle
  airfoil: AirfoilType

  // Dimensions
  chord: number         // Blade chord length (0.1-1.0 of diameter)
  span: number          // Blade span (height multiplier 0.5-1.0)
  thickness: number     // Base thickness (0.02-0.3)

  // Global transforms
  twist: number         // Total twist from bottom to top (0-180 degrees)
  taper: number         // Tip/root chord ratio (0.3-1.5)
  sweep: number         // Sweep angle (-45 to 45 degrees)
  prebend: number       // Pre-bend angle for troposkein (-45 to 45)

  // Sections (user-customizable)
  sections: BladeSection[]

  // Custom profile curve (drawn by user)
  profileCurve: TurbineControlPoint[]

  // Advanced
  hollowCore: boolean   // Hollow blade for weight reduction
  surfaceTexture: 'smooth' | 'ribbed' | 'dimpled' | 'serrated'

  // Tips
  tipTop: BladeTipConfig
  tipBottom: BladeTipConfig
}

// Material configuration
export interface TurbineMaterialConfig {
  type: 'solar' | 'chrome' | 'led' | 'carbon' | 'painted' | 'wood' | 'transparent'
  primaryColor: string
  secondaryColor: string
  emissive: boolean
  emissiveColor: string
  emissiveIntensity: number
  metalness: number
  roughness: number
  opacity: number
}

// Animation configuration
export interface TurbineAnimationConfig {
  autoRotate: boolean
  baseSpeed: number     // RPM
  windResponsive: boolean
  easing: 'linear' | 'ease-in' | 'ease-out' | 'bounce'
  direction: 'clockwise' | 'counter-clockwise'
}

// Full procedural turbine configuration
export interface ProceduralTurbineConfig {
  // Basic dimensions
  height: number        // Total height (3-20 meters)
  diameter: number      // Rotor diameter (0.5-6 meters)
  bladeCount: number    // Number of blades (2-12)

  // Blade configuration
  blade: BladeConfig

  // Components
  hub: HubConfig
  shaft: ShaftConfig
  supportArms: SupportArmConfig

  // Material
  material: TurbineMaterialConfig

  // Animation
  animation: TurbineAnimationConfig

  // Performance parameters (calculated)
  sweptArea: number
  solidity: number      // Blade area / swept area
  tipSpeedRatio: number
  efficiency: number
}

// Preset metadata
export interface TurbinePresetMeta {
  id: string
  name: string
  description: string
  category: 'efficiency' | 'aesthetic' | 'experimental' | 'classic'
  icon: string
  unlockCost: number
  performanceRating: {
    power: number       // 1-10
    startupWind: number // 1-10 (lower is better)
    noise: number       // 1-10 (lower is better)
    durability: number  // 1-10
    efficiency: number  // 1-10
  }
}

// Complete turbine preset
export interface TurbinePreset extends TurbinePresetMeta {
  config: Partial<ProceduralTurbineConfig>
}

// Editor state
export interface TurbineSectionEditorState {
  activeSection: number         // Currently editing section (0-based)
  sectionCount: number          // Number of sections to show
  editMode: 'section' | 'profile' | 'global'
  showWireframe: boolean
  showSections: boolean
  showAirflow: boolean
  selectedTool: 'select' | 'draw' | 'adjust' | 'smooth'
  symmetryMode: boolean
  previewRotation: boolean
}

// Section interpolation mode
export type InterpolationMode = 'linear' | 'smooth' | 'bezier' | 'step'

// Section editor event types
export interface SectionChangeEvent {
  sectionIndex: number
  property: keyof BladeSection
  value: number | TurbinePoint
}

// Creative mode features
export interface CreativeModeConfig {
  enabled: boolean
  unlimitedBlades: boolean      // Allow more than 12 blades
  customAirfoils: boolean       // Allow drawing custom airfoils
  physicsOverride: boolean      // Ignore physics constraints
  experimentalShapes: boolean   // Enable experimental blade shapes
  particleEffects: boolean      // Visual particle effects
  soundDesign: boolean          // Custom wind sounds
}

// Blade generation parameters for procedural creation
export interface BladeGenerationParams {
  seed: number                  // Random seed for reproducibility
  complexity: number            // 0-1, affects detail level
  organicFactor: number         // 0-1, makes shapes more organic
  symmetryStrength: number      // 0-1, enforces symmetry
  noiseScale: number            // Procedural noise scale
  noiseStrength: number         // Procedural noise strength
}

// Export default section configuration
export const DEFAULT_BLADE_SECTION: BladeSection = {
  position: 0.5,
  width: 1.0,
  thickness: 1.0,
  pitch: 0,
  twist: 0,
  sweep: 0,
  camber: 0,
  leadingEdge: 0.3,
  trailingEdge: 0.7,
  offset: { x: 0, y: 0 },
}

// Export default blade config
export const DEFAULT_BLADE_CONFIG: BladeConfig = {
  style: 'helix',
  airfoil: 'symmetric',
  chord: 0.3,
  span: 1.0,
  thickness: 0.08,
  twist: 45,
  taper: 0.8,
  sweep: 0,
  prebend: 0,
  sections: [
    { ...DEFAULT_BLADE_SECTION, position: 0, width: 1.0, pitch: 5 },
    { ...DEFAULT_BLADE_SECTION, position: 0.5, width: 1.2, pitch: 0 },
    { ...DEFAULT_BLADE_SECTION, position: 1.0, width: 0.8, pitch: -5 },
  ],
  profileCurve: [],
  hollowCore: false,
  surfaceTexture: 'smooth',
  tipTop: { type: 'rounded', size: 1.0, angle: 0 },
  tipBottom: { type: 'rounded', size: 1.0, angle: 0 },
}

// Export default turbine config
export const DEFAULT_TURBINE_CONFIG: ProceduralTurbineConfig = {
  height: 8,
  diameter: 2,
  bladeCount: 3,
  blade: DEFAULT_BLADE_CONFIG,
  hub: {
    type: 'cylinder',
    diameter: 0.1,
    length: 1.0,
    topCap: true,
    bottomMount: true,
    material: 'metal',
  },
  shaft: {
    visible: true,
    diameter: 0.08,
    style: 'straight',
    sections: 1,
    color: '#475569',
  },
  supportArms: {
    count: 0,
    positions: [],
    type: 'hidden',
    width: 1.0,
    fairing: false,
  },
  material: {
    type: 'solar',
    primaryColor: '#8B5CF6',
    secondaryColor: '#06B6D4',
    emissive: false,
    emissiveColor: '#8B5CF6',
    emissiveIntensity: 0,
    metalness: 0.5,
    roughness: 0.3,
    opacity: 1.0,
  },
  animation: {
    autoRotate: true,
    baseSpeed: 30,
    windResponsive: true,
    easing: 'linear',
    direction: 'clockwise',
  },
  sweptArea: 0,
  solidity: 0,
  tipSpeedRatio: 4,
  efficiency: 0.25,
}
