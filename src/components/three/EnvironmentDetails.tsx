import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useWorldStore } from '../../state/useWorldStore'
import * as THREE from 'three'

/**
 * Environmental Details Component
 * Adds atmospheric elements like rocks, seabirds, floating debris, etc.
 */
export function EnvironmentDetails() {
  const world = useWorldStore((state) => state.world)
  const seabirdsRef = useRef<THREE.Group[]>([])

  const environmentMeshes = useMemo(() => {
    if (!world) return { rocks: [], seabirds: [], floatingDebris: [] }

    const rocks: THREE.Mesh[] = []
    const seabirds: THREE.Group[] = []
    const floatingDebris: THREE.Mesh[] = []

    // ===== COASTAL ROCKS =====
    // Add rocks around each island
    world.islands.forEach((island) => {
      const rockCount = Math.floor(island.radius / 30)

      for (let r = 0; r < rockCount; r++) {
        const angle = (r / rockCount) * Math.PI * 2 + Math.random() * 0.8
        const dist = island.radius * (0.8 + Math.random() * 0.3)
        const rockX = island.position[0] + Math.cos(angle) * dist
        const rockZ = island.position[1] + Math.sin(angle) * dist
        const rockY = island.elevation(rockX, rockZ)

        // Only place rocks near water level or on slopes
        if (rockY < island.height * 0.25) {
          const rockSize = 3 + Math.random() * 8

          // Create irregular rock shape using multiple spheres
          const rockGroup = new THREE.Group()

          for (let s = 0; s < 3; s++) {
            const subRockGeo = new THREE.DodecahedronGeometry(rockSize * (0.5 + Math.random() * 0.5), 0)
            const rockMaterial = new THREE.MeshStandardMaterial({
              color: island.type === 'volcanic' ? 0x4a4a4a :
                     island.type === 'coral' ? 0x8b7355 : 0x6b6b6b,
              roughness: 0.9,
              metalness: 0,
            })

            const subRock = new THREE.Mesh(subRockGeo, rockMaterial)
            subRock.position.set(
              Math.random() * rockSize * 0.5,
              Math.random() * rockSize * 0.3,
              Math.random() * rockSize * 0.5
            )
            subRock.rotation.set(
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            )
            subRock.castShadow = true
            subRock.receiveShadow = true
            rockGroup.add(subRock)
          }

          rockGroup.position.set(rockX, rockY - rockSize * 0.3, rockZ)
          rockGroup.rotation.y = Math.random() * Math.PI * 2

          rocks.push(...rockGroup.children as THREE.Mesh[])
        }
      }
    })

    // ===== SEABIRDS =====
    // Create animated seabirds circling around islands and marina
    const birdLocations = [
      ...world.islands.map(island => ({ pos: island.position, radius: island.radius })),
      { pos: world.marina.position, radius: 200 }
    ]

    birdLocations.forEach((location) => {
      const birdCount = 3 + Math.floor(Math.random() * 4)

      for (let b = 0; b < birdCount; b++) {
        const birdGroup = new THREE.Group()

        // Simple bird body
        const bodyGeo = new THREE.CapsuleGeometry(0.5, 2, 4, 8)
        const bodyMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.7,
        })
        const body = new THREE.Mesh(bodyGeo, bodyMaterial)
        body.rotation.z = Math.PI / 2
        birdGroup.add(body)

        // Wings (simple planes that will flap)
        const wingGeo = new THREE.PlaneGeometry(3, 1)
        const wingMaterial = new THREE.MeshStandardMaterial({
          color: 0xf0f0f0,
          side: THREE.DoubleSide,
          roughness: 0.6,
        })

        const leftWing = new THREE.Mesh(wingGeo, wingMaterial)
        leftWing.position.set(0, 0, -1.5)
        leftWing.rotation.y = Math.PI / 4
        birdGroup.add(leftWing)

        const rightWing = new THREE.Mesh(wingGeo, wingMaterial)
        rightWing.position.set(0, 0, 1.5)
        rightWing.rotation.y = -Math.PI / 4
        birdGroup.add(rightWing)

        // Position bird in circular flight path
        const angle = (b / birdCount) * Math.PI * 2
        const height = 40 + Math.random() * 30
        const radius = location.radius * (1.2 + Math.random() * 0.5)

        birdGroup.position.set(
          location.pos[0] + Math.cos(angle) * radius,
          height,
          location.pos[1] + Math.sin(angle) * radius
        )

        // Store metadata for animation
        birdGroup.userData = {
          centerX: location.pos[0],
          centerZ: location.pos[1],
          radius: radius,
          speed: 0.3 + Math.random() * 0.3,
          offset: Math.random() * Math.PI * 2,
          baseHeight: height,
          wingPhase: Math.random() * Math.PI * 2,
          leftWing,
          rightWing
        }

        seabirds.push(birdGroup)
      }
    })

    seabirdsRef.current = seabirds

    // ===== FLOATING DEBRIS =====
    // Add some floating objects (driftwood, buoys, etc.) on the water surface
    for (let d = 0; d < 15; d++) {
      const x = (Math.random() - 0.5) * (world.bounds.max[0] - world.bounds.min[0]) * 0.7
      const z = (Math.random() - 0.5) * (world.bounds.max[1] - world.bounds.min[1]) * 0.7

      // Avoid placing debris on islands
      let onIsland = false
      for (const island of world.islands) {
        const dx = x - island.position[0]
        const dz = z - island.position[1]
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist < island.radius) {
          onIsland = true
          break
        }
      }

      if (!onIsland) {
        const debrisType = Math.floor(Math.random() * 3)
        let debrisMesh: THREE.Mesh

        switch (debrisType) {
          case 0: // Driftwood
            const logGeo = new THREE.CylinderGeometry(0.5, 0.6, 8, 8)
            const logMat = new THREE.MeshStandardMaterial({
              color: 0x8b7355,
              roughness: 0.9,
            })
            debrisMesh = new THREE.Mesh(logGeo, logMat)
            debrisMesh.rotation.z = Math.PI / 2
            break

          case 1: // Buoy
            const buoyGeo = new THREE.SphereGeometry(1.5, 8, 8)
            const buoyMat = new THREE.MeshStandardMaterial({
              color: 0xff6b6b,
              roughness: 0.4,
              metalness: 0.3,
            })
            debrisMesh = new THREE.Mesh(buoyGeo, buoyMat)
            break

          default: // Barrel
            const barrelGeo = new THREE.CylinderGeometry(1, 1, 2, 8)
            const barrelMat = new THREE.MeshStandardMaterial({
              color: 0x4a4a4a,
              roughness: 0.6,
              metalness: 0.4,
            })
            debrisMesh = new THREE.Mesh(barrelGeo, barrelMat)
        }

        debrisMesh.position.set(x, 0.5, z)
        debrisMesh.rotation.y = Math.random() * Math.PI * 2
        debrisMesh.castShadow = true
        debrisMesh.userData = {
          bobPhase: Math.random() * Math.PI * 2,
          bobSpeed: 0.5 + Math.random() * 0.5
        }

        floatingDebris.push(debrisMesh)
      }
    }

    return { rocks, seabirds, floatingDebris }
  }, [world])

  // Animate seabirds and floating debris
  useFrame((state) => {
    const time = state.clock.elapsedTime

    // Animate seabirds circling
    seabirdsRef.current.forEach((bird) => {
      const data = bird.userData
      const angle = time * data.speed + data.offset

      // Circular flight path
      bird.position.x = data.centerX + Math.cos(angle) * data.radius
      bird.position.z = data.centerZ + Math.sin(angle) * data.radius

      // Gentle up/down motion
      bird.position.y = data.baseHeight + Math.sin(time * 0.5 + data.offset) * 3

      // Rotation to face direction of travel
      bird.rotation.y = angle + Math.PI / 2

      // Wing flapping
      const flapAngle = Math.sin(time * 10 + data.wingPhase) * 0.5
      data.leftWing.rotation.y = Math.PI / 4 + flapAngle
      data.rightWing.rotation.y = -Math.PI / 4 - flapAngle
    })

    // Animate floating debris bobbing
    environmentMeshes.floatingDebris.forEach((debris) => {
      const data = debris.userData
      debris.position.y = 0.5 + Math.sin(time * data.bobSpeed + data.bobPhase) * 0.3
      debris.rotation.y += 0.001
    })
  })

  return (
    <group>
      {/* Rocks */}
      {environmentMeshes.rocks.map((rock, idx) => (
        <primitive key={`rock-${idx}`} object={rock} />
      ))}

      {/* Seabirds */}
      {environmentMeshes.seabirds.map((bird, idx) => (
        <primitive key={`bird-${idx}`} object={bird} />
      ))}

      {/* Floating debris */}
      {environmentMeshes.floatingDebris.map((debris, idx) => (
        <primitive key={`debris-${idx}`} object={debris} />
      ))}
    </group>
  )
}
