import { Canvas } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import { Suspense, useEffect } from 'react'
import { Leva } from 'leva'

// Components
import { Ocean } from './components/three/Ocean'
import { Yacht } from './components/three/Yacht'
import { WindIndicator } from './components/three/WindIndicator'
import { CameraController } from './components/three/CameraController'
import { Islands } from './components/three/Islands'
import { Marina } from './components/three/Marina'
import { PointsOfInterest } from './components/three/PointsOfInterest'
import { RaceCheckpoints } from './components/three/RaceCheckpoints'
import { HUD } from './components/ui/HUD'
import { BuildMode } from './components/ui/BuildMode'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { RaceMenu, RaceStatus, Leaderboard } from './components/ui/RaceUI'
import { LandingPage } from './components/ui/LandingPage'

// Stores
import { useGameStore } from './state/useGameStore'
import { useRaceStore } from './state/useRaceStore'
import { useLandingStore } from './state/useLandingStore'

// Hooks
import { useWorldIntegration } from './hooks/useWorldIntegration'

export default function App() {
  const { timeOfDay, gameMode, setGameMode } = useGameStore()
  const currentRace = useRaceStore((state) => state.currentRace)
  const gameStarted = useLandingStore((state) => state.gameStarted)

  // Initialize world on mount - only if game has started
  useEffect(() => {
    if (gameStarted) {
      // World will be initialized by landing page when map is selected
    }
  }, [gameStarted])

  // Integrate world mechanics with game state
  useWorldIntegration()

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
        camera={{ position: [20, 10, 20], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[50, 50, 25]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />

          {/* Environment */}
          <Sky
            distance={450000}
            sunPosition={[100, timeOfDay > 0.5 ? 20 : -20, 100]}
            inclination={0.5}
            azimuth={0.25}
          />
          <Stars radius={100} depth={50} count={5000} factor={4} fade />
          <fog attach="fog" args={['#87CEEB', 100, 500]} />

          {/* Ocean */}
          <Ocean />

          {/* World */}
          <Islands />
          <Marina />
          <PointsOfInterest />

          {/* Player Yacht */}
          <Yacht />

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
        </div>

        {/* Back to Landing - Top Right */}
        <button
          onClick={() => useLandingStore.getState().resetToLanding()}
          className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-slate-800/90 text-slate-300 hover:bg-slate-700 font-medium transition-all z-50"
          title="Return to map selection"
        >
          ← Exit
        </button>

        {/* Build Mode UI */}
        {gameMode === 'build' && <BuildMode />}

        {/* Racing UI */}
        <RaceMenu />
        <RaceStatus />
        <Leaderboard />
      </Suspense>
    </div>
  )
}
