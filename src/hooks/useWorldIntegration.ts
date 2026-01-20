import { useEffect } from 'react'
import { useGameStore } from '../state/useGameStore'
import { useWorldStore } from '../state/useWorldStore'
import { getWindZoneAtPosition } from '../world/WorldGenerator'

/**
 * Hook to integrate world state with game mechanics:
 * - Apply wind zone modifiers based on position
 * - Handle docking/undocking
 * - Detect and reward POI discoveries
 */
export function useWorldIntegration() {
  const playerPos = useGameStore((state) => state.player.position)
  const setWind = useGameStore((state) => state.setWind)
  const setWeather = useGameStore((state) => state.setWeather)
  const gameMode = useGameStore((state) => state.gameMode)

  const world = useWorldStore((state) => state.world)
  const isDocked = useWorldStore((state) => state.isDocked)
  const dock = useWorldStore((state) => state.dock)
  const undock = useWorldStore((state) => state.undock)
  const discoverPOI = useWorldStore((state) => state.discoverPOI)
  const discoveredPOIs = useWorldStore((state) => state.discoveredPOIs)

  // Apply wind zone modifiers
  useEffect(() => {
    if (!world || gameMode === 'build') return

    const windZone = getWindZoneAtPosition(world.windZones, playerPos[0], playerPos[2])

    if (windZone) {
      // Apply wind zone's conditions
      const speedVariation = Math.sin(Date.now() / 5000) * 1 // Subtle variation
      setWind({
        direction: windZone.direction,
        speed: Math.max(1, windZone.speed + speedVariation),
      })
      setWeather(windZone.pattern as any)
    }
  }, [playerPos, world, gameMode, setWind, setWeather])

  // Handle docking
  useEffect(() => {
    if (!world || gameMode === 'build') return

    const marina = world.marina
    const dx = playerPos[0] - marina.position[0]
    const dz = playerPos[2] - marina.position[1]
    const distToMarina = Math.sqrt(dx * dx + dz * dz)

    // Enter docking zone
    if (distToMarina <= marina.dockingZoneRadius && !isDocked) {
      dock(marina.id)
    }

    // Leave docking zone
    if (distToMarina > marina.dockingZoneRadius * 1.2 && isDocked) {
      undock()
    }
  }, [playerPos, world, isDocked, dock, undock, gameMode])

  // Detect POI discoveries
  useEffect(() => {
    if (!world || gameMode === 'build') return

    for (const poi of world.pois) {
      if (discoveredPOIs.has(poi.id)) continue

      const dx = playerPos[0] - poi.position[0]
      const dz = playerPos[2] - poi.position[1]
      const distToPOI = Math.sqrt(dx * dx + dz * dz)

      // Discovery range: 500m
      if (distToPOI <= 500) {
        discoverPOI(poi.id)
      }
    }
  }, [playerPos, world, discoveredPOIs, discoverPOI, gameMode])
}
