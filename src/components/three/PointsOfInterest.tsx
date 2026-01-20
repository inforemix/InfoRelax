import { useMemo } from 'react'
import { useWorldStore } from '../../state/useWorldStore'
import * as THREE from 'three'

export function PointsOfInterest() {
  const world = useWorldStore((state) => state.world)
  const discoveredPOIs = useWorldStore((state) => state.discoveredPOIs)

  const poiMeshes = useMemo(() => {
    if (!world) return []

    return world.pois.map((poi) => {
      // Determine color based on type and discovery status
      let color: THREE.ColorRepresentation
      const isDiscovered = discoveredPOIs.has(poi.id)

      switch (poi.type) {
        case 'reef':
          color = isDiscovered ? 0x0088ff : 0x004488
          break
        case 'wreck':
          color = isDiscovered ? 0x8844ff : 0x442244
          break
        case 'buoy':
          color = isDiscovered ? 0xff8800 : 0x884400
          break
        case 'wildlife':
          color = isDiscovered ? 0x00ff88 : 0x008844
          break
        case 'research-station':
          color = isDiscovered ? 0xffff00 : 0x888800
          break
      }

      // Create a cone for undiscovered, sphere for discovered
      let geometry: THREE.BufferGeometry
      if (isDiscovered) {
        geometry = new THREE.SphereGeometry(15, 16, 16)
      } else {
        geometry = new THREE.ConeGeometry(20, 30, 8)
      }

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.3,
        emissive: isDiscovered ? new THREE.Color(color).multiplyScalar(0.5) : 0x000000,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(poi.position[0], isDiscovered ? 10 : 15, poi.position[1])
      mesh.castShadow = true
      mesh.receiveShadow = true

      return mesh
    })
  }, [world, discoveredPOIs])

  return (
    <>
      {poiMeshes.map((mesh, i) => (
        <primitive key={`poi-${i}`} object={mesh} />
      ))}
    </>
  )
}
