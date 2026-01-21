import { useGameStore } from '../../state/useGameStore'
import { useYachtStore } from '../../state/useYachtStore'

/**
 * Engine Controls - Shows thrust, throttle, and motor power
 * Displays real-time engine metrics and allows manual throttle control
 */
export function EngineControls() {
  const { player, energy, setThrottle } = useGameStore()
  const { stats } = useYachtStore()

  // Calculate thrust percentage based on throttle and current speed
  const thrustPercentage = (player.throttle / 100) * Math.min(1, player.speed / stats.maxSpeed * 2)

  // Calculate motor power in kW
  const motorPowerKW = energy.motorConsumption

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-slate-900/95 border-2 border-cyan-500/50 rounded-lg shadow-lg p-4 w-80 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          ⚡ Engine Controls
        </h3>
        <div className="text-xs text-slate-400">
          {motorPowerKW.toFixed(1)} kW
        </div>
      </div>

      {/* Throttle Control */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-slate-300 text-xs font-medium">
            Throttle
          </label>
          <span className="text-cyan-400 font-bold text-sm">
            {player.throttle.toFixed(0)}%
          </span>
        </div>

        {/* Throttle Slider */}
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={player.throttle}
          onChange={(e) => setThrottle(parseFloat(e.target.value))}
          className="w-full h-3 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-500"
          style={{
            background: `linear-gradient(to right,
              #06b6d4 0%,
              #06b6d4 ${player.throttle}%,
              #334155 ${player.throttle}%,
              #334155 100%)`
          }}
        />

        {/* Quick Throttle Presets */}
        <div className="grid grid-cols-5 gap-1 mt-2">
          <button
            onClick={() => setThrottle(0)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            0%
          </button>
          <button
            onClick={() => setThrottle(25)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            25%
          </button>
          <button
            onClick={() => setThrottle(50)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            50%
          </button>
          <button
            onClick={() => setThrottle(75)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            75%
          </button>
          <button
            onClick={() => setThrottle(100)}
            className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
          >
            100%
          </button>
        </div>
      </div>

      {/* Thrust Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-slate-300 text-xs font-medium">
            Thrust Output
          </label>
          <span className="text-green-400 font-bold text-sm">
            {(thrustPercentage * 100).toFixed(0)}%
          </span>
        </div>

        {/* Thrust Bar */}
        <div className="relative h-8 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${thrustPercentage * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold drop-shadow-lg">
              {(thrustPercentage * 100).toFixed(0)}% THRUST
            </span>
          </div>
        </div>
      </div>

      {/* Engine Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Speed */}
        <div className="bg-slate-800/50 rounded p-2">
          <div className="text-[10px] text-slate-400 mb-1">Speed</div>
          <div className="text-cyan-400 font-bold text-sm">
            {player.speed.toFixed(1)} kt
          </div>
        </div>

        {/* Max Speed */}
        <div className="bg-slate-800/50 rounded p-2">
          <div className="text-[10px] text-slate-400 mb-1">Max Speed</div>
          <div className="text-purple-400 font-bold text-sm">
            {stats.maxSpeed.toFixed(1)} kt
          </div>
        </div>

        {/* Motor Power */}
        <div className="bg-slate-800/50 rounded p-2">
          <div className="text-[10px] text-slate-400 mb-1">Motor Draw</div>
          <div className="text-red-400 font-bold text-sm">
            {motorPowerKW.toFixed(2)} kW
          </div>
        </div>

        {/* Efficiency */}
        <div className="bg-slate-800/50 rounded p-2">
          <div className="text-[10px] text-slate-400 mb-1">Efficiency</div>
          <div className="text-green-400 font-bold text-sm">
            {player.speed > 0 ? (motorPowerKW / player.speed).toFixed(1) : '0.0'} kW/kt
          </div>
        </div>
      </div>

      {/* Visual Thrust Indicators */}
      <div className="flex items-center justify-center gap-1 mb-2">
        {[...Array(10)].map((_, i) => {
          const isActive = (thrustPercentage * 10) > i
          return (
            <div
              key={i}
              className={`w-6 h-2 rounded transition-all duration-150 ${
                isActive
                  ? i < 3
                    ? 'bg-green-500'
                    : i < 7
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                  : 'bg-slate-700'
              }`}
            />
          )
        })}
      </div>

      {/* Keyboard Controls Info */}
      <div className="text-[10px] text-slate-400 bg-slate-800/50 rounded p-2 space-y-1">
        <div className="flex justify-between">
          <span>⬆️ W Key</span>
          <span>Increase Throttle</span>
        </div>
        <div className="flex justify-between">
          <span>⬇️ S Key</span>
          <span>Decrease Throttle</span>
        </div>
        <div className="flex justify-between">
          <span>⬅️ A/D Keys</span>
          <span>Steering</span>
        </div>
      </div>
    </div>
  )
}
