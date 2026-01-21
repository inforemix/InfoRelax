import { create } from 'zustand';

export type RaceDifficulty = 'peaceful' | 'moderate' | 'challenging';

export interface Checkpoint {
  id: string;
  position: [number, number];
  radius: number;
  order: number;
}

export interface RaceConfig {
  id: string;
  name: string;
  checkpoints: Checkpoint[];
  laps: number;
  difficultyMultiplier: number; // Affects wind conditions
}

export interface BoatDamage {
  hullIntegrity: number; // 0-100%
  collisionCount: number;
  lastCollisionTime: number | null;
}

export interface LapData {
  lapNumber: number;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  checkpointTimes: Record<string, number>; // checkpoint id -> time when passed
}

export interface RaceState {
  // Active race
  currentRace: RaceConfig | null;
  isRacing: boolean;
  raceStartTime: number | null;
  currentLap: number;
  currentCheckpoint: number;
  lapTimes: LapData[];

  // Difficulty and damage
  difficulty: RaceDifficulty;
  damage: BoatDamage;
  raceFinished: boolean;
  finishTime: number | null;

  // Leaderboard
  leaderboard: Array<{
    rank: number;
    playerName: string;
    bestTime: number;
    totalTime: number;
    completedLaps: number;
    personalBest: number;
    collisions: number;
    finalIntegrity: number;
  }>;

  // Actions
  setDifficulty: (difficulty: RaceDifficulty) => void;
  startRace: (config: RaceConfig, playerName: string) => void;
  passCheckpoint: (checkpointId: string) => void;
  completeLap: () => void;
  finishRace: () => void;
  abandonRace: () => void;
  updateLeaderboard: (entry: any) => void;
  registerCollision: (damageAmount: number) => void;
}

export const useRaceStore = create<RaceState>((set, get) => ({
  currentRace: null,
  isRacing: false,
  raceStartTime: null,
  currentLap: 1,
  currentCheckpoint: 0,
  lapTimes: [],
  leaderboard: [],
  difficulty: 'moderate',
  damage: {
    hullIntegrity: 100,
    collisionCount: 0,
    lastCollisionTime: null,
  },
  raceFinished: false,
  finishTime: null,

  setDifficulty: (difficulty: RaceDifficulty) => {
    set({ difficulty });
  },

  startRace: (config: RaceConfig, _playerName: string) => {
    set({
      currentRace: config,
      isRacing: true,
      raceStartTime: Date.now(),
      currentLap: 1,
      currentCheckpoint: 0,
      raceFinished: false,
      finishTime: null,
      damage: {
        hullIntegrity: 100,
        collisionCount: 0,
        lastCollisionTime: null,
      },
      lapTimes: [
        {
          lapNumber: 1,
          startTime: Date.now(),
          endTime: null,
          duration: null,
          checkpointTimes: {},
        },
      ],
    });
  },

  passCheckpoint: (checkpointId: string) => {
    set((state) => {
      if (!state.isRacing || state.lapTimes.length === 0) return state;

      const currentLapData = state.lapTimes[state.lapTimes.length - 1];
      if (currentLapData.checkpointTimes[checkpointId]) {
        return state; // Already passed this checkpoint in this lap
      }

      const updatedLapTimes = [...state.lapTimes];
      updatedLapTimes[updatedLapTimes.length - 1] = {
        ...currentLapData,
        checkpointTimes: {
          ...currentLapData.checkpointTimes,
          [checkpointId]: Date.now(),
        },
      };

      return {
        lapTimes: updatedLapTimes,
        currentCheckpoint: state.currentCheckpoint + 1,
      };
    });
  },

  completeLap: () => {
    set((state) => {
      if (!state.isRacing || !state.currentRace) return state;

      const currentLapData = state.lapTimes[state.lapTimes.length - 1];
      const duration = Date.now() - currentLapData.startTime;

      const updatedLapTimes = [...state.lapTimes];
      updatedLapTimes[updatedLapTimes.length - 1] = {
        ...currentLapData,
        endTime: Date.now(),
        duration,
      };

      const newLap = state.currentLap + 1;
      const isFinished = newLap > state.currentRace.laps;

      if (isFinished) {
        return {
          lapTimes: updatedLapTimes,
          isRacing: false,
        };
      }

      // Add new lap
      updatedLapTimes.push({
        lapNumber: newLap,
        startTime: Date.now(),
        endTime: null,
        duration: null,
        checkpointTimes: {},
      });

      return {
        lapTimes: updatedLapTimes,
        currentLap: newLap,
        currentCheckpoint: 0,
      };
    });
  },

  finishRace: () => {
    const state = get();
    set({
      isRacing: false,
      raceFinished: true,
      finishTime: state.raceStartTime ? Date.now() - state.raceStartTime : null,
    });
  },

  abandonRace: () => {
    set({
      currentRace: null,
      isRacing: false,
      raceStartTime: null,
      currentLap: 1,
      currentCheckpoint: 0,
      lapTimes: [],
      raceFinished: false,
      finishTime: null,
      damage: {
        hullIntegrity: 100,
        collisionCount: 0,
        lastCollisionTime: null,
      },
    });
  },

  updateLeaderboard: (entry: any) => {
    set((state) => {
      const updated = [...state.leaderboard];
      const existingIndex = updated.findIndex((e) => e.playerName === entry.playerName);

      if (existingIndex >= 0) {
        // Update existing entry with better time
        if (entry.bestTime < updated[existingIndex].bestTime) {
          updated[existingIndex] = entry;
        }
      } else {
        // Add new entry
        updated.push(entry);
      }

      // Sort by best time
      updated.sort((a, b) => a.bestTime - b.bestTime);

      // Update ranks
      updated.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return { leaderboard: updated };
    });
  },

  registerCollision: (damageAmount: number) => {
    const state = get();
    if (!state.isRacing) return;

    // Cooldown to prevent multiple registrations
    const now = Date.now();
    if (state.damage.lastCollisionTime && now - state.damage.lastCollisionTime < 1000) {
      return;
    }

    // Damage based on difficulty
    const difficultyMultiplier = {
      peaceful: 0.5,
      moderate: 1.0,
      challenging: 1.5,
    };

    const actualDamage = damageAmount * difficultyMultiplier[state.difficulty];
    const newIntegrity = Math.max(0, state.damage.hullIntegrity - actualDamage);

    set({
      damage: {
        hullIntegrity: newIntegrity,
        collisionCount: state.damage.collisionCount + 1,
        lastCollisionTime: now,
      },
    });

    // Auto-fail race if hull integrity is 0
    if (newIntegrity <= 0) {
      set({ isRacing: false, raceFinished: true });
    }
  },
}));
