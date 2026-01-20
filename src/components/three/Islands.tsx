import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useWorldStore } from '../../state/useWorldStore'
import * as THREE from 'three'
import { createTerrainMaterial } from '../../shaders/TerrainShader'

export function Islands() {
  const world = useWorldStore((state) => state.world)
  const materialsRef = useRef<THREE.ShaderMaterial[]>([])

  const islandMeshes = useMemo(() => {
    if (!world) return []

    materialsRef.current = []

    try {
      return world.islands
        .map((island) => {
          try {
            // Create high-resolution terrain mesh
            // Increased segments for smoother, more detailed terrain
            const radialSegments = 64  // Doubled from 32
            const heightSegments = 16  // Doubled from 8
            const geometry = new THREE.ConeGeometry(
              island.radius,
              island.height,
              radialSegments,
              heightSegments
            )

            // Apply elevation function to geometry vertices with enhanced detail
            const positionAttribute = geometry.getAttribute('position')
            const positions = positionAttribute.array as Float32Array

            for (let i = 0; i < positions.length; i += 3) {
              const localX = positions[i]
              const localZ = positions[i + 2]
              const worldX = localX + island.position[0]
              const worldZ = localZ + island.position[1]

              // Get base elevation from world generator
              const baseY = island.elevation(worldX, worldZ)

              // Add micro-detail variation for realism
              const distFromCenter = Math.sqrt(localX * localX + localZ * localZ)
              const normalizedDist = distFromCenter / island.radius

              // Add subtle noise-based detail that doesn't affect overall shape
              const detail = Math.sin(worldX * 0.5) * Math.cos(worldZ * 0.5) * 2
              const detailStrength = Math.pow(1 - normalizedDist, 2) * 0.3

              const finalY = baseY + detail * detailStrength
              positions[i + 1] = isNaN(finalY) || !isFinite(finalY) ? 0 : finalY
            }

            positionAttribute.needsUpdate = true
            geometry.computeVertexNormals()

            // Add beach/shore vertices by duplicating and lowering base vertices
            const beachGeometry = geometry.clone()
            const beachPositions = beachGeometry.getAttribute('position').array as Float32Array
            for (let i = 0; i < beachPositions.length; i += 3) {
              if (beachPositions[i + 1] < island.height * 0.1) {
                beachPositions[i + 1] = -1 // Slightly below water level
              }
            }
            beachGeometry.computeVertexNormals()

            // Create advanced terrain material with shader
            const material = createTerrainMaterial(island.height, island.type)
            materialsRef.current.push(material)

            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(island.position[0], 0, island.position[1])
            mesh.castShadow = true
            mesh.receiveShadow = true

            // Create beach mesh with standard material
            const beachMaterial = new THREE.MeshStandardMaterial({
              color: island.type === 'volcanic' ? 0x3a3a3a :
                     island.type === 'coral' ? 0xffd4a3 : 0xf4e4c1,
              roughness: 0.9,
              metalness: 0,
            })
            const beachMesh = new THREE.Mesh(beachGeometry, beachMaterial)
            beachMesh.position.set(island.position[0], 0, island.position[1])
            beachMesh.receiveShadow = true

            // Add vegetation instances for grass/rock zones (simple cylinders for trees)
            const vegetation: THREE.Mesh[] = []
            if (island.height > 80) {
              const treeCount = Math.floor(island.radius / 50)
              for (let t = 0; t < treeCount; t++) {
                const angle = (t / treeCount) * Math.PI * 2 + Math.random() * 0.5
                const dist = island.radius * (0.3 + Math.random() * 0.3)
                const treeX = island.position[0] + Math.cos(angle) * dist
                const treeZ = island.position[1] + Math.sin(angle) * dist
                const treeY = island.elevation(treeX, treeZ)

                if (treeY > island.height * 0.2 && treeY < island.height * 0.6) {
                  // Tree trunk
                  const trunkGeo = new THREE.CylinderGeometry(1.5, 2, 8, 6)
                  const trunkMat = new THREE.MeshStandardMaterial({
                    color: 0x4a3728,
                    roughness: 0.9
                  })
                  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
                  trunk.position.set(treeX, treeY + 4, treeZ)
                  trunk.castShadow = true
                  vegetation.push(trunk)

                  // Tree foliage
                  const foliageGeo = new THREE.ConeGeometry(5, 12, 6)
                  const foliageMat = new THREE.MeshStandardMaterial({
                    color: island.type === 'volcanic' ? 0x2a4a2a : 0x3a7a3a,
                    roughness: 0.8
                  })
                  const foliage = new THREE.Mesh(foliageGeo, foliageMat)
                  foliage.position.set(treeX, treeY + 12, treeZ)
                  foliage.castShadow = true
                  vegetation.push(foliage)
                }
              }
            }

            return { mesh, beachMesh, vegetation, island, material }
          } catch (error) {
            console.error('Error creating island mesh:', island.id, error)
            return null
          }
        })
        .filter((item) => item !== null) as Array<{
          mesh: THREE.Mesh
          beachMesh: THREE.Mesh
          vegetation: THREE.Mesh[]
          island: any
          material: THREE.ShaderMaterial
        }>
    } catch (error) {
      console.error('Error creating island meshes:', error)
      return []
    }
  }, [world])

  // Animate shader uniforms
  useFrame((state) => {
    materialsRef.current.forEach((material) => {
      if (material.uniforms.uTime) {
        material.uniforms.uTime.value = state.clock.elapsedTime
      }
    })
  })

  return (
    <>
      {islandMeshes.map(({ mesh, beachMesh, vegetation, island }) => (
        <group key={island.id}>
          <primitive object={mesh} />
          <primitive object={beachMesh} />
          {vegetation.map((veg, idx) => (
            <primitive key={`${island.id}-veg-${idx}`} object={veg} />
          ))}
        </group>
      ))}
    </>
  )
}
