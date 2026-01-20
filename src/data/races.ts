import { RaceConfig } from '../state/useRaceStore';

export const RACE_CONFIGS: Record<string, RaceConfig> = {
  'bay-circuit': {
    id: 'bay-circuit',
    name: 'Bay Circuit Race',
    laps: 3,
    difficultyMultiplier: 1.0,
    checkpoints: [
      {
        id: 'bay-cp-1',
        position: [1500, 1500],
        radius: 300,
        order: 1,
      },
      {
        id: 'bay-cp-2',
        position: [1500, -1500],
        radius: 300,
        order: 2,
      },
      {
        id: 'bay-cp-3',
        position: [-1500, -1500],
        radius: 300,
        order: 3,
      },
      {
        id: 'bay-cp-4',
        position: [-1500, 1500],
        radius: 300,
        order: 4,
      },
    ],
  },
  'island-hopper': {
    id: 'island-hopper',
    name: 'Island Hopper Challenge',
    laps: 2,
    difficultyMultiplier: 1.3,
    checkpoints: [
      {
        id: 'island-cp-1',
        position: [2000, 0],
        radius: 250,
        order: 1,
      },
      {
        id: 'island-cp-2',
        position: [1000, 1732],
        radius: 250,
        order: 2,
      },
      {
        id: 'island-cp-3',
        position: [-1000, 1732],
        radius: 250,
        order: 3,
      },
      {
        id: 'island-cp-4',
        position: [-2000, 0],
        radius: 250,
        order: 4,
      },
      {
        id: 'island-cp-5',
        position: [-1000, -1732],
        radius: 250,
        order: 5,
      },
      {
        id: 'island-cp-6',
        position: [1000, -1732],
        radius: 250,
        order: 6,
      },
    ],
  },
  'open-ocean': {
    id: 'open-ocean',
    name: 'Open Ocean Marathon',
    laps: 1,
    difficultyMultiplier: 1.6,
    checkpoints: [
      {
        id: 'ocean-cp-1',
        position: [3000, 2000],
        radius: 400,
        order: 1,
      },
      {
        id: 'ocean-cp-2',
        position: [3000, -2000],
        radius: 400,
        order: 2,
      },
      {
        id: 'ocean-cp-3',
        position: [0, -3500],
        radius: 400,
        order: 3,
      },
      {
        id: 'ocean-cp-4',
        position: [-3000, -2000],
        radius: 400,
        order: 4,
      },
      {
        id: 'ocean-cp-5',
        position: [-3000, 2000],
        radius: 400,
        order: 5,
      },
    ],
  },
  'speed-trial': {
    id: 'speed-trial',
    name: 'Speed Trial',
    laps: 1,
    difficultyMultiplier: 0.8,
    checkpoints: [
      {
        id: 'speed-cp-1',
        position: [1000, 0],
        radius: 250,
        order: 1,
      },
      {
        id: 'speed-cp-2',
        position: [2000, 0],
        radius: 250,
        order: 2,
      },
      {
        id: 'speed-cp-3',
        position: [3000, 0],
        radius: 250,
        order: 3,
      },
      {
        id: 'speed-cp-4',
        position: [4000, 0],
        radius: 250,
        order: 4,
      },
    ],
  },
};

export function getRaceConfig(raceId: string): RaceConfig | null {
  return RACE_CONFIGS[raceId] || null;
}

export function getAllRaces(): RaceConfig[] {
  return Object.values(RACE_CONFIGS);
}
