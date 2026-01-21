import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/useGameStore'
import { useWorldStore } from '../state/useWorldStore'
import { checkIcebergCollision } from '../world/WorldGenerator'

// Check if boat is colliding with any iceberg (works in both racing and free sailing)
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
    if (!world || !world.icebergs || world.icebergs.length === 0) return

    // Throttle collision checks (every 50ms)
    const now = Date.now()
    if (now - lastCheckRef.current < 50) return
    lastCheckRef.current = now

    // Check for collision with world icebergs
    const boatX = player.position[0]
    const boatZ = player.position[2]
    const boatRadius = 8 // Approximate boat collision radius

    const collision = checkIcebergCollision(world.icebergs, boatX, boatZ, boatRadius)

    if (collision.collided && collision.iceberg) {
      handleCollision(
        collision.iceberg.id,
        collision.penetration,
        collision.normal[0],
        collision.normal[1],
        collision.iceberg.radius
      )
    }
  }, [player.position, gameMode, world, handleCollision])
}
