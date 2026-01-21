# 🌊 Project InfoRelax

**Sustainable Yacht Simulator - Creative Physics Sandbox**

Design electric yachts with vertical wind turbines. Sail the open ocean. Harvest energy to upgrade. Race other players.

![E-Cat Concept](docs/concepts/e-cat-hero.jpg)

---

## 🎮 Game Concept

InfoRelax combines the creative freedom of vehicle builders like *Stormworks* with the relaxing exploration of sailing games like *Sailwind*—all wrapped in a sustainability theme where energy harvesting drives progression.

### Core Loop
```
DESIGN → SAIL → HARVEST ENERGY → UPGRADE → DESIGN (improved)
```

### Pillars
| Pillar | Description |
|--------|-------------|
| **BUILD** | Deep parametric customization of hulls and turbine blades |
| **SAIL** | Satisfying "feels right" physics with wind/wave interaction |
| **EXPLORE** | Multiplayer open world with racing and discovery |
| **SUSTAIN** | Energy harvesting as the core progression mechanic |

---

## ✨ Signature Feature: Kaleidoscope Blade Editor

The game's unique differentiator—a tool that makes turbine design both accessible and deeply creative.

### How It Works
1. **Draw** a single blade profile (freehand or modify preset)
2. **Mirror** - Kaleidoscope auto-replicates based on blade count
3. **Analyze** - Get instant feedback on efficiency and balance
4. **Test** - Preview your turbine spinning in a wind tunnel

### Symmetry Modes
| Blades | Symmetry |
|--------|----------|
| 2 | 180° |
| 3 | 120° |
| 4 | 90° |
| 5 | 72° |
| 6 | 60° |

---

## 🚤 E-Cat Design Language

Based on concept art featuring futuristic sustainable yachts:

### Hull
- Catamaran base with hydrofoil outrigger
- Sleek white finish with blue LED accents
- Parametric length/beam/draft sliders

### VAWT Turbines (Unlockable)
| Style | Description | Unlock |
|-------|-------------|--------|
| **DNA Helix** | Solar-integrated helical blades | Starter |
| **Infinity Loop** | Mirror chrome, high-speed | 1,000 EC |
| **Ribbon LED** | Purple glow, night bonus | 5,000 EC |

### Deck Modules
- **DJ Booth** (signature) - Turntables + speakers
- **Cargo Hold** - For delivery missions
- **Fishing Gear** - Resource gathering
- **Solar Canopy** - Extra generation

### Auxiliary
- **Kite Sail** - Tethered wind power boost

---

## 🔋 Energy System

### Generation
| Source | Output | Factor |
|--------|--------|--------|
| Wind Turbine | 0-5 kW | Wind speed × blade efficiency |
| Solar Panels | 0-2 kW | Sun angle × panel area |
| Kite Sail | 0-1 kW | When deployed |
| Regen Braking | 0-0.3 kW | When slowing |

### Consumption
| Consumer | Draw |
|----------|------|
| Electric Motor | 0-10 kW (throttle-based) |
| Ship Systems | 0.1-0.5 kW (constant) |
| DJ Booth | 0.5-1 kW (when active) |

### Progression
- **Energy Credits (EC)**: 1 EC per 1 kWh harvested
- **Doubloons**: Earned from tasks (deliveries, races)
- EC unlocks equipment; Doubloons buy cosmetics

---

## 🗺️ World Structure

```
┌─────────────────────────────────────────┐
│              EDGE ZONES                 │
│    (Mysteries, rare discoveries)        │
│  ┌───────────────────────────────────┐  │
│  │         OUTER RING                │  │
│  │    (Strong winds, storms)         │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │       MIDDLE RING           │  │  │
│  │  │    (Variable weather)       │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │     INNER RING        │  │  │  │
│  │  │  │   (Calm, beginner)    │  │  │  │
│  │  │  │  ┌─────────────────┐  │  │  │  │
│  │  │  │  │   CENTRAL HUB   │  │  │  │  │
│  │  │  │  │    (Marina)     │  │  │  │  │
│  │  │  │  └─────────────────┘  │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Points of Interest
- **Marinas** - Save, repair, upgrade
- **Wind Farms** - Energy harvesting hotspots
- **Research Stations** - Unlock advanced parts
- **Shipwrecks** - Salvage rare components
- **Party Islands** - DJ performance venues

---

## 🎯 MVP Scope (12 Weeks)

### P0 - Must Have ✅ COMPLETE
- [x] Hull editor with parametric sliders
- [x] Kaleidoscope blade editor (freehand + presets)
- [x] Sailing with wind response
- [x] Energy system (turbine + solar + battery)
- [x] Power flow HUD
- [x] Save/load yacht designs

### P1 - Should Have 🟡 IN PROGRESS
- [ ] See other players in world (Colyseus setup pending)
- [x] Racing with checkpoints
- [x] Energy credit progression
- [x] Weather zones (4 presets: clear, overcast, storm, arctic)

### P2 - Nice to Have 🟡 PARTIAL
- [ ] Kite sail (designed, not implemented)
- [ ] DJ booth module (designed, not implemented)
- [x] Island discoveries (procedurally generated POIs)
- [ ] Leaderboards (requires multiplayer backend)

### Out of Scope (MVP)
- Interior customization
- Trading between players
- Simulation Mode (realistic physics)
- Mobile/VR

---

## 🛠️ Technical Architecture

### Web MVP Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| 3D Engine | Three.js + React Three Fiber |
| State | Zustand |
| Physics | Custom simplified + Cannon.js |
| Multiplayer | Colyseus |
| Backend | Node.js + PostgreSQL |
| Hosting | Vercel + Railway |

### Data That Transfers to Unreal
- Ship configuration JSONs
- Blade profile spline data
- Physics tuning constants
- Progression/unlock data
- 3D assets (Blender → glTF/FBX)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/inforelax.git
cd inforelax

# Install dependencies
npm install

# Start development server
npm run dev

# In a separate terminal, start multiplayer server
npm run server
```

### Project Structure
```
inforelax/
├── src/
│   ├── components/
│   │   ├── ui/          # React UI
│   │   └── three/       # Three.js components
│   ├── editor/          # Kaleidoscope system
│   ├── physics/         # Game physics
│   ├── state/           # Zustand stores
│   └── multiplayer/     # Colyseus client
├── server/              # Multiplayer server
├── public/
│   ├── models/          # 3D assets
│   └── textures/
└── docs/
```

---

## 📊 Success Metrics

| Metric | MVP Target | V1 Target |
|--------|------------|-----------|
| Daily Active Users | 500 | 10,000 |
| Session Length | 15 min | 45 min |
| Day 7 Retention | 20% | 35% |
| Designs Created/User | 3 | 10 |

---

## 🎨 Design System

### Colors (from E-Cat concepts)
| Name | Hex | Usage |
|------|-----|-------|
| Hull White | `#F8FAFC` | Primary surfaces |
| Ocean Deep | `#0C4A6E` | Background, water |
| Ocean Mid | `#0E7490` | Water highlights |
| Cyan Accent | `#06B6D4` | UI accents, LEDs |
| Sunset Orange | `#F97316` | Warnings, sun |
| Sunset Gold | `#FBBF24` | Energy, highlights |
| Turbine Purple | `#8B5CF6` | LED turbine |
| Speaker Gold | `#D4A574` | DJ booth |

---

## 📚 Documentation

- [CLAUDE.md](CLAUDE.md) - Context for Claude Code
- [docs/PRD.md](docs/PRD.md) - Full product requirements
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical deep-dive
- [docs/PHYSICS.md](docs/PHYSICS.md) - Physics formulas
- [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) - Visual style guide

---

## 🙏 Acknowledgments

- Concept art inspired by sustainable marine technology
- Reference games: Stormworks, From the Depths, Sailwind, KSP

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

*Built with 🌊 and ☀️ for a sustainable future*
