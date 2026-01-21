import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { calculateApparentWind, WEATHER_PRESETS } from '../physics/WindSystem'
import { getSolarMultiplier, getCloudMultiplier, SOLAR_CONSTANT, SOLAR_PANEL_EFFICIENCY } from '../physics/EnergySystem'

export type Weather = 'clear' | 'cloudy' | 'trade-winds' | 'storm' | 'doldrums'
export type CameraMode = 'third-person' | 'first-person'
export type GameMode = 'sail' | 'build'

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

export interface BatteryState {
  currentCharge: number    // kWh stored
  chargePercent: number    // 0-100%
  capacity: number         // kWh total
}

export interface BoatDamageState {
  hullIntegrity: number    // 0-100%
  collisionCount: number
  lastCollisionTime: number | null
  lastCollisionIcebergId: string | null
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

  // Camera & Mode
  cameraMode: CameraMode
  gameMode: GameMode

  // Energy
  energy: EnergyState
  energyCredits: number    // Total EC earned
  battery: BatteryState    // Dynamic battery state

  // Player
  player: PlayerState

  // Boat damage (persistent across racing and free sailing)
  boatDamage: BoatDamageState

  // World state
  currentWindZone: string | null  // Wind zone ID if in one
  nearbyCheckpoints: string[]     // Checkpoint IDs in range
  distanceToCheckpoint: Record<string, number> // Checkpoint distances
  lastPassedCheckpoint: string | null // For race checkpoint tracking

  // Actions
  setTimeOfDay: (time: number) => void
  setWeather: (weather: Weather) => void
  setWind: (wind: Partial<WindState>) => void
  setThrottle: (throttle: number) => void
  setSteering: (steering: number) => void
  setCameraMode: (mode: CameraMode) => void
  toggleCameraMode: () => void
  setGameMode: (mode: GameMode) => void
  updatePlayerPosition: (delta: number, maxSpeed: number, turnRate: number) => void
  updateEnergy: (delta: number) => void
  updateCheckpointDetection: (checkpoints: any[]) => void
  tick: (delta: number, maxSpeed?: number, turnRate?: number) => void
  handleCollision: (icebergId: string, penetration: number, normalX: number, normalZ: number, icebergRadius: number) => void
  repairBoat: () => void
}

// Use weather presets from WindSystem (re-export for compatibility)
const weatherPresets = WEATHER_PRESETS

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
    gameMode: 'sail',

    energy: {
      turbineOutput: 0,
      solarOutput: 0,
      motorConsumption: 0,
      systemsConsumption: 0.2,
      netPower: 0,
    },

    energyCredits: 0,

    battery: {
      currentCharge: 75,  // kWh stored (starts at 75% of 100 kWh)
      chargePercent: 75,  // 0-100%
      capacity: 100,      // kWh total
    },

    player: {
      position: [0, 0, 150], // Spawn in front of marina pier
      rotation: 0, // Face away from the marina (180° rotated from previous)
      speed: 0,
      throttle: 0,
      steering: 0,
    },

    boatDamage: {
      hullIntegrity: 100,
      collisionCount: 0,
      lastCollisionTime: null,
      lastCollisionIcebergId: null,
    },

    currentWindZone: null,
    nearbyCheckpoints: [],
    distanceToCheckpoint: {},
    lastPassedCheckpoint: null,
    
    // Actions
    setTimeOfDay: (time) => {
      set((state) => {
        state.timeOfDay = Math.max(0, Math.min(1, time))
      })
    },
    
    setWeather: (weather) => {
      const preset = weatherPresets[weather]

      // Safety check: if weather preset doesn't exist, log warning and use trade-winds as fallback
      if (!preset) {
        console.warn(`Unknown weather type: "${weather}". Using 'trade-winds' as fallback.`)
        const fallbackPreset = weatherPresets['trade-winds']
        const [minSpeed, maxSpeed] = fallbackPreset.baseSpeed

        set((state) => {
          state.weather = 'trade-winds'
          state.wind.speed = minSpeed + Math.random() * (maxSpeed - minSpeed)
          state.wind.gustFactor = fallbackPreset.gustFactor
        })
        return
      }

      const [minSpeed, maxSpeed] = preset.baseSpeed

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

    setGameMode: (mode) => {
      set((state) => {
        state.gameMode = mode
      })
    },

    updateCheckpointDetection: (checkpoints) => {
      const { player } = get()
      const distances: Record<string, number> = {}
      const nearby: string[] = []

      for (const checkpoint of checkpoints) {
        const dx = checkpoint.position[0] - player.position[0]
        const dz = checkpoint.position[1] - player.position[2]
        const distance = Math.sqrt(dx * dx + dz * dz)

        distances[checkpoint.id] = distance

        // Checkpoints within 1.5x their radius are considered "nearby"
        if (distance <= checkpoint.radius * 1.5) {
          nearby.push(checkpoint.id)
        }
      }

      set((state) => {
        state.distanceToCheckpoint = distances
        state.nearbyCheckpoints = nearby
      })
    },

    updatePlayerPosition: (delta, maxSpeed, turnRate) => {
      set((state) => {
        const { player } = state

        // Calculate current speed based on throttle (knots to m/s: 1 knot ≈ 0.514 m/s)
        const targetSpeed = (player.throttle / 100) * maxSpeed

        // Realistic acceleration with force and drag
        // More thrust at low speeds (easier to accelerate), more drag at high speeds
        const speedRatio = Math.abs(player.speed) / maxSpeed
        const dragFactor = 1 + speedRatio * speedRatio * 2 // Quadratic drag
        const thrustFactor = Math.max(0.2, 1 - speedRatio * 0.5) // More effective thrust at low speeds

        // Acceleration rate: faster at low speeds, slower at high speeds
        // With 300% more power, acceleration should be much quicker
        const baseAcceleration = 6 // Increased from 2 to 6 (3x faster)
        const accelerationRate = baseAcceleration * thrustFactor / dragFactor

        // Apply acceleration/deceleration
        const speedDiff = targetSpeed - player.speed
        const accelerationAmount = speedDiff * Math.min(1, delta * accelerationRate)
        player.speed += accelerationAmount

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
      const state = get()
      const { wind, weather, timeOfDay, player } = state

      // Calculate apparent wind for turbine
      const boatHeading = (player.rotation * 180) / Math.PI
      const apparent = calculateApparentWind(wind.speed, wind.direction, player.speed, boatHeading)

      // Turbine output using apparent wind
      // P = 0.5 * ρ * A * v³ * Cp
      // Swept area: assume 8m height × 2m diameter = 16m²
      const sweptArea = 16
      const turbineEfficiency = 0.30 // VAWT efficiency
      const AIR_DENSITY = 1.225

      // Use apparent wind speed for power (VAWT benefits from apparent wind)
      const effectiveWindSpeed = Math.max(wind.speed, apparent.speed * 0.7)
      const turbineOutput = 0.5 * AIR_DENSITY * sweptArea * Math.pow(effectiveWindSpeed, 3) * turbineEfficiency / 1000 // kW

      // Cut-in and cut-out speeds
      const cutInSpeed = 2.5
      const cutOutSpeed = 25
      const safeTurbineOutput = effectiveWindSpeed < cutInSpeed ? 0 :
        effectiveWindSpeed > cutOutSpeed ? 0 : turbineOutput

      // Solar output using proper calculations
      const solarMultiplier = getSolarMultiplier(timeOfDay)
      const cloudMultiplier = getCloudMultiplier(weather)
      const panelArea = 8 // m² deck coverage
      const irradiance = SOLAR_CONSTANT * solarMultiplier * cloudMultiplier * 0.7

      const solarOutput = (irradiance * panelArea * SOLAR_PANEL_EFFICIENCY * 0.95) / 1000 // kW with inverter efficiency

      // Motor consumption: based on throttle (max 15kW)
      const motorEfficiency = 0.92
      const maxMotorPower = 15
      const motorConsumption = ((player.throttle / 100) * maxMotorPower) / motorEfficiency

      // Systems consumption
      const isNight = timeOfDay < 0.25 || timeOfDay > 0.75
      const systemsConsumption = 0.15 + (isNight ? 0.1 : 0)

      // Net power
      const netPower = safeTurbineOutput + solarOutput - motorConsumption - systemsConsumption

      // Earn energy credits (only for positive generation)
      const energyGenerated = (safeTurbineOutput + solarOutput) * delta / 3600 // kWh

      // Calculate battery change
      const energyDelta = netPower * delta / 3600 // kWh change
      const chargingEfficiency = netPower > 0 ? 0.95 : 1.0 // 95% efficiency when charging

      set((state) => {
        state.energy.turbineOutput = safeTurbineOutput
        state.energy.solarOutput = solarOutput
        state.energy.motorConsumption = motorConsumption
        state.energy.systemsConsumption = systemsConsumption
        state.energy.netPower = netPower
        state.energyCredits += energyGenerated

        // Update battery state
        let newCharge = state.battery.currentCharge + energyDelta * chargingEfficiency
        newCharge = Math.max(0, Math.min(state.battery.capacity, newCharge))
        state.battery.currentCharge = newCharge
        state.battery.chargePercent = (newCharge / state.battery.capacity) * 100
      })
    },
    
    tick: (delta, maxSpeed = 15, turnRate = 1) => {
      const { gameMode } = get()

      // Skip simulation updates in build mode
      if (gameMode === 'build') {
        return
      }

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

    handleCollision: (icebergId, penetration, normalX, normalZ, icebergRadius) => {
      const now = Date.now()
      const state = get()

      // Cooldown check - prevent multiple collisions with same iceberg
      if (
        state.boatDamage.lastCollisionIcebergId === icebergId &&
        state.boatDamage.lastCollisionTime &&
        now - state.boatDamage.lastCollisionTime < 2000
      ) {
        // Just push the boat away without registering new damage
        set((s) => {
          s.player.position[0] += normalX * penetration * 1.5
          s.player.position[2] += normalZ * penetration * 1.5
          // Reduce speed on collision
          s.player.speed *= 0.5
        })
        return
      }

      // Calculate damage based on speed and iceberg size
      const speedFactor = Math.max(1, state.player.speed / 5)
      const sizeFactor = Math.max(1, icebergRadius / 20)
      const baseDamage = 5 + penetration * 0.5
      const totalDamage = baseDamage * speedFactor * sizeFactor

      set((s) => {
        // Apply collision response - push boat away
        s.player.position[0] += normalX * penetration * 1.5
        s.player.position[2] += normalZ * penetration * 1.5

        // Bounce effect - reflect velocity somewhat
        const dotProduct = Math.sin(s.player.rotation) * normalX + Math.cos(s.player.rotation) * normalZ
        if (dotProduct < 0) {
          // Boat is moving toward iceberg, reflect
          s.player.rotation += Math.PI * 0.3 * (normalX > 0 ? 1 : -1)
        }

        // Reduce speed significantly on collision
        s.player.speed *= 0.3

        // Apply damage
        s.boatDamage.hullIntegrity = Math.max(0, s.boatDamage.hullIntegrity - totalDamage)
        s.boatDamage.collisionCount += 1
        s.boatDamage.lastCollisionTime = now
        s.boatDamage.lastCollisionIcebergId = icebergId
      })
    },

    repairBoat: () => {
      set((state) => {
        state.boatDamage.hullIntegrity = 100
        state.boatDamage.collisionCount = 0
        state.boatDamage.lastCollisionTime = null
        state.boatDamage.lastCollisionIcebergId = null
      })
    },
  }))
)
