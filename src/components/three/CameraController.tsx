import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

import { useGameStore } from '@/state/useGameStore'
import { useKeyboard } from '@/utils/useKeyboard'

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()

  const { player, cameraMode, gameMode, toggleCameraMode } = useGameStore()
  const keys = useKeyboard()

  // Track if we need to reset camera
  const shouldReset = useRef(false)
  const lastGameMode = useRef(gameMode)
  const isInteracting = useRef(false)
  const cameraPreset = useRef<number>(0) // 0=default, 1=close-up, 2=side, 3=bird's eye

  // Track user interaction with controls
  useEffect(() => {
    if (!controlsRef.current) return

    const controls = controlsRef.current

    const handleStart = () => {
      isInteracting.current = true
    }

    const handleEnd = () => {
      isInteracting.current = false
    }

    controls.addEventListener('start', handleStart)
    controls.addEventListener('end', handleEnd)

    return () => {
      controls.removeEventListener('start', handleStart)
      controls.removeEventListener('end', handleEnd)
    }
  }, [])

  // Handle V key for camera mode toggle
  useEffect(() => {
    if (keys.toggleCamera) {
      toggleCameraMode()
    }
  }, [keys.toggleCamera, toggleCameraMode])

  // Handle N key for camera reset
  useEffect(() => {
    if (keys.resetCamera) {
      shouldReset.current = true
      cameraPreset.current = 0 // Reset to default
    }
  }, [keys.resetCamera])

  // Handle 1 key for close-up camera
  useEffect(() => {
    if (keys.cameraPreset1) {
      cameraPreset.current = 1
    }
  }, [keys.cameraPreset1])

  // Handle 2 key for side camera
  useEffect(() => {
    if (keys.cameraPreset2) {
      cameraPreset.current = 2
    }
  }, [keys.cameraPreset2])

  // Handle 3 key for bird's eye camera
  useEffect(() => {
    if (keys.cameraPreset3) {
      cameraPreset.current = 3
    }
  }, [keys.cameraPreset3])

  useFrame(() => {
    if (!controlsRef.current) return

    const yachtPos = new THREE.Vector3(
      player.position[0],
      player.position[1],
      player.position[2]
    )

    // Handle game mode changes - reset camera when switching to build mode
    if (gameMode !== lastGameMode.current) {
      lastGameMode.current = gameMode
      if (gameMode === 'build') {
        // Position camera for build mode preview (1/3 editor, 2/3 preview)
        // Camera positioned to place yacht on the right side of the preview area
        // Offset camera to the left so yacht appears on the right
        const buildCameraPos = new THREE.Vector3(
          yachtPos.x - 12,  // Offset left to push yacht right in view
          yachtPos.y + 12,
          yachtPos.z + 20
        )
        camera.position.copy(buildCameraPos)
        // Target slightly to the right to center yacht in right portion of screen
        const buildTarget = new THREE.Vector3(
          yachtPos.x + 5,
          yachtPos.y + 2,
          yachtPos.z
        )
        controlsRef.current.target.copy(buildTarget)
        controlsRef.current.update()
      }
    }

    // Build mode: camera targets yacht, user can orbit
    if (gameMode === 'build') {
      controlsRef.current.enabled = true
      // Smoothly follow yacht position only when not interacting
      if (!isInteracting.current) {
        controlsRef.current.target.lerp(yachtPos, 0.1)
      }
      return
    }

    if (cameraMode === 'first-person') {
      // First-person: disable controls, position camera at helm
      controlsRef.current.enabled = false

      const fpHeight = 3.5
      const fpForwardOffset = 2
      const targetCameraPos = new THREE.Vector3(
        yachtPos.x + Math.sin(player.rotation) * fpForwardOffset,
        yachtPos.y + fpHeight,
        yachtPos.z + Math.cos(player.rotation) * fpForwardOffset
      )

      camera.position.lerp(targetCameraPos, 0.1)

      // Look forward
      const lookDistance = 50
      const lookTarget = new THREE.Vector3(
        yachtPos.x + Math.sin(player.rotation) * lookDistance,
        yachtPos.y + 2,
        yachtPos.z + Math.cos(player.rotation) * lookDistance
      )
      camera.lookAt(lookTarget)
    } else {
      // Third-person: enable orbit controls, target follows yacht
      controlsRef.current.enabled = true

      // Update orbit target to follow yacht only when not interacting
      // This preserves the focal point during zoom/pan/rotate
      if (!isInteracting.current) {
        controlsRef.current.target.lerp(yachtPos, 0.1)
      }

      // Reset camera to default back view position (N key)
      if (shouldReset.current) {
        shouldReset.current = false

        // Default position: behind and above the yacht
        const cameraDistance = 25
        const cameraHeight = 12
        const defaultPos = new THREE.Vector3(
          yachtPos.x - Math.sin(player.rotation) * cameraDistance,
          yachtPos.y + cameraHeight,
          yachtPos.z - Math.cos(player.rotation) * cameraDistance
        )

        camera.position.copy(defaultPos)
        controlsRef.current.target.copy(yachtPos)
        controlsRef.current.update()
      }

      // Apply camera presets (1, 2, 3 keys)
      if (cameraPreset.current > 0 && !isInteracting.current) {
        let presetPos: THREE.Vector3

        switch (cameraPreset.current) {
          case 1: // Close-up view (behind and closer)
            presetPos = new THREE.Vector3(
              yachtPos.x - Math.sin(player.rotation) * 12,
              yachtPos.y + 6,
              yachtPos.z - Math.cos(player.rotation) * 12
            )
            break

          case 2: // Side view (perpendicular to yacht)
            presetPos = new THREE.Vector3(
              yachtPos.x + Math.cos(player.rotation) * 18,
              yachtPos.y + 8,
              yachtPos.z - Math.sin(player.rotation) * 18
            )
            break

          case 3: // Bird's eye view (top-down)
            presetPos = new THREE.Vector3(
              yachtPos.x,
              yachtPos.y + 45,
              yachtPos.z - 8 // Slightly behind for better view
            )
            break

          default:
            presetPos = camera.position.clone()
        }

        // Smoothly transition to preset position
        camera.position.lerp(presetPos, 0.05)

        // Update target to yacht center
        controlsRef.current.target.lerp(yachtPos, 0.1)
      }
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={10}
      maxDistance={100}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={0.1}
      // Enable damping for smoother controls
      enableDamping={true}
      dampingFactor={0.05}
      // Allow 360 rotation
      minAzimuthAngle={-Infinity}
      maxAzimuthAngle={Infinity}
      // Mouse buttons: left = rotate, right = pan
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  )
}
