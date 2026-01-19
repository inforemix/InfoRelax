# CLAUDE.md - Project InfoRelax

## Project Overview

InfoRelax is a creative physics sandbox game where players design sustainable electric yachts with vertical wind turbines, then sail them across a multiplayer open world. The game combines intuitive customization with believable aerodynamic simulation.

**Current Phase:** Web MVP Development (Months 1-3)
**Tech Stack:** React + TypeScript + Three.js + Colyseus
**Target:** Browser-based prototype to validate core gameplay

## Core Concepts

### The E-Cat Yacht Design
The game's aesthetic is based on the E-Cat concept yacht series featuring:
- Catamaran hull with hydrofoil outrigger
- Central sculptural VAWT (Vertical Axis Wind Turbine)
- Integrated solar deck panels
- Modular deck attachments (DJ booth is signature module)
- Optional kite sail for auxiliary power

### Signature Feature: Kaleidoscope Blade Editor
Players design turbine blades by drawing freehand OR modifying presets. The system uses rotational symmetry (Kaleidoscope effect) to complete the design:
- 2 blades = 180° symmetry
- 3 blades = 120° symmetry
- 4 blades = 90° symmetry
- etc.

### Energy-Based Progression
- Players earn Energy Credits (EC) by harvesting wind and solar power while sailing
- EC unlocks better turbines, larger batteries, more efficient solar panels
- 1 EC = 1 kWh harvested
- This creates a "play to progress" loop that reinforces the sustainability theme

## Project Structure

```
inforelax/
├── CLAUDE.md                 # This file - project context for Claude Code
├── README.md                 # Full PRD and documentation
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
│
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Main app with React Three Fiber
│   │
│   ├── components/
│   │   ├── ui/               # React UI components
│   │   │   ├── HUD.tsx       # In-game heads-up display
│   │   │   ├── BuilderPanel.tsx
│   │   │   └── PowerFlowDiagram.tsx
│   │   │
│   │   └── three/            # Three.js/R3F components
│   │       ├── Ocean.tsx     # Water rendering
│   │       ├── Yacht.tsx     # Player boat
│   │       ├── Turbine.tsx   # VAWT component
│   │       └── World.tsx     # Islands, sky, environment
│   │
│   ├── editor/               # Kaleidoscope blade editor
│   │   ├── KaleidoscopeCanvas.tsx
│   │   ├── BladePresets.ts
│   │   ├── SplineUtils.ts
│   │   └── TurbineGenerator.ts
│   │
│   ├── physics/              # Game physics (simplified)
│   │   ├── WindSystem.ts
│   │   ├── WaterPhysics.ts
│   │   ├── EnergySystem.ts
│   │   └── BoatController.ts
│   │
│   ├── state/                # Zustand stores
│   │   ├── useYachtStore.ts  # Yacht configuration
│   │   ├── useGameStore.ts   # Game state, weather, time
│   │   └── usePlayerStore.ts # Progression, currency, unlocks
│   │
│   ├── multiplayer/          # Colyseus client
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   └── hooks.ts
│   │
│   ├── data/                 # Static game data
│   │   ├── hulls.json
│   │   ├── turbines.json
│   │   ├── upgrades.json
│   │   └── world-seed.json
│   │
│   └── utils/
│       ├── math.ts
│       └── constants.ts
│
├── server/                   # Colyseus multiplayer server
│   ├── index.ts
│   ├── rooms/
│   │   └── OceanRoom.ts
│   └── schema/
│       └── GameState.ts
│
├── public/
│   ├── models/               # 3D assets (glTF)
│   │   ├── hull-catamaran.glb
│   │   ├── turbine-helix.glb
│   │   └── turbine-infinity.glb
│   │
│   └── textures/
│       ├── water-normal.jpg
│       └── solar-panel.jpg
│
└── docs/
    ├── PRD.md                # Full product requirements
    ├── ARCHITECTURE.md       # Technical deep-dive
    ├── ART_DIRECTION.md      # Visual style guide
    └── PHYSICS.md            # Physics formulas
```

## Key Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start multiplayer server (separate terminal)
npm run server

# Build for production
npm run build

# Run tests
npm run test
```

## Development Guidelines

### Code Style
- Use TypeScript with strict mode
- Functional components with hooks
- Zustand for state management
- Keep Three.js components in `components/three/`
- Keep React UI in `components/ui/`

### Three.js Patterns
```tsx
// Use React Three Fiber declarative style
<Canvas>
  <Ocean />
  <Yacht position={[0, 0, 0]} config={yachtConfig} />
  <Environment preset="sunset" />
</Canvas>
```

### State Management
```tsx
// Zustand store pattern
const useYachtStore = create<YachtState>((set) => ({
  hull: { type: 'catamaran', length: 12, beam: 4 },
  turbine: { type: 'helix', height: 4, blades: 3 },
  setHull: (hull) => set({ hull }),
}));
```

### Physics Constants
```typescript
// Air density at sea level (kg/m³)
const AIR_DENSITY = 1.225;

// Simplified power calculation
// P = 0.5 × ρ × A × v³ × η
function calculateTurbinePower(
  windSpeed: number,      // m/s
  sweptArea: number,      // m²
  efficiency: number      // 0.1 to 0.4
): number {
  return 0.5 * AIR_DENSITY * sweptArea * Math.pow(windSpeed, 3) * efficiency;
}
```

## Current Sprint Tasks

### Sprint 1-2: Foundation (Weeks 1-2)
- [x] Project setup with Vite + React + Three.js
- [ ] Basic water shader with waves
- [ ] Import E-Cat hull mesh
- [ ] WASD boat movement
- [ ] Camera follow system

### Sprint 2: Hull Builder (Weeks 3-4)
- [ ] Parametric hull generator
- [ ] Hull type switching (mono/cat/tri)
- [ ] Live 3D preview
- [ ] Drag/stability calculations

### Sprint 3: Kaleidoscope Editor (Weeks 5-6)
- [ ] Canvas drawing input
- [ ] Catmull-Rom spline interpolation
- [ ] Rotational mirroring
- [ ] Preset blade library
- [ ] 3D turbine mesh generation

### Sprint 4: Energy System (Weeks 7-8)
- [ ] Wind direction/speed system
- [ ] Turbine power output
- [ ] Solar panel calculations
- [ ] Battery charge/discharge
- [ ] Power flow HUD

### Sprint 5: World & Multiplayer (Weeks 9-10)
- [ ] Procedural island generation
- [ ] Colyseus server setup
- [ ] Player position sync
- [ ] Racing checkpoints

### Sprint 6: Polish (Weeks 11-12)
- [ ] Save/load yacht designs
- [ ] Optional tooltips
- [ ] Progression unlocks
- [ ] Closed alpha testing

## Key Design Decisions

1. **Simplified Physics First**: Use "feels right" approximations, not engineering-grade simulation. We can add complexity later.

2. **Kaleidoscope is the Hook**: This feature differentiates us from other boat games. Prioritize making it feel magical.

3. **Energy = Progression**: Everything ties back to harvesting energy. It's the core loop.

4. **Web First, Unreal Later**: The web MVP validates fun. Code won't transfer to Unreal, but design decisions will.

5. **Catamaran is Default**: The E-Cat design is a catamaran. Start here, add mono/trimaran/hydrofoil later.

## Reference Games
- **Stormworks**: Deep vehicle building, physics feedback
- **From the Depths**: Creative freedom, emergent gameplay
- **Sailwind**: Relaxing sailing feel, wind mechanics
- **Kerbal Space Program**: Learning through failure

## Assets Needed
- [ ] E-Cat hull mesh (simplified for web)
- [ ] VAWT Helix turbine mesh
- [ ] VAWT Infinity turbine mesh
- [ ] Water normal map
- [ ] Skybox/HDRI for sunset ocean scene
- [ ] DJ booth module mesh (V1)

## Questions for Development

When implementing features, consider:
1. Does this support the Build → Sail → Harvest → Upgrade loop?
2. Is this achievable in the web MVP scope?
3. Will the design decisions transfer to Unreal later?
4. Does this feel satisfying with simplified physics?

## Contact & Resources
- Concept art in `/docs/concepts/`
- PRD document in `/docs/PRD.md`
- Design system colors extracted from E-Cat renders
