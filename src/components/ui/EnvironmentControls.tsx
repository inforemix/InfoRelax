import { useState } from 'react'
import { useGameStore } from '../../state/useGameStore'

/**
 * Environment Controls - Adjust wind and wave conditions in real-time
 * Provides intuitive dial controls for wind speed/direction and wave settings
 */
export function EnvironmentControls() {
  const [isExpanded, setIsExpanded] = useState(false)
  const { wind, setWind, weather, setWeather } = useGameStore()

  // Wind dial (0-360 degrees)
  const handleWindDirectionChange = (degrees: number) => {
    setWind({ direction: degrees })
  }

  // Wind speed slider (0-25 m/s)
  const handleWindSpeedChange = (speed: number) => {
    setWind({ speed })
  }

  // Gust factor slider (0-1)
  const handleGustFactorChange = (gust: number) => {
    setWind({ gustFactor: gust })
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="absolute top-32 left-4 z-10 bg-slate-900/90 border-2 border-cyan-500/50 rounded-lg p-2 hover:bg-slate-800/90 transition-all pointer-events-auto"
        title="Environment Controls"
      >
        <span className="text-cyan-400 text-lg">🌊</span>
      </button>
    )
  }

  return (
    <div className="absolute top-32 left-4 z-10 bg-slate-900/95 border-2 border-cyan-500/50 rounded-lg shadow-lg p-4 w-80 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          🌊 Environment Controls
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-cyan-400 hover:text-cyan-300 transition-colors text-xs"
        >
          −
        </button>
      </div>

      {/* Wind Direction Dial */}
      <div className="mb-4">
        <label className="text-slate-300 text-xs font-medium mb-2 block">
          Wind Direction: {wind.direction}° ({getWindDirectionName(wind.direction)})
        </label>

        <div className="relative w-32 h-32 mx-auto mb-2">
          {/* Compass background */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-700 bg-slate-800">
            {/* Cardinal directions */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold">N</div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-bold">S</div>
            <div className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">W</div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">E</div>
          </div>

          {/* Wind arrow */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: `rotate(${wind.direction}deg)` }}
          >
            <div className="text-cyan-400 text-3xl">↑</div>
          </div>

          {/* Interactive overlay */}
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={wind.direction}
            onChange={(e) => handleWindDirectionChange(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{
              WebkitAppearance: 'none',
              background: 'transparent'
            }}
          />
        </div>

        {/* Quick direction buttons */}
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => handleWindDirectionChange(0)}
            className="text-xs py-1 px-2 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            N
          </button>
          <button
            onClick={() => handleWindDirectionChange(90)}
            className="text-xs py-1 px-2 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            E
          </button>
          <button
            onClick={() => handleWindDirectionChange(180)}
            className="text-xs py-1 px-2 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            S
          </button>
          <button
            onClick={() => handleWindDirectionChange(270)}
            className="text-xs py-1 px-2 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            W
          </button>
        </div>
      </div>

      {/* Wind Speed Slider */}
      <div className="mb-4">
        <label className="text-slate-300 text-xs font-medium mb-2 block">
          Wind Speed: {wind.speed.toFixed(1)} m/s ({(wind.speed * 1.944).toFixed(1)} kt)
        </label>
        <input
          type="range"
          min="0"
          max="25"
          step="0.5"
          value={wind.speed}
          onChange={(e) => handleWindSpeedChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>Calm</span>
          <span>Breeze</span>
          <span>Gale</span>
        </div>

        {/* Quick speed presets */}
        <div className="grid grid-cols-5 gap-1 mt-2">
          <button
            onClick={() => handleWindSpeedChange(0)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            0
          </button>
          <button
            onClick={() => handleWindSpeedChange(5)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            5
          </button>
          <button
            onClick={() => handleWindSpeedChange(10)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            10
          </button>
          <button
            onClick={() => handleWindSpeedChange(15)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            15
          </button>
          <button
            onClick={() => handleWindSpeedChange(20)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            20
          </button>
        </div>
      </div>

      {/* Gust Factor */}
      <div className="mb-4">
        <label className="text-slate-300 text-xs font-medium mb-2 block">
          Gust Factor: {(wind.gustFactor * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={wind.gustFactor}
          onChange={(e) => handleGustFactorChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>Steady</span>
          <span>Variable</span>
          <span>Gusty</span>
        </div>
      </div>

      {/* Weather Presets */}
      <div className="mb-3">
        <label className="text-slate-300 text-xs font-medium mb-2 block">
          Weather Preset
        </label>
        <div className="grid grid-cols-3 gap-1">
          {(['clear', 'cloudy', 'storm'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setWeather(preset)}
              className={`text-xs py-1 px-2 rounded transition-all capitalize ${
                weather === preset
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {preset === 'clear' && '☀️ '}
              {preset === 'cloudy' && '☁️ '}
              {preset === 'storm' && '⛈️ '}
              {preset}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1 mt-1">
          {(['doldrums', 'trade-winds'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => setWeather(preset)}
              className={`text-xs py-1 px-2 rounded transition-all ${
                weather === preset
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {preset === 'doldrums' && '💤 '}
              {preset === 'trade-winds' && '🌬️ '}
              {preset.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-[10px] text-slate-400 bg-slate-800/50 rounded p-2">
        <p>💡 Adjust wind and weather to test your yacht's performance in different conditions.</p>
      </div>
    </div>
  )
}

// Helper function to get wind direction name
function getWindDirectionName(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}
