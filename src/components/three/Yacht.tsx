import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls, folder } from 'leva'
import * as THREE from 'three'

import { useYachtStore } from '@/state/useYachtStore'
import { useGameStore } from '@/state/useGameStore'
import { useRaceStore } from '@/state/useRaceStore'
import { useKeyboard } from '@/utils/useKeyboard'
import { ParametricHull } from './hulls/HullGenerator'
import { ProceduralHull } from './hulls/ProceduralHull'
import { CustomTurbine } from './CustomTurbine'
import { GLBYacht } from './GLBYacht'

export function Yacht() {
  const groupRef = useRef<THREE.Group>(null)

  // Get yacht config from store
  const {
    currentYacht, stats, proceduralHullConfig,
    setTurbinePosition, setUseGLBModel, setGLBModelScale
  } = useYachtStore()
  const {
    hull, turbine, turbinePosition, useGLBModel, glbModelScale,
    secondTurbineEnabled, secondTurbine, secondTurbineYOffset, turbineAnimation
  } = currentYacht

  // Get game state
  const { wind, player, tick, setThrottle, setSteering, updateCheckpointDetection, activateBurst } = useGameStore()

  // Get race state
  const { isRacing, currentRace, passCheckpoint, currentCheckpoint } = useRaceStore()

  // Keyboard input
  const keys = useKeyboard()

  // Track last checkpoint to detect when we pass through
  const lastCheckpointRef = useRef<string | null>(null)

  // Debug controls with yacht model selection and turbine positioning
  const yachtControls = useControls('Yacht', {
    bobAmount: { value: 0.2, min: 0, max: 1 },
    bobSpeed: { value: 1, min: 0, max: 3 },
    'Model': folder({
      useGLBModel: { value: useGLBModel, label: 'Use GLB Model' },
      glbScale: { value: glbModelScale, min: 1, max: 30, step: 0.5, label: 'GLB Scale' },
    }),
    'Turbine Position': folder({
      turbineX: { value: turbinePosition.x, min: -5, max: 10, step: 0.1, label: 'X (Left/Right)' },
      turbineY: { value: turbinePosition.y, min: 0, max: 10, step: 0.1, label: 'Y (Height)' },
      turbineZ: { value: turbinePosition.z, min: -5, max: 10, step: 0.1, label: 'Z (Front/Back)' },
    }),
  })

  const { bobAmount, bobSpeed } = yachtControls

  // Sync Leva controls to store
  useEffect(() => {
    setUseGLBModel(yachtControls.useGLBModel)
  }, [yachtControls.useGLBModel, setUseGLBModel])

  useEffect(() => {
    setGLBModelScale(yachtControls.glbScale)
  }, [yachtControls.glbScale, setGLBModelScale])

  useEffect(() => {
    setTurbinePosition({
      x: yachtControls.turbineX,
      y: yachtControls.turbineY,
      z: yachtControls.turbineZ,
    })
  }, [yachtControls.turbineX, yachtControls.turbineY, yachtControls.turbineZ, setTurbinePosition])

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

    // Steering: A = left (negative rotation), D = right (positive rotation)
    // Inverted signs to match intuitive left/right feel
    if (keys.left) steering += 1   // A turns boat left
    if (keys.right) steering -= 1  // D turns boat right

    setThrottle(throttle)
    setSteering(steering)
  }, [keys.forward, keys.backward, keys.left, keys.right, player.throttle, setThrottle, setSteering])

  // Handle burst key press
  useEffect(() => {
    if (keys.burst) {
      activateBurst()
    }
  }, [keys.burst, activateBurst])

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
    // Clamp speed ratio to prevent excessive tilting at high speeds
    const speedRatio = Math.min(player.speed / 15, 1.0) // Normalize to base speed of 15 knots
    const targetRoll = -player.steering * 0.08 * speedRatio // Reduced from 0.1 to 0.08 for smoother feel
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      targetRoll + Math.sin(time * bobSpeed * 0.7) * 0.03,
      0.15 // Increased from 0.1 for faster stabilization
    )

    // Gentle pitch
    groupRef.current.rotation.x = Math.sin(time * bobSpeed * 0.5) * 0.02

    // Checkpoint detection for racing
    if (isRacing && currentRace) {
      updateCheckpointDetection(currentRace.checkpoints)

      // Check if we've passed the current checkpoint
      const currentCheckpointObj = currentRace.checkpoints[currentCheckpoint]
      if (currentCheckpointObj) {
        const dx = player.position[0] - currentCheckpointObj.position[0]
        const dz = player.position[2] - currentCheckpointObj.position[1]
        const distance = Math.sqrt(dx * dx + dz * dz)

        // Passed through checkpoint
        if (
          distance <= currentCheckpointObj.radius &&
          lastCheckpointRef.current !== currentCheckpointObj.id
        ) {
          lastCheckpointRef.current = currentCheckpointObj.id
          passCheckpoint(currentCheckpointObj.id)

          // Check if we've completed the lap
          if (currentCheckpoint + 1 >= currentRace.checkpoints.length) {
            useRaceStore.getState().completeLap()
          }
        }
      }
    }
  })

  // Calculate deck height for turbine placement
  // Adjust based on whether using GLB model or procedural hull
  const baseDeckHeight = useGLBModel ? 2.0 : hull.draft + 0.4
  const deckHeight = baseDeckHeight + turbinePosition.y

  return (
    <group ref={groupRef}>
      {/* Hull - use GLB model if enabled, otherwise procedural/parametric */}
      {useGLBModel ? (
        <GLBYacht scale={glbModelScale} />
      ) : proceduralHullConfig ? (
        <ProceduralHull config={proceduralHullConfig} />
      ) : (
        <ParametricHull config={hull} />
      )}

      {/* Custom Turbine - uses blade profile from Kaleidoscope editor */}
      {/* Position can be adjusted via turbinePosition */}
      <group position={[turbinePosition.x, 0, turbinePosition.z]}>
        <CustomTurbine
          config={turbine}
          deckHeight={deckHeight}
          windSpeed={wind.speed}
          animation={turbineAnimation}
        />

        {/* Second Turbine - positioned below the first on same axis */}
        {secondTurbineEnabled && (
          <CustomTurbine
            config={secondTurbine}
            deckHeight={deckHeight + secondTurbineYOffset}
            windSpeed={wind.speed}
            animation={turbineAnimation}
          />
        )}
      </group>
    </group>
  )
}
