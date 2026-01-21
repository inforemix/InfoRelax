import { useMemo } from 'react'
import { useRaceStore } from '../../state/useRaceStore'
import { useGameStore } from '../../state/useGameStore'
import * as THREE from 'three'

export function RaceCheckpoints() {
  const currentRace = useRaceStore((state) => state.currentRace)
  const currentCheckpoint = useRaceStore((state) => state.currentCheckpoint)
  const isRacing = useRaceStore((state) => state.isRacing)
  const nearbyCheckpoints = useGameStore((state) => state.nearbyCheckpoints)

  const checkpointMeshes = useMemo(() => {
    if (!currentRace || !isRacing) return []

    return currentRace.checkpoints.map((checkpoint, index) => {
      // Thin flat ring on the water surface
      const innerRadius = checkpoint.radius * 0.85
      const outerRadius = checkpoint.radius
      const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 48)

      const isPassed = index < currentCheckpoint
      const isCurrent = index === currentCheckpoint
      const isNext = index === currentCheckpoint + 1
      const isFinish = index === currentRace.checkpoints.length - 1

      // Determine color based on state
      let color: THREE.ColorRepresentation
      let opacity: number

      if (isPassed) {
        color = 0x2a5a2a // Dark green for completed
        opacity = 0.3
      } else if (isCurrent) {
        color = isFinish ? 0xffaa00 : 0x00ff88 // Gold for finish, bright green for current
        opacity = nearbyCheckpoints.includes(checkpoint.id) ? 0.9 : 0.7
      } else if (isNext) {
        color = 0x4488aa // Blue-ish for upcoming
        opacity = 0.5
      } else {
        color = 0x3a5a6a // Muted blue-gray for distant
        opacity = 0.25
      }

      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(checkpoint.position[0], 0.5, checkpoint.position[1])
      mesh.rotation.x = -Math.PI / 2 // Lay flat on water

      return { mesh, isCurrent, isFinish, position: checkpoint.position }
    })
  }, [currentRace, currentCheckpoint, isRacing, nearbyCheckpoints])

  if (!currentRace || !isRacing) return null

  return (
    <group name="race-checkpoints">
      {checkpointMeshes.map((item, i) => (
        <primitive key={`checkpoint-${i}`} object={item.mesh} />
      ))}
    </group>
  )
}

/**
 * Wireframe visualization for wind zones (debug)
 */
export function WindZonesDebug() {
  // This would need world store integration
  return null
}
