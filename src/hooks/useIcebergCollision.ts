import { useEffect, useRef } from 'react'
import { useGameStore } from '../state/useGameStore'
import { useRaceStore } from '../state/useRaceStore'
import { getIcebergPositions, RaceDifficulty } from '../components/three/Icebergs'

// Check if boat is colliding with any iceberg
export function useIcebergCollision() {
  const player = useGameStore((state) => state.player)
  const currentRace = useRaceStore((state) => state.currentRace)
  const isRacing = useRaceStore((state) => state.isRacing)
  const difficulty = useRaceStore((state) => state.difficulty)
  const registerCollision = useRaceStore((state) => state.registerCollision)

  const lastCheckRef = useRef<number>(0)
  const collidedIcebergsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!isRacing || !currentRace) {
      collidedIcebergsRef.current.clear()
      return
    }

    // Throttle collision checks (every 50ms)
    const now = Date.now()
    if (now - lastCheckRef.current < 50) return
    lastCheckRef.current = now

    // Get iceberg positions
    const icebergs = getIcebergPositions(
      currentRace.checkpoints,
      difficulty as RaceDifficulty,
      currentRace.id
    )

    // Boat collision radius (approximate hull size)
    const boatRadius = 8

    // Check each iceberg
    for (const iceberg of icebergs) {
      const dx = player.position[0] - iceberg.position[0]
      const dz = player.position[2] - iceberg.position[2]
      const distance = Math.sqrt(dx * dx + dz * dz)

      // Collision threshold
      const collisionThreshold = iceberg.radius + boatRadius

      if (distance < collisionThreshold) {
        // Check if we've already registered this collision recently
        if (!collidedIcebergsRef.current.has(iceberg.id)) {
          // Calculate damage based on speed
          const speedFactor = Math.max(1, player.speed / 5)
          const baseDamage = 10 + (iceberg.radius / 30) * 5 // Larger icebergs = more damage
          const damage = baseDamage * speedFactor

          registerCollision(damage)
          collidedIcebergsRef.current.add(iceberg.id)

          // Clear this iceberg from collision set after 3 seconds
          setTimeout(() => {
            collidedIcebergsRef.current.delete(iceberg.id)
          }, 3000)
        }
      }
    }
  }, [player.position, player.speed, isRacing, currentRace, difficulty, registerCollision])
}
