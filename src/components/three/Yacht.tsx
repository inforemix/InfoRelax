import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'

import { useYachtStore } from '@/state/useYachtStore'
import { useGameStore } from '@/state/useGameStore'
import { useKeyboard } from '@/utils/useKeyboard'

// Placeholder yacht mesh until we have the E-Cat model
function PlaceholderHull({ length, beam }: { length: number, beam: number }) {
  return (
    <group>
      {/* Main hull (catamaran style) */}
      <mesh position={[0, 0.5, -beam / 2]} castShadow>
        <boxGeometry args={[length, 0.8, 0.6]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, beam / 2]} castShadow>
        <boxGeometry args={[length, 0.8, 0.6]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.7} />
      </mesh>
      
      {/* Cross beams */}
      <mesh position={[length * 0.2, 0.6, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, beam + 0.6]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      <mesh position={[-length * 0.2, 0.6, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, beam + 0.6]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      
      {/* Deck */}
      <mesh position={[0, 0.8, 0]} receiveShadow>
        <boxGeometry args={[length * 0.7, 0.1, beam * 0.8]} />
        <meshStandardMaterial color="#8b5cf6" metalness={0.5} roughness={0.3} />
      </mesh>
      
      {/* Cabin */}
      <mesh position={[length * 0.15, 1.2, 0]} castShadow>
        <boxGeometry args={[length * 0.3, 0.6, beam * 0.4]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Outrigger/Hydrofoil */}
      <mesh position={[-length * 0.4, 0.3, -beam - 0.5]} castShadow>
        <capsuleGeometry args={[0.3, 2, 4, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  )
}

// Placeholder turbine
function PlaceholderTurbine({ height, diameter, bladeCount, rotation }: {
  height: number
  diameter: number
  bladeCount: number
  rotation: number
}) {
  return (
    <group position={[0, height / 2 + 1, 0]}>
      {/* Tower */}
      <mesh castShadow>
        <cylinderGeometry args={[0.15, 0.2, height, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Rotating blades */}
      <group position={[0, height / 2, 0]} rotation={[0, rotation, 0]}>
        {Array.from({ length: bladeCount }).map((_, i) => {
          const angle = (i / bladeCount) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.sin(angle) * diameter / 2, 0, Math.cos(angle) * diameter / 2]}
              rotation={[0, -angle, Math.PI / 6]}
              castShadow
            >
              {/* Helical blade (simplified as curved box) */}
              <boxGeometry args={[0.1, height * 0.8, diameter * 0.3]} />
              <meshStandardMaterial 
                color="#06b6d4" 
                metalness={0.6} 
                roughness={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

export function Yacht() {
  const groupRef = useRef<THREE.Group>(null)
  const turbineRotation = useRef(0)

  // Get yacht config from store
  const { currentYacht, stats } = useYachtStore()
  const { hull, turbine } = currentYacht

  // Get game state
  const { wind, player, tick, setThrottle, setSteering } = useGameStore()

  // Keyboard input
  const keys = useKeyboard()

  // Get camera for follow
  const { camera } = useThree()

  // Debug controls
  const { bobAmount, bobSpeed } = useControls('Yacht', {
    bobAmount: { value: 0.2, min: 0, max: 1 },
    bobSpeed: { value: 1, min: 0, max: 3 },
  })

  // Handle keyboard input for throttle and steering
  useEffect(() => {
    let throttle = player.throttle
    let steering = 0

    // Throttle: W increases, S decreases
    if (keys.forward) {
      throttle = Math.min(100, throttle + 2)
    }
    if (keys.backward) {
      throttle = Math.max(0, throttle - 2)
    }

    // Steering: A = left (-1), D = right (+1)
    if (keys.left) steering -= 1
    if (keys.right) steering += 1

    setThrottle(throttle)
    setSteering(steering)
  }, [keys, player.throttle, setThrottle, setSteering])

  // Animate the yacht and run game tick
  useFrame((state, delta) => {
    if (!groupRef.current) return

    const time = state.clock.elapsedTime

    // Run game tick with yacht stats
    const turnRate = 12 / hull.length // Smaller boats turn faster
    tick(delta, stats.maxSpeed, turnRate)

    // Update yacht position from player state
    groupRef.current.position.x = player.position[0]
    groupRef.current.position.z = player.position[2]

    // Update yacht rotation from player state
    groupRef.current.rotation.y = player.rotation

    // Bob up and down with waves
    groupRef.current.position.y = Math.sin(time * bobSpeed) * bobAmount

    // Roll based on steering (lean into turns)
    const targetRoll = -player.steering * 0.1 * (player.speed / stats.maxSpeed)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      targetRoll + Math.sin(time * bobSpeed * 0.7) * 0.03,
      0.1
    )

    // Gentle pitch
    groupRef.current.rotation.x = Math.sin(time * bobSpeed * 0.5) * 0.02

    // Rotate turbine based on wind speed
    turbineRotation.current += wind.speed * 0.02

    // Camera follow (smooth)
    const yachtPos = groupRef.current.position
    const yachtRot = player.rotation

    // Calculate camera position behind the yacht
    const cameraDistance = 25
    const cameraHeight = 12
    const targetCameraPos = new THREE.Vector3(
      yachtPos.x - Math.sin(yachtRot) * cameraDistance,
      yachtPos.y + cameraHeight,
      yachtPos.z - Math.cos(yachtRot) * cameraDistance
    )

    // Smoothly move camera
    camera.position.lerp(targetCameraPos, 0.05)

    // Camera looks at yacht
    const lookTarget = new THREE.Vector3(yachtPos.x, yachtPos.y + 2, yachtPos.z)
    camera.lookAt(lookTarget)
  })

  return (
    <group ref={groupRef}>
      {/* Hull */}
      <PlaceholderHull length={hull.length} beam={hull.beam} />

      {/* Turbine */}
      <PlaceholderTurbine
        height={turbine.height}
        diameter={turbine.diameter}
        bladeCount={turbine.bladeCount}
        rotation={turbineRotation.current}
      />
    </group>
  )
}
