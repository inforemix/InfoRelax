/**
 * Hull Types - Comprehensive type definitions for procedural hull generation
 */

// Basic point type for hull profiles
export interface HullPoint {
  x: number  // Normalized -1 to 1 (left to right)
  y: number  // Normalized -1 to 1 (bottom to top)
}

// Control point with handles for bezier curves
export interface ControlPoint extends HullPoint {
  handleIn?: HullPoint   // Incoming bezier handle
  handleOut?: HullPoint  // Outgoing bezier handle
}

// Hull cross-section at a specific longitudinal position
export interface HullCrossSection {
  position: number       // 0 = bow, 1 = stern
  profile: ControlPoint[] // Points defining the cross-section shape
  beamMultiplier: number  // Multiplier for beam at this section (0.1 to 1.5)
  deadrise: number        // V-angle at bottom (0-45 degrees)
  freeboard: number       // Height above waterline multiplier (0.5-2.0)
}

// Bow shape configuration
export interface BowConfig {
  type: 'piercing' | 'flared' | 'bulbous' | 'spoon' | 'clipper' | 'plumb' | 'axe' | 'wave-piercing'
  angle: number          // Entry angle (10-60 degrees)
  overhang: number       // Bow overhang (0-30%)
  flare: number          // Flare angle at bow (0-30 degrees)
  rake: number           // Forward rake angle (0-45 degrees)
  bulbSize: number       // For bulbous bow (0-0.5)
  bulbPosition: number   // Vertical position of bulb (0-1)
}

// Stern shape configuration
export interface SternConfig {
  type: 'transom' | 'cruiser' | 'canoe' | 'double-ended' | 'sugar-scoop' | 'reverse-transom' | 'ducktail'
  angle: number          // Transom angle (-15 to 45 degrees)
  overhang: number       // Stern overhang (0-20%)
  width: number          // Transom width ratio (0.3-1.0)
  height: number         // Transom height ratio (0.3-1.0)
  rake: number           // Backward rake (0-30 degrees)
}

// Keel configuration
export interface KeelConfig {
  type: 'flat' | 'v-hull' | 'deep-v' | 'modified-v' | 'round-bottom' | 'multi-chine' | 'tunnel' | 'cathedral'
  depth: number          // Keel depth (0-2 meters)
  length: number         // Keel length ratio (0.3-1.0)
  position: number       // Fore-aft position (0.3-0.7)
  sweep: number          // Keel sweep angle (0-45 degrees)
  finType: 'none' | 'stub' | 'fin' | 'bulb' | 'wing' | 'centerboard' | 'daggerboard'
  finDepth: number       // Fin keel depth (0-3 meters)
}

// Chine configuration
export interface ChineConfig {
  type: 'soft' | 'hard' | 'reverse' | 'spray-rail' | 'none'
  count: number          // Number of chines (0-4)
  positions: number[]    // Vertical positions (0-1) for each chine
  angles: number[]       // Chine angles for each
}

// Deck configuration
export interface DeckConfig {
  camber: number         // Deck curve (0-15% of beam)
  sheer: number          // Sheer line height bow/stern (0-0.5m)
  coachRoof: boolean     // Has raised cabin
  coachRoofHeight: number // Height of coach roof (0.3-1.5m)
  coachRoofLength: number // Length ratio (0.2-0.6)
  flybridge: boolean     // Has flybridge
}

// Rocker configuration (fore-aft curvature of bottom)
export interface RockerConfig {
  bowRise: number        // Bow rise amount (0-0.5m per meter length)
  sternRise: number      // Stern rise amount (0-0.3m per meter length)
  centerPoint: number    // Position of lowest point (0.4-0.6)
  continuous: boolean    // Smooth vs stepped rocker
}

// Full procedural hull configuration
export interface ProceduralHullConfig {
  // Basic dimensions
  length: number         // Overall length (6-40 meters)
  beam: number           // Maximum beam (2-12 meters)
  draft: number          // Design draft (0.3-3 meters)
  freeboard: number      // Bow freeboard (0.5-2 meters)

  // Hull category
  category: 'monohull' | 'catamaran' | 'trimaran' | 'proa' | 'swath'

  // Shape configurations
  bow: BowConfig
  stern: SternConfig
  keel: KeelConfig
  chine: ChineConfig
  deck: DeckConfig
  rocker: RockerConfig

  // Custom cross-sections (user-drawn)
  crossSections: HullCrossSection[]

  // Hull entry/exit waterlines (user-drawn profiles)
  waterlineProfile: ControlPoint[]   // Top-down waterline shape
  buttockProfile: ControlPoint[]     // Side profile (buttock line)

  // Advanced parameters
  prismaticCoefficient: number  // Fullness of ends (0.5-0.7)
  blockCoefficient: number      // Overall fullness (0.3-0.6)
  midshipCoefficient: number    // Midship fullness (0.6-0.95)
  wettedSurfaceArea: number     // Calculated
  displacement: number          // Calculated tonnage

  // Visual customization
  colors: {
    hull: string
    deck: string
    accent: string
    antifoul: string
  }

  // Material/finish
  material: 'fiberglass' | 'carbon' | 'aluminum' | 'wood' | 'steel'
  finish: 'matte' | 'satin' | 'gloss' | 'metallic'
}

// Catamaran-specific configuration
export interface CatamaranConfig extends ProceduralHullConfig {
  category: 'catamaran'
  hullSpacing: number         // Spacing between hulls (0.3-0.5 of beam)
  hullSymmetry: 'symmetric' | 'asymmetric'
  bridgeDeck: {
    height: number            // Clearance above water
    type: 'open' | 'solid' | 'nacelle'
    nacelleLength: number     // For nacelle type
  }
  crossBeams: {
    count: number             // 2-4
    type: 'straight' | 'curved' | 'airfoil'
    height: number
  }
}

// Trimaran-specific configuration
export interface TrimaranConfig extends ProceduralHullConfig {
  category: 'trimaran'
  mainHullRatio: number       // Main hull beam ratio (0.4-0.6)
  amaLength: number           // Outrigger length ratio (0.5-0.8)
  amaBeam: number             // Outrigger beam ratio (0.1-0.25)
  amaSpacing: number          // Distance from center (0.3-0.5 of beam)
  akaType: 'fixed' | 'folding' | 'telescoping'
  akaPosition: number[]       // Fore-aft positions [front, rear]
}

// Grid editor state
export interface HullGridEditorState {
  activeView: 'top' | 'side' | 'front' | 'perspective'
  activeTool: 'select' | 'draw' | 'edit' | 'smooth' | 'mirror'
  gridSize: number
  snapToGrid: boolean
  showWaterline: boolean
  showSections: boolean
  selectedPoints: number[]
  currentSection: number
  symmetryMode: boolean
}

// Hull preset metadata
export interface HullPresetMeta {
  id: string
  name: string
  description: string
  category: 'racing' | 'cruising' | 'expedition' | 'luxury' | 'workboat' | 'classic'
  icon: string
  thumbnail?: string
  unlockCost: number
  performanceRating: {
    speed: number      // 1-10
    stability: number  // 1-10
    comfort: number    // 1-10
    efficiency: number // 1-10
    seakeeping: number // 1-10
  }
}

// Complete hull preset
export interface HullPreset extends HullPresetMeta {
  config: Partial<ProceduralHullConfig>
}

// Editor view types
export type HullView = 'top' | 'side' | 'front' | 'perspective'

// Drawing mode
export type DrawingMode = 'freehand' | 'bezier' | 'polygon' | 'spline'

// Hull symmetry
export type HullSymmetry = 'port-starboard' | 'bow-stern' | 'none'
