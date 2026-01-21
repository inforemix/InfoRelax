import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../state/useGameStore'

export function WeatherEffects() {
  const weather = useGameStore((state) => state.weather)
  const playerPosition = useGameStore((state) => state.player.position)

  const rainRef = useRef<THREE.Points>(null)
  const snowRef = useRef<THREE.Points>(null)
  const fogRef = useRef<THREE.Mesh>(null)

  // Rain particle system
  const rainGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(5000 * 3)
    const velocities = new Float32Array(5000)

    for (let i = 0; i < 5000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400
      positions[i * 3 + 1] = Math.random() * 200
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400
      velocities[i] = 20 + Math.random() * 30
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1))

    return geometry
  }, [])

  const rainMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.5,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // Snow particle system
  const snowGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(3000 * 3)
    const velocities = new Float32Array(3000)

    for (let i = 0; i < 3000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400
      positions[i * 3 + 1] = Math.random() * 200
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400
      velocities[i] = 2 + Math.random() * 3
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1))

    return geometry
  }, [])

  const snowMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      transparent: true,
      opacity: 0.8,
      map: createSnowflakeTexture(),
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // Animate particles
  useFrame((state, delta) => {
    // Update rain
    if (rainRef.current && (weather === 'storm' || weather === 'cloudy')) {
      const positions = rainGeometry.attributes.position.array as Float32Array
      const velocities = rainGeometry.attributes.velocity.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= velocities[i] * delta

        // Reset particle if it falls below sea level
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 200
          positions[i * 3] = playerPosition[0] + (Math.random() - 0.5) * 400
          positions[i * 3 + 2] = playerPosition[2] + (Math.random() - 0.5) * 400
        }
      }

      // Follow player
      rainRef.current.position.set(playerPosition[0], 0, playerPosition[2])
      rainGeometry.attributes.position.needsUpdate = true
    }

    // Update snow
    if (snowRef.current && weather === 'storm') {
      const positions = snowGeometry.attributes.position.array as Float32Array
      const velocities = snowGeometry.attributes.velocity.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] -= velocities[i] * delta

        // Gentle drift
        positions[i * 3] += Math.sin(state.clock.elapsedTime + i) * 0.05
        positions[i * 3 + 2] += Math.cos(state.clock.elapsedTime + i) * 0.05

        // Reset particle
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 200
          positions[i * 3] = playerPosition[0] + (Math.random() - 0.5) * 400
          positions[i * 3 + 2] = playerPosition[2] + (Math.random() - 0.5) * 400
        }
      }

      snowRef.current.position.set(playerPosition[0], 0, playerPosition[2])
      snowGeometry.attributes.position.needsUpdate = true
    }
  })

  const isRaining = weather === 'storm' || weather === 'cloudy'
  const isSnowing = weather === 'storm'
  const showFog = weather === 'cloudy' || weather === 'storm'

  return (
    <group>
      {/* Rain */}
      {isRaining && (
        <points ref={rainRef} geometry={rainGeometry} material={rainMaterial} />
      )}

      {/* Snow */}
      {isSnowing && (
        <points ref={snowRef} geometry={snowGeometry} material={snowMaterial} />
      )}

      {/* Fog sphere around player */}
      {showFog && (
        <mesh ref={fogRef} position={[playerPosition[0], 50, playerPosition[2]]}>
          <sphereGeometry args={[300, 16, 16]} />
          <meshBasicMaterial
            color={weather === 'storm' ? 0x334455 : 0x889999}
            transparent
            opacity={weather === 'storm' ? 0.3 : 0.15}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

// Create snowflake texture
function createSnowflakeTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)

  const texture = new THREE.Texture(canvas)
  texture.needsUpdate = true
  return texture
}
