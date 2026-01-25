import { useMemo } from 'react'
import { useWorldStore } from '../../state/useWorldStore'
import * as THREE from 'three'

export function Marina() {
  const marina = useWorldStore((state) => state.world?.marina)
  const isDocked = useWorldStore((state) => state.isDocked)

  const marinaMeshes = useMemo(() => {
    if (!marina) return { structures: [], lights: [] }

    try {
      const structures: THREE.Mesh[] = []
      const lights: THREE.PointLight[] = []

      const [centerX, centerZ] = marina.position

      // Material definitions
      const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b6f47,
        roughness: 0.8,
        metalness: 0,
      })

      const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x707070,
        roughness: 0.4,
        metalness: 0.8,
      })

      // ===== MAIN DOCK PLATFORM =====
      const mainDockGeo = new THREE.BoxGeometry(150, 3, 80)
      const mainDockMesh = new THREE.Mesh(mainDockGeo, woodMaterial)
      mainDockMesh.position.set(centerX, 1, centerZ + 40)
      mainDockMesh.castShadow = true
      mainDockMesh.receiveShadow = true
      structures.push(mainDockMesh)

      // ===== DOCKING PIERS (4 piers extending from main dock) =====
      for (let pier = 0; pier < 4; pier++) {
        const pierX = centerX - 60 + pier * 40
        const pierZ = centerZ + 80

        // Pier walkway
        const pierGeo = new THREE.BoxGeometry(15, 2, 80)
        const pierMesh = new THREE.Mesh(pierGeo, woodMaterial)
        pierMesh.position.set(pierX, 0.5, pierZ + 40)
        pierMesh.castShadow = true
        pierMesh.receiveShadow = true
        structures.push(pierMesh)

        // Pier pylons
        for (let p = 0; p < 5; p++) {
          const pylonGeo = new THREE.CylinderGeometry(1.5, 1.5, 15, 8)
          const pylonMesh = new THREE.Mesh(pylonGeo, woodMaterial)
          pylonMesh.position.set(pierX - 5, -7, pierZ + p * 20)
          structures.push(pylonMesh)

          const pylon2Mesh = new THREE.Mesh(pylonGeo, woodMaterial)
          pylon2Mesh.position.set(pierX + 5, -7, pierZ + p * 20)
          structures.push(pylon2Mesh)
        }

        // Dock cleats
        for (let c = 0; c < 3; c++) {
          const cleatGeo = new THREE.CylinderGeometry(0.5, 1, 2, 6)
          const cleatMesh = new THREE.Mesh(cleatGeo, metalMaterial)
          cleatMesh.position.set(pierX + 6, 2, pierZ + c * 30)
          structures.push(cleatMesh)
        }

        // Pier lights
        const pierLight = new THREE.PointLight(0xffa500, 20, 50)
        pierLight.position.set(pierX, 8, pierZ + 40)
        pierLight.castShadow = false
        lights.push(pierLight)

        // Light post
        const postGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8)
        const postMesh = new THREE.Mesh(postGeo, metalMaterial)
        postMesh.position.set(pierX, 4, pierZ + 40)
        structures.push(postMesh)

        // Light fixture
        const fixtureGeo = new THREE.SphereGeometry(1.5, 8, 8)
        const fixtureMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffa500,
          emissiveIntensity: 1,
        })
        const fixtureMesh = new THREE.Mesh(fixtureGeo, fixtureMaterial)
        fixtureMesh.position.set(pierX, 8, pierZ + 40)
        structures.push(fixtureMesh)
      }

      // ===== CHARGING STATIONS =====
      for (let cs = 0; cs < 3; cs++) {
        const stationX = centerX - 40 + cs * 40
        const stationZ = centerZ + 20

        // Charging pedestal
        const pedestalGeo = new THREE.BoxGeometry(6, 12, 6)
        const pedestalMesh = new THREE.Mesh(pedestalGeo, metalMaterial)
        pedestalMesh.position.set(stationX, 5, stationZ)
        pedestalMesh.castShadow = true
        structures.push(pedestalMesh)

        // Charging screen
        const screenGeo = new THREE.BoxGeometry(5, 4, 0.5)
        const screenMaterial = new THREE.MeshStandardMaterial({
          color: 0x00ff00,
          emissive: 0x00ff00,
          emissiveIntensity: 0.8,
        })
        const screenMesh = new THREE.Mesh(screenGeo, screenMaterial)
        screenMesh.position.set(stationX, 9, stationZ + 3.5)
        structures.push(screenMesh)

        // Charging cable (simplified)
        const cableGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8)
        const cableMesh = new THREE.Mesh(cableGeo, new THREE.MeshStandardMaterial({ color: 0x404040 }))
        cableMesh.position.set(stationX + 3, 7, stationZ)
        cableMesh.rotation.z = Math.PI / 4
        structures.push(cableMesh)
      }

      // ===== MOORED BOATS (decorative) =====
      for (let boat = 0; boat < 3; boat++) {
        const boatX = centerX - 50 + boat * 40
        const boatZ = centerZ + 90

        // Simple boat hull
        const hullGeo = new THREE.CapsuleGeometry(3, 12, 8, 16)
        const hullMesh = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.3,
          metalness: 0.5,
        }))
        hullMesh.position.set(boatX, 1, boatZ)
        hullMesh.rotation.z = Math.PI / 2
        hullMesh.rotation.x = Math.PI / 2
        hullMesh.castShadow = true
        structures.push(hullMesh)

        // Boat mast
        const mastGeo = new THREE.CylinderGeometry(0.3, 0.3, 15, 8)
        const mastMesh = new THREE.Mesh(mastGeo, woodMaterial)
        mastMesh.position.set(boatX, 8.5, boatZ)
        structures.push(mastMesh)
      }

      // ===== DOCKING ZONE INDICATOR =====
      const zoneGeometry = new THREE.RingGeometry(
        marina.dockingZoneRadius * 0.95,
        marina.dockingZoneRadius,
        64
      )
      const zoneMaterial = new THREE.MeshBasicMaterial({
        color: isDocked ? 0x00ff00 : 0x0099ff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      })
      const zoneMesh = new THREE.Mesh(zoneGeometry, zoneMaterial)
      zoneMesh.position.set(centerX, 0.2, centerZ)
      zoneMesh.rotation.x = -Math.PI / 2
      structures.push(zoneMesh)

      return { structures, lights }
    } catch (error) {
      console.error('Error creating marina meshes:', error)
      return { structures: [], lights: [] }
    }
  }, [marina, isDocked])

  return (
    <>
      {marinaMeshes.structures.map((mesh, i) => (
        <primitive key={`marina-struct-${i}`} object={mesh} />
      ))}
      {marinaMeshes.lights.map((light, i) => (
        <primitive key={`marina-light-${i}`} object={light} />
      ))}
    </>
  )
}
