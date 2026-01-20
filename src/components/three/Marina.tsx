import { useMemo } from 'react'
import { useWorldStore } from '../../state/useWorldStore'
import * as THREE from 'three'

export function Marina() {
  const marina = useWorldStore((state) => state.world?.marina)
  const isDocked = useWorldStore((state) => state.isDocked)

  const marinaMeshes = useMemo(() => {
    if (!marina) return []

    const meshes = []

    // Central dock structure
    const dockGeometry = new THREE.CylinderGeometry(marina.dockingZoneRadius * 0.6, marina.dockingZoneRadius * 0.6, 2, 32)
    const dockMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513, // Brown/wood color
      roughness: 0.6,
      metalness: 0,
    })
    const dockMesh = new THREE.Mesh(dockGeometry, dockMaterial)
    dockMesh.position.set(marina.position[0], 0.5, marina.position[1])
    dockMesh.castShadow = true
    dockMesh.receiveShadow = true
    meshes.push(dockMesh)

    // Docking zone indicator (large ring)
    const zoneGeometry = new THREE.RingGeometry(
      marina.dockingZoneRadius * 0.9,
      marina.dockingZoneRadius,
      32
    )
    const zoneMaterial = new THREE.MeshBasicMaterial({
      color: isDocked ? 0x00ff00 : 0x0099ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    })
    const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial)
    zoneMesh.position.set(marina.position[0], 0.15, marina.position[1])
    zoneMesh.rotation.x = Math.PI / 2
    meshes.push(zoneMesh)

    // Fuel/charge station (cone)
    const stationGeometry = new THREE.ConeGeometry(20, 15, 8)
    const stationMaterial = new THREE.MeshStandardMaterial({
      color: 0xff9900, // Orange
      roughness: 0.5,
      metalness: 0.3,
      emissive: 0xff6600,
    })
    const stationMesh = new THREE.Mesh(stationGeometry, stationMaterial)
    stationMesh.position.set(marina.position[0], 7.5, marina.position[1])
    stationMesh.castShadow = true
    stationMesh.receiveShadow = true
    meshes.push(stationMesh)

    return meshes
  }, [marina, isDocked])

  return (
    <>
      {marinaMeshes.map((mesh, i) => (
        <primitive key={`marina-${i}`} object={mesh} />
      ))}
    </>
  )
}
