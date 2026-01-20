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
      // Ring geometry for checkpoint marker
      const geometry = new THREE.RingGeometry(
        checkpoint.radius * 0.8,
        checkpoint.radius,
        32
      )

      // Color: red for completed, yellow for next, white for future
      let color: THREE.ColorRepresentation
      if (index < currentCheckpoint) {
        color = 0x00aa00 // Green for completed
      } else if (index === currentCheckpoint) {
        color = 0xffff00 // Yellow for next
      } else {
        color = 0xcccccc // Gray for future
      }

      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(checkpoint.position[0], 0.1, checkpoint.position[1])
      mesh.rotation.x = Math.PI / 2

      // Pulsing animation for current checkpoint
      if (index === currentCheckpoint && nearbyCheckpoints.includes(checkpoint.id)) {
        material.opacity = 0.8
      }

      return mesh
    })
  }, [currentRace, currentCheckpoint, isRacing, nearbyCheckpoints])

  return (
    <>
      {checkpointMeshes.map((mesh, i) => (
        <primitive key={`checkpoint-${i}`} object={mesh} />
      ))}
    </>
  )
}

/**
 * Wireframe visualization for wind zones (debug)
 */
export function WindZonesDebug() {
  // This would need world store integration
  return null
}
