import { create } from 'zustand';

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

  // Leaderboard
  leaderboard: Array<{
    rank: number;
    playerName: string;
    bestTime: number;
    totalTime: number;
    completedLaps: number;
    personalBest: number;
  }>;

  // Actions
  startRace: (config: RaceConfig, playerName: string) => void;
  passCheckpoint: (checkpointId: string) => void;
  completeLap: () => void;
  finishRace: () => void;
  abandonRace: () => void;
  updateLeaderboard: (entry: any) => void;
}

export const useRaceStore = create<RaceState>((set) => ({
  currentRace: null,
  isRacing: false,
  raceStartTime: null,
  currentLap: 1,
  currentCheckpoint: 0,
  lapTimes: [],
  leaderboard: [],

  startRace: (config: RaceConfig, _playerName: string) => {
    set({
      currentRace: config,
      isRacing: true,
      raceStartTime: Date.now(),
      currentLap: 1,
      currentCheckpoint: 0,
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
    set({ isRacing: false });
  },

  abandonRace: () => {
    set({
      currentRace: null,
      isRacing: false,
      raceStartTime: null,
      currentLap: 1,
      currentCheckpoint: 0,
      lapTimes: [],
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
}));
