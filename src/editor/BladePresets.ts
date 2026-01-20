import { BladePoint } from '@/state/useYachtStore'

export interface BladePreset {
  id: string
  name: string
  description: string
  icon: string
  points: BladePoint[]
  category: 'efficiency' | 'aesthetic' | 'experimental'
  unlockCost: number
}

// All presets use normalized coordinates (-1 to 1 from center)
// These will be denormalized when displayed on the canvas

export const BLADE_PRESETS: BladePreset[] = [
  {
    id: 'classic-curved',
    name: 'Classic Curved',
    description: 'Traditional VAWT blade with gentle curve for reliable performance',
    icon: '🌀',
    category: 'efficiency',
    unlockCost: 0,
    points: [
      { x: 0.1, y: 0.0 },
      { x: 0.15, y: -0.3 },
      { x: 0.25, y: -0.5 },
      { x: 0.35, y: -0.65 },
      { x: 0.4, y: -0.8 },
    ],
  },
  {
    id: 'helix-wing',
    name: 'Helix Wing',
    description: 'S-curved blade inspired by Gorlov helical design',
    icon: '🧬',
    category: 'efficiency',
    unlockCost: 0,
    points: [
      { x: 0.05, y: 0.0 },
      { x: 0.2, y: -0.2 },
      { x: 0.15, y: -0.4 },
      { x: 0.25, y: -0.6 },
      { x: 0.2, y: -0.8 },
    ],
  },
  {
    id: 'savonius',
    name: 'Savonius Scoop',
    description: 'Deep curved scoop blade, great for low wind speeds',
    icon: '🥄',
    category: 'efficiency',
    unlockCost: 200,
    points: [
      { x: 0.0, y: 0.0 },
      { x: 0.3, y: -0.15 },
      { x: 0.4, y: -0.35 },
      { x: 0.35, y: -0.55 },
      { x: 0.2, y: -0.75 },
      { x: 0.05, y: -0.85 },
    ],
  },
  {
    id: 'darrieus-egg',
    name: 'Darrieus Egg',
    description: 'Egg-beater style troposkein curve for high speed',
    icon: '🥚',
    category: 'efficiency',
    unlockCost: 500,
    points: [
      { x: 0.0, y: 0.0 },
      { x: 0.35, y: -0.2 },
      { x: 0.45, y: -0.45 },
      { x: 0.35, y: -0.7 },
      { x: 0.0, y: -0.9 },
    ],
  },
  {
    id: 'ribbon-twist',
    name: 'Ribbon Twist',
    description: 'Flowing ribbon design with artistic flair',
    icon: '🎀',
    category: 'aesthetic',
    unlockCost: 300,
    points: [
      { x: 0.1, y: 0.0 },
      { x: 0.3, y: -0.1 },
      { x: 0.15, y: -0.3 },
      { x: 0.35, y: -0.5 },
      { x: 0.2, y: -0.7 },
      { x: 0.3, y: -0.85 },
    ],
  },
  {
    id: 'flame',
    name: 'Flame',
    description: 'Dynamic flame-shaped blade with aggressive curves',
    icon: '🔥',
    category: 'aesthetic',
    unlockCost: 400,
    points: [
      { x: 0.05, y: 0.0 },
      { x: 0.25, y: -0.1 },
      { x: 0.15, y: -0.25 },
      { x: 0.3, y: -0.4 },
      { x: 0.2, y: -0.55 },
      { x: 0.35, y: -0.7 },
      { x: 0.15, y: -0.85 },
    ],
  },
  {
    id: 'infinity-loop',
    name: 'Infinity Loop',
    description: 'Figure-8 inspired design for the signature E-Cat look',
    icon: '∞',
    category: 'aesthetic',
    unlockCost: 1000,
    points: [
      { x: 0.2, y: 0.0 },
      { x: 0.35, y: -0.15 },
      { x: 0.25, y: -0.3 },
      { x: 0.1, y: -0.45 },
      { x: 0.25, y: -0.6 },
      { x: 0.35, y: -0.75 },
      { x: 0.2, y: -0.9 },
    ],
  },
  {
    id: 'wave',
    name: 'Ocean Wave',
    description: 'Sinusoidal wave pattern inspired by the sea',
    icon: '🌊',
    category: 'aesthetic',
    unlockCost: 350,
    points: [
      { x: 0.15, y: 0.0 },
      { x: 0.35, y: -0.15 },
      { x: 0.15, y: -0.35 },
      { x: 0.35, y: -0.55 },
      { x: 0.15, y: -0.75 },
      { x: 0.25, y: -0.9 },
    ],
  },
  {
    id: 'bio-leaf',
    name: 'Bio Leaf',
    description: 'Organic leaf-inspired blade mimicking nature',
    icon: '🍃',
    category: 'experimental',
    unlockCost: 600,
    points: [
      { x: 0.05, y: 0.0 },
      { x: 0.15, y: -0.15 },
      { x: 0.4, y: -0.3 },
      { x: 0.45, y: -0.5 },
      { x: 0.3, y: -0.7 },
      { x: 0.1, y: -0.85 },
    ],
  },
  {
    id: 'angular',
    name: 'Angular',
    description: 'Sharp geometric design for a modern look',
    icon: '📐',
    category: 'experimental',
    unlockCost: 450,
    points: [
      { x: 0.1, y: 0.0 },
      { x: 0.1, y: -0.25 },
      { x: 0.35, y: -0.35 },
      { x: 0.35, y: -0.6 },
      { x: 0.1, y: -0.7 },
      { x: 0.1, y: -0.9 },
    ],
  },
  {
    id: 'spiral',
    name: 'Spiral',
    description: 'Logarithmic spiral for experimental high efficiency',
    icon: '🌀',
    category: 'experimental',
    unlockCost: 800,
    points: [
      { x: 0.05, y: 0.0 },
      { x: 0.15, y: -0.12 },
      { x: 0.25, y: -0.28 },
      { x: 0.32, y: -0.45 },
      { x: 0.35, y: -0.62 },
      { x: 0.33, y: -0.78 },
      { x: 0.25, y: -0.9 },
    ],
  },
  {
    id: 'dj-blade',
    name: 'DJ Blade',
    description: 'Party-ready design with LED integration points',
    icon: '🎧',
    category: 'aesthetic',
    unlockCost: 1500,
    points: [
      { x: 0.15, y: 0.0 },
      { x: 0.4, y: -0.1 },
      { x: 0.25, y: -0.25 },
      { x: 0.4, y: -0.4 },
      { x: 0.25, y: -0.55 },
      { x: 0.4, y: -0.7 },
      { x: 0.15, y: -0.85 },
    ],
  },
]

// Get presets by category
export function getPresetsByCategory(category: BladePreset['category']): BladePreset[] {
  return BLADE_PRESETS.filter((p) => p.category === category)
}

// Get unlocked presets based on player's energy credits
export function getUnlockedPresets(energyCredits: number): BladePreset[] {
  return BLADE_PRESETS.filter((p) => p.unlockCost <= energyCredits)
}

// Get preset by ID
export function getPresetById(id: string): BladePreset | undefined {
  return BLADE_PRESETS.find((p) => p.id === id)
}
