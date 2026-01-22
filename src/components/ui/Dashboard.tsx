import { useState } from 'react'
import { useGameStore } from '../../state/useGameStore'
import { useYachtStore } from '../../state/useYachtStore'
import { useWorldStore } from '../../state/useWorldStore'

type DashboardTab = 'status' | 'engine' | 'energy' | 'navigation'

/**
 * Unified Dashboard Component
 * Consolidates HUD, Engine Controls, and other UI elements into organized tabs
 */
export function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('status')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { player, energy, battery, boatDamage, wind, timeOfDay, setThrottle, isAutoDocking, setAutoDock, repairBoat, isBursting, burstCooldown } = useGameStore()
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
  const motorPowerKW = energy.motorConsumption

  const tabs = [
    { id: 'status' as const, label: 'Status', icon: '📊' },
    { id: 'engine' as const, label: 'Engine', icon: '⚙️' },
    { id: 'energy' as const, label: 'Energy', icon: '⚡' },
  ]

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setIsCollapsed(false)}
          className="px-4 py-3 bg-slate-900/95 border-2 border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-slate-800 transition-all shadow-lg"
        >
          📊 Show Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[420px]">
      <div className="bg-slate-900/95 border-2 border-cyan-500/50 rounded-lg shadow-2xl overflow-hidden">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between bg-slate-800/80 px-4 py-2 border-b border-cyan-500/30">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-slate-400 hover:text-cyan-400 text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 max-h-[500px] overflow-y-auto">
          {/* STATUS TAB */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Speed & Position */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Speed" value={`${player.speed.toFixed(1)} kt`} color="cyan" />
                <StatCard label="Max Speed" value={`${stats.maxSpeed.toFixed(1)} kt`} color="purple" />
              </div>

              {/* Wind Info */}
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-2">Wind Conditions</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-slate-500">Direction</div>
                    <div className="text-sm text-cyan-400 font-bold">{wind.direction.toFixed(0)}°</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Speed</div>
                    <div className="text-sm text-cyan-400 font-bold">{wind.speed.toFixed(1)} m/s</div>
                  </div>
                </div>
              </div>

              {/* Hull Integrity */}
              <div className={`bg-slate-800/50 rounded-lg p-3 ${
                boatDamage.hullIntegrity < 50 ? 'border border-red-500/50' : ''
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs text-slate-400">
                    Hull Integrity {boatDamage.hullIntegrity < 50 && '⚠️'}
                  </div>
                  <div className={`text-sm font-bold ${
                    boatDamage.hullIntegrity > 50 ? 'text-green-400' :
                    boatDamage.hullIntegrity > 20 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {boatDamage.hullIntegrity.toFixed(0)}%
                  </div>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      boatDamage.hullIntegrity > 50 ? 'bg-green-500' :
                      boatDamage.hullIntegrity > 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${boatDamage.hullIntegrity}%` }}
                  />
                </div>
                {boatDamage.collisionCount > 0 && (
                  <div className="text-xs text-red-400 mt-2">
                    💥 Collisions: {boatDamage.collisionCount}
                  </div>
                )}
              </div>

              {/* Burst Speed Indicator */}
              {(isBursting || burstCooldown > 0) && (
                <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-orange-400">Burst Speed</div>
                    <div className={`text-sm font-bold ${
                      isBursting ? 'text-orange-400 animate-pulse' : 'text-cyan-400'
                    }`}>
                      {isBursting ? 'ACTIVE!' : `${burstCooldown.toFixed(1)}s`}
                    </div>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isBursting ? 'bg-orange-500 animate-pulse' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${isBursting ? 100 : (1 - burstCooldown / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ENGINE TAB */}
          {activeTab === 'engine' && (
            <div className="space-y-4">
              {/* Throttle Control */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 text-xs font-medium">Throttle</label>
                  <span className="text-cyan-400 font-bold text-sm">{player.throttle.toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={player.throttle}
                  onChange={(e) => setThrottle(parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {[0, 25, 50, 75, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => setThrottle(val)}
                      className="text-[10px] py-1 bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white rounded transition-colors"
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Thrust Output */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-300 text-xs font-medium">Thrust Output</label>
                  <span className="text-green-400 font-bold text-sm">{(thrustPercentage * 100).toFixed(0)}%</span>
                </div>
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

              {/* Engine Stats */}
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Motor Draw" value={`${motorPowerKW.toFixed(1)} kW`} color="red" />
                <StatCard label="Engine Tier" value={currentYacht.engine.tier.toUpperCase()} color="purple" />
              </div>

              {/* Auto-Dock & Repair */}
              <div className="space-y-2">
                <button
                  onClick={handleAutoDock}
                  disabled={distToMarina < 50}
                  className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                    isAutoDocking
                      ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse'
                      : distToMarina < 50
                      ? 'bg-green-600 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  }`}
                >
                  {isAutoDocking ? '⏹️ Cancel Auto-Dock' : distToMarina < 50 ? '✓ At Marina' : `⚓ Return to Dock (${distToMarina.toFixed(0)}m)`}
                </button>

                {boatDamage.hullIntegrity < 100 && (
                  <button
                    onClick={() => {
                      const success = repairBoat()
                      if (!success) alert('Not enough battery charge to repair! Need 20 kWh.')
                    }}
                    disabled={battery.currentCharge < 20}
                    className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                      battery.currentCharge >= 20
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    🔧 Repair Hull (20 kWh) - {boatDamage.hullIntegrity.toFixed(0)}%
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ENERGY TAB */}
          {activeTab === 'energy' && (
            <div className="space-y-4">
              {/* Battery */}
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs text-slate-400">Battery Charge</div>
                  <div className={`text-sm font-bold ${
                    battery.chargePercent > 50 ? 'text-green-400' :
                    battery.chargePercent > 20 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {battery.chargePercent.toFixed(0)}%
                  </div>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-300 ${
                      battery.chargePercent > 50 ? 'bg-green-500' :
                      battery.chargePercent > 20 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${battery.chargePercent}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  {battery.currentCharge.toFixed(1)} / {battery.capacity} kWh
                </div>
              </div>

              {/* Power Flow */}
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Turbine" value={`+${energy.turbineOutput.toFixed(2)} kW`} color="green" />
                <StatCard label="Solar" value={`+${energy.solarOutput.toFixed(2)} kW`} color="yellow" />
                <StatCard label="Motor" value={`-${energy.motorConsumption.toFixed(2)} kW`} color="red" />
                <StatCard label="Net Power" value={`${energy.netPower >= 0 ? '+' : ''}${energy.netPower.toFixed(2)} kW`} color={energy.netPower >= 0 ? 'green' : 'red'} />
              </div>

              {/* Turbine Efficiency */}
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-2">Turbine Efficiency</div>
                <div className="text-2xl font-bold text-cyan-400">{(stats.turbineEfficiency * 100).toFixed(0)}%</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with controls hint */}
        <div className="bg-slate-800/80 px-4 py-2 border-t border-cyan-500/30">
          <div className="text-[10px] text-slate-400 flex justify-between">
            <span>W/S: Throttle</span>
            <span>A/D: Steer</span>
            <span>Tab/Space: Burst</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component for stat cards
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    cyan: 'text-cyan-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  }

  return (
    <div className="bg-slate-800/50 rounded p-2">
      <div className="text-[10px] text-slate-400 mb-1">{label}</div>
      <div className={`${colorClasses[color as keyof typeof colorClasses]} font-bold text-sm`}>
        {value}
      </div>
    </div>
  )
}
