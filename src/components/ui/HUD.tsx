import { useGameStore } from '@/state/useGameStore'
import { useYachtStore } from '@/state/useYachtStore'

export function HUD() {
  const { wind, energy, energyCredits, player, timeOfDay } = useGameStore()
  const { stats, currentYacht } = useYachtStore()
  
  // Format energy credits
  const formatEC = (ec: number) => {
    if (ec >= 1000) return `${(ec / 1000).toFixed(1)}k`
    return ec.toFixed(1)
  }
  
  // Get time of day as hours
  const hours = Math.floor(timeOfDay * 24)
  const minutes = Math.floor((timeOfDay * 24 - hours) * 60)
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Left: Energy Credits */}
      <div className="absolute top-4 left-4 glass rounded-xl p-4 pointer-events-auto">
        <div className="text-xs text-slate-400 mb-1">Energy Credits</div>
        <div className="text-2xl font-bold text-yellow-400 hud-glow">
          ⚡ {formatEC(energyCredits)} EC
        </div>
      </div>
      
      {/* Top Right: Time & Weather */}
      <div className="absolute top-4 right-4 glass rounded-xl p-4 text-right">
        <div className="text-2xl font-mono text-white">{timeString}</div>
        <div className="text-sm text-cyan-400">Trade Winds</div>
      </div>
      
      {/* Bottom Left: Wind & Speed */}
      <div className="absolute bottom-4 left-4 glass rounded-xl p-4">
        <div className="flex items-center gap-4">
          {/* Wind */}
          <div className="text-center">
            <div className="text-xs text-slate-400">Wind</div>
            <div 
              className="w-8 h-8 mx-auto my-1 text-cyan-400"
              style={{ transform: `rotate(${wind.direction}deg)` }}
            >
              ↑
            </div>
            <div className="text-lg font-bold text-white">{wind.speed.toFixed(1)}</div>
            <div className="text-xs text-slate-400">m/s</div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-16 bg-slate-600" />
          
          {/* Speed */}
          <div className="text-center">
            <div className="text-xs text-slate-400">Speed</div>
            <div className="text-3xl font-bold text-white my-1">
              {player.speed.toFixed(1)}
            </div>
            <div className="text-xs text-slate-400">knots</div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-16 bg-slate-600" />
          
          {/* Throttle */}
          <div className="text-center">
            <div className="text-xs text-slate-400">Throttle</div>
            <div className="text-3xl font-bold text-white my-1">
              {player.throttle}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Right: Power Flow */}
      <div className="absolute bottom-4 right-4 glass rounded-xl p-4">
        <div className="text-xs text-slate-400 mb-2">Power Flow</div>
        
        <div className="space-y-2 text-sm">
          {/* Generation */}
          <div className="flex justify-between items-center">
            <span className="text-slate-300">🌀 Turbine</span>
            <span className="text-green-400 font-mono">
              +{energy.turbineOutput.toFixed(2)} kW
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">☀️ Solar</span>
            <span className="text-green-400 font-mono">
              +{energy.solarOutput.toFixed(2)} kW
            </span>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-slate-600 my-1" />
          
          {/* Consumption */}
          <div className="flex justify-between items-center">
            <span className="text-slate-300">⚡ Motor</span>
            <span className="text-red-400 font-mono">
              -{energy.motorConsumption.toFixed(2)} kW
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">📡 Systems</span>
            <span className="text-red-400 font-mono">
              -{energy.systemsConsumption.toFixed(2)} kW
            </span>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-slate-600 my-1" />
          
          {/* Net */}
          <div className="flex justify-between items-center">
            <span className="text-white font-medium">Net</span>
            <span className={`font-mono font-bold ${
              energy.netPower >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {energy.netPower >= 0 ? '+' : ''}{energy.netPower.toFixed(2)} kW
            </span>
          </div>
        </div>
        
        {/* Battery Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>🔋 Battery</span>
            <span>{currentYacht.battery.currentCharge}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                currentYacht.battery.currentCharge > 50 
                  ? 'bg-green-500' 
                  : currentYacht.battery.currentCharge > 20 
                    ? 'bg-yellow-500' 
                    : 'bg-red-500'
              }`}
              style={{ width: `${currentYacht.battery.currentCharge}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1 text-right">
            Range: {stats.range.toFixed(0)} km
          </div>
        </div>
      </div>
      
      {/* Center: Controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-lg px-4 py-2 text-xs text-slate-400">
        WASD to move • Scroll to zoom • Drag to rotate
      </div>
    </div>
  )
}
