# Debugging Guide - InfoRelax

## Overview

This guide helps you identify and fix errors that occur when playing InfoRelax, especially after clicking "SET SAIL" on the landing page.

---

## Error Display System

InfoRelax now includes an **Error Boundary** component that displays React errors on-screen instead of silently failing. If an error occurs:

### What You'll See
```
⚠️ Application Error

[Error message and stack trace displayed]

[Reload Application] button
```

### How to Respond
1. **Read the error message** - it will tell you exactly what went wrong
2. **Check the console** (F12) for more detailed debugging info
3. **Note any stack traces** - these point to the exact line causing the issue
4. **Click "Reload Application"** to restart after fixing code

---

## Common Errors & Solutions

### 1. "Cannot read property 'windZones' of null"

**Cause**: World is null when integration hook tries to access it

**Solution**: The world is initialized when you click "SET SAIL". If this error appears:
- Verify that the map selection correctly calls `initializeWorld()`
- Check that `useLandingStore.startGame()` is called after `initializeWorld()`
- Look in console for warnings about world generation

**Fix Implemented**:
```typescript
// In useWorldIntegration.ts
const world = useWorldStore((state) => state.world)

useEffect(() => {
  if (!world || gameMode === 'build') return  // <- Added null check
  // ... rest of hook
}, [world, gameMode, ...])
```

---

### 2. "island.elevation is not a function"

**Cause**: Island object doesn't have elevation function

**Solution**: The elevation function is created in `createElevationFunction()`. If missing:
- Check that `generateWorld()` properly creates islands
- Verify `world.islands` array has proper structure
- Look for errors in world generation

**Fix Implemented**:
```typescript
// In Islands.tsx - added error handling
try {
  const y = island.elevation(x, z)
  positions[i + 1] = isNaN(y) || !isFinite(y) ? 0 : y
} catch (error) {
  console.error('Error calculating elevation:', error)
  positions[i + 1] = 0  // Default to ground level
}
```

---

### 3. "NaN or Infinity in mesh positions"

**Cause**: Elevation function returns invalid numbers

**Solution**: Perlin noise or math operations might return NaN/Infinity

**Fix Implemented**:
```typescript
// In WorldGenerator.ts elevation function
const result = maxHeight * falloff * (0.8 + noiseVal)
return isNaN(result) || !isFinite(result) ? 0 : result
```

---

### 4. "Cannot read property 'length' of undefined"

**Cause**: Trying to access array property on undefined value

**Solution**: Check your array access patterns:
```typescript
// Bad - can crash if world is null
world.pois.map(...)  // <- Error if world is null

// Good - with null check
if (!world) return []
world.pois.map(...)
```

---

## Browser Console Debugging

### How to Access
1. **Windows/Linux**: Press `F12`
2. **Mac**: Press `Cmd + Option + I`
3. Look for the **Console** tab

### What to Look For

#### Errors
```
Uncaught TypeError: Cannot read property...
```
These appear in red and prevent the game from running.

#### Warnings
```
Warning: Each child in a list should have a unique "key" prop
```
These appear in yellow and usually don't break the game.

#### Log Messages
```
Error calculating elevation: TypeError...
Error creating POI mesh: poi-5
```
These are intentional debug messages to help identify issues.

### Copying Error Stack Traces
1. Right-click the error
2. Click "Copy stack trace"
3. Save it for troubleshooting

---

## Checklist - When Game Won't Load

### Landing Page Works, But Game Crashes After "SET SAIL"

- [ ] **Check browser console (F12)** - Look for red error messages
- [ ] **Read the error boundary message** - It displays specific errors
- [ ] **Check network tab** - Verify no failed resource loads
- [ ] **Verify map was selected** - Landing page should show "✓ Selected"
- [ ] **Check player name was set** - Default is "Navigator"

### Islands Not Showing

- [ ] **Check 3D canvas renders** - Should show ocean background
- [ ] **Verify world initialized** - Islands component has `if (!world) return []`
- [ ] **Check for mesh creation errors** - See console for "Error creating island mesh"
- [ ] **Verify Perlin noise works** - Look for elevation calculation errors

### POIs Not Visible

- [ ] **Zoom out or sail around** - POIs might be far away
- [ ] **Check PointsOfInterest component** - Should create cones for undiscovered
- [ ] **Verify world has POIs** - `world.pois` should have length > 0
- [ ] **Look for mesh creation errors** - Check console for POI errors

### Racing Won't Start

- [ ] **Check race configuration loaded** - Should see race menu on left
- [ ] **Verify checkpoints render** - Should see rings after race starts
- [ ] **Check RaceCheckpoints component** - Needs `currentRace` and `isRacing` = true
- [ ] **Look for checkpoint detection errors** - Check console

### Wind Zones Not Applying

- [ ] **Check game mode** - Wind zones only apply in Sail mode (not Build)
- [ ] **Verify world has wind zones** - `world.windZones` should have 4 zones
- [ ] **Look for integration hook errors** - Check `useWorldIntegration` logs
- [ ] **Verify wind speed changes** - HUD should show wind speed updates

---

## File-by-File Error Locations

### State Management
- **`src/state/useLandingStore.ts`** - Map selection errors
- **`src/state/useWorldStore.ts`** - World initialization errors
- **`src/state/useRaceStore.ts`** - Race state errors

### World Generation
- **`src/world/WorldGenerator.ts`** - Island/zone/POI generation (wrapped in try-catch)
- **`src/utils/Perlin.ts`** - Noise calculation (wrapped in try-catch)

### Three.js Components
- **`src/components/three/Islands.tsx`** - Island mesh errors (wrapped)
- **`src/components/three/Marina.tsx`** - Marina mesh errors (wrapped)
- **`src/components/three/PointsOfInterest.tsx`** - POI mesh errors (wrapped)
- **`src/components/three/RaceCheckpoints.tsx`** - Checkpoint rendering
- **`src/components/three/Yacht.tsx`** - Checkpoint detection logic

### UI Components
- **`src/components/ui/LandingPage.tsx`** - Landing page initialization
- **`src/components/ui/RaceUI.tsx`** - Race menu/HUD rendering
- **`src/components/ErrorBoundary.tsx`** - Error display

### Integration
- **`src/hooks/useWorldIntegration.ts`** - World system integration
- **`src/App.tsx`** - Main application flow
- **`src/main.tsx`** - Application entry point

---

## Advanced Debugging

### Enable Verbose Logging

Add this to components you want to debug:

```typescript
useEffect(() => {
  console.log('[ComponentName] Component mounted', {
    world,
    isRacing,
    playerPos
  })
  return () => console.log('[ComponentName] Component unmounted')
}, [world, isRacing, playerPos])
```

### Monitor Perlin Noise

```typescript
console.log('Perlin noise test:', perlin.noise(0.5, 0.5, 0))
// Should output a number between -1 and 1
```

### Check Store State

In browser console:
```javascript
// Zustand stores are global
useGameStore.getState()           // View game state
useWorldStore.getState()          // View world state
useRaceStore.getState()           // View race state
useLandingStore.getState()        // View landing state
```

### Performance Profiling

1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click **Record**
4. Play for 10 seconds
5. Click **Stop**
6. Look for:
   - Frames > 16ms (should be < 16ms for 60 FPS)
   - Large gaps in CPU usage
   - Garbage collection spikes

---

## Testing After Fixes

### 1. Test Landing Page
- [ ] Page loads without errors
- [ ] All 6 maps display
- [ ] Map selection works
- [ ] Player name input works

### 2. Test World Generation
- [ ] Can click "SET SAIL"
- [ ] Game canvas renders ocean
- [ ] Islands visible (may need to sail to see them)
- [ ] No console errors

### 3. Test Racing
- [ ] Can click "START RACE" button
- [ ] Race menu appears
- [ ] Can select a race
- [ ] Checkpoints appear on screen
- [ ] Checkpoint detection works

### 4. Test Integration
- [ ] Wind zones affect wind
- [ ] Marina auto-docks
- [ ] POIs discoverable
- [ ] Leaderboard updates

---

## Reporting Errors

If you find an error, please report:

1. **Error Message** - Exact text from error boundary or console
2. **Steps to Reproduce** - What you did when it happened
3. **Console Output** - Any red error messages
4. **Browser** - Chrome, Firefox, Safari, etc.
5. **Map Selected** - Which difficulty level
6. **Component** - Where you were (Landing, Sailing, Racing, etc.)

Example:
```
Error: Cannot read property 'islands' of null
Steps: 1) Load landing page 2) Click SET SAIL 3) Error appears
Browser: Chrome 120
Map: Serene Archipelago
Component: Islands rendering
```

---

## Quick Reference

| Symptom | Check | Fix |
|---------|-------|-----|
| Landing page won't load | Browser console | Hard refresh (Ctrl+Shift+R) |
| Game crashes after "SET SAIL" | Error boundary message | Read error details |
| Islands missing | Canvas renders | Check world initialization |
| Race won't start | Left side menu | Click "START RACE" first |
| Wind zones not working | Game mode is "Sail" | Switch from Build to Sail |
| Leaderboard empty | Finish a race | Complete race first |
| Frame rate drops | Performance tab | Check for GC spikes |
| Checkpoints not found | Console for errors | Verify race loaded |

---

## Getting Help

If you can't resolve an issue:

1. **Check this guide** - Most issues covered above
2. **Check browser console** (F12) - See exact error
3. **Reload the page** - Clear cache: Ctrl+Shift+R
4. **Check DEVELOPMENT_GUIDE.md** - Architecture context
5. **Check FEATURES.md** - How systems should work

---

## Version Information

- **Last Updated**: 2026-01-20
- **Branch**: `claude/world-gen-racing-system-eWbuH`
- **Build Status**: ✅ Passing
- **Error Handling**: ✅ Comprehensive
- **Console Logging**: ✅ Enabled
