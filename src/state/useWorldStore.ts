import { create } from 'zustand';
import { WorldData, WorldDifficulty, MapConfig, generateWorld } from '../world/WorldGenerator';

export interface WorldState {
  // World data
  world: WorldData | null;
  discoveredPOIs: Set<string>;

  // Player location
  isDocked: boolean;
  dockedAt: string | null; // Marina ID

  // Actions
  initializeWorld: (seed: number, worldSize?: number, difficulty?: WorldDifficulty) => void;
  initializeWorldFromConfig: (config: MapConfig) => void;
  discoverPOI: (poiId: string) => void;
  dock: (marinaId: string) => void;
  undock: () => void;
}

export const useWorldStore = create<WorldState>((set) => ({
  world: null,
  discoveredPOIs: new Set(),
  isDocked: false,
  dockedAt: null,

  initializeWorld: (seed: number, worldSize?: number, difficulty: WorldDifficulty = 'moderate') => {
    try {
      console.log('Generating world with seed:', seed, 'size:', worldSize, 'difficulty:', difficulty);
      const world = generateWorld(seed, worldSize, difficulty);
      console.log('World generated successfully:', world);
      set({ world });
    } catch (error) {
      console.error('Error generating world:', error);
      throw error;
    }
  },

  initializeWorldFromConfig: (config: MapConfig) => {
    try {
      console.log('Generating world from MapConfig:', config.name, 'seed:', config.seed);
      const world = generateWorld(config);
      console.log('World generated successfully:', world);
      set({ world });
    } catch (error) {
      console.error('Error generating world:', error);
      throw error;
    }
  },

  discoverPOI: (poiId: string) => {
    set((state) => {
      const updated = new Set(state.discoveredPOIs);
      updated.add(poiId);
      return { discoveredPOIs: updated };
    });
  },

  dock: (marinaId: string) => {
    set({ isDocked: true, dockedAt: marinaId });
  },

  undock: () => {
    set({ isDocked: false, dockedAt: null });
  },
}));
