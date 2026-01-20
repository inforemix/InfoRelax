import { useMemo } from 'react'
import { useWorldStore } from '../../state/useWorldStore'
import * as THREE from 'three'

export function Islands() {
  const world = useWorldStore((state) => state.world)

  const islandMeshes = useMemo(() => {
    if (!world) return []

    return world.islands.map((island) => {
      // Create terrain mesh with multiple segments for better elevation
      const geometry = new THREE.ConeGeometry(island.radius, island.height, 32, 8)

      // Apply elevation function to geometry vertices
      const positionAttribute = geometry.getAttribute('position')
      const positions = positionAttribute.array as Float32Array

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i] + island.position[0]
        const z = positions[i + 2] + island.position[1]
        const y = island.elevation(x, z)
        positions[i + 1] = y
      }

      positionAttribute.needsUpdate = true
      geometry.computeVertexNormals()

      // Island color based on type
      let color: THREE.ColorRepresentation
      switch (island.type) {
        case 'volcanic':
          color = 0x4a4a4a // Dark gray
          break
        case 'coral':
          color = 0xff9999 // Reddish
          break
        case 'sandy':
          color = 0xf4d03f // Golden
          break
      }

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.1,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(island.position[0], 0, island.position[1])
      mesh.castShadow = true
      mesh.receiveShadow = true

      return { mesh, island }
    })
  }, [world])

  return (
    <>
      {islandMeshes.map(({ mesh, island }) => (
        <primitive key={island.id} object={mesh} />
      ))}
    </>
  )
}
