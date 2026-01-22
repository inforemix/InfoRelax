import { useState } from 'react'
import { useLandingStore, MAP_PRESETS } from '../../state/useLandingStore'
import { useWorldStore } from '../../state/useWorldStore'
import { WorldDifficulty } from '../../world/WorldGenerator'

export function LandingPage() {
  const { selectedMap, playerName, setPlayerName, selectMap, startGame } = useLandingStore()
  const initializeWorld = useWorldStore((state) => state.initializeWorld)
  const [nameInput, setNameInput] = useState(playerName)

  const maps = Object.values(MAP_PRESETS)

  const handleStartGame = () => {
    if (!selectedMap) return

    try {
      // Update player name
      setPlayerName(nameInput || 'Navigator')

      // Initialize world with selected map and difficulty
      console.log('Initializing world with:', selectedMap)
      initializeWorld(selectedMap.seed, selectedMap.worldSize, selectedMap.difficulty as WorldDifficulty)

      // Start the game
      console.log('Starting game...')
      startGame()
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Error starting game. Please try again.')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'peaceful':
        return 'text-green-400 border-green-400'
      case 'moderate':
        return 'text-blue-400 border-blue-400'
      case 'challenging':
        return 'text-yellow-400 border-yellow-400'
      case 'extreme':
        return 'text-red-400 border-red-400'
      default:
        return 'text-gray-400 border-gray-400'
    }
  }

  const getDifficultyBg = (difficulty: string) => {
    switch (difficulty) {
      case 'peaceful':
        return 'bg-green-900/20'
      case 'moderate':
        return 'bg-blue-900/20'
      case 'challenging':
        return 'bg-yellow-900/20'
      case 'extreme':
        return 'bg-red-900/20'
      default:
        return 'bg-gray-900/20'
    }
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="pt-12 pb-8 text-center">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 mb-2">
            InfoRelax
          </h1>
          <p className="text-xl text-cyan-300/80 font-light">Electric Yacht Sailing Experience</p>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-20">
          <div className="max-w-7xl mx-auto">
            {/* Player Name Input & Set Sail Button - Side by Side */}
            <div className="mb-12 max-w-3xl mx-auto">
              <label className="block text-cyan-400 font-semibold mb-3">Captain's Name</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                />
                <button
                  onClick={handleStartGame}
                  disabled={!selectedMap}
                  className={`px-8 py-3 rounded-lg font-bold text-lg transition-all transform whitespace-nowrap ${
                    selectedMap
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  ⛵ SET SAIL
                </button>
              </div>
            </div>

            {/* Map Selection */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
                <span>⛵</span> Select Your World
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maps.map((map) => (
                  <button
                    key={map.id}
                    onClick={() => selectMap(map)}
                    className={`text-left p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${
                      selectedMap?.id === map.id
                        ? 'border-cyan-400 bg-cyan-900/40 shadow-lg shadow-cyan-400/30'
                        : 'border-slate-600 bg-slate-800/40 hover:border-cyan-400/60'
                    } ${getDifficultyBg(map.difficulty)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">{map.name}</h3>
                      <span className={`text-xs font-semibold px-3 py-1 border rounded ${getDifficultyColor(map.difficulty)}`}>
                        {map.difficulty.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 mb-4">{map.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {map.features.map((feature) => (
                        <span key={feature} className="text-xs px-2 py-1 bg-slate-700/50 text-cyan-300 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Size: {(map.worldSize / 1000).toFixed(0)}km</span>
                      <span>Seed: {map.seed}</span>
                    </div>

                    {selectedMap?.id === map.id && (
                      <div className="mt-4 pt-4 border-t border-cyan-400/30">
                        <p className="text-sm text-cyan-400 font-semibold">✓ Selected</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 mt-16">
              <div className="bg-slate-800/40 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                  <span>🌊</span> World Features
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✓ Procedurally generated islands</li>
                  <li>✓ Dynamic wind zones and weather</li>
                  <li>✓ Discoverable Points of Interest</li>
                  <li>✓ Central marina hub with charging</li>
                  <li>✓ Realistic water physics</li>
                </ul>
              </div>

              <div className="bg-slate-800/40 border border-green-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                  <span>🏁</span> Racing Features
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✓ 4 unique race configurations</li>
                  <li>✓ Real-time lap timing</li>
                  <li>✓ Checkpoint detection</li>
                  <li>✓ Global leaderboards</li>
                  <li>✓ Progressive difficulty</li>
                </ul>
              </div>

              <div className="bg-slate-800/40 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <span>⚡</span> Energy System
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✓ Wind turbine power generation</li>
                  <li>✓ Solar panel efficiency</li>
                  <li>✓ Battery management</li>
                  <li>✓ Energy credit progression</li>
                  <li>✓ Equipment unlocks</li>
                </ul>
              </div>

              <div className="bg-slate-800/40 border border-orange-500/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                  <span>🛠️</span> Customization
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✓ Yacht hull customization</li>
                  <li>✓ Kaleidoscope blade editor</li>
                  <li>✓ Turbine design system</li>
                  <li>✓ Save/load designs</li>
                  <li>✓ Build and test modes</li>
                </ul>
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-r from-slate-800/40 via-cyan-900/20 to-slate-800/40 border border-cyan-500/20 rounded-lg p-6 mb-12">
              <h3 className="text-lg font-bold text-cyan-400 mb-4">💡 Getting Started Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <p>• Start with <strong>Serene Archipelago</strong> to learn the basics</p>
                <p>• Use <strong>Build Mode</strong> to design your yacht before sailing</p>
                <p>• Visit the <strong>Marina</strong> to charge your energy batteries</p>
                <p>• Discover <strong>POIs</strong> to earn bonus energy credits</p>
                <p>• Start with <strong>Speed Trial</strong> race to practice checkpoints</p>
                <p>• Upgrade your turbine for better wind power generation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pt-8 pb-8 px-6">
          <div className="max-w-7xl mx-auto text-center">
            {selectedMap && (
              <p className="text-sm text-slate-400">
                Ready to sail to <span className="text-cyan-400 font-semibold">{selectedMap.name}</span> as{' '}
                <span className="text-cyan-400 font-semibold">{nameInput || 'Navigator'}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
