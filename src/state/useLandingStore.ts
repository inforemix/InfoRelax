import { create } from 'zustand'
import { useGameStore } from './useGameStore'
import type { MapConfig } from '../world/WorldGenerator'

// ── Map presets (fully-populated MapConfig objects) ──
export const MAP_PRESETS: Record<string, MapConfig> = {
  'serene-archipelago': {
    seed: 42,
    name: 'Serene Archipelago',
    worldSize: 8000,
    difficulty: 'peaceful',
    islandCount: 10,
    islandSizeScale: 1.0,
    islandHeightScale: 1.0,
    islandDistribution: 'ring',
    icebergCount: 12,
    icebergSizeScale: 1.0,
    icebergSpread: 'random',
    floatingIceDensity: 300,
    floatingIceSizeScale: 1.0,
    windZoneCount: 4,
    windStrengthMultiplier: 0.7,
    weatherVolatility: 0.15,
    raceCount: 3,
    raceLength: 'medium',
    routeComplexity: 0.8,
    poiDensity: 1.2,
    discoveryRewardMultiplier: 1.5,
    marinaChargeRate: 8,
    safeZoneRadius: 500,
    fogDensity: 0.08,
    currentStrength: 0.0,
    icebergDrift: false,
    nightMode: false,
    energyMultiplier: 1.2,
  },
  'frozen-strait': {
    seed: 256,
    name: 'Frozen Strait',
    worldSize: 10000,
    difficulty: 'moderate',
    islandCount: 6,
    islandSizeScale: 1.3,
    islandHeightScale: 1.5,
    islandDistribution: 'archipelago',
    icebergCount: 50,
    icebergSizeScale: 1.2,
    icebergSpread: 'lanes',
    floatingIceDensity: 800,
    floatingIceSizeScale: 1.0,
    windZoneCount: 5,
    windStrengthMultiplier: 1.2,
    weatherVolatility: 0.35,
    raceCount: 4,
    raceLength: 'medium',
    routeComplexity: 1.3,
    poiDensity: 1.0,
    discoveryRewardMultiplier: 1.0,
    marinaChargeRate: 5,
    safeZoneRadius: 400,
    fogDensity: 0.25,
    currentStrength: 0.3,
    icebergDrift: true,
    nightMode: false,
    energyMultiplier: 1.0,
  },
  'glacier-maze': {
    seed: 777,
    name: 'Glacier Maze',
    worldSize: 12000,
    difficulty: 'challenging',
    islandCount: 15,
    islandSizeScale: 0.8,
    islandHeightScale: 2.0,
    islandDistribution: 'clustered',
    icebergCount: 100,
    icebergSizeScale: 1.5,
    icebergSpread: 'concentrated',
    floatingIceDensity: 1200,
    floatingIceSizeScale: 1.3,
    windZoneCount: 6,
    windStrengthMultiplier: 1.5,
    weatherVolatility: 0.55,
    raceCount: 5,
    raceLength: 'long',
    routeComplexity: 2.0,
    poiDensity: 1.5,
    discoveryRewardMultiplier: 2.0,
    marinaChargeRate: 5,
    safeZoneRadius: 350,
    fogDensity: 0.4,
    currentStrength: 0.5,
    icebergDrift: true,
    nightMode: false,
    energyMultiplier: 0.8,
  },
  'polar-abyss': {
    seed: 1313,
    name: 'Polar Abyss',
    worldSize: 16000,
    difficulty: 'extreme',
    islandCount: 20,
    islandSizeScale: 1.2,
    islandHeightScale: 2.2,
    islandDistribution: 'scattered',
    icebergCount: 200,
    icebergSizeScale: 2.0,
    icebergSpread: 'dispersed',
    floatingIceDensity: 2000,
    floatingIceSizeScale: 1.5,
    windZoneCount: 8,
    windStrengthMultiplier: 2.5,
    weatherVolatility: 0.8,
    raceCount: 6,
    raceLength: 'long',
    routeComplexity: 2.5,
    poiDensity: 2.0,
    discoveryRewardMultiplier: 3.0,
    marinaChargeRate: 3,
    safeZoneRadius: 250,
    fogDensity: 0.6,
    currentStrength: 0.8,
    icebergDrift: true,
    nightMode: true,
    energyMultiplier: 0.6,
  },
  'midnight-ice': {
    seed: 999,
    name: 'Midnight Ice',
    worldSize: 10000,
    difficulty: 'challenging',
    islandCount: 8,
    islandSizeScale: 1.4,
    islandHeightScale: 1.8,
    islandDistribution: 'ring',
    icebergCount: 70,
    icebergSizeScale: 1.3,
    icebergSpread: 'random',
    floatingIceDensity: 900,
    floatingIceSizeScale: 1.2,
    windZoneCount: 4,
    windStrengthMultiplier: 1.0,
    weatherVolatility: 0.2,
    raceCount: 3,
    raceLength: 'medium',
    routeComplexity: 1.5,
    poiDensity: 0.8,
    discoveryRewardMultiplier: 2.0,
    marinaChargeRate: 6,
    safeZoneRadius: 400,
    fogDensity: 0.5,
    currentStrength: 0.2,
    icebergDrift: false,
    nightMode: true,
    energyMultiplier: 0.9,
  },
}

// Descriptions for each preset (kept separate so MapConfig stays serialisable)
export const MAP_DESCRIPTIONS: Record<string, { description: string; features: string[] }> = {
  'serene-archipelago': {
    description: 'Gentle waters with scattered islands in a ring formation. Perfect for learning the ropes.',
    features: ['Calm winds', 'Ring of islands', 'Few icebergs', 'Bonus energy'],
  },
  'frozen-strait': {
    description: 'Navigate icy corridors between towering glaciers. Icebergs form natural lanes.',
    features: ['Ice lanes', 'Drifting bergs', 'Ocean currents', 'Foggy patches'],
  },
  'glacier-maze': {
    description: 'Dense clusters of ice mountains create a labyrinth. Route through the maze for double rewards.',
    features: ['Clustered islands', 'Dense ice field', 'Strong winds', 'Double rewards'],
  },
  'polar-abyss': {
    description: 'The ultimate arctic challenge. Massive map, extreme conditions, and precious little shelter.',
    features: ['Huge map', 'Night mode', 'Strong currents', 'Triple rewards'],
  },
  'midnight-ice': {
    description: 'Sail under the aurora through an eerie night ocean dotted with glowing icebergs.',
    features: ['Night sailing', 'Dense fog', 'Moderate ice', 'Double rewards'],
  },
}

export interface LandingState {
  gameStarted: boolean
  selectedPresetId: string | null
  mapConfig: MapConfig
  playerName: string
  customMode: boolean  // true = show all sliders

  // Actions
  selectPreset: (presetId: string) => void
  setMapConfig: (config: Partial<MapConfig>) => void
  setPlayerName: (name: string) => void
  setCustomMode: (enabled: boolean) => void
  randomizeSeed: () => void
  startGame: () => void
  resetToLanding: () => void
}

export const useLandingStore = create<LandingState>((set) => ({
  gameStarted: false,
  selectedPresetId: 'serene-archipelago',
  mapConfig: { ...MAP_PRESETS['serene-archipelago'] },
  playerName: 'Navigator',
  customMode: false,

  selectPreset: (presetId: string) => {
    const preset = MAP_PRESETS[presetId]
    if (preset) {
      set({ selectedPresetId: presetId, mapConfig: { ...preset } })
    }
  },

  setMapConfig: (partial: Partial<MapConfig>) => {
    set((state) => ({
      mapConfig: { ...state.mapConfig, ...partial },
      selectedPresetId: null, // custom edit clears preset selection
    }))
  },

  setPlayerName: (name: string) => {
    set({ playerName: name })
  },

  setCustomMode: (enabled: boolean) => {
    set({ customMode: enabled })
  },

  randomizeSeed: () => {
    set((state) => ({
      mapConfig: {
        ...state.mapConfig,
        seed: Math.floor(Math.random() * 99999),
      },
      selectedPresetId: null,
    }))
  },

  startGame: () => {
    console.log('Setting gameStarted to true')
    set({ gameStarted: true })
    console.log('Game started successfully')
  },

  resetToLanding: () => {
    set({ gameStarted: false })
    const gameStore = useGameStore.getState()
    if (gameStore.resetGameState) {
      gameStore.resetGameState()
    }
  },
}))
