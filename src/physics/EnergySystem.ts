/**
 * Energy System
 * Calculates power generation from turbines and solar, consumption, and battery management
 */

import type { TurbineConfig, SolarConfig, BatteryConfig, HullConfig } from '../state/useYachtStore'

// Physical constants
export const AIR_DENSITY = 1.225 // kg/m³ at sea level
export const SOLAR_CONSTANT = 1361 // W/m² at Earth's surface (max)
export const SOLAR_PANEL_EFFICIENCY = 0.22 // Modern panels ~22%

// Time of day solar multiplier (accounts for atmosphere and angle)
export function getSolarMultiplier(timeOfDay: number): number {
  // timeOfDay: 0 = midnight, 0.5 = noon, 1 = midnight
  // Convert to angle (0 at midnight, π at noon)
  const angle = timeOfDay * 2 * Math.PI

  // Sun elevation: negative at night, positive during day
  const elevation = Math.sin(angle - Math.PI / 2)

  // No solar at night
  if (elevation <= 0) return 0

  // Atmospheric attenuation (more atmosphere to pass through at low angles)
  const atmosphericPath = 1 / Math.max(elevation, 0.1)
  const attenuation = Math.exp(-0.1 * (atmosphericPath - 1))

  return elevation * attenuation
}

// Cloud cover effect on solar
export function getCloudMultiplier(weather: string): number {
  switch (weather) {
    case 'clear': return 1.0
    case 'cloudy': return 0.4
    case 'trade-winds': return 0.85
    case 'storm': return 0.15
    case 'doldrums': return 0.6
    default: return 0.8
  }
}

/**
 * Calculate turbine power output
 * Uses Betz limit and accounts for blade design
 */
export interface TurbinePowerResult {
  mechanicalPower: number  // kW (theoretical)
  electricalPower: number  // kW (after conversion losses)
  rpm: number              // Rotations per minute
  tipSpeedRatio: number    // TSR (optimal ~5-7 for VAWTs)
  efficiency: number       // Overall efficiency (0-0.593 Betz limit)
}

export function calculateTurbinePower(
  turbine: TurbineConfig,
  windSpeed: number,      // m/s
  _windDirection: number,  // degrees (reserved for future directional effects)
  _yachtHeading: number    // degrees (reserved for apparent wind calculation)
): TurbinePowerResult {
  // Swept area for VAWT: height × diameter
  const sweptArea = turbine.height * turbine.diameter

  // Blade design affects efficiency
  // Base efficiency for VAWT: 0.25-0.35 (vs 0.45 for HAWT)
  let baseEfficiency = 0.28

  // Blade count affects starting torque and max efficiency
  // 3 blades is optimal, 2 has lower efficiency, 4+ has diminishing returns
  const bladeCountFactor = turbine.bladeCount === 3 ? 1.0 :
    turbine.bladeCount === 2 ? 0.85 :
      turbine.bladeCount === 4 ? 0.95 :
        turbine.bladeCount === 5 ? 0.92 : 0.88

  // Twist affects efficiency (optimal ~45-60° for Gorlov-style)
  const twistOptimal = 52
  const twistFactor = 1 - Math.abs(turbine.twist - twistOptimal) / 180 * 0.3

  // Taper affects structural efficiency
  const taperFactor = 0.9 + turbine.taper * 0.1

  // Thickness affects drag (thinner = less drag but weaker)
  const thicknessFactor = 1 - (turbine.thickness - 0.08) * 0.5

  // Camber affects lift generation
  const camberFactor = 1 + Math.abs(turbine.camber) * 0.2

  // Combined blade efficiency
  const bladeEfficiency = baseEfficiency * bladeCountFactor * twistFactor * taperFactor * thicknessFactor * camberFactor

  // Cap at Betz limit (0.593)
  const efficiency = Math.min(0.593, bladeEfficiency)

  // Calculate tip speed ratio
  // TSR = (ω × R) / V where ω is angular velocity, R is radius, V is wind speed
  const radius = turbine.diameter / 2
  const optimalTSR = 4 + turbine.bladeCount * 0.5 // Higher blade count = lower optimal TSR

  // Calculate RPM for optimal TSR (simplified)
  const optimalOmega = (optimalTSR * windSpeed) / radius // rad/s
  const rpm = Math.min(200, (optimalOmega * 60) / (2 * Math.PI)) // Cap at 200 RPM

  // Power equation: P = 0.5 × ρ × A × v³ × Cp
  // Where Cp is power coefficient (efficiency)
  const mechanicalPower = 0.5 * AIR_DENSITY * sweptArea * Math.pow(windSpeed, 3) * efficiency / 1000 // kW

  // Generator efficiency (typically 85-95%)
  const generatorEfficiency = 0.90

  // Electrical power output
  const electricalPower = mechanicalPower * generatorEfficiency

  // Cut-in speed (minimum wind to generate power)
  const cutInSpeed = 2.5 // m/s
  const finalPower = windSpeed < cutInSpeed ? 0 : electricalPower

  // Cut-out speed (safety limit)
  const cutOutSpeed = 25 // m/s
  const safePower = windSpeed > cutOutSpeed ? 0 : finalPower

  return {
    mechanicalPower,
    electricalPower: safePower,
    rpm,
    tipSpeedRatio: optimalTSR,
    efficiency,
  }
}

/**
 * Calculate solar panel power output
 */
export interface SolarPowerResult {
  panelArea: number       // m²
  irradiance: number      // W/m² (actual)
  rawPower: number        // kW (before losses)
  electricalPower: number // kW (after all losses)
}

export function calculateSolarPower(
  solar: SolarConfig,
  hull: HullConfig,
  timeOfDay: number,
  weather: string
): SolarPowerResult {
  // Calculate available deck area for solar panels
  const deckArea = hull.length * hull.beam * 0.6 // 60% of deck usable
  const panelArea = deckArea * (solar.deckCoverage / 100)

  // Add turbine-integrated panels if enabled
  const turbinePanelArea = solar.turbineIntegrated ? 2 : 0 // ~2m² on turbine

  const totalPanelArea = panelArea + turbinePanelArea

  // Calculate irradiance
  const solarMultiplier = getSolarMultiplier(timeOfDay)
  const cloudMultiplier = getCloudMultiplier(weather)

  // Effective irradiance (W/m²)
  const irradiance = SOLAR_CONSTANT * solarMultiplier * cloudMultiplier * 0.7 // 0.7 for atmosphere

  // Raw power
  const rawPower = (irradiance * totalPanelArea * SOLAR_PANEL_EFFICIENCY) / 1000 // kW

  // Inverter efficiency
  const inverterEfficiency = 0.95

  // Temperature derating (hot panels lose efficiency)
  const tempDerating = 0.92 // Assume warm conditions

  // Final electrical power
  const electricalPower = rawPower * inverterEfficiency * tempDerating

  return {
    panelArea: totalPanelArea,
    irradiance,
    rawPower,
    electricalPower,
  }
}

/**
 * Calculate motor power consumption
 */
export interface MotorConsumptionResult {
  mechanicalPower: number  // kW (propulsion)
  electricalPower: number  // kW (from battery)
  efficiency: number
}

export function calculateMotorConsumption(
  throttle: number,        // 0-100%
  currentSpeed: number,    // knots
  _maxSpeed: number,       // knots (reserved for speed-based efficiency curves)
  hullDrag: number         // Newtons at test speed
): MotorConsumptionResult {
  // Motor specs (typical electric yacht motor)
  const maxMotorPower = 15 // kW
  const motorEfficiency = 0.92

  // Power needed: drag force × velocity
  const dragPower = (hullDrag * currentSpeed * 0.514) / 1000 // kW (drag × velocity)

  // Actual power draw based on throttle and drag
  const mechanicalPower = Math.min(maxMotorPower, dragPower * (throttle / 100))

  // Electrical consumption (higher than mechanical due to losses)
  const electricalPower = mechanicalPower / motorEfficiency

  return {
    mechanicalPower,
    electricalPower,
    efficiency: motorEfficiency,
  }
}

/**
 * Calculate systems consumption (always-on loads)
 */
export function calculateSystemsConsumption(
  hasCanopy: boolean,
  timeOfDay: number
): number {
  // Base systems: navigation, instruments, pumps
  let basePower = 0.15 // kW

  // Lights at night
  const isNight = timeOfDay < 0.25 || timeOfDay > 0.75
  if (isNight) {
    basePower += 0.1 // Navigation lights
  }

  // Canopy motor/AC if enabled
  if (hasCanopy) {
    basePower += 0.3
  }

  return basePower
}

/**
 * Battery management
 */
export interface BatteryState {
  currentCharge: number    // kWh
  chargePercent: number    // 0-100%
  chargingPower: number    // kW (positive = charging)
  timeToFull: number       // hours (Infinity if discharging)
  timeToEmpty: number      // hours (Infinity if charging)
  health: number           // 0-100%
}

export function updateBattery(
  battery: BatteryConfig,
  netPower: number,         // kW (positive = surplus, negative = deficit)
  deltaTime: number         // seconds
): BatteryState {
  // Current energy in kWh
  const currentEnergy = (battery.currentCharge / 100) * battery.capacity

  // Energy change in this time step
  const energyDelta = (netPower * deltaTime) / 3600 // kWh

  // Charging efficiency (lithium batteries ~95%)
  const chargingEfficiency = netPower > 0 ? 0.95 : 1.0

  // New energy level
  let newEnergy = currentEnergy + energyDelta * chargingEfficiency

  // Clamp to battery limits
  newEnergy = Math.max(0, Math.min(battery.capacity, newEnergy))

  // Calculate charge percentage
  const chargePercent = (newEnergy / battery.capacity) * 100

  // Time estimates
  const timeToFull = netPower > 0 ?
    (battery.capacity - newEnergy) / (netPower * chargingEfficiency) :
    Infinity

  const timeToEmpty = netPower < 0 ?
    newEnergy / Math.abs(netPower) :
    Infinity

  return {
    currentCharge: newEnergy,
    chargePercent,
    chargingPower: netPower,
    timeToFull,
    timeToEmpty,
    health: 100, // Simplified - no degradation model yet
  }
}

/**
 * Complete energy system update
 */
export interface EnergySystemState {
  turbine: TurbinePowerResult
  solar: SolarPowerResult
  motor: MotorConsumptionResult
  systems: number
  battery: BatteryState
  netPower: number
  energyCreditsEarned: number  // EC earned this tick
}

export function updateEnergySystem(
  turbine: TurbineConfig,
  solar: SolarConfig,
  battery: BatteryConfig,
  hull: HullConfig,
  windSpeed: number,
  windDirection: number,
  yachtHeading: number,
  timeOfDay: number,
  weather: string,
  throttle: number,
  currentSpeed: number,
  maxSpeed: number,
  hullDrag: number,
  deltaTime: number
): EnergySystemState {
  // Calculate all power sources and sinks
  const turbineResult = calculateTurbinePower(turbine, windSpeed, windDirection, yachtHeading)
  const solarResult = calculateSolarPower(solar, hull, timeOfDay, weather)
  const motorResult = calculateMotorConsumption(throttle, currentSpeed, maxSpeed, hullDrag)
  const systemsConsumption = calculateSystemsConsumption(solar.canopyEnabled, timeOfDay)

  // Net power balance
  const totalGeneration = turbineResult.electricalPower + solarResult.electricalPower
  const totalConsumption = motorResult.electricalPower + systemsConsumption
  const netPower = totalGeneration - totalConsumption

  // Update battery
  const batteryState = updateBattery(battery, netPower, deltaTime)

  // Energy credits: 1 EC = 1 kWh generated
  const energyCreditsEarned = (totalGeneration * deltaTime) / 3600 // kWh

  return {
    turbine: turbineResult,
    solar: solarResult,
    motor: motorResult,
    systems: systemsConsumption,
    battery: batteryState,
    netPower,
    energyCreditsEarned,
  }
}
