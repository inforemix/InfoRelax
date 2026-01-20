/**
 * Turbine Shape Library - Comprehensive collection of turbine designs and blade presets
 */

import {
  TurbinePreset,
  ProceduralTurbineConfig,
  BladeConfig,
  BladeSection,
  DEFAULT_TURBINE_CONFIG,
  DEFAULT_BLADE_CONFIG,
  DEFAULT_BLADE_SECTION,
} from './TurbineTypes'

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function createSections(count: number, config: Partial<BladeSection>[]): BladeSection[] {
  return Array.from({ length: count }, (_, i) => ({
    ...DEFAULT_BLADE_SECTION,
    position: i / (count - 1),
    ...(config[i] || {}),
  }))
}

// ============================================================
// TURBINE PRESETS LIBRARY
// ============================================================

export const TURBINE_PRESETS: TurbinePreset[] = [
  // --- EFFICIENCY CATEGORY ---
  {
    id: 'classic-helix',
    name: 'Classic Helix',
    description: 'Traditional helical VAWT with proven efficiency. Good all-around performance in variable winds.',
    category: 'efficiency',
    icon: '🌀',
    unlockCost: 0,
    performanceRating: {
      power: 7,
      startupWind: 6,
      noise: 7,
      durability: 8,
      efficiency: 7,
    },
    config: {
      height: 8,
      diameter: 2,
      bladeCount: 3,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'helix',
        airfoil: 'symmetric',
        twist: 60,
        taper: 0.85,
        sections: createSections(5, [
          { width: 1.0, pitch: 8, thickness: 1.1 },
          { width: 1.1, pitch: 4, thickness: 1.0 },
          { width: 1.2, pitch: 0, thickness: 1.0 },
          { width: 1.1, pitch: -4, thickness: 1.0 },
          { width: 0.9, pitch: -8, thickness: 0.9 },
        ]),
      },
    },
  },
  {
    id: 'high-efficiency-darrieus',
    name: 'High-Eff Darrieus',
    description: 'Optimized Darrieus design with curved troposkein blades for maximum lift efficiency.',
    category: 'efficiency',
    icon: '⚡',
    unlockCost: 1500,
    performanceRating: {
      power: 9,
      startupWind: 4,
      noise: 6,
      durability: 7,
      efficiency: 9,
    },
    config: {
      height: 10,
      diameter: 2.5,
      bladeCount: 3,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'darrieus',
        airfoil: 'double-surface',
        twist: 0,
        taper: 1.0,
        prebend: 25,
        chord: 0.25,
        sections: createSections(7, [
          { width: 0.6, pitch: 12, offset: { x: 0.3, y: 0 } },
          { width: 0.8, pitch: 8, offset: { x: 0.5, y: 0 } },
          { width: 1.0, pitch: 4, offset: { x: 0.7, y: 0 } },
          { width: 1.1, pitch: 0, offset: { x: 0.8, y: 0 } },
          { width: 1.0, pitch: -4, offset: { x: 0.7, y: 0 } },
          { width: 0.8, pitch: -8, offset: { x: 0.5, y: 0 } },
          { width: 0.6, pitch: -12, offset: { x: 0.3, y: 0 } },
        ]),
      },
      supportArms: {
        count: 2,
        positions: [0.25, 0.75],
        type: 'airfoil',
        width: 1.2,
        fairing: true,
      },
    },
  },
  {
    id: 'giromill-pro',
    name: 'Giromill Pro',
    description: 'H-rotor design with variable pitch capability. Excellent in steady winds.',
    category: 'efficiency',
    icon: '🔄',
    unlockCost: 2000,
    performanceRating: {
      power: 8,
      startupWind: 5,
      noise: 5,
      durability: 9,
      efficiency: 8,
    },
    config: {
      height: 8,
      diameter: 3,
      bladeCount: 4,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'h-rotor',
        airfoil: 'double-surface',
        twist: 0,
        taper: 1.0,
        prebend: 0,
        chord: 0.2,
        thickness: 0.12,
        sections: createSections(3, [
          { width: 1.0, pitch: 6, sweep: 5 },
          { width: 1.0, pitch: 0, sweep: 0 },
          { width: 1.0, pitch: -6, sweep: -5 },
        ]),
        tipTop: { type: 'endplate', size: 1.5, angle: 0 },
        tipBottom: { type: 'endplate', size: 1.5, angle: 0 },
      },
      supportArms: {
        count: 3,
        positions: [0.15, 0.5, 0.85],
        type: 'airfoil',
        width: 0.8,
        fairing: true,
      },
    },
  },
  {
    id: 'savonius-power',
    name: 'Savonius Power',
    description: 'Drag-based design with excellent startup torque. Works in turbulent conditions.',
    category: 'efficiency',
    icon: '🌊',
    unlockCost: 800,
    performanceRating: {
      power: 5,
      startupWind: 9,
      noise: 4,
      durability: 10,
      efficiency: 5,
    },
    config: {
      height: 6,
      diameter: 1.5,
      bladeCount: 2,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'savonius',
        airfoil: 's-curve',
        twist: 90,
        taper: 1.0,
        chord: 0.6,
        thickness: 0.02,
        sections: createSections(5, [
          { width: 0.95, camber: 0.4, pitch: 0 },
          { width: 1.0, camber: 0.45, pitch: 15 },
          { width: 1.0, camber: 0.5, pitch: 30 },
          { width: 1.0, camber: 0.45, pitch: 45 },
          { width: 0.95, camber: 0.4, pitch: 60 },
        ]),
      },
      hub: {
        type: 'cylinder',
        diameter: 0.25,
        length: 1.0,
        topCap: true,
        bottomMount: true,
        material: 'metal',
      },
    },
  },

  // --- AESTHETIC CATEGORY ---
  {
    id: 'infinity-loop',
    name: 'Infinity Loop',
    description: 'Elegant figure-8 design inspired by mathematical infinity. A true conversation piece.',
    category: 'aesthetic',
    icon: '♾️',
    unlockCost: 3000,
    performanceRating: {
      power: 6,
      startupWind: 6,
      noise: 8,
      durability: 6,
      efficiency: 6,
    },
    config: {
      height: 10,
      diameter: 2,
      bladeCount: 2,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'infinity',
        airfoil: 'symmetric',
        twist: 180,
        taper: 0.7,
        chord: 0.35,
        sections: createSections(9, [
          { width: 0.7, pitch: 0, offset: { x: 0.2, y: 0 } },
          { width: 0.9, pitch: 15, offset: { x: 0.5, y: 0 } },
          { width: 1.0, pitch: 30, offset: { x: 0.8, y: 0 } },
          { width: 0.9, pitch: 45, offset: { x: 0.5, y: 0 } },
          { width: 0.8, pitch: 0, offset: { x: 0.2, y: 0 } },
          { width: 0.9, pitch: -45, offset: { x: 0.5, y: 0 } },
          { width: 1.0, pitch: -30, offset: { x: 0.8, y: 0 } },
          { width: 0.9, pitch: -15, offset: { x: 0.5, y: 0 } },
          { width: 0.7, pitch: 0, offset: { x: 0.2, y: 0 } },
        ]),
      },
      material: {
        type: 'chrome',
        primaryColor: '#E2E8F0',
        secondaryColor: '#06B6D4',
        emissive: false,
        emissiveColor: '#06B6D4',
        emissiveIntensity: 0,
        metalness: 0.9,
        roughness: 0.1,
        opacity: 1.0,
      },
    },
  },
  {
    id: 'flowing-ribbon',
    name: 'Flowing Ribbon',
    description: 'Continuous ribbon blade that flows like fabric in the wind. Pure sculptural beauty.',
    category: 'aesthetic',
    icon: '🎀',
    unlockCost: 2500,
    performanceRating: {
      power: 5,
      startupWind: 7,
      noise: 9,
      durability: 5,
      efficiency: 5,
    },
    config: {
      height: 12,
      diameter: 1.8,
      bladeCount: 1,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'ribbon',
        airfoil: 'flat',
        twist: 360,
        taper: 0.6,
        chord: 0.4,
        thickness: 0.02,
        hollowCore: false,
        surfaceTexture: 'smooth',
        sections: createSections(12, Array(12).fill(null).map((_, i) => ({
          width: 0.8 + Math.sin(i / 11 * Math.PI) * 0.4,
          pitch: (i / 11) * 360 - 180,
          sweep: Math.sin(i / 11 * Math.PI * 2) * 15,
        }))),
      },
      material: {
        type: 'painted',
        primaryColor: '#EC4899',
        secondaryColor: '#8B5CF6',
        emissive: false,
        emissiveColor: '#EC4899',
        emissiveIntensity: 0,
        metalness: 0.2,
        roughness: 0.4,
        opacity: 0.95,
      },
    },
  },
  {
    id: 'dj-blade',
    name: 'DJ Blade',
    description: 'Party-ready design with LED integration points. Makes your yacht the center of attention.',
    category: 'aesthetic',
    icon: '🎧',
    unlockCost: 1800,
    performanceRating: {
      power: 6,
      startupWind: 6,
      noise: 5,
      durability: 7,
      efficiency: 6,
    },
    config: {
      height: 8,
      diameter: 2.5,
      bladeCount: 4,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'helix',
        airfoil: 'symmetric',
        twist: 45,
        taper: 0.9,
        chord: 0.35,
        sections: createSections(5, [
          { width: 1.2, pitch: 10, thickness: 1.2 },
          { width: 1.4, pitch: 5, thickness: 1.1 },
          { width: 1.5, pitch: 0, thickness: 1.0 },
          { width: 1.4, pitch: -5, thickness: 1.1 },
          { width: 1.2, pitch: -10, thickness: 1.2 },
        ]),
        tipTop: { type: 'winglet', size: 1.3, angle: 15 },
        tipBottom: { type: 'winglet', size: 1.3, angle: -15 },
      },
      material: {
        type: 'led',
        primaryColor: '#1E1B4B',
        secondaryColor: '#8B5CF6',
        emissive: true,
        emissiveColor: '#8B5CF6',
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3,
        opacity: 0.9,
      },
    },
  },
  {
    id: 'crystal-bloom',
    name: 'Crystal Bloom',
    description: 'Organic flower-like design with translucent blades. Catches light beautifully at sunset.',
    category: 'aesthetic',
    icon: '🌸',
    unlockCost: 2200,
    performanceRating: {
      power: 4,
      startupWind: 7,
      noise: 8,
      durability: 4,
      efficiency: 4,
    },
    config: {
      height: 7,
      diameter: 2.2,
      bladeCount: 5,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'custom',
        airfoil: 'cambered',
        twist: 30,
        taper: 0.5,
        chord: 0.45,
        thickness: 0.03,
        sections: createSections(6, [
          { width: 0.4, pitch: 15, camber: 0.3 },
          { width: 0.8, pitch: 10, camber: 0.25 },
          { width: 1.2, pitch: 5, camber: 0.2 },
          { width: 1.4, pitch: 0, camber: 0.15 },
          { width: 1.2, pitch: -5, camber: 0.1 },
          { width: 0.6, pitch: -10, camber: 0.05 },
        ]),
        tipTop: { type: 'tapered', size: 0.3, angle: 30 },
        tipBottom: { type: 'rounded', size: 1.0, angle: 0 },
      },
      material: {
        type: 'transparent',
        primaryColor: '#FDF4FF',
        secondaryColor: '#F0ABFC',
        emissive: true,
        emissiveColor: '#F0ABFC',
        emissiveIntensity: 0.2,
        metalness: 0.1,
        roughness: 0.1,
        opacity: 0.7,
      },
    },
  },

  // --- EXPERIMENTAL CATEGORY ---
  {
    id: 'hybrid-lift-drag',
    name: 'Hybrid Lift-Drag',
    description: 'Experimental design combining lift and drag principles. Self-starting with good efficiency.',
    category: 'experimental',
    icon: '🔬',
    unlockCost: 3500,
    performanceRating: {
      power: 7,
      startupWind: 8,
      noise: 6,
      durability: 6,
      efficiency: 7,
    },
    config: {
      height: 9,
      diameter: 2.8,
      bladeCount: 6,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'hybrid',
        airfoil: 'cambered',
        twist: 75,
        taper: 0.75,
        chord: 0.28,
        sections: createSections(7, [
          { width: 0.8, pitch: 20, camber: 0.35, offset: { x: 0.2, y: 0 } },
          { width: 1.0, pitch: 15, camber: 0.3, offset: { x: 0.3, y: 0 } },
          { width: 1.2, pitch: 8, camber: 0.2, offset: { x: 0.4, y: 0 } },
          { width: 1.3, pitch: 0, camber: 0.1, offset: { x: 0.5, y: 0 } },
          { width: 1.2, pitch: -8, camber: 0.15, offset: { x: 0.4, y: 0 } },
          { width: 1.0, pitch: -15, camber: 0.25, offset: { x: 0.3, y: 0 } },
          { width: 0.8, pitch: -20, camber: 0.35, offset: { x: 0.2, y: 0 } },
        ]),
      },
    },
  },
  {
    id: 'tornado-spiral',
    name: 'Tornado Spiral',
    description: 'Extreme twist design inspired by tornado dynamics. Captures energy from all directions.',
    category: 'experimental',
    icon: '🌪️',
    unlockCost: 4000,
    performanceRating: {
      power: 6,
      startupWind: 8,
      noise: 4,
      durability: 5,
      efficiency: 6,
    },
    config: {
      height: 12,
      diameter: 1.5,
      bladeCount: 3,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'helix',
        airfoil: 'helical',
        twist: 540,
        taper: 0.4,
        chord: 0.5,
        thickness: 0.05,
        sections: createSections(15, Array(15).fill(null).map((_, i) => ({
          width: 0.5 + Math.sin(i / 14 * Math.PI) * 0.7,
          pitch: i * 36,
          sweep: Math.sin(i / 14 * Math.PI * 3) * 20,
        }))),
      },
      hub: {
        type: 'streamlined',
        diameter: 0.08,
        length: 1.2,
        topCap: true,
        bottomMount: true,
        material: 'carbon',
      },
    },
  },
  {
    id: 'biomimetic-kelp',
    name: 'Biomimetic Kelp',
    description: 'Inspired by ocean kelp movement. Flexible design that adapts to wind conditions.',
    category: 'experimental',
    icon: '🌿',
    unlockCost: 2800,
    performanceRating: {
      power: 5,
      startupWind: 9,
      noise: 9,
      durability: 4,
      efficiency: 5,
    },
    config: {
      height: 10,
      diameter: 2,
      bladeCount: 8,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'custom',
        airfoil: 'cambered',
        twist: 20,
        taper: 0.3,
        chord: 0.15,
        thickness: 0.02,
        sections: createSections(8, Array(8).fill(null).map((_, i) => ({
          width: 0.4 + i * 0.15,
          pitch: Math.sin(i / 7 * Math.PI * 2) * 15,
          sweep: Math.sin(i / 7 * Math.PI * 3) * 10,
          camber: 0.1 + i * 0.05,
        }))),
        tipTop: { type: 'tapered', size: 0.2, angle: 45 },
      },
      material: {
        type: 'painted',
        primaryColor: '#065F46',
        secondaryColor: '#34D399',
        emissive: false,
        emissiveColor: '#34D399',
        emissiveIntensity: 0,
        metalness: 0.1,
        roughness: 0.7,
        opacity: 0.85,
      },
    },
  },

  // --- CLASSIC CATEGORY ---
  {
    id: 'traditional-windmill',
    name: 'Traditional Windmill',
    description: 'Classic windmill blade design adapted for modern use. Reliable and time-tested.',
    category: 'classic',
    icon: '🏠',
    unlockCost: 500,
    performanceRating: {
      power: 6,
      startupWind: 7,
      noise: 6,
      durability: 9,
      efficiency: 6,
    },
    config: {
      height: 8,
      diameter: 2.5,
      bladeCount: 4,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'h-rotor',
        airfoil: 'flat',
        twist: 15,
        taper: 0.7,
        chord: 0.3,
        thickness: 0.04,
        sections: createSections(3, [
          { width: 1.2, pitch: 12, thickness: 1.2 },
          { width: 1.0, pitch: 8, thickness: 1.0 },
          { width: 0.7, pitch: 4, thickness: 0.8 },
        ]),
      },
      material: {
        type: 'wood',
        primaryColor: '#92400E',
        secondaryColor: '#D4A574',
        emissive: false,
        emissiveColor: '#D4A574',
        emissiveIntensity: 0,
        metalness: 0.1,
        roughness: 0.8,
        opacity: 1.0,
      },
    },
  },
  {
    id: 'marine-classic',
    name: 'Marine Classic',
    description: 'Nautical-inspired design that complements traditional yacht aesthetics.',
    category: 'classic',
    icon: '⚓',
    unlockCost: 1000,
    performanceRating: {
      power: 6,
      startupWind: 6,
      noise: 7,
      durability: 8,
      efficiency: 6,
    },
    config: {
      height: 7,
      diameter: 2,
      bladeCount: 3,
      blade: {
        ...DEFAULT_BLADE_CONFIG,
        style: 'helix',
        airfoil: 'symmetric',
        twist: 45,
        taper: 0.85,
        chord: 0.28,
        sections: createSections(4, [
          { width: 1.0, pitch: 10, thickness: 1.1 },
          { width: 1.15, pitch: 5, thickness: 1.0 },
          { width: 1.1, pitch: 0, thickness: 1.0 },
          { width: 0.9, pitch: -5, thickness: 0.95 },
        ]),
      },
      material: {
        type: 'painted',
        primaryColor: '#1E3A5F',
        secondaryColor: '#D4AF37',
        emissive: false,
        emissiveColor: '#D4AF37',
        emissiveIntensity: 0,
        metalness: 0.3,
        roughness: 0.5,
        opacity: 1.0,
      },
      hub: {
        type: 'sphere',
        diameter: 0.12,
        length: 0.8,
        topCap: true,
        bottomMount: true,
        material: 'metal',
      },
    },
  },
]

// Category metadata
export const TURBINE_CATEGORIES = {
  efficiency: { label: 'Efficiency', icon: '⚡', color: '#10B981' },
  aesthetic: { label: 'Aesthetic', icon: '✨', color: '#8B5CF6' },
  experimental: { label: 'Experimental', icon: '🔬', color: '#F59E0B' },
  classic: { label: 'Classic', icon: '⚓', color: '#6366F1' },
} as const

// Get presets by category
export function getTurbinePresetsByCategory(category: TurbinePreset['category']): TurbinePreset[] {
  return TURBINE_PRESETS.filter(p => p.category === category)
}

// Get preset by ID
export function getTurbinePresetById(id: string): TurbinePreset | undefined {
  return TURBINE_PRESETS.find(p => p.id === id)
}

// Create a new config from preset
export function createTurbineConfigFromPreset(preset: TurbinePreset): ProceduralTurbineConfig {
  return {
    ...DEFAULT_TURBINE_CONFIG,
    ...preset.config,
    blade: {
      ...DEFAULT_BLADE_CONFIG,
      ...preset.config?.blade,
    },
  }
}

// Blade style descriptions for UI
export const BLADE_STYLE_INFO = {
  helix: {
    name: 'Helix',
    description: 'Twisted helical blades that spiral around the axis',
    icon: '🌀',
  },
  darrieus: {
    name: 'Darrieus',
    description: 'Curved eggbeater-style blades using lift force',
    icon: '🥚',
  },
  savonius: {
    name: 'Savonius',
    description: 'S-curved scoops that use drag force',
    icon: '🌊',
  },
  'h-rotor': {
    name: 'H-Rotor',
    description: 'Straight vertical blades on horizontal arms',
    icon: '🔲',
  },
  giromill: {
    name: 'Giromill',
    description: 'Variable pitch straight blades',
    icon: '🔄',
  },
  ribbon: {
    name: 'Ribbon',
    description: 'Continuous flowing ribbon blade',
    icon: '🎀',
  },
  infinity: {
    name: 'Infinity',
    description: 'Figure-8 twisted loop design',
    icon: '♾️',
  },
  troposkein: {
    name: 'Troposkein',
    description: 'Optimal curvature for centrifugal loads',
    icon: '🎯',
  },
  hybrid: {
    name: 'Hybrid',
    description: 'Combined lift and drag principles',
    icon: '🔬',
  },
  custom: {
    name: 'Custom',
    description: 'User-defined blade shape',
    icon: '✏️',
  },
} as const

// Airfoil type descriptions
export const AIRFOIL_INFO = {
  flat: { name: 'Flat Plate', description: 'Simple flat surface', efficiency: 0.6 },
  symmetric: { name: 'Symmetric', description: 'Equal curvature top/bottom', efficiency: 0.8 },
  cambered: { name: 'Cambered', description: 'Single surface curve', efficiency: 0.85 },
  'double-surface': { name: 'Double Surface', description: 'Traditional airfoil', efficiency: 0.95 },
  helical: { name: 'Helical', description: 'Twisted along length', efficiency: 0.75 },
  's-curve': { name: 'S-Curve', description: 'Savonius scoop shape', efficiency: 0.5 },
  cup: { name: 'Cup', description: 'Cupped drag surface', efficiency: 0.45 },
  custom: { name: 'Custom', description: 'User-defined profile', efficiency: 0.7 },
} as const
