# InfoRelax Features Guide

## 🌍 World Generation System

### Overview
The world generation system creates fully procedural, seed-based worlds with diverse islands, wind zones, and points of interest.

### Key Features

#### Islands
- **Procedurally Generated**: 8-12 islands per world based on seed
- **Island Types**: Volcanic (dark, rugged), Coral (colorful, reef-like), Sandy (beaches)
- **Elevation**: Natural terrain with Perlin noise-based elevation falloff
- **Exploration**: Navigate through realistic ocean to discover distant islands

#### Wind Zones
- **4 Regional Zones**: Each zone has unique weather patterns
- **Weather Types**:
  - Trade Winds: Steady, predictable wind
  - Doldrums: Calm, variable conditions
  - Monsoon: Strong seasonal patterns
  - Storm Path: Extreme, dangerous winds
- **Dynamic Effect**: Wind conditions change based on location
- **Strategic Navigation**: Plan routes through favorable wind zones

#### Points of Interest (POIs)
- **Discovery Rewards**: Find and unlock POIs for energy credit bonuses
- **5 POI Types**:
  - Reefs (5 EC reward)
  - Wrecks (15 EC reward)
  - Buoys (2 EC reward)
  - Wildlife zones (10 EC reward)
  - Research stations (20 EC reward)
- **Visual Indicators**: Undiscovered POIs appear as cones, discovered as spheres
- **Progressive Unlocks**: Earn equipment by discovering POIs

#### Marina Hub
- **Central Docking Facility**: Located at world origin (0, 0)
- **Auto-Docking**: Automatically enter docking mode when near marina
- **Fast Charging**: 5 EC per second while docked
- **Respawn Point**: Safe haven to recharge and plan next adventure

---

## 🏁 Racing System

### Overview
Competitive racing with checkpoints, lap timing, and persistent leaderboards.

### Race Configurations

#### 1. Bay Circuit (3 Laps)
- **Difficulty**: Peaceful
- **Checkpoints**: 4
- **Distance**: ~4,000m per lap
- **Ideal For**: Practice and learning checkpoints
- **Challenge**: Navigation and consistency

#### 2. Island Hopper (2 Laps)
- **Difficulty**: Moderate
- **Checkpoints**: 6
- **Distance**: ~6,000m per lap
- **Ideal For**: Intermediate players
- **Challenge**: Weather and long distances

#### 3. Open Ocean Marathon (1 Lap)
- **Difficulty**: Extreme
- **Checkpoints**: 5
- **Distance**: ~8,000m
- **Ideal For**: Advanced players
- **Challenge**: Endurance and navigation

#### 4. Speed Trial (1 Lap)
- **Difficulty**: Moderate
- **Checkpoints**: 4
- **Distance**: ~4,000m
- **Ideal For**: Speed enthusiasts
- **Challenge**: Pure speed on straight course

### Racing Mechanics

#### Checkpoint System
- **Detection Zone**: Pass through checkpoint radius to count
- **Visual Feedback**: Yellow ring = next checkpoint, green = completed
- **Real-time Status**: HUD shows distance to next checkpoint
- **Proximity Alerts**: Screen effect when approaching checkpoint

#### Lap Timing
- **Millisecond Precision**: Accurate timing for competitive racing
- **Per-Lap Tracking**: Individual time for each lap
- **Checkpoint Times**: Track time at each checkpoint
- **Best Lap**: System records your best lap time

#### Leaderboard
- **Top 5 Display**: Live leaderboard showing best players
- **Personal Best**: Track your fastest times
- **Competitive Ranking**: Compare performance across all races
- **Persistent Storage**: Leaderboard updates are saved

### Race UI

#### Main Menu
- Race selection with description and difficulty
- One-click race start
- Visual difficulty indicators

#### During Race HUD
```
┌─────────────────────┐
│ Bay Circuit Race     │
│ LAP: 1/3            │
│ LAP TIME: 2:15.43   │
│ RACE TIME: 2:15.43  │
│ NEXT: CP 2          │
│ → APPROACHING ←     │
├─────────────────────┤
│ [FINISH] [ABANDON]  │
└─────────────────────┘
```

#### Post-Race
- Final time and placement
- Leaderboard position
- Energy credit rewards
- Option to restart or return to sailing

---

## 🗺️ Landing Page & Map Selection

### Map Presets

#### 1. Serene Archipelago (Seed: 42)
- **World Size**: 8,000m
- **Difficulty**: Peaceful
- **Features**: Calm winds, nearby islands, easy navigation, POI bonuses
- **Best For**: Learning the game mechanics
- **Wind**: 5-8 m/s average

#### 2. Trade Winds Routes (Seed: 123)
- **World Size**: 10,000m
- **Difficulty**: Moderate
- **Features**: Variable winds, dispersed islands, racing available, energy focus
- **Best For**: Balanced gameplay
- **Wind**: 8-12 m/s average

#### 3. Storm Archipelago (Seed: 456)
- **World Size**: 12,000m
- **Difficulty**: Challenging
- **Features**: Storm paths, fast winds, scattered islands, high rewards
- **Best For**: Experienced players
- **Wind**: 12-18 m/s average

#### 4. Open Ocean Expanse (Seed: 789)
- **World Size**: 15,000m
- **Difficulty**: Extreme
- **Features**: Extreme distances, rare islands, marathon races, epic exploration
- **Best For**: Adventure seekers
- **Wind**: 15-22 m/s average

#### 5. Island Paradise (Seed: 101112)
- **World Size**: 9,000m
- **Difficulty**: Moderate
- **Features**: Many islands, abundant POIs, exploration, varied terrain
- **Best For**: Discovery-focused gameplay
- **Wind**: 8-10 m/s average

#### 6. Wind Laboratory (Seed: 131415)
- **World Size**: 11,000m
- **Difficulty**: Extreme
- **Features**: Extreme winds, 4+ races, tight checkpoints, speed focus
- **Best For**: Racing challenges
- **Wind**: 18-25 m/s average

### Landing Page Features

#### Player Setup
- Customizable captain name
- Persistent player preferences
- Welcome screen with feature overview

#### World Selection
- 6 unique map presets
- Difficulty indicators with color coding
- Feature descriptions for each map
- Visual world size comparison
- Quick preview of wind conditions

#### Feature Summary
- World generation overview
- Racing system capabilities
- Energy progression system
- Customization options

#### Getting Started Guide
- Tips for each difficulty level
- Feature recommendations
- Learning path suggestions

---

## 🎮 Game Modes

### Sail Mode
- **Free Exploration**: Sail around the world freely
- **POI Discovery**: Find and discover points of interest
- **Energy Generation**: Harvest wind and solar power
- **Racing**: Access race menu to start competitive races
- **Third-Person Camera**: Dynamic camera following the yacht

### Build Mode
- **Yacht Customization**: Design your boat
- **Blade Editor**: Create custom turbine blades with kaleidoscope symmetry
- **Live Preview**: See 3D preview of yacht in real-time
- **Design Testing**: Test different configurations
- **Save/Load**: Save favorite yacht designs

---

## ⚡ Energy & Progression

### Energy Generation
- **Wind Turbine**: Converts wind speed to electrical power
  - Formula: P = 0.5 × ρ × A × v³ × Cp
  - Apparent wind benefits (boat movement increases effective wind)
  - 1 EC = 1 kWh harvested

- **Solar Panels**: Converts sunlight to power
  - Time-of-day modulation (noon = peak, night = zero)
  - Cloud coverage reduces efficiency
  - Temperature efficiency curves

### Energy Credits (EC)
- **Earning Methods**:
  - Wind generation: Continuous while sailing
  - Solar generation: During daylight hours
  - POI discovery: 2-20 EC per discovery
  - Race completion: Bonus EC for finishing

- **Uses**:
  - Motor consumption: Run electric motor
  - Systems: Navigation, HUD, autopilot
  - Upgrades: Unlock new components
  - Batteries: Store generated power

### Equipment Unlocks
- **EC Thresholds**: Unlock new turbines, solar panels, batteries
- **Progression**: Early game focuses on discovery, late game on optimization
- **Customization**: Choose which upgrades fit your playstyle

---

## 🛥️ Physics Integration

### Wind System
- **Regional Variations**: Wind changes by location
- **Apparent Wind**: Boat movement affects effective wind
- **Gusts**: Random variations for realism
- **Direction Drift**: Smooth, realistic wind direction changes

### Water Physics
- **Drag Calculations**: Form, friction, and wave-making drag
- **Stability**: Hull type affects roll resistance
- **Hull Speed**: Maximum speed determined by physics
- **Hydrofoil Effects**: Advanced hull types gain advantage

### Boat Dynamics
- **Acceleration**: Gradual throttle response
- **Turning**: Speed-dependent turning radius
- **Roll Animation**: Lean into turns for immersion
- **Wave Response**: Bob with ocean waves

---

## 🎨 Visual Features

### Graphics
- **Ocean Rendering**: Gerstner waves with realistic foam
- **Island Terrain**: Procedural terrain with natural coloring
- **Time of Day**: Dynamic lighting with day/night cycle
- **Weather Effects**: Visual indicators of wind zones
- **POI Visualization**: Color-coded discovery indicators

### User Interface
- **Landing Page**: Beautiful gradient background with feature previews
- **In-Game HUD**: Real-time stats and racing information
- **Map Selection**: Color-coded difficulty indicators
- **Leaderboard**: Integrated score tracking
- **Modal Dialogs**: Race menu and settings

---

## 🔧 Technical Systems

### Procedural Generation
- **Perlin Noise**: Deterministic terrain generation
- **Seeding**: Reproducible worlds with same seed
- **Scalability**: Adjust world size and complexity
- **Performance**: Optimized mesh generation

### State Management
- **Zustand Stores**: Centralized game state
- **World Store**: Island, POI, marina, wind zone data
- **Race Store**: Lap timing, leaderboard, checkpoint tracking
- **Landing Store**: Map selection and game initialization
- **Game Store**: Player position, wind, energy, mode

### Integration
- **World Integration Hook**: Seamlessly connects world to gameplay
- **Checkpoint Detection**: Real-time racer tracking
- **POI Discovery**: Automatic detection and reward
- **Marina Docking**: Proximity-based auto-dock/undock

---

## 📊 Performance Optimizations

### Rendering
- **LOD System**: Reduced detail at distance
- **Mesh Consolidation**: Fewer draw calls
- **Shadow Optimization**: 2048x2048 shadow maps
- **Fog Culling**: Distance-based rendering limits

### Physics
- **Calculation Intervals**: 60 FPS update rate
- **Simplified Models**: "Feels right" over perfect physics
- **Caching**: Pre-calculated lookup tables
- **Efficient Distance Checks**: Squared distance comparisons

### Memory
- **Mesh Sharing**: Reuse geometry for POIs
- **Texture Atlasing**: Combined texture maps
- **Lazy Loading**: Load world data on demand
- **Asset Streaming**: Progressive asset loading

---

## 🎯 Design Philosophy

### Player Experience
1. **Accessible**: Easy to pick up, hard to master
2. **Rewarding**: Clear progression and unlocks
3. **Immersive**: Beautiful graphics and realistic physics
4. **Competitive**: Racing challenges for skill expression
5. **Relaxing**: Can also be played casually

### Gameplay Loop
```
Landing Page (Select World)
    ↓
Sail Mode → Discover POIs → Earn Energy Credits
    ↓
Build Mode → Customize Yacht
    ↓
Racing Mode → Compete on Leaderboards
    ↓
Repeat with new goals
```

### Progression Path
**Beginner**: Serene Archipelago → Learn controls → Do bay circuit race
**Intermediate**: Trade Winds → Explore fully → Complete all races
**Advanced**: Storm Archipelago → Optimize builds → Dominate leaderboards
**Expert**: Open Ocean Expanse → Marathon sailing → 100% exploration

---

## 🚀 Future Expansions

### Planned Features
- Multiplayer races with real players
- Dynamic weather events
- Seasonal content with unique challenges
- More yacht body styles (monohull, trimaran, hydrofoil racing)
- Advanced blade design with fluid dynamics simulation
- Environmental hazards (rocks, reefs, shipping lanes)
- Achievement system
- Custom race builder

### Content Roadmap
- Q2: 8 additional map presets
- Q3: Multiplayer implementation
- Q4: Advanced weather system
- 2026: Full Unreal Engine port with enhanced graphics
