import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky, Stars } from '@react-three/drei'
import { Suspense, useState } from 'react'
import { Leva } from 'leva'

// Components
import { Ocean } from './components/three/Ocean'
import { Yacht } from './components/three/Yacht'
import { WindIndicator } from './components/three/WindIndicator'
import { HUD } from './components/ui/HUD'
import { BuilderPanel } from './components/ui/BuilderPanel'
import { LoadingScreen } from './components/ui/LoadingScreen'

// Stores
import { useGameStore } from './state/useGameStore'

type GameMode = 'sail' | 'build'

export default function App() {
  const [mode, setMode] = useState<GameMode>('sail')
  const { timeOfDay } = useGameStore()

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

          {/* Camera Controls */}
          <OrbitControls
            enablePan={false}
            minDistance={10}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2.1}
          />
        </Suspense>
      </Canvas>

      {/* Loading Screen */}
      <Suspense fallback={<LoadingScreen />}>
        {/* UI Overlay */}
        <HUD />

        {/* Mode Toggle */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
          <button
            onClick={() => setMode('sail')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              mode === 'sail'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🌊 Sail
          </button>
          <button
            onClick={() => setMode('build')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              mode === 'build'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🔧 Build
          </button>
        </div>

        {/* Builder Panel (when in build mode) */}
        {mode === 'build' && <BuilderPanel />}
      </Suspense>
    </div>
  )
}
