import { useGameStore } from '@/state/useGameStore'

export function HUD() {
  const { wind, energy, energyCredits, player, timeOfDay, battery, boatDamage, isBursting, burstCooldown } = useGameStore()

  // Format energy credits
  const formatEC = (ec: number) => {
    if (ec >= 1000) return `${(ec / 1000).toFixed(1)}k`
    return ec.toFixed(1)
  }

  // Get time of day as hours
  const hours = Math.floor(timeOfDay * 24)
  const minutes = Math.floor((timeOfDay * 24 - hours) * 60)
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

  // Calculate compass heading (0-360)
  // player.rotation: 0 = facing +Z (South), PI/2 = +X (East), PI = -Z (North), 3PI/2 = -X (West)
  // Compass: 0 = North, 90 = East, 180 = South, 270 = West
  const heading = (((-player.rotation * 180 / Math.PI) + 180) % 360 + 360) % 360
  const getCardinalDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(deg / 45) % 8
    return directions[index]
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Left: Time, Compass & Weather */}
      <div className="absolute top-4 left-4 glass rounded-xl p-4">
        <div className="flex items-start gap-4">
          {/* Time */}
          <div>
            <div className="text-2xl font-mono text-white">{timeString}</div>
            <div className="text-sm text-cyan-400">Trade Winds</div>
          </div>

          {/* Compass */}
          <div className="flex flex-col items-center">
            <div className="relative w-16 h-16">
              {/* Compass ring */}
              <div className="absolute inset-0 border-2 border-slate-500 rounded-full" />

              {/* Cardinal marks */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 text-xs font-bold text-red-400">N</div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-xs font-bold text-slate-400">S</div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 text-xs font-bold text-slate-400">W</div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 text-xs font-bold text-slate-400">E</div>

              {/* Rotating needle */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${heading}deg)` }}
              >
                {/* North pointer (red) */}
                <div className="absolute w-1.5 h-5 bg-gradient-to-t from-transparent to-red-500 top-1.5"
                     style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                {/* South pointer (white) */}
                <div className="absolute w-1.5 h-5 bg-gradient-to-b from-transparent to-slate-300 bottom-1.5"
                     style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }} />
                {/* Center dot */}
                <div className="absolute w-2 h-2 bg-slate-400 rounded-full" />
              </div>
            </div>
            <div className="text-xs text-cyan-400 font-mono mt-1">
              {heading.toFixed(0)}° {getCardinalDirection(heading)}
            </div>
          </div>
        </div>

        {/* Hull Integrity */}
        <div className={`mt-3 pt-3 border-t border-slate-600 ${
          boatDamage.hullIntegrity < 50 ? 'bg-red-900/20 -mx-4 px-4 py-2 rounded' : ''
        }`}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">
              Hull {boatDamage.hullIntegrity < 50 && '⚠️'}
            </span>
            <span className={`font-bold ${
              boatDamage.hullIntegrity > 50 ? 'text-green-400' :
              boatDamage.hullIntegrity > 20 ? 'text-yellow-400 animate-pulse' : 'text-red-400 animate-pulse'
            }`}>
              {boatDamage.hullIntegrity.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                boatDamage.hullIntegrity > 50 ? 'bg-green-500' :
                boatDamage.hullIntegrity > 20 ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-pulse'
              }`}
              style={{ width: `${boatDamage.hullIntegrity}%` }}
            />
          </div>
          {boatDamage.collisionCount > 0 && (
            <div className="text-xs text-red-400 mt-1">
              💥 Collisions: {boatDamage.collisionCount}
            </div>
          )}
          {boatDamage.hullIntegrity < 50 && (
            <div className="text-xs text-orange-400 mt-1">
              ⚠️ Repair at dock (20 kWh)
            </div>
          )}
        </div>

        {/* Burst Speed Indicator */}
        {(isBursting || burstCooldown > 0) && (
          <div className="mt-3 pt-3 border-t border-slate-600">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Burst</span>
              <span className={`font-bold ${
                isBursting ? 'text-orange-400 animate-pulse' : 'text-cyan-400'
              }`}>
                {isBursting ? 'ACTIVE!' : `${burstCooldown.toFixed(1)}s`}
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isBursting ? 'bg-orange-500 animate-pulse' : 'bg-cyan-500'
                }`}
                style={{ width: `${isBursting ? 100 : (1 - burstCooldown / 5) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {isBursting ? 'Speed boosted +50%!' : 'Ready in ' + burstCooldown.toFixed(1) + 's'}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Center: Wind, Speed & Throttle */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass rounded-xl p-4">
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

          {/* Divider */}
          <div className="w-px h-16 bg-slate-600" />

          {/* Energy Credits */}
          <div className="text-center">
            <div className="text-xs text-slate-400">Credits</div>
            <div className="text-2xl font-bold text-yellow-400 my-1 hud-glow">
              ⚡ {formatEC(energyCredits)}
            </div>
            <div className="text-xs text-slate-400">EC</div>
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
            <span>Battery</span>
            <span>{battery.chargePercent.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                battery.chargePercent > 50
                  ? 'bg-green-500'
                  : battery.chargePercent > 20
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${battery.chargePercent}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-1 text-right">
            {battery.currentCharge.toFixed(1)} / {battery.capacity} kWh
          </div>
        </div>
      </div>
      
    </div>
  )
}
