# InfoRelax Development Guide

## Architecture Overview

### Core Systems

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Root                         │
│                      (src/App.tsx)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Landing Page State (useLandingStore)               │   │
│  │  - Map Selection                                     │   │
│  │  - Player Name Setup                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
            (gameStarted: true)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Three.js Canvas (Game)                     │
│                                                              │
│  World Integration                                          │
│  ├─ World Generation (useWorldStore)                       │
│  │  ├─ Islands                                            │
│  │  ├─ Wind Zones                                         │
│  │  ├─ POIs                                               │
│  │  └─ Marina                                             │
│  │                                                         │
│  ├─ Game State (useGameStore)                            │
│  │  ├─ Player Position & Rotation                        │
│  │  ├─ Wind & Weather                                    │
│  │  ├─ Energy Management                                 │
│  │  └─ Checkpoint Detection                              │
│  │                                                         │
│  ├─ Race State (useRaceStore)                            │
│  │  ├─ Current Race Config                               │
│  │  ├─ Lap Timing                                        │
│  │  ├─ Checkpoint Tracking                               │
│  │  └─ Leaderboard Management                            │
│  │                                                         │
│  └─ World Integration Hook                               │
│     ├─ Apply Wind Zone Modifiers                         │
│     ├─ Handle Docking                                    │
│     └─ Detect POI Discovery                              │
│                                                              │
│  Three.js Components                                        │
│  ├─ Ocean.tsx (Water Rendering)                          │
│  ├─ Islands.tsx (Island Meshes)                          │
│  ├─ Marina.tsx (Hub Rendering)                           │
│  ├─ PointsOfInterest.tsx (POI Markers)                   │
│  ├─ RaceCheckpoints.tsx (Checkpoint Rings)               │
│  ├─ Yacht.tsx (Player Boat + Physics)                    │
│  └─ CameraController.tsx (Camera Logic)                  │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### Zustand Stores Structure

#### useLandingStore
```typescript
// Manages landing page state
{
  gameStarted: boolean          // Whether game has been started
  selectedMap: MapPreset | null // Currently selected map
  playerName: string            // Player's captain name

  selectMap(map)               // Select a map
  setPlayerName(name)          // Set player name
  startGame()                  // Initialize and start game
  resetToLanding()             // Return to landing page
}
```

#### useWorldStore
```typescript
// Manages world generation and world state
{
  world: WorldData | null      // Generated world with all data
  discoveredPOIs: Set<string>  // Set of discovered POI IDs
  isDocked: boolean            // Player docking status
  dockedAt: string | null      // Which marina docked at

  initializeWorld(seed, size)  // Generate new world
  discoverPOI(poiId)          // Mark POI as discovered
  dock(marinaId)              // Enter docking mode
  undock()                    // Exit docking mode
}
```

#### useGameStore
```typescript
// Manages game runtime state and physics
{
  // Time
  timeOfDay: number            // 0-1 day cycle
  gameTime: number             // Seconds elapsed

  // World
  weather: Weather             // Current weather type
  wind: WindState              // Wind direction and speed

  // Player
  player: PlayerState          // Position, rotation, speed, throttle

  // Energy
  energy: EnergyState          // Power generation/consumption
  energyCredits: number        // Total EC earned

  // Checkpoint Detection
  currentWindZone: string | null
  nearbyCheckpoints: string[]
  distanceToCheckpoint: Record<string, number>
  lastPassedCheckpoint: string | null

  // Actions
  setThrottle(value)
  setSteering(value)
  setWeather(weather)
  setWind(wind)
  updatePlayerPosition(delta, maxSpeed, turnRate)
  updateEnergy(delta)
  updateCheckpointDetection(checkpoints)
  tick(delta, maxSpeed, turnRate)
}
```

#### useRaceStore
```typescript
// Manages racing state
{
  currentRace: RaceConfig | null
  isRacing: boolean
  raceStartTime: number | null
  currentLap: number
  currentCheckpoint: number
  lapTimes: LapData[]           // Array of lap timings
  leaderboard: LeaderboardEntry[]

  // Actions
  startRace(config, playerName)
  passCheckpoint(checkpointId)
  completeLap()
  finishRace()
  abandonRace()
  updateLeaderboard(entry)
}
```

## Component Architecture

### Three.js Components

#### Islands.tsx
```typescript
// Renders all islands from world data
export function Islands() {
  // Reads from useWorldStore
  // Creates Three.js cone geometry for each island
  // Applies elevation function for terrain
  // Uses island type for coloring
  // Returns primitive meshes for R3F
}
```

#### RaceCheckpoints.tsx
```typescript
// Renders race checkpoints
export function RaceCheckpoints() {
  // Only renders if race is active (useRaceStore)
  // Shows ring geometry for each checkpoint
  // Color codes: green=completed, yellow=next, gray=future
  // Positioned at checkpoint coordinates
}
```

#### Marina.tsx
```typescript
// Renders central marina hub
export function Marina() {
  // Creates dock platform (cylinder)
  // Creates docking zone indicator (ring)
  // Creates charge station (cone with emissive)
  // Shows different colors based on docking status
}
```

#### PointsOfInterest.tsx
```typescript
// Renders all POI markers
export function PointsOfInterest() {
  // Shows cone for undiscovered POIs
  // Shows sphere for discovered POIs
  // Color-codes by POI type (reef, wreck, buoy, etc)
  // Emissive glow on discovered POIs
}
```

### UI Components

#### LandingPage.tsx
```typescript
// Full landing page experience
export function LandingPage() {
  // Gradient background with animations
  // Player name input field
  // Map grid with 6 presets
  // Features overview sections
  // Getting started tips
  // Start button with validation
}
```

#### RaceUI.tsx
```typescript
// Racing interface components

export function RaceMenu()    // Map selection and race start
export function RaceStatus()  // Live race HUD with timings
export function Leaderboard() // Top 5 standings display
```

## World Generation Pipeline

### Procedural Generation Flow

```
generateWorld(seed, worldSize)
├─ Create Perlin noise instance with seed
├─ generateIslands(seed, bounds)
│  ├─ Calculate island count (8-12)
│  ├─ Position islands in circle pattern
│  ├─ Create elevation function for each
│  └─ Return Island[] with all data
├─ generateWindZones(seed, bounds)
│  ├─ Create 4 wind zones
│  ├─ Distribute around world
│  ├─ Assign weather patterns
│  └─ Return WindZone[]
├─ generatePOIs(seed, bounds, islands)
│  ├─ Create 12+ points of interest
│  ├─ Randomly distribute across map
│  ├─ Assign POI types and rewards
│  └─ Return POI[]
├─ generateMarina(bounds)
│  ├─ Create marina at origin (0,0)
│  ├─ Set docking zone radius
│  └─ Return Marina
└─ Return complete WorldData object
```

### Elevation Function

The elevation for each island uses:
1. **Distance from center**: Smooth falloff using cosine
2. **Perlin noise**: Fine detail variation
3. **Composite formula**: `height = maxHeight × falloff × (0.8 + noise)`

Result: Natural looking terrain with peaks and valleys.

## Racing System Pipeline

### Race Initiation

```
User selects race from RaceUI
       ↓
useRaceStore.startRace()
       ↓
Initialize lap tracking
Set currentLap = 1, currentCheckpoint = 0
Create first LapData object
       ↓
Yacht component enables checkpoint detection
```

### Checkpoint Detection

```
Each frame in Yacht.tsx:
  ├─ Calculate distance to all checkpoints
  ├─ For current checkpoint:
  │  ├─ If distance <= radius:
  │  │  ├─ passCheckpoint(id)
  │  │  ├─ Move to next checkpoint
  │  │  └─ Increment currentCheckpoint
  │  └─ If checkpoint index >= total:
  │     ├─ completeLap()
  │     ├─ If laps remaining:
  │     │  ├─ Create new LapData
  │     │  ├─ Increment currentLap
  │     │  └─ Reset currentCheckpoint = 0
  │     └─ Else:
  │        └─ finishRace()
  └─ Update distances for HUD display
```

### Leaderboard Update

```
Race completed
    ↓
Calculate total time
    ↓
updateLeaderboard({
  playerName,
  bestTime: Math.min(currentTime, previousBest),
  totalTime,
  completedLaps,
  personalBest
})
    ↓
Sort entries by bestTime
Assign ranks 1-N
Display in leaderboard component
```

## Integration Hooks

### useWorldIntegration Hook

```typescript
useWorldIntegration():
  ├─ Wind Zone Application
  │  ├─ Get player position
  │  ├─ Find wind zone at position
  │  └─ If in zone:
  │     ├─ Override wind direction
  │     ├─ Modify wind speed
  │     └─ Set weather type
  ├─ Marina Docking
  │  ├─ Calculate distance to marina
  │  ├─ If within docking zone:
  │  │  └─ Auto-dock()
  │  └─ If outside threshold:
  │     └─ Auto-undock()
  └─ POI Discovery
     ├─ For each POI:
     │  ├─ Calculate distance
     │  ├─ If < 500m and not discovered:
     │  │  ├─ discoverPOI(id)
     │  │  ├─ Award energy credits
     │  │  └─ Update rewards
```

## Performance Considerations

### Optimization Strategies

#### Distance Calculations
- Use squared distances to avoid sqrt()
- Cache results between frames
- Only update every 100ms for distant objects

#### Mesh Generation
- Reuse geometries where possible
- Use LOD (Level of Detail) for distant objects
- Consolidate draw calls with mesh instancing

#### Physics Simulation
- Skip simulation in build mode
- Use fixed timestep for consistency
- Cache wind calculations

#### Memory Management
- Release unused meshes
- Stream large datasets
- Lazy-load POI data

### Rendering Performance

```
Canvas Target: 60 FPS
├─ Lighting: 2 lights (ambient + directional)
├─ Shadows: 2048x2048 shadow maps
├─ Fog: Distance-based culling at 500m
├─ Meshes: ~30-50 visible at once
└─ Particles: Foam effects on ocean
```

## Extending the Systems

### Adding a New Map Preset

1. Create new MapPreset in `useLandingStore.ts`:
```typescript
'custom-map': {
  id: 'custom-map',
  name: 'Custom Map',
  description: 'Your map description',
  seed: 999,           // Unique seed
  worldSize: 10000,    // Size in meters
  difficulty: 'moderate',
  features: ['Feature 1', 'Feature 2'],
}
```

2. Map will automatically appear in landing page grid

### Adding a New Race Configuration

1. Create new RaceConfig in `src/data/races.ts`:
```typescript
'custom-race': {
  id: 'custom-race',
  name: 'Custom Race',
  laps: 2,
  difficultyMultiplier: 1.2,
  checkpoints: [
    { id: 'cp-1', position: [x, y], radius: 300, order: 1 },
    // ... more checkpoints
  ],
}
```

2. Race appears automatically in RaceMenu

### Adding a New POI Type

1. Add to POI type union in `WorldGenerator.ts`:
```typescript
type POI['type'] = 'reef' | 'wreck' | 'buoy' | 'wildlife' | 'research-station' | 'NEW_TYPE'
```

2. Update rewards in `generatePOIs()`:
```typescript
const rewards: Record<POI['type'], number> = {
  'new-type': 25, // EC reward
  // ...
}
```

3. Add color in `PointsOfInterest.tsx`:
```typescript
case 'new-type':
  color = 0xrrggbb
  break
```

### Adding New Wind Zone Patterns

1. Extend Weather type:
```typescript
export type Weather =
  | 'clear' | 'cloudy' | 'trade-winds'
  | 'storm' | 'doldrums' | 'NEW_PATTERN'
```

2. Add to WEATHER_PRESETS in `WindSystem.ts`:
```typescript
'new-pattern': {
  baseSpeed: [speedMin, speedMax],
  gustFactor: 0.X,
  description: 'Description',
}
```

3. Add visual feedback in HUD

## Testing

### Manual Testing Checklist

- [ ] Landing page loads with all 6 maps
- [ ] Map selection updates visual state
- [ ] Player name input persists
- [ ] Starting game initializes correct world
- [ ] Islands render with correct count per seed
- [ ] POIs are discoverable (change to sphere)
- [ ] Wind zones apply correct weather
- [ ] Marina auto-docks when near
- [ ] Races start and checkpoint detection works
- [ ] Lap timing shows correct times
- [ ] Leaderboard updates after race
- [ ] Return to landing from game works
- [ ] All map presets have unique seeds

### Performance Testing

- [ ] Frame rate stays 60 FPS in sail mode
- [ ] Build mode disables physics updates
- [ ] No memory leaks in long play sessions
- [ ] Smooth transitions between game states

## Debugging Tips

### Common Issues

**World not generating:**
- Check that `initializeWorld()` is called from landing page
- Verify seed and worldSize are valid numbers
- Check browser console for Perlin noise errors

**Checkpoints not detecting:**
- Verify checkpoint positions in race config
- Check player position is updating correctly
- Debug: log distances in Yacht component

**POIs not discoverable:**
- Verify discovery radius in `useWorldIntegration` (500m)
- Check that POI generation included them
- Debug: check `world.pois` array length

**Memory issues:**
- Profile with Chrome DevTools
- Check for mesh leaks in Islands component
- Reduce shadow map size if needed

## Performance Profiling

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Record while sailing/racing
4. Look for:
   - Long frames (>16ms)
   - Garbage collection pauses
   - CPU bottlenecks

### Three.js Stats

Can be enabled with Leva debug controls (already in App.tsx)

## Future Architecture Improvements

1. **Entity Component System**: Replace store-based approach
2. **Worker Threads**: Offload physics calculations
3. **Streaming World**: Load chunks as needed
4. **LOD System**: Dynamic detail based on distance
5. **Server Sync**: Multiplayer replication
6. **Replay System**: Record and replay races
7. **Replay Editor**: Create custom levels
