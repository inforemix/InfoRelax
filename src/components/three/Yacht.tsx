import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'

import { useYachtStore } from '@/state/useYachtStore'
import { useGameStore } from '@/state/useGameStore'
import { useKeyboard } from '@/utils/useKeyboard'
import { ParametricHull } from './hulls/HullGenerator'
import { CustomTurbine } from './CustomTurbine'

export function Yacht() {
  const groupRef = useRef<THREE.Group>(null)

  // Get yacht config from store
  const { currentYacht, stats } = useYachtStore()
  const { hull, turbine } = currentYacht

  // Get game state
  const { wind, player, tick, setThrottle, setSteering } = useGameStore()

  // Keyboard input
  const keys = useKeyboard()

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
  }, [keys.forward, keys.backward, keys.left, keys.right, player.throttle, setThrottle, setSteering])

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
    // Offset by -90° to align model bow (facing +X) with movement direction (+Z when rotation=0)
    groupRef.current.rotation.y = player.rotation - Math.PI / 2

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
  })

  // Calculate deck height for turbine placement
  const deckHeight = hull.draft + 0.4

  return (
    <group ref={groupRef}>
      {/* Parametric Hull - responds to hull type, dimensions, and bow shape */}
      <ParametricHull config={hull} />

      {/* Custom Turbine - uses blade profile from Kaleidoscope editor */}
      <CustomTurbine
        config={turbine}
        deckHeight={deckHeight}
        windSpeed={wind.speed}
      />
    </group>
  )
}
