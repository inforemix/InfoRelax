import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/useGameStore'
import { useWorldStore } from '../state/useWorldStore'
import { checkIcebergCollision, checkFloatingIceCollision } from '../world/WorldGenerator'

// Check if boat is colliding with any ice (icebergs or floating ice)
export function useIcebergCollision() {
  const player = useGameStore((state) => state.player)
  const handleCollision = useGameStore((state) => state.handleCollision)
  const gameMode = useGameStore((state) => state.gameMode)
  const world = useWorldStore((state) => state.world)

  const lastCheckRef = useRef<number>(0)

  useEffect(() => {
    // Skip collision checks in build mode
    if (gameMode === 'build') return

    // Skip if no world loaded
    if (!world) return

    // Throttle collision checks (every 50ms)
    const now = Date.now()
    if (now - lastCheckRef.current < 50) return
    lastCheckRef.current = now

    // Check for collision with world icebergs
    const boatX = player.position[0]
    const boatZ = player.position[2]
    const boatRadius = 8 // Approximate boat collision radius

    // Check large icebergs first
    if (world.icebergs && world.icebergs.length > 0) {
      const collision = checkIcebergCollision(world.icebergs, boatX, boatZ, boatRadius)

      if (collision.collided && collision.iceberg) {
        handleCollision(
          collision.iceberg.id,
          collision.penetration,
          collision.normal[0],
          collision.normal[1],
          collision.iceberg.radius
        )
        return // One collision per frame is enough
      }
    }

    // Check floating ice
    if (world.floatingIce && world.floatingIce.length > 0) {
      const floatingCollision = checkFloatingIceCollision(world.floatingIce, boatX, boatZ, boatRadius)

      if (floatingCollision.collided && floatingCollision.ice) {
        // Floating ice does less damage but still affects the boat
        handleCollision(
          floatingCollision.ice.id,
          floatingCollision.penetration * 0.5, // Less penetration push
          floatingCollision.normal[0],
          floatingCollision.normal[1],
          floatingCollision.ice.radius * 0.5 // Smaller effective size for damage calc
        )
      }
    }
  }, [player.position, gameMode, world, handleCollision])
}
