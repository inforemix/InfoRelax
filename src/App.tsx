import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Leva } from 'leva'

// Components
import { Ocean } from './components/three/Ocean'
import { Yacht } from './components/three/Yacht'
import { WindIndicator } from './components/three/WindIndicator'
import { CameraController } from './components/three/CameraController'
import { Islands } from './components/three/Islands'
import { Marina } from './components/three/Marina'
import { EnvironmentDetails } from './components/three/EnvironmentDetails'
import { PointsOfInterest } from './components/three/PointsOfInterest'
import { RaceCheckpoints } from './components/three/RaceCheckpoints'
import { Icebergs } from './components/three/Icebergs'
import { WeatherEffects } from './components/three/WeatherEffects'
import { DynamicLighting } from './components/three/DynamicLighting'
import { ProceduralClouds } from './components/three/ProceduralClouds'
import { EnhancedSky } from './components/three/EnhancedSky'
import { HUD } from './components/ui/HUD'
import { BuildMode } from './components/ui/BuildMode'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { RaceMenu, RaceStatus, Leaderboard } from './components/ui/RaceUI'
import { LandingPage } from './components/ui/LandingPage'
import { WorldMap } from './components/ui/WorldMap'
import { EngineControls } from './components/ui/EngineControls'

// Stores
import { useGameStore } from './state/useGameStore'
import { useRaceStore } from './state/useRaceStore'
import { useLandingStore } from './state/useLandingStore'

// Hooks
import { useWorldIntegration } from './hooks/useWorldIntegration'
import { useIcebergCollision } from './hooks/useIcebergCollision'

export default function App() {
  const { gameMode, setGameMode } = useGameStore()
  const currentRace = useRaceStore((state) => state.currentRace)
  const isRacing = useRaceStore((state) => state.isRacing)
  const gameStarted = useLandingStore((state) => state.gameStarted)

  // Initialize world on mount - only if game has started
  useEffect(() => {
    if (gameStarted) {
      // World will be initialized by landing page when map is selected
    }
  }, [gameStarted])

  // Integrate world mechanics with game state
  useWorldIntegration()

  // Iceberg collision detection
  useIcebergCollision()

  // Show landing page if game hasn't started
  if (!gameStarted) {
    return <LandingPage />
  }

  return (
    <div className="w-full h-full relative">
      {/* Debug Controls */}
      <Leva collapsed />

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [20, 10, 20], fov: 50, near: 0.1, far: 20000 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          {/* Dynamic Lighting System */}
          <DynamicLighting />

          {/* Weather Visual Effects */}
          <WeatherEffects />

          {/* Procedural Clouds */}
          <ProceduralClouds />

          {/* Environment - Enhanced Sky with dynamic sunsets */}
          <EnhancedSky />
          <fogExp2 attach="fog" args={['#b0c4de', 0.0008]} />

          {/* Ocean */}
          <Ocean />

          {/* World */}
          <Islands />
          <Marina />
          <EnvironmentDetails />
          <PointsOfInterest />

          {/* Player Yacht */}
          <Yacht />

          {/* World Icebergs - Always visible */}
          <Icebergs />

          {/* Racing */}
          {currentRace && <RaceCheckpoints />}

          {/* Wind Indicator */}
          <WindIndicator />

          {/* Camera Controller */}
          <CameraController />
        </Suspense>
      </Canvas>

      {/* Loading Screen */}
      <Suspense fallback={<LoadingScreen />}>
        {/* Sail Mode UI (blurred when in build mode) */}
        <div className={`transition-all duration-300 ${gameMode === 'build' ? 'opacity-0 pointer-events-none' : ''}`}>
          <HUD />
        </div>

        {/* Mode Toggle - Center top */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
          {/* Exit button as icon */}
          <button
            onClick={() => useLandingStore.getState().resetToLanding()}
            className="px-3 py-2 rounded-lg bg-slate-800/90 text-slate-300 hover:bg-slate-700 font-medium transition-all"
            title="Return to map selection"
          >
            ←
          </button>

          <button
            onClick={() => setGameMode('sail')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              gameMode === 'sail'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Sail
          </button>
          <button
            onClick={() => setGameMode('build')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              gameMode === 'build'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Build
          </button>
          {/* Race button - only show in sail mode when not already racing */}
          {gameMode === 'sail' && !isRacing && <RaceMenu />}
        </div>

        {/* Build Mode UI */}
        {gameMode === 'build' && <BuildMode />}

        {/* Racing UI - Status and Leaderboard */}
        <RaceStatus />
        <Leaderboard />

        {/* World Map */}
        {gameMode === 'sail' && <WorldMap />}

        {/* Engine Controls (Thrust & Throttle) */}
        {gameMode === 'sail' && <EngineControls />}
      </Suspense>
    </div>
  )
}
