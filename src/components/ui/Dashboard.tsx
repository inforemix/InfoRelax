import { useState } from 'react'
import { useGameStore } from '../../state/useGameStore'
import { useYachtStore } from '../../state/useYachtStore'
import { useWorldStore } from '../../state/useWorldStore'

/**
 * Unified Dashboard Component - Glassmorphism Design
 * Shows all stats at once with transparent blur background
 */
export function Dashboard() {
  const [isMinimized, setIsMinimized] = useState(false)

  const { player, energy, battery, boatDamage, wind, setThrottle, isAutoDocking, setAutoDock, repairBoat, isBursting, burstCooldown } = useGameStore()
  const { stats, currentYacht } = useYachtStore()
  const world = useWorldStore((state) => state.world)

  // Get marina position for auto-dock
  const marinaPosition = world?.marina?.position || [0, 0]
  const distToMarina = Math.sqrt(
    Math.pow(player.position[0] - marinaPosition[0], 2) +
    Math.pow(player.position[2] - marinaPosition[1], 2)
  )

  const handleAutoDock = () => {
    if (isAutoDocking) {
      setAutoDock(false)
    } else {
      setAutoDock(true, marinaPosition as [number, number])
    }
  }

  // Calculate thrust percentage
  const thrustPercentage = (player.throttle / 100) * Math.min(1, player.speed / stats.maxSpeed * 2)

  // Calculate compass heading (0-360)
  const heading = (((-player.rotation * 180 / Math.PI) + 180) % 360 + 360) % 360
  const getCardinalDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(deg / 45) % 8
    return directions[index]
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="px-4 py-3 bg-slate-900/60 backdrop-blur-md border border-cyan-500/30 rounded-xl text-cyan-400 hover:bg-slate-800/60 transition-all shadow-lg hover:shadow-cyan-500/20"
        >
          📊 Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
      <div className="max-w-[1400px] mx-auto pointer-events-auto">
        {/* Glassmorphism Container */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-2xl shadow-2xl p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-cyan-400 font-bold text-base tracking-wide">⚓ DASHBOARD</h2>
              <div className="h-4 w-px bg-cyan-500/30" />
              <div className="text-xs text-slate-400">
                <span className="text-cyan-400 font-semibold">{player.speed.toFixed(1)}</span> kt •
                <span className="text-purple-400 font-semibold ml-1">{stats.maxSpeed.toFixed(1)}</span> kt max
              </div>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-slate-400 hover:text-cyan-400 text-xs transition-colors px-2 py-1 rounded hover:bg-slate-800/50"
            >
              Minimize ▼
            </button>
          </div>

          {/* Main Stats Grid - 4 columns */}
          <div className="grid grid-cols-4 gap-4">
            {/* Column 1: Performance */}
            <div className="space-y-3">
              <div className="text-xs text-cyan-400 font-bold mb-2 uppercase tracking-wider">Performance</div>

              {/* Speed */}
              <GlassCard>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Speed</span>
                  <span className="text-lg font-bold text-cyan-400">{player.speed.toFixed(1)}</span>
                </div>
                <div className="text-[9px] text-slate-500">knots</div>
              </GlassCard>

              {/* Throttle */}
              <GlassCard>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400">Throttle</span>
                  <span className="text-sm font-bold text-cyan-400">{player.throttle.toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={player.throttle}
                  onChange={(e) => setThrottle(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700/50 rounded appearance-none cursor-pointer accent-cyan-500"
                />
              </GlassCard>

              {/* Thrust */}
              <GlassCard>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">Thrust</span>
                  <span className="text-sm font-bold text-green-400">{(thrustPercentage * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${thrustPercentage * 100}%` }}
                  />
                </div>
              </GlassCard>

              {/* Compass with Wind Direction */}
              <GlassCard>
                <div className="flex items-center gap-2">
                  {/* Compass */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="relative w-12 h-12">
                      {/* Compass ring */}
                      <div className="absolute inset-0 border border-slate-500 rounded-full" />

                      {/* Cardinal mark - N only */}
                      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-red-400">N</div>

                      {/* Rotating needle */}
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ transform: `rotate(${heading}deg)` }}
                      >
                        {/* North pointer (red) */}
                        <div className="absolute w-1 h-2.5 bg-gradient-to-t from-transparent to-red-500 top-1"
                             style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                        {/* Center dot */}
                        <div className="absolute w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Wind Info */}
                  <div className="flex-1">
                    <div className="text-[9px] text-slate-400 mb-1">Heading</div>
                    <div className="text-xs text-cyan-400 font-mono mb-1">{heading.toFixed(0)}° {getCardinalDirection(heading)}</div>
                    <div className="text-[9px] text-slate-400 mb-0.5">Wind</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-cyan-400">{wind.direction.toFixed(0)}°</span>
                      <span className="text-cyan-400">{wind.speed.toFixed(1)} m/s</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Column 2: Energy */}
            <div className="space-y-3">
              <div className="text-xs text-yellow-400 font-bold mb-2 uppercase tracking-wider">Energy</div>

              {/* Battery */}
              <GlassCard highlight={battery.chargePercent < 20}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400">Battery</span>
                  <span className={`text-sm font-bold ${
                    battery.chargePercent > 50 ? 'text-green-400' :
                    battery.chargePercent > 20 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {battery.chargePercent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      battery.chargePercent > 50 ? 'bg-green-500' :
                      battery.chargePercent > 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${battery.chargePercent}%` }}
                  />
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  {battery.currentCharge.toFixed(1)} / {battery.capacity} kWh
                </div>
              </GlassCard>

              {/* Power Flow */}
              <GlassCard>
                <div className="space-y-1">
                  <PowerStat label="Turbine" value={energy.turbineOutput} positive />
                  <PowerStat label="Solar" value={energy.solarOutput} positive />
                  <PowerStat label="Motor" value={energy.motorConsumption} />
                  <div className="pt-1 border-t border-slate-700/50 mt-1">
                    <PowerStat label="Net" value={energy.netPower} positive={energy.netPower >= 0} bold />
                  </div>
                </div>
              </GlassCard>

              {/* Engine Tier */}
              <GlassCard>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Engine</span>
                  <span className="text-xs font-bold text-purple-400 uppercase">{currentYacht.engine.tier}</span>
                </div>
                <div className="text-[9px] text-slate-500">{currentYacht.engine.powerMultiplier}x power</div>
              </GlassCard>
            </div>

            {/* Column 3: Status */}
            <div className="space-y-3">
              <div className="text-xs text-green-400 font-bold mb-2 uppercase tracking-wider">Status</div>

              {/* Hull Integrity */}
              <GlassCard highlight={boatDamage.hullIntegrity < 50}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400">
                    Hull {boatDamage.hullIntegrity < 50 && '⚠️'}
                  </span>
                  <span className={`text-sm font-bold ${
                    boatDamage.hullIntegrity > 50 ? 'text-green-400' :
                    boatDamage.hullIntegrity > 20 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {boatDamage.hullIntegrity.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      boatDamage.hullIntegrity > 50 ? 'bg-green-500' :
                      boatDamage.hullIntegrity > 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${boatDamage.hullIntegrity}%` }}
                  />
                </div>
                {boatDamage.collisionCount > 0 && (
                  <div className="text-[9px] text-red-400 mt-1">
                    💥 {boatDamage.collisionCount} collision{boatDamage.collisionCount > 1 ? 's' : ''}
                  </div>
                )}
              </GlassCard>

              {/* Burst Speed */}
              {(isBursting || burstCooldown > 0) && (
                <GlassCard highlight={isBursting}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400">Burst</span>
                    <span className={`text-sm font-bold ${
                      isBursting ? 'text-orange-400 animate-pulse' : 'text-cyan-400'
                    }`}>
                      {isBursting ? 'ACTIVE!' : `${burstCooldown.toFixed(1)}s`}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isBursting ? 'bg-orange-500 animate-pulse' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${isBursting ? 100 : (1 - burstCooldown / 5) * 100}%` }}
                    />
                  </div>
                </GlassCard>
              )}

              {/* Stats */}
              <GlassCard>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Max Speed</span>
                    <span className="text-purple-400 font-semibold">{stats.maxSpeed.toFixed(1)} kt</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Efficiency</span>
                    <span className="text-green-400 font-semibold">{(stats.turbineEfficiency * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Column 4: Controls */}
            <div className="space-y-3">
              <div className="text-xs text-orange-400 font-bold mb-2 uppercase tracking-wider">Controls</div>

              {/* Auto-Dock */}
              <button
                onClick={handleAutoDock}
                disabled={distToMarina < 50}
                className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all backdrop-blur-sm ${
                  isAutoDocking
                    ? 'bg-orange-500/80 hover:bg-orange-600/80 text-white animate-pulse border border-orange-400/50'
                    : distToMarina < 50
                    ? 'bg-green-600/80 text-white border border-green-400/50'
                    : 'bg-cyan-600/80 hover:bg-cyan-700/80 text-white border border-cyan-400/50'
                }`}
              >
                {isAutoDocking ? (
                  <>⏹️ Cancel Auto-Dock</>
                ) : distToMarina < 50 ? (
                  <>✓ At Marina</>
                ) : (
                  <>⚓ Dock ({distToMarina.toFixed(0)}m)</>
                )}
              </button>

              {/* Repair */}
              {boatDamage.hullIntegrity < 100 && (
                <button
                  onClick={() => {
                    const success = repairBoat()
                    if (!success) alert('Need 20 kWh to repair!')
                  }}
                  disabled={battery.currentCharge < 20}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all backdrop-blur-sm border ${
                    battery.currentCharge >= 20
                      ? 'bg-green-600/80 hover:bg-green-700/80 text-white border-green-400/50'
                      : 'bg-gray-600/50 text-gray-400 cursor-not-allowed border-gray-600/30'
                  }`}
                >
                  🔧 Repair (20 kWh)
                </button>
              )}

              {/* Keyboard Hints */}
              <GlassCard>
                <div className="text-[9px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">W/S</span>
                    <span>Throttle</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">A/D</span>
                    <span>Steer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tab/Space</span>
                    <span>Burst</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Glass Card Component
function GlassCard({ children, highlight = false }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`bg-slate-800/30 backdrop-blur-sm rounded-lg p-2.5 transition-all ${
      highlight ? 'border border-orange-500/40 shadow-lg shadow-orange-500/10' : 'border border-slate-700/30'
    }`}>
      {children}
    </div>
  )
}

// Power Stat Component
function PowerStat({ label, value, positive = false, bold = false }: { label: string; value: number; positive?: boolean; bold?: boolean }) {
  const color = positive
    ? (value > 0 ? 'text-green-400' : 'text-slate-500')
    : 'text-red-400'

  return (
    <div className="flex justify-between items-center">
      <span className={`text-[10px] text-slate-500 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`text-[10px] ${color} ${bold ? 'font-bold' : ''}`}>
        {positive && value > 0 ? '+' : ''}{value.toFixed(2)} kW
      </span>
    </div>
  )
}
