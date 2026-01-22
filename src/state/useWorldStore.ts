import { create } from 'zustand';
import { WorldData, WorldDifficulty, generateWorld } from '../world/WorldGenerator';

export interface WorldState {
  // World data
  world: WorldData | null;
  discoveredPOIs: Set<string>;

  // Player location
  isDocked: boolean;
  dockedAt: string | null; // Marina ID

  // Actions
  initializeWorld: (seed: number, worldSize?: number, difficulty?: WorldDifficulty) => void;
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
    const world = generateWorld(seed, worldSize, difficulty);
    set({ world });
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
