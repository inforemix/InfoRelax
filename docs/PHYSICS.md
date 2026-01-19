# Physics System Documentation

## Overview

InfoRelax uses a "feels right" simplified physics model designed for intuitive gameplay rather than engineering-grade simulation. All formulas below are approximations that produce believable behavior.

---

## Wind System

### Wind Vector
```
Wind = {
  direction: 0-360 degrees (0 = North, 90 = East)
  speed: 0-25 m/s
  gustFactor: 0-1 (random variation amplitude)
}
```

### Weather Presets

| Weather | Wind Speed (m/s) | Gust Factor |
|---------|------------------|-------------|
| Clear | 2-6 | 0.1 |
| Cloudy | 4-10 | 0.2 |
| Trade Winds | 8-15 | 0.15 |
| Storm | 15-25 | 0.5 |
| Doldrums | 0-2 | 0.05 |

### Wind Updates
```typescript
// Each frame:
wind.speed += (random(-1, 1) * gustFactor * deltaTime)
wind.direction += (random(-1, 1) * 2 * deltaTime) // Slow drift
```

---

## Turbine Power Calculation

### Basic Formula (Simplified Betz)
```
P = 0.5 × ρ × A × v³ × η

Where:
  P = Power output (Watts)
  ρ = Air density (1.225 kg/m³ at sea level)
  A = Swept area (m²)
  v = Wind speed (m/s)
  η = Efficiency factor (0.1 to 0.4)
```

### Swept Area
```
For VAWT: A = height × diameter
```

### Efficiency Factor (η)
Base efficiency depends on turbine design and blade shape:

| Factor | Effect |
|--------|--------|
| Turbine Type | Helix: ×1.0, Infinity: ×1.1, Ribbon: ×0.9 |
| Blade Count | 2: ×0.8, 3: ×1.0, 4: ×1.05, 5: ×1.08, 6: ×1.1 |
| Blade Shape | Custom via Kaleidoscope (0.8 to 1.2) |
| Material | Solar: ×0.95, Chrome: ×1.0, LED: ×0.98 |

### Example Calculation
```
3-blade helix turbine, 4m height × 2m diameter, 10 m/s wind

A = 4 × 2 = 8 m²
η = 0.25 × 1.0 (helix) × 1.0 (3 blades) = 0.25

P = 0.5 × 1.225 × 8 × 10³ × 0.25
P = 0.5 × 1.225 × 8 × 1000 × 0.25
P = 1,225 W = 1.225 kW
```

---

## Solar Panel Output

### Basic Formula
```
P = A × η × I × cos(θ)

Where:
  P = Power output (Watts)
  A = Panel area (m²)
  η = Panel efficiency (0.18 for typical panels)
  I = Solar irradiance (1000 W/m² at peak)
  θ = Angle from sun
```

### Time of Day Factor
```typescript
// timeOfDay: 0 = midnight, 0.5 = noon, 1 = midnight
sunAngle = sin(timeOfDay × PI)
effectiveIrradiance = 1000 × max(0, sunAngle)
```

### Deck Coverage
```
panelArea = deckArea × (deckCoverage / 100)
deckArea = hullLength × hullBeam × 0.5 // Approximate usable deck
```

### Example Calculation
```
12m × 4m hull, 60% coverage, noon

deckArea = 12 × 4 × 0.5 = 24 m²
panelArea = 24 × 0.6 = 14.4 m²
P = 14.4 × 0.18 × 1000 × 1.0
P = 2,592 W = 2.6 kW
```

---

## Hull Physics

### Drag Coefficient
```
Cd = baseDrag × (beam / length) × hullTypeMod

Hull Type Modifiers:
  Monohull: 1.0
  Catamaran: 0.85
  Trimaran: 0.75
  Hydrofoil: 0.5 (when foiling)
```

### Stability
```
stability = beam × draft × hullTypeMod × 10

Higher stability = less roll, slower turns
```

### Speed
```
// Simplified: drag determines max speed
maxSpeed = sqrt(motorPower / dragCoefficient) × speedScale

// Actual speed approaches max based on throttle
currentSpeed += (targetSpeed - currentSpeed) × acceleration × deltaTime
```

### Turning
```
turnRate = baseTurnRate × (1 / hullLength) × (1 / (1 + speed/10))

// Longer hulls turn slower
// Higher speed reduces turn rate
```

---

## Energy Flow

### Power Balance
```
netPower = (turbineOutput + solarOutput + regenBraking) 
         - (motorConsumption + systemsDraw + modulesDraw)
```

### Battery Dynamics
```typescript
// Charge rate limited
maxChargeRate = batteryCapacity × 0.5 // C-rate of 0.5

if (netPower > 0) {
  // Charging
  chargeRate = min(netPower, maxChargeRate)
  currentCharge += chargeRate × deltaTime / 3600 // kWh
}
else {
  // Discharging
  currentCharge += netPower × deltaTime / 3600
}

currentCharge = clamp(currentCharge, 0, batteryCapacity)
chargePercent = (currentCharge / batteryCapacity) × 100
```

### Energy Credits
```
EC earned = totalGenerated (kWh)

// Only generation counts, not net power
energyCredits += (turbineOutput + solarOutput) × deltaTime / 3600
```

---

## Motor System

### Consumption
```
motorConsumption = maxMotorPower × (throttle / 100)

// Typical maxMotorPower: 5-10 kW depending on hull size
maxMotorPower = hullLength × 0.5 // kW
```

### Thrust
```
thrust = motorPower × propellerEfficiency
propellerEfficiency = 0.7 // Typical for electric props
```

---

## Simplified Boat Movement

### Forces
```typescript
// 1. Motor thrust
thrustForce = thrust × throttlePercent × forwardVector

// 2. Wind force on turbine (reaction force)
windForce = windVector × (turbineDragCoefficient × 0.1)

// 3. Drag force
dragForce = -velocity × dragCoefficient × speed

// 4. Net force
netForce = thrustForce + windForce + dragForce

// 5. Update position
velocity += netForce × deltaTime
position += velocity × deltaTime
```

### Wave Motion (Visual Only)
```typescript
// Vertical bob
yOffset = sin(time × bobSpeed) × waveHeight

// Roll
roll = sin(time × rollSpeed) × maxRoll

// Pitch
pitch = sin(time × pitchSpeed) × maxPitch
```

---

## Range Calculation

### Cruise Estimate
```
avgConsumption = motorPower × 0.5 // 50% throttle cruise
avgGeneration = (solarOutput × 0.5) + (turbineOutput × 0.7)
netConsumption = max(0.5, avgConsumption - avgGeneration)

range = (batteryCapacity × chargePercent / 100) / netConsumption × cruiseSpeed
```

---

## Kaleidoscope Blade Analysis

### Shape Efficiency Scoring
When a player draws a blade profile, we analyze:

1. **Camber** - Curve of the blade
   - Optimal: 8-15% camber
   - Score: 0.8 to 1.2

2. **Thickness** - Blade width
   - Optimal: 12-18% of chord
   - Too thin: structural weakness
   - Too thick: drag penalty

3. **Leading Edge** - Sharpness
   - Rounder = better low-speed
   - Sharper = better high-speed

4. **Symmetry** - Balance check
   - Deviation from perfect symmetry
   - Affects vibration/stability

### Simplified Scoring
```typescript
function scoreBladeProfile(points: Point[]): number {
  const camber = calculateCamber(points)
  const thickness = calculateThickness(points)
  const symmetry = calculateSymmetry(points)
  
  let score = 1.0
  
  // Camber bonus (optimal around 12%)
  score *= 1.0 + (0.2 - Math.abs(camber - 0.12)) * 2
  
  // Thickness (optimal around 15%)
  score *= 1.0 + (0.2 - Math.abs(thickness - 0.15)) * 2
  
  // Symmetry (perfect = 1.0)
  score *= 0.8 + (symmetry * 0.2)
  
  return clamp(score, 0.1, 1.5)
}
```

---

## Constants Reference

```typescript
export const PHYSICS = {
  // Environment
  AIR_DENSITY: 1.225,           // kg/m³
  WATER_DENSITY: 1025,          // kg/m³
  GRAVITY: 9.81,                // m/s²
  
  // Solar
  SOLAR_IRRADIANCE_PEAK: 1000,  // W/m²
  PANEL_EFFICIENCY: 0.18,
  
  // Turbine
  BETZ_LIMIT: 0.593,
  TURBINE_EFFICIENCY_BASE: 0.25,
  
  // Movement
  SPEED_SCALE: 1.94384,         // m/s to knots
  MAX_TURN_RATE: 45,            // degrees/second
  
  // Energy
  SYSTEMS_DRAW: 0.2,            // kW
  BATTERY_C_RATE: 0.5,          // max charge rate
}
```

---

## Future: Simulation Mode

For the "Pro Mode" simulation, we would add:
- Full CFD-lite for wind interaction
- Wave height affecting stability
- Heel angle reducing effective sail area
- Tip-speed ratio optimization
- Cut-in and cut-out wind speeds
- Temperature effects on air density
- Detailed propeller physics
