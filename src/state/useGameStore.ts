import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type Weather = 'clear' | 'cloudy' | 'trade-winds' | 'storm' | 'doldrums'
export type CameraMode = 'third-person' | 'first-person'

export interface WindState {
  direction: number    // 0-360 degrees (0 = North)
  speed: number        // m/s (0-25)
  gustFactor: number   // 0-1 (random variation)
}

export interface EnergyState {
  turbineOutput: number    // kW
  solarOutput: number      // kW
  motorConsumption: number // kW
  systemsConsumption: number // kW
  netPower: number         // kW (positive = charging)
}

export interface PlayerState {
  position: [number, number, number]
  rotation: number         // Y-axis rotation (radians)
  speed: number            // knots
  throttle: number         // 0-100%
  steering: number         // -1 to 1 (left to right)
}

interface GameState {
  // Time
  timeOfDay: number        // 0-1 (0 = midnight, 0.5 = noon)
  gameTime: number         // Seconds since start

  // Weather & Wind
  weather: Weather
  wind: WindState

  // Camera
  cameraMode: CameraMode

  // Energy
  energy: EnergyState
  energyCredits: number    // Total EC earned

  // Player
  player: PlayerState
  
  // Actions
  setTimeOfDay: (time: number) => void
  setWeather: (weather: Weather) => void
  setWind: (wind: Partial<WindState>) => void
  setThrottle: (throttle: number) => void
  setSteering: (steering: number) => void
  setCameraMode: (mode: CameraMode) => void
  toggleCameraMode: () => void
  updatePlayerPosition: (delta: number, maxSpeed: number, turnRate: number) => void
  updateEnergy: (delta: number) => void
  tick: (delta: number, maxSpeed?: number, turnRate?: number) => void
}

// Weather presets
const weatherPresets: Record<Weather, { windSpeed: [number, number], gustFactor: number }> = {
  'clear': { windSpeed: [2, 6], gustFactor: 0.1 },
  'cloudy': { windSpeed: [4, 10], gustFactor: 0.2 },
  'trade-winds': { windSpeed: [8, 15], gustFactor: 0.15 },
  'storm': { windSpeed: [15, 25], gustFactor: 0.5 },
  'doldrums': { windSpeed: [0, 2], gustFactor: 0.05 },
}

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    // Initial state
    timeOfDay: 0.6, // Late afternoon
    gameTime: 0,
    
    weather: 'trade-winds',
    wind: {
      direction: 45,  // NE wind
      speed: 10,
      gustFactor: 0.15,
    },

    cameraMode: 'third-person',
    
    energy: {
      turbineOutput: 0,
      solarOutput: 0,
      motorConsumption: 0,
      systemsConsumption: 0.2,
      netPower: 0,
    },
    
    energyCredits: 0,
    
    player: {
      position: [0, 0, 0],
      rotation: 0,
      speed: 0,
      throttle: 0,
      steering: 0,
    },
    
    // Actions
    setTimeOfDay: (time) => {
      set((state) => {
        state.timeOfDay = Math.max(0, Math.min(1, time))
      })
    },
    
    setWeather: (weather) => {
      const preset = weatherPresets[weather]
      const [minSpeed, maxSpeed] = preset.windSpeed
      
      set((state) => {
        state.weather = weather
        state.wind.speed = minSpeed + Math.random() * (maxSpeed - minSpeed)
        state.wind.gustFactor = preset.gustFactor
      })
    },
    
    setWind: (wind) => {
      set((state) => {
        Object.assign(state.wind, wind)
      })
    },
    
    setThrottle: (throttle) => {
      set((state) => {
        state.player.throttle = Math.max(0, Math.min(100, throttle))
      })
    },

    setSteering: (steering) => {
      set((state) => {
        state.player.steering = Math.max(-1, Math.min(1, steering))
      })
    },

    setCameraMode: (mode) => {
      set((state) => {
        state.cameraMode = mode
      })
    },

    toggleCameraMode: () => {
      set((state) => {
        state.cameraMode = state.cameraMode === 'third-person' ? 'first-person' : 'third-person'
      })
    },

    updatePlayerPosition: (delta, maxSpeed, turnRate) => {
      set((state) => {
        const { player } = state

        // Calculate current speed based on throttle (knots to m/s: 1 knot ≈ 0.514 m/s)
        const targetSpeed = (player.throttle / 100) * maxSpeed
        // Gradually accelerate/decelerate
        player.speed = player.speed + (targetSpeed - player.speed) * Math.min(1, delta * 2)

        // Apply steering (only when moving)
        if (Math.abs(player.speed) > 0.1) {
          const turnAmount = player.steering * turnRate * delta * (player.speed / maxSpeed)
          player.rotation += turnAmount
        }

        // Convert speed from knots to m/s for position update
        const speedMs = player.speed * 0.514

        // Update position based on rotation and speed
        // Forward is -Z in Three.js convention
        player.position[0] += Math.sin(player.rotation) * speedMs * delta
        player.position[2] += Math.cos(player.rotation) * speedMs * delta
      })
    },
    
    updateEnergy: (delta) => {
      // This gets called with yacht config from physics system
      // For now, use simplified calculations
      const state = get()
      const { wind, timeOfDay, player } = state
      
      // Turbine output: P = 0.5 * ρ * A * v³ * η
      // Simplified: assume 2m² swept area, 25% efficiency
      const turbineOutput = 0.5 * 1.225 * 2 * Math.pow(wind.speed, 3) * 0.25 / 1000 // kW
      
      // Solar output: based on time of day (peak at noon)
      const sunAngle = Math.sin(timeOfDay * Math.PI) // 0 at midnight, 1 at noon
      const solarOutput = Math.max(0, sunAngle * 1.5) // Max 1.5 kW
      
      // Motor consumption: based on throttle (max 5kW)
      const motorConsumption = (player.throttle / 100) * 5
      
      // Net power
      const netPower = turbineOutput + solarOutput - motorConsumption - 0.2 // 0.2 kW systems
      
      // Earn energy credits (only for positive generation)
      const energyGenerated = (turbineOutput + solarOutput) * delta / 3600 // kWh
      
      set((state) => {
        state.energy.turbineOutput = turbineOutput
        state.energy.solarOutput = solarOutput
        state.energy.motorConsumption = motorConsumption
        state.energy.netPower = netPower
        state.energyCredits += energyGenerated
      })
    },
    
    tick: (delta, maxSpeed = 15, turnRate = 1) => {
      // Update player position first
      get().updatePlayerPosition(delta, maxSpeed, turnRate)

      set((state) => {
        // Advance game time
        state.gameTime += delta

        // Slowly cycle time of day (1 game day = 20 real minutes)
        state.timeOfDay = (state.timeOfDay + delta / 1200) % 1

        // Random wind gusts
        const gustOffset = (Math.random() - 0.5) * 2 * state.wind.gustFactor
        state.wind.speed = Math.max(0, state.wind.speed + gustOffset * delta)

        // Slowly drift wind direction
        state.wind.direction = (state.wind.direction + (Math.random() - 0.5) * 2 * delta) % 360
      })

      // Update energy calculations
      get().updateEnergy(delta)
    },
  }))
)
