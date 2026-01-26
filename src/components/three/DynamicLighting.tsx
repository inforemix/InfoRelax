import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useControls } from 'leva'
import { useGameStore } from '../../state/useGameStore'

export function DynamicLighting() {
  const sunRef = useRef<THREE.DirectionalLight>(null)
  const moonRef = useRef<THREE.DirectionalLight>(null)

  const lightControls = useControls('Lighting', {
    sunIntensity: { value: 1.5, min: 0, max: 3, step: 0.1 },
    sunElevation: { value: 45, min: -20, max: 90, step: 1 },
    sunAzimuth: { value: 180, min: 0, max: 360, step: 5 },
    sunColor: '#ffffee',
    ambientIntensity: { value: 0.6, min: 0, max: 2, step: 0.1 },
    ambientColor: '#8899bb',
    fogDensity: { value: 0.0008, min: 0, max: 0.01, step: 0.0001 },
    fogColor: '#b0c4de',
  })

  const weather = useGameStore((state) => state.weather)

  // Calculate sun position from elevation and azimuth
  const sunPosition = new THREE.Vector3()
  const elevation = THREE.MathUtils.degToRad(lightControls.sunElevation)
  const azimuth = THREE.MathUtils.degToRad(lightControls.sunAzimuth)

  sunPosition.x = Math.cos(elevation) * Math.sin(azimuth) * 1000
  sunPosition.y = Math.sin(elevation) * 1000
  sunPosition.z = Math.cos(elevation) * Math.cos(azimuth) * 1000

  // Adjust intensity based on weather
  let weatherMultiplier = 1
  if (weather === 'cloudy') weatherMultiplier = 0.5
  if (weather === 'storm') weatherMultiplier = 0.3
  if (weather === 'doldrums') weatherMultiplier = 1.2

  const effectiveSunIntensity = lightControls.sunIntensity * weatherMultiplier

  // Update fog
  useEffect(() => {
    const scene = sunRef.current?.parent as THREE.Scene
    if (scene && scene.fog) {
      const fog = scene.fog as THREE.FogExp2
      fog.density = lightControls.fogDensity
      fog.color.set(lightControls.fogColor)
    }
  }, [lightControls.fogDensity, lightControls.fogColor])

  return (
    <>
      {/* Ambient light */}
      <ambientLight
        intensity={lightControls.ambientIntensity}
        color={lightControls.ambientColor}
      />

      {/* Sun (Directional light) */}
      <directionalLight
        ref={sunRef}
        position={[sunPosition.x, sunPosition.y, sunPosition.z]}
        intensity={effectiveSunIntensity}
        color={lightControls.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={10000}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
        shadow-bias={-0.0001}
      />

      {/* Hemisphere light for sky/ground color blend */}
      <hemisphereLight
        color={weather === 'storm' ? '#445566' : '#87ceeb'}
        groundColor={weather === 'storm' ? '#222222' : '#4a5f7f'}
        intensity={0.3}
      />

      {/* Moon light (subtle, for nighttime/low elevation) */}
      {lightControls.sunElevation < 10 && (
        <directionalLight
          ref={moonRef}
          position={[-sunPosition.x, Math.abs(sunPosition.y), -sunPosition.z]}
          intensity={0.2}
          color="#c5d9ed"
        />
      )}
    </>
  )
}
