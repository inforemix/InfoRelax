import { useWorldStore } from '../../state/useWorldStore'

/**
 * PointsOfInterest - Minimal visual representation
 *
 * POIs are primarily shown on the world map. In 3D space, we only show
 * subtle visual cues for nearby discovered POIs to avoid visual clutter.
 *
 * The heavy sphere/cone rendering has been removed as it didn't fit
 * the game's aesthetic.
 */
export function PointsOfInterest() {
  const world = useWorldStore((state) => state.world)

  if (!world) return null

  // POIs are now only shown on the minimap for cleaner visuals
  // Future: Add subtle glow or particle effects for nearby POIs
  return null
}
