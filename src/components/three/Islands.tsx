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
            // Create high-resolution iceberg/arctic terrain mesh
            const radialSegments = 64
            const heightSegments = 16
            const geometry = new THREE.ConeGeometry(
              island.radius,
              island.height,
              radialSegments,
              heightSegments
            )

            // Apply elevation function to geometry vertices with iceberg-like deformation
            const positionAttribute = geometry.getAttribute('position')
            const positions = positionAttribute.array as Float32Array

            for (let i = 0; i < positions.length; i += 3) {
              const localX = positions[i]
              const localZ = positions[i + 2]
              const worldX = localX + island.position[0]
              const worldZ = localZ + island.position[1]

              // Get base elevation
              const baseY = island.elevation(worldX, worldZ)

              const distFromCenter = Math.sqrt(localX * localX + localZ * localZ)
              const normalizedDist = distFromCenter / island.radius

              // Iceberg-style irregular deformation
              // Add dramatic vertical striations and jagged edges
              const verticalStripes = Math.sin(worldX * 0.3) * Math.cos(worldZ * 0.3) * 8
              const jaggedEdges = Math.sin(worldX * 0.8 + worldZ * 0.6) * 4
              const erosion = Math.pow(Math.sin(worldX * 1.5) * Math.cos(worldZ * 1.5), 2) * 6

              // Combine effects - stronger at mid-heights for that sculpted look
              const heightFactor = Math.sin(normalizedDist * Math.PI) // Peaks at middle
              const icebergDetail = (verticalStripes + jaggedEdges + erosion) * heightFactor

              // Add underwater portion (icebergs extend below water)
              const underwaterExtension = normalizedDist > 0.8 ? -island.height * 0.3 : 0

              const finalY = baseY + icebergDetail + underwaterExtension
              positions[i + 1] = isNaN(finalY) || !isFinite(finalY) ? 0 : finalY
            }

            positionAttribute.needsUpdate = true
            geometry.computeVertexNormals()

            // Add underwater ice shelf by duplicating and extending base
            const iceShelfGeometry = geometry.clone()
            const shelfPositions = iceShelfGeometry.getAttribute('position').array as Float32Array
            for (let i = 0; i < shelfPositions.length; i += 3) {
              if (shelfPositions[i + 1] < island.height * 0.2) {
                shelfPositions[i + 1] = Math.min(shelfPositions[i + 1], -5) // Extend underwater
              }
            }
            iceShelfGeometry.computeVertexNormals()

            // Create iceberg material with 'iceberg' or 'arctic' type
            const icebergType = island.type === 'volcanic' ? 'volcanic' : 'iceberg'
            const material = createTerrainMaterial(island.height, icebergType)
            materialsRef.current.push(material)

            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(island.position[0], 0, island.position[1])
            mesh.castShadow = true
            mesh.receiveShadow = true

            // Create ice shelf mesh with translucent ice material
            const iceShelfMaterial = new THREE.MeshStandardMaterial({
              color: 0xc8e8f0,
              roughness: 0.1,
              metalness: 0.1,
              transparent: true,
              opacity: 0.8,
              depthWrite: true,
              depthTest: true,
              side: THREE.FrontSide,
              polygonOffset: true,
              polygonOffsetFactor: 1,
              polygonOffsetUnits: 1,
            })
            const beachMesh = new THREE.Mesh(iceShelfGeometry, iceShelfMaterial)
            beachMesh.position.set(island.position[0], -2.0, island.position[1])
            beachMesh.receiveShadow = true

            // No vegetation on icebergs - they're pure ice and snow
            const vegetation: THREE.Mesh[] = []

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
