# 📋 InfoRelax Development Tasks

## Sprint 1-2: Foundation (Weeks 1-2)

### Setup
- [x] Run `npm install`
- [x] Verify `npm run dev` starts correctly
- [x] Test Three.js canvas renders
- [x] Confirm Tailwind styles working

### Water System
- [x] Implement wave vertex shader
- [x] Add foam on wave peaks
- [x] Tune wave height and frequency (Leva controls)
- [x] Add underwater fog

### Yacht Placeholder
- [x] Create catamaran hull geometry
- [x] Add outrigger/hydrofoil shape
- [x] Implement bobbing animation
- [x] Add roll/pitch with waves

### Camera
- [x] Orbit controls with limits
- [x] Follow player yacht
- [x] Zoom constraints
- [x] Optional first-person view (V key toggle)

### Basic Movement
- [x] WASD keyboard input
- [x] Throttle control
- [x] Steering with A/D
- [x] Speed based on throttle

---

## Sprint 3-4: Hull Builder (Weeks 3-4)

### Parametric Hull
- [ ] Length slider affects mesh
- [ ] Beam slider affects mesh
- [ ] Draft slider affects mesh
- [ ] Hull type switching (mono/cat/tri)

### Builder UI
- [ ] Builder panel component
- [ ] Real-time preview updates
- [ ] Stats display (speed, stability, drag)
- [ ] Save design button

### Physics Integration
- [ ] Drag coefficient calculation
- [ ] Stability calculation
- [ ] Max speed calculation
- [ ] Turn rate based on length

---

## Sprint 5-6: Kaleidoscope Editor (Weeks 5-6)

### Canvas Drawing
- [ ] Mouse/touch input capture
- [ ] Smooth line drawing
- [ ] Catmull-Rom spline interpolation
- [ ] Control points display

### Kaleidoscope Mirroring
- [ ] 2-blade (180°) symmetry
- [ ] 3-blade (120°) symmetry
- [ ] 4-blade (90°) symmetry
- [ ] 5-blade (72°) symmetry
- [ ] 6-blade (60°) symmetry
- [ ] Live preview while drawing

### Preset Library
- [ ] Darrieus preset
- [ ] Savonius preset
- [ ] NACA 0015 preset
- [ ] Modify presets with control points

### 3D Preview
- [ ] Generate turbine mesh from profile
- [ ] Helical extrusion along height
- [ ] Animated spin preview
- [ ] Wind tunnel mini-game

### Analysis
- [ ] Efficiency score calculation
- [ ] Balance/symmetry check
- [ ] Structural integrity estimate
- [ ] Suggested improvements

---

## Sprint 7-8: Energy System (Weeks 7-8)

### Wind System
- [ ] Global wind direction
- [ ] Wind speed zones
- [ ] Gust variation
- [ ] Wind indicator UI

### Turbine Power
- [ ] Power calculation formula
- [ ] Blade efficiency modifier
- [ ] Swept area calculation
- [ ] Real-time output display

### Solar System
- [ ] Time of day cycle
- [ ] Sun angle calculation
- [ ] Panel output based on coverage
- [ ] Cloud/weather effects

### Battery
- [ ] Charge/discharge model
- [ ] Capacity upgrades
- [ ] Battery UI bar
- [ ] Low battery warning

### Power Flow HUD
- [ ] Generation breakdown
- [ ] Consumption breakdown
- [ ] Net power indicator
- [ ] Range estimate

### Energy Credits
- [ ] Accumulate from generation
- [ ] Display total EC
- [ ] EC used for unlocks

---

## Sprint 9-10: World & Multiplayer (Weeks 9-10)

### World Generation
- [ ] Seed-based procedural
- [ ] Island placement algorithm
- [ ] Wind zones definition
- [ ] Central hub/marina

### Environment
- [ ] Skybox/sky shader
- [ ] Day/night cycle
- [ ] Weather transitions
- [ ] Distant island rendering

### Colyseus Server
- [ ] Server setup with rooms
- [ ] Player schema definition
- [ ] Position synchronization
- [ ] Yacht config sync

### Multiplayer Client
- [ ] Connect to server
- [ ] Send position updates
- [ ] Receive other players
- [ ] Render other yachts

### Racing
- [ ] Checkpoint system
- [ ] Race creation UI
- [ ] Timer and lap tracking
- [ ] Finish line detection

---

## Sprint 11-12: Polish & Launch (Weeks 11-12)

### Save/Load
- [ ] Save yacht to local storage
- [ ] Save to cloud (Supabase)
- [ ] Load yacht designs
- [ ] Design slots UI

### Progression
- [ ] Unlock system implementation
- [ ] Hull type unlocks
- [ ] Turbine style unlocks
- [ ] Battery capacity unlocks

### Tutorial
- [ ] First-run detection
- [ ] Optional tooltip system
- [ ] Contextual hints
- [ ] Dismissable tutorials

### Polish
- [ ] Sound effects (wind, water, motor)
- [ ] UI animations
- [ ] Loading screen
- [ ] Error handling

### Testing
- [ ] Closed alpha invites
- [ ] Feedback collection form
- [ ] Bug tracking setup
- [ ] Performance profiling

### Launch Prep
- [ ] Landing page
- [ ] Social media assets
- [ ] Demo video capture
- [ ] Documentation review

---

## Post-MVP Features (V1)

### Kite Sail
- [ ] Kite deployment UI
- [ ] Kite physics (simplified)
- [ ] Power boost calculation
- [ ] Visual kite model

### DJ Booth Module
- [ ] Module placement
- [ ] Visual DJ equipment
- [ ] Power consumption
- [ ] Party mode effects

### Weather System
- [ ] Storm events
- [ ] Doldrums zones
- [ ] Weather forecast UI
- [ ] Storm survival gameplay

### Points of Interest
- [ ] Marina locations
- [ ] Wind farm hotspots
- [ ] Discovery rewards
- [ ] Fast travel

### Leaderboards
- [ ] Top speeds
- [ ] Best efficiency
- [ ] Exploration %
- [ ] Race records

---

## Quality Checklist

### Performance
- [ ] 60 FPS on mid-range hardware
- [ ] < 3s initial load time
- [ ] Smooth multiplayer sync
- [ ] Memory leak checks

### Accessibility
- [ ] Keyboard navigation
- [ ] Color blind friendly UI
- [ ] Screen reader labels
- [ ] Reduced motion option

### Mobile (V2)
- [ ] Touch controls
- [ ] Responsive UI
- [ ] Performance optimization
- [ ] PWA support

---

## Notes

- Prioritize **Kaleidoscope Editor** as the unique selling point
- Keep physics **simple but satisfying**
- **Energy harvesting = fun** must be core to the loop
- Test multiplayer early to catch networking issues
- Get player feedback as soon as sailing feels good
