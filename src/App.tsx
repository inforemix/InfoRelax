import { Canvas } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import { Suspense } from 'react'
import { Leva } from 'leva'

// Components
import { Ocean } from './components/three/Ocean'
import { Yacht } from './components/three/Yacht'
import { WindIndicator } from './components/three/WindIndicator'
import { CameraController } from './components/three/CameraController'
import { HUD } from './components/ui/HUD'
import { BuildMode } from './components/ui/BuildMode'
import { LoadingScreen } from './components/ui/LoadingScreen'

// Stores
import { useGameStore } from './state/useGameStore'

export default function App() {
  const { timeOfDay, gameMode, setGameMode } = useGameStore()

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

          {/* Player Yacht */}
          <Yacht />

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

        {/* Build Mode UI */}
        {gameMode === 'build' && <BuildMode />}
      </Suspense>
    </div>
  )
}
