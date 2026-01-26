import { useState, useCallback, useMemo } from 'react'
import { useLandingStore, MAP_PRESETS, MAP_DESCRIPTIONS } from '../../state/useLandingStore'
import { useWorldStore } from '../../state/useWorldStore'
import type { MapConfig, IslandDistribution, IcebergSpread, RaceLength, WorldDifficulty } from '../../world/WorldGenerator'

// ── Reusable slider component ──
function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = '',
  formatValue,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  suffix?: string
  formatValue?: (v: number) => string
}) {
  const display = formatValue ? formatValue(value) : `${value}${suffix}`
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-cyan-400 font-mono">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-500 bg-slate-700"
      />
    </div>
  )
}

// ── Reusable select component ──
function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-cyan-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ── Toggle component ──
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? 'bg-cyan-500' : 'bg-slate-600'
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </div>
      <span className="text-xs text-slate-300">{label}</span>
    </label>
  )
}

type ConfigTab = 'terrain' | 'ice' | 'environment' | 'racing' | 'modifiers'

const TABS: { id: ConfigTab; label: string; icon: string }[] = [
  { id: 'terrain', label: 'Terrain', icon: 'M' },
  { id: 'ice', label: 'Ice', icon: 'I' },
  { id: 'environment', label: 'Wind & Weather', icon: 'W' },
  { id: 'racing', label: 'Racing', icon: 'R' },
  { id: 'modifiers', label: 'Modifiers', icon: 'X' },
]

export function LandingPage() {
  const {
    selectedPresetId,
    mapConfig,
    playerName,
    customMode,
    selectPreset,
    setMapConfig,
    setPlayerName,
    setCustomMode,
    randomizeSeed,
    startGame,
  } = useLandingStore()

  const initializeWorldFromConfig = useWorldStore((s) => s.initializeWorldFromConfig)

  const [nameInput, setNameInput] = useState(playerName)
  const [activeTab, setActiveTab] = useState<ConfigTab>('terrain')

  const presetEntries = useMemo(() => Object.entries(MAP_PRESETS), [])

  const getDifficultyColor = (d: WorldDifficulty) => {
    switch (d) {
      case 'peaceful': return 'text-green-400 border-green-400/50 bg-green-900/20'
      case 'moderate': return 'text-blue-400 border-blue-400/50 bg-blue-900/20'
      case 'challenging': return 'text-yellow-400 border-yellow-400/50 bg-yellow-900/20'
      case 'extreme': return 'text-red-400 border-red-400/50 bg-red-900/20'
    }
  }

  const handleStartGame = useCallback(() => {
    try {
      setPlayerName(nameInput || 'Navigator')
      console.log('Initializing world with config:', mapConfig)
      initializeWorldFromConfig(mapConfig)
      console.log('Starting game...')
      startGame()
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Error starting game. Please try again.')
    }
  }, [nameInput, mapConfig, setPlayerName, initializeWorldFromConfig, startGame])

  const update = useCallback(
    (partial: Partial<MapConfig>) => setMapConfig(partial),
    [setMapConfig],
  )

  // ── Map summary stats ──
  const stats = useMemo(() => {
    const c = mapConfig
    return [
      { label: 'Map Size', value: `${(c.worldSize / 1000).toFixed(0)}km` },
      { label: 'Islands', value: `${c.islandCount}` },
      { label: 'Icebergs', value: `${c.icebergCount}` },
      { label: 'Ice Chunks', value: `${Math.round(c.floatingIceDensity)}` },
      { label: 'Races', value: `${c.raceCount}` },
      { label: 'Wind Zones', value: `${c.windZoneCount}` },
    ]
  }, [mapConfig])

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="pt-8 pb-4 text-center flex-shrink-0">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 mb-1">
            InfoRelax
          </h1>
          <p className="text-base text-cyan-300/80 font-light">Electric Yacht Sailing Experience</p>
        </div>

        {/* Scrollable main area */}
        <div className="flex-1 overflow-y-auto px-4 pb-28">
          <div className="max-w-6xl mx-auto">
            {/* ── Captain + Sail Row ── */}
            <div className="mb-6 max-w-2xl mx-auto">
              <label className="block text-cyan-400 font-semibold mb-2 text-sm">Captain's Name</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm"
                />
                <button
                  onClick={handleStartGame}
                  className="px-8 py-2.5 rounded-lg font-bold text-base bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                  SET SAIL
                </button>
              </div>
            </div>

            {/* ── Preset Cards ── */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-cyan-400 mb-3">Select Map Preset</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {presetEntries.map(([id, preset]) => {
                  const desc = MAP_DESCRIPTIONS[id]
                  const isSelected = selectedPresetId === id
                  return (
                    <button
                      key={id}
                      onClick={() => selectPreset(id)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-900/30 shadow-md shadow-cyan-400/20'
                          : 'border-slate-600/60 bg-slate-800/30 hover:border-cyan-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="text-sm font-bold text-white truncate">{preset.name}</h3>
                      </div>
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 border rounded mb-2 ${getDifficultyColor(
                          preset.difficulty,
                        )}`}
                      >
                        {preset.difficulty.toUpperCase()}
                      </span>
                      {desc && (
                        <p className="text-[11px] text-slate-400 leading-tight mb-2 line-clamp-2">
                          {desc.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {desc?.features.slice(0, 3).map((f) => (
                          <span key={f} className="text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-cyan-300/80 rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                      {isSelected && (
                        <div className="mt-2 text-[11px] text-cyan-400 font-semibold">Selected</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Seed & Size Row ── */}
            <div className="mb-4 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-slate-300 mb-1">Map Seed / ID</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={mapConfig.seed}
                    onChange={(e) => update({ seed: parseInt(e.target.value) || 0 })}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={randomizeSeed}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-500 rounded text-xs text-cyan-300 transition-colors"
                    title="Randomize seed"
                  >
                    Dice
                  </button>
                </div>
              </div>
              <div className="w-48">
                <Slider
                  label="Map Size"
                  value={mapConfig.worldSize}
                  min={4000}
                  max={20000}
                  step={1000}
                  onChange={(v) => update({ worldSize: v })}
                  formatValue={(v) => `${(v / 1000).toFixed(0)}km`}
                />
              </div>
              <div className="w-36">
                <Select<WorldDifficulty>
                  label="Base Difficulty"
                  value={mapConfig.difficulty}
                  options={[
                    { value: 'peaceful', label: 'Peaceful' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'challenging', label: 'Challenging' },
                    { value: 'extreme', label: 'Extreme' },
                  ]}
                  onChange={(v) => update({ difficulty: v })}
                />
              </div>
            </div>

            {/* ── Map Summary Bar ── */}
            <div className="mb-4 flex flex-wrap gap-4 px-4 py-2.5 bg-slate-800/40 border border-slate-700/50 rounded-lg">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-cyan-400 font-bold text-sm font-mono">{s.value}</div>
                  <div className="text-[10px] text-slate-400">{s.label}</div>
                </div>
              ))}
              <div className="ml-auto flex items-center">
                <Toggle
                  label="Customize Map"
                  checked={customMode}
                  onChange={setCustomMode}
                />
              </div>
            </div>

            {/* ── Customization Panel (collapsible) ── */}
            {customMode && (
              <div className="mb-6 border border-cyan-500/20 rounded-lg bg-slate-900/50 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-700/50">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-cyan-400 bg-slate-800/60 border-b-2 border-cyan-400'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="mr-1 font-mono text-[10px] opacity-60">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                  {activeTab === 'terrain' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <Slider
                        label="Island Count"
                        value={mapConfig.islandCount}
                        min={2}
                        max={25}
                        step={1}
                        onChange={(v) => update({ islandCount: v })}
                      />
                      <Select<IslandDistribution>
                        label="Island Layout"
                        value={mapConfig.islandDistribution}
                        options={[
                          { value: 'ring', label: 'Ring - Evenly spaced circle' },
                          { value: 'clustered', label: 'Clustered - Grouped pockets' },
                          { value: 'scattered', label: 'Scattered - Random placement' },
                          { value: 'archipelago', label: 'Archipelago - Winding chain' },
                        ]}
                        onChange={(v) => update({ islandDistribution: v })}
                      />
                      <Slider
                        label="Island Size Scale"
                        value={mapConfig.islandSizeScale}
                        min={0.3}
                        max={2.5}
                        step={0.1}
                        onChange={(v) => update({ islandSizeScale: v })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                      />
                      <Slider
                        label="Island Height Scale"
                        value={mapConfig.islandHeightScale}
                        min={0.3}
                        max={2.5}
                        step={0.1}
                        onChange={(v) => update({ islandHeightScale: v })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                      />
                      <Slider
                        label="Safe Zone Radius"
                        value={mapConfig.safeZoneRadius}
                        min={100}
                        max={1500}
                        step={50}
                        onChange={(v) => update({ safeZoneRadius: v })}
                        suffix="m"
                      />
                      <Slider
                        label="Marina Charge Rate"
                        value={mapConfig.marinaChargeRate}
                        min={1}
                        max={25}
                        step={1}
                        onChange={(v) => update({ marinaChargeRate: v })}
                        suffix=" EC/s"
                      />
                    </div>
                  )}

                  {activeTab === 'ice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <Slider
                        label="Iceberg Count"
                        value={mapConfig.icebergCount}
                        min={0}
                        max={250}
                        step={5}
                        onChange={(v) => update({ icebergCount: v })}
                      />
                      <Select<IcebergSpread>
                        label="Iceberg Spread Pattern"
                        value={mapConfig.icebergSpread}
                        options={[
                          { value: 'random', label: 'Random - Golden angle spread' },
                          { value: 'concentrated', label: 'Concentrated - Near islands' },
                          { value: 'dispersed', label: 'Dispersed - Uniform coverage' },
                          { value: 'lanes', label: 'Lanes - Navigable corridors' },
                        ]}
                        onChange={(v) => update({ icebergSpread: v })}
                      />
                      <Slider
                        label="Iceberg Size Scale"
                        value={mapConfig.icebergSizeScale}
                        min={0.3}
                        max={3.0}
                        step={0.1}
                        onChange={(v) => update({ icebergSizeScale: v })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                      />
                      <Slider
                        label="Floating Ice Pieces"
                        value={mapConfig.floatingIceDensity}
                        min={0}
                        max={2500}
                        step={50}
                        onChange={(v) => update({ floatingIceDensity: v })}
                      />
                      <Slider
                        label="Floating Ice Size Scale"
                        value={mapConfig.floatingIceSizeScale}
                        min={0.3}
                        max={3.0}
                        step={0.1}
                        onChange={(v) => update({ floatingIceSizeScale: v })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                      />
                      <Toggle
                        label="Iceberg Drift (icebergs slowly move)"
                        checked={mapConfig.icebergDrift}
                        onChange={(v) => update({ icebergDrift: v })}
                      />
                    </div>
                  )}

                  {activeTab === 'environment' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <Slider
                        label="Wind Zones"
                        value={mapConfig.windZoneCount}
                        min={0}
                        max={10}
                        step={1}
                        onChange={(v) => update({ windZoneCount: v })}
                      />
                      <Slider
                        label="Wind Strength"
                        value={mapConfig.windStrengthMultiplier}
                        min={0.2}
                        max={3.0}
                        step={0.1}
                        onChange={(v) => update({ windStrengthMultiplier: v })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                      />
                      <Slider
                        label="Weather Volatility"
                        value={mapConfig.weatherVolatility}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) => update({ weatherVolatility: v })}
                        formatValue={(v) => `${Math.round(v * 100)}%`}
                      />
                      <Slider
                        label="Fog Density"
                        value={mapConfig.fogDensity}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) => update({ fogDensity: v })}
                        formatValue={(v) => `${Math.round(v * 100)}%`}
                      />
                      <Slider
                        label="Current Strength"
                        value={mapConfig.currentStrength}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) => update({ currentStrength: v })}
                        formatValue={(v) => `${Math.round(v * 100)}%`}
                      />
                      <Slider
                        label="POI Density"
                        value={mapConfig.poiDensity}
                        min={0.2}
                        max={3.0}
                        step={0.1}
                        onChange={(v) => update({ poiDensity: v })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                      />
                    </div>
                  )}

                  {activeTab === 'racing' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <Slider
                        label="Race Count"
                        value={mapConfig.raceCount}
                        min={0}
                        max={8}
                        step={1}
                        onChange={(v) => update({ raceCount: v })}
                      />
                      <Select<RaceLength>
                        label="Race Length"
                        value={mapConfig.raceLength}
                        options={[
                          { value: 'short', label: 'Short - Quick sprints (3-4 checkpoints)' },
                          { value: 'medium', label: 'Medium - Standard routes (4-8 checkpoints)' },
                          { value: 'long', label: 'Long - Endurance runs (7-12 checkpoints)' },
                        ]}
                        onChange={(v) => update({ raceLength: v })}
                      />
                      <Slider
                        label="Route Complexity"
                        value={mapConfig.routeComplexity}
                        min={0.2}
                        max={3.0}
                        step={0.1}
                        onChange={(v) => update({ routeComplexity: v })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                      />
                      <Slider
                        label="Discovery Reward"
                        value={mapConfig.discoveryRewardMultiplier}
                        min={0.5}
                        max={5.0}
                        step={0.25}
                        onChange={(v) => update({ discoveryRewardMultiplier: v })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                      />
                    </div>
                  )}

                  {activeTab === 'modifiers' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <Slider
                        label="Energy Multiplier"
                        value={mapConfig.energyMultiplier}
                        min={0.5}
                        max={5.0}
                        step={0.25}
                        onChange={(v) => update({ energyMultiplier: v })}
                        formatValue={(v) => `${v.toFixed(1)}x`}
                      />
                      <Toggle
                        label="Night Mode (start at night)"
                        checked={mapConfig.nightMode}
                        onChange={(v) => update({ nightMode: v })}
                      />
                      <Toggle
                        label="Iceberg Drift"
                        checked={mapConfig.icebergDrift}
                        onChange={(v) => update({ icebergDrift: v })}
                      />
                      <Slider
                        label="Current Strength"
                        value={mapConfig.currentStrength}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) => update({ currentStrength: v })}
                        formatValue={(v) => `${Math.round(v * 100)}%`}
                      />
                      <Slider
                        label="Fog Density"
                        value={mapConfig.fogDensity}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(v) => update({ fogDensity: v })}
                        formatValue={(v) => `${Math.round(v * 100)}%`}
                      />
                      <Slider
                        label="Safe Zone Radius"
                        value={mapConfig.safeZoneRadius}
                        min={100}
                        max={1500}
                        step={50}
                        onChange={(v) => update({ safeZoneRadius: v })}
                        suffix="m"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Quick reference / Tips ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-800/30 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-400 mb-2">World Features</h3>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>Procedural islands from seed</li>
                  <li>Dynamic wind zones & weather</li>
                  <li>Discoverable Points of Interest</li>
                  <li>Central marina with charging</li>
                </ul>
              </div>
              <div className="bg-slate-800/30 border border-green-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-green-400 mb-2">Racing</h3>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>Auto-generated race routes</li>
                  <li>Routes weave through ice</li>
                  <li>Checkpoint-based timing</li>
                  <li>Leaderboards per seed</li>
                </ul>
              </div>
              <div className="bg-slate-800/30 border border-purple-500/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-purple-400 mb-2">Tips</h3>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>Share your seed for identical maps</li>
                  <li>Higher fog = harder navigation</li>
                  <li>More icebergs = trickier races</li>
                  <li>Night mode + fog = ultimate challenge</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pt-6 pb-6 px-4 pointer-events-none">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-xs text-slate-500">
              Map: <span className="text-cyan-400/80 font-mono">{mapConfig.name}</span>
              {' | '}Seed: <span className="text-cyan-400/80 font-mono">{mapConfig.seed}</span>
              {' | '}Size: <span className="text-cyan-400/80 font-mono">{(mapConfig.worldSize / 1000).toFixed(0)}km</span>
              {' | '}Captain: <span className="text-cyan-400/80">{nameInput || 'Navigator'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
