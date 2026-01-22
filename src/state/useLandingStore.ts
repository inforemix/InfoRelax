import { create } from 'zustand'

export interface MapPreset {
  id: string
  name: string
  description: string
  seed: number
  worldSize: number
  difficulty: 'peaceful' | 'moderate' | 'challenging' | 'extreme'
  features: string[]
}

export interface LandingState {
  gameStarted: boolean
  selectedMap: MapPreset | null
  playerName: string

  // Actions
  selectMap: (map: MapPreset) => void
  setPlayerName: (name: string) => void
  startGame: () => void
  resetToLanding: () => void
}

export const MAP_PRESETS: Record<string, MapPreset> = {
  'serene-archipelago': {
    id: 'serene-archipelago',
    name: 'Serene Archipelago',
    description: 'Perfect for beginners - gentle winds and close islands',
    seed: 42,
    worldSize: 8000,
    difficulty: 'peaceful',
    features: ['Calm winds', 'Nearby islands', 'Easy navigation', 'POI bonuses'],
  },
  'trade-winds': {
    id: 'trade-winds',
    name: 'Trade Winds Routes',
    description: 'Classic sailing experience with consistent regional weather',
    seed: 123,
    worldSize: 10000,
    difficulty: 'moderate',
    features: ['Variable winds', 'Dispersed islands', 'Racing available', 'Energy focus'],
  },
  'storm-archipelago': {
    id: 'storm-archipelago',
    name: 'Storm Archipelago',
    description: 'Challenging weather patterns and powerful wind zones',
    seed: 456,
    worldSize: 12000,
    difficulty: 'challenging',
    features: ['Storm paths', 'Fast winds', 'Scattered islands', 'High rewards'],
  },
}

export const useLandingStore = create<LandingState>((set) => ({
  gameStarted: false,
  selectedMap: null,
  playerName: 'Navigator',

  selectMap: (map: MapPreset) => {
    set({ selectedMap: map })
  },

  setPlayerName: (name: string) => {
    set({ playerName: name })
  },

  startGame: () => {
    set({ gameStarted: true })
  },

  resetToLanding: () => {
    set({ gameStarted: false, selectedMap: null })
    // Reset game state when returning to landing
    const { useGameStore } = require('./useGameStore')
    const gameStore = useGameStore.getState()
    if (gameStore.resetGameState) {
      gameStore.resetGameState()
    }
  },
}))
