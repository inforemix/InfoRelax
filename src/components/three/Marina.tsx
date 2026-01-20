import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useWorldStore } from '../../state/useWorldStore'
import * as THREE from 'three'

export function Marina() {
  const marina = useWorldStore((state) => state.world?.marina)
  const isDocked = useWorldStore((state) => state.isDocked)
  const lighthouseRef = useRef<THREE.PointLight>(null)

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

      const concreteMaterial = new THREE.MeshStandardMaterial({
        color: 0xa0a0a0,
        roughness: 0.7,
        metalness: 0.1,
      })

      const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x707070,
        roughness: 0.4,
        metalness: 0.8,
      })

      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        roughness: 0.6,
        metalness: 0.2,
      })

      // ===== MAIN HARBOR BUILDING =====
      // Building base
      const buildingBase = new THREE.BoxGeometry(60, 25, 40)
      const buildingMesh = new THREE.Mesh(buildingBase, concreteMaterial)
      buildingMesh.position.set(centerX, 12.5, centerZ - 100)
      buildingMesh.castShadow = true
      buildingMesh.receiveShadow = true
      structures.push(buildingMesh)

      // Building roof
      const roofGeo = new THREE.ConeGeometry(35, 15, 4)
      const roofMesh = new THREE.Mesh(roofGeo, roofMaterial)
      roofMesh.position.set(centerX, 32, centerZ - 100)
      roofMesh.rotation.y = Math.PI / 4
      roofMesh.castShadow = true
      structures.push(roofMesh)

      // Windows
      const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x6699cc,
        emissive: 0x4477aa,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.1,
      })

      for (let i = 0; i < 3; i++) {
        const windowGeo = new THREE.BoxGeometry(8, 6, 1)
        const window1 = new THREE.Mesh(windowGeo, windowMaterial)
        window1.position.set(centerX - 20 + i * 20, 15, centerZ - 80)
        structures.push(window1)

        const window2 = new THREE.Mesh(windowGeo, windowMaterial)
        window2.position.set(centerX - 20 + i * 20, 15, centerZ - 120)
        structures.push(window2)
      }

      // ===== LIGHTHOUSE =====
      // Lighthouse tower
      const lighthouseTower = new THREE.CylinderGeometry(6, 8, 50, 12)
      const lighthouseMesh = new THREE.Mesh(lighthouseTower, concreteMaterial)
      lighthouseMesh.position.set(centerX + 80, 25, centerZ - 80)
      lighthouseMesh.castShadow = true
      structures.push(lighthouseMesh)

      // Lighthouse top
      const lighthouseTop = new THREE.CylinderGeometry(8, 6, 8, 12)
      const lighthouseTopMesh = new THREE.Mesh(lighthouseTop, metalMaterial)
      lighthouseTopMesh.position.set(centerX + 80, 54, centerZ - 80)
      lighthouseTopMesh.castShadow = true
      structures.push(lighthouseTopMesh)

      // Lighthouse light
      const lighthouseLight = new THREE.PointLight(0xffff00, 100, 300)
      lighthouseLight.position.set(centerX + 80, 58, centerZ - 80)
      lighthouseLight.castShadow = true
      lights.push(lighthouseLight)

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
        const cableMesh = new THREE.Mesh(cableGeo, new THREE.MeshStandardMaterial({ color: 0x000000 }))
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

      // ===== FUEL/SUPPLY TANKS =====
      for (let tank = 0; tank < 2; tank++) {
        const tankX = centerX + 40
        const tankZ = centerZ - 100 + tank * 30

        const tankGeo = new THREE.CylinderGeometry(8, 8, 20, 16)
        const tankMesh = new THREE.Mesh(tankGeo, metalMaterial)
        tankMesh.position.set(tankX, 10, tankZ)
        tankMesh.rotation.z = Math.PI / 2
        tankMesh.castShadow = true
        structures.push(tankMesh)
      }

      // ===== STORAGE CONTAINERS =====
      for (let cont = 0; cont < 4; cont++) {
        const contX = centerX - 40
        const contZ = centerZ - 120 + cont * 15

        const containerGeo = new THREE.BoxGeometry(12, 8, 12)
        const colors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0x95e1d3]
        const containerMesh = new THREE.Mesh(containerGeo, new THREE.MeshStandardMaterial({
          color: colors[cont],
          roughness: 0.7,
          metalness: 0.5,
        }))
        containerMesh.position.set(contX, 4, contZ)
        containerMesh.castShadow = true
        containerMesh.receiveShadow = true
        structures.push(containerMesh)
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

  // Animate lighthouse light
  useFrame((state) => {
    if (lighthouseRef.current) {
      lighthouseRef.current.intensity = 100 + Math.sin(state.clock.elapsedTime * 2) * 50
    }
  })

  return (
    <>
      {marinaMeshes.structures.map((mesh, i) => (
        <primitive key={`marina-struct-${i}`} object={mesh} />
      ))}
      {marinaMeshes.lights.map((light, i) => {
        if (i === 0) {
          // Lighthouse light (animated)
          return <primitive key={`marina-light-${i}`} ref={lighthouseRef} object={light} />
        }
        return <primitive key={`marina-light-${i}`} object={light} />
      })}
    </>
  )
}
