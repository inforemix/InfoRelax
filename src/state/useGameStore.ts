import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { calculateApparentWind, WEATHER_PRESETS } from '../physics/WindSystem'
import { getSolarMultiplier, getCloudMultiplier, SOLAR_CONSTANT, SOLAR_PANEL_EFFICIENCY } from '../physics/EnergySystem'
import { useYachtStore } from './useYachtStore'

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

  // Auto-dock
  isAutoDocking: boolean
  autoDockTarget: [number, number] | null

  // Burst speed
  isBursting: boolean
  burstCooldown: number  // seconds
  burstEnergyCost: number  // kW during burst

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
  repairBoat: () => boolean
  setAutoDock: (enabled: boolean, target?: [number, number]) => void
  resetGameState: () => void
  activateBurst: () => void
}

// Use weather presets from WindSystem (re-export for compatibility)
const weatherPresets = WEATHER_PRESETS

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    // Initial state
    timeOfDay: 0.52, // Late afternoon
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
      currentCharge: 50,  // kWh stored (starts at 50% of 100 kWh)
      chargePercent: 50,  // 0-100%
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

    // Auto-dock
    isAutoDocking: false,
    autoDockTarget: null,

    // Burst speed
    isBursting: false,
    burstCooldown: 0,
    burstEnergyCost: 25,  // 25 kW burst consumption

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
      const gameState = get()

      // Get engine tier from yacht store to adjust max speed
      const yachtStore = useYachtStore.getState()
      const engineMultiplier = yachtStore.currentYacht.engine?.powerMultiplier || 1
      const adjustedMaxSpeed = maxSpeed * engineMultiplier

      // Handle auto-dock navigation
      if (gameState.isAutoDocking && gameState.autoDockTarget) {
        const target = gameState.autoDockTarget
        const pos = gameState.player.position

        // Calculate direction to target
        const dx = target[0] - pos[0]
        const dz = target[1] - pos[2]
        const distToTarget = Math.sqrt(dx * dx + dz * dz)

        // If we're close enough, stop auto-docking
        if (distToTarget < 50) {
          set((s) => {
            s.isAutoDocking = false
            s.autoDockTarget = null
            s.player.throttle = 0
            s.player.steering = 0
          })
          return
        }

        // Calculate target angle (angle from boat to target)
        const targetAngle = Math.atan2(dx, dz)

        // Calculate angle difference (normalize to [-PI, PI])
        let angleDiff = targetAngle - gameState.player.rotation
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

        // Set steering based on angle difference (user can still adjust throttle)
        const steeringAmount = Math.max(-1, Math.min(1, angleDiff * 2))

        set((s) => {
          s.player.steering = steeringAmount
          // Keep user's throttle setting - only update steering for navigation
        })
      }

      set((state) => {
        const { player } = state

        // Apply burst speed boost (50% increase)
        const burstMultiplier = state.isBursting ? 1.5 : 1.0

        // Calculate current speed based on throttle (knots to m/s: 1 knot ≈ 0.514 m/s)
        const targetSpeed = (player.throttle / 100) * adjustedMaxSpeed * burstMultiplier

        // Realistic acceleration with force and drag
        // More thrust at low speeds (easier to accelerate), more drag at high speeds
        const speedRatio = Math.abs(player.speed) / adjustedMaxSpeed
        const dragFactor = 1 + speedRatio * speedRatio * 2 // Quadratic drag
        const thrustFactor = Math.max(0.2, 1 - speedRatio * 0.5) // More effective thrust at low speeds

        // Acceleration rate: faster at low speeds, slower at high speeds
        // Base acceleration scaled by engine multiplier
        const baseAcceleration = 2 * engineMultiplier
        const accelerationRate = baseAcceleration * thrustFactor / dragFactor

        // Apply acceleration/deceleration
        const speedDiff = targetSpeed - player.speed
        const accelerationAmount = speedDiff * Math.min(1, delta * accelerationRate)
        player.speed += accelerationAmount

        // Apply steering (only when moving)
        if (Math.abs(player.speed) > 0.1) {
          const turnAmount = player.steering * turnRate * delta * (player.speed / adjustedMaxSpeed)
          player.rotation += turnAmount
        }

        // Normalize rotation to [-PI, PI] to prevent precision issues and map flipping
        while (player.rotation > Math.PI) player.rotation -= Math.PI * 2
        while (player.rotation < -Math.PI) player.rotation += Math.PI * 2

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
      // Get engine tier from yacht store
      const yachtStore = useYachtStore.getState()
      const engineMultiplier = yachtStore.currentYacht.engine?.powerMultiplier || 1

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

      // Motor consumption: based on throttle and engine tier (base 15kW, scaled by tier)
      const motorEfficiency = 0.92
      const baseMaxMotorPower = 15
      const maxMotorPower = baseMaxMotorPower * engineMultiplier
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

        // Update burst cooldown
        if (state.burstCooldown > 0) {
          state.burstCooldown = Math.max(0, state.burstCooldown - delta)
        }

        // Drain battery during burst
        if (state.isBursting) {
          const burstEnergyDrain = state.burstEnergyCost * delta / 3600 // Convert kW to kWh
          state.battery.currentCharge = Math.max(0, state.battery.currentCharge - burstEnergyDrain)
          state.battery.chargePercent = (state.battery.currentCharge / state.battery.capacity) * 100
          // Cancel burst if battery runs out
          if (state.battery.chargePercent <= 0) {
            state.isBursting = false
          }
        }
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
      const state = get()
      // Repair costs 20 kWh (20% of 100 kWh battery)
      const repairCost = 20
      if (state.battery.currentCharge >= repairCost) {
        set((s) => {
          // Deduct repair cost from battery
          s.battery.currentCharge -= repairCost
          s.battery.chargePercent = (s.battery.currentCharge / s.battery.capacity) * 100

          // Restore hull integrity
          s.boatDamage.hullIntegrity = 100
          s.boatDamage.collisionCount = 0
          s.boatDamage.lastCollisionTime = null
          s.boatDamage.lastCollisionIcebergId = null
        })
        return true
      }
      return false // Not enough battery
    },

    setAutoDock: (enabled, target) => {
      set((state) => {
        state.isAutoDocking = enabled
        state.autoDockTarget = enabled && target ? target : null
        // When auto-dock is enabled, set full throttle to return quickly
        if (enabled) {
          state.player.throttle = 100
        }
      })
    },

    resetGameState: () => {
      set((state) => {
        // Reset battery to 50%
        state.battery.currentCharge = 50
        state.battery.chargePercent = 50

        // Reset boat damage
        state.boatDamage.hullIntegrity = 100
        state.boatDamage.collisionCount = 0
        state.boatDamage.lastCollisionTime = null
        state.boatDamage.lastCollisionIcebergId = null

        // Reset player position to spawn
        state.player.position = [0, 0, 150]
        state.player.rotation = 0
        state.player.speed = 0
        state.player.throttle = 0
        state.player.steering = 0

        // Reset auto-dock
        state.isAutoDocking = false
        state.autoDockTarget = null

        // Reset burst
        state.isBursting = false
        state.burstCooldown = 0

        // Reset time of day to default afternoon
        state.timeOfDay = 0.52
      })
    },

    activateBurst: () => {
      const state = get()
      // Only activate if not on cooldown and has enough battery
      if (state.burstCooldown <= 0 && state.battery.chargePercent > 10) {
        set((s) => {
          s.isBursting = true
          s.burstCooldown = 5  // 5 second cooldown
        })
        // Burst lasts for 2 seconds
        setTimeout(() => {
          set((s) => {
            s.isBursting = false
          })
        }, 2000)
      }
    },
  }))
)
