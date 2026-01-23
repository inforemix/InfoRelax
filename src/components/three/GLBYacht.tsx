import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface GLBYachtProps {
  scale?: number
}

export function GLBYacht({ scale = 1.0 }: GLBYachtProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Load the yacht GLB model
  const { scene } = useGLTF('/assets/futuristic+boat+3d+model.glb')

  useEffect(() => {
    if (scene) {
      // Enable shadows for all meshes
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true

          // Enhance materials for better visuals
          if (child.material) {
            const mat = child.material as THREE.MeshStandardMaterial
            if (mat.isMeshStandardMaterial) {
              mat.envMapIntensity = 1.5
              mat.needsUpdate = true
            }
          }
        }
      })
    }
  }, [scene])

  return (
    <group ref={groupRef}>
      <primitive
        object={scene.clone()}
        scale={[scale, scale, scale]}
        // Rotate to align with movement direction (bow facing +Z)
        rotation={[0, Math.PI, 0]}
      />
    </group>
  )
}

// Preload the model
useGLTF.preload('/assets/futuristic+boat+3d+model.glb')
