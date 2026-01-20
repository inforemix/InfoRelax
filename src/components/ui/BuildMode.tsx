import { useState, useCallback } from 'react'
import { useYachtStore, HullType } from '@/state/useYachtStore'
import { KaleidoscopeCanvas } from '@/editor/KaleidoscopeCanvas'
import { BLADE_PRESETS, BladePreset } from '@/editor/BladePresets'

// Visual bar indicator component
function StatBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const percentage = Math.min((value / max) * 100, 100)
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Slider component for consistent styling
function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  )
}

// Tab type for the editor panels
type EditorTab = 'hull' | 'turbine' | 'power'

export function BuildMode() {
  const { currentYacht, setHull, setTurbine, setSolar, setBladeProfile, stats } = useYachtStore()
  const { hull, turbine, solar } = currentYacht
  const [activeTab, setActiveTab] = useState<EditorTab>('turbine')
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  // Handle blade profile changes
  const handleBladeChange = useCallback((points: typeof turbine.bladeProfile) => {
    setBladeProfile(points)
    setSelectedPreset(null)
  }, [setBladeProfile])

  // Load a preset
  const loadPreset = useCallback((preset: BladePreset) => {
    setBladeProfile(preset.points)
    setSelectedPreset(preset.id)
  }, [setBladeProfile])

  return (
    <div className="absolute inset-0 flex pointer-events-auto">
      {/* Left Panel - Editor (2/3 width) */}
      <div className="w-2/3 h-full bg-slate-900/95 backdrop-blur-md flex flex-col">
        {/* Header with tabs */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h1 className="text-xl font-bold text-white">Yacht Builder</h1>
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
            {(['hull', 'turbine', 'power'] as EditorTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Kaleidoscope Editor - Always visible when on turbine tab */}
          {activeTab === 'turbine' && (
            <div className="flex-1 flex">
              {/* Canvas Area */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-950/50">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">
                  Kaleidoscope Blade Editor
                </h3>
                <KaleidoscopeCanvas
                  bladeCount={turbine.bladeCount}
                  initialPoints={turbine.bladeProfile}
                  onPointsChange={handleBladeChange}
                  size={360}
                />
                <p className="text-xs text-slate-500 mt-3 text-center max-w-sm">
                  Draw from center outward to design your blade. The pattern mirrors with {turbine.bladeCount}-way symmetry ({360 / turbine.bladeCount}°).
                </p>
              </div>

              {/* Turbine Controls */}
              <div className="w-72 p-4 border-l border-slate-700/50 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Turbine Settings</h3>

                {/* Turbine Style */}
                <div className="mb-4">
                  <label className="text-xs text-slate-400 mb-2 block">Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { style: 'helix', label: 'Helix', locked: false },
                      { style: 'infinity', label: 'Infinity', locked: true },
                      { style: 'ribbon', label: 'Ribbon', locked: true },
                    ] as const).map(({ style, label, locked }) => (
                      <button
                        key={style}
                        onClick={() => !locked && setTurbine({ style })}
                        className={`px-2 py-2 rounded-lg text-xs transition-all ${
                          turbine.style === style
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={locked}
                      >
                        {label}
                        {locked && <span className="block text-[9px]">Locked</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <Slider
                  label="Height"
                  value={turbine.height}
                  min={5}
                  max={15}
                  step={0.5}
                  unit="m"
                  onChange={(v) => setTurbine({ height: v })}
                />

                <Slider
                  label="Diameter"
                  value={turbine.diameter}
                  min={1}
                  max={4}
                  step={0.5}
                  unit="m"
                  onChange={(v) => setTurbine({ diameter: v })}
                />

                {/* Blade Count */}
                <div className="mb-4">
                  <label className="text-xs text-slate-400 mb-2 block">Blade Count</label>
                  <div className="flex gap-1">
                    {[2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        onClick={() => setTurbine({ bladeCount: count })}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          turbine.bladeCount === count
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blade Presets */}
                <div className="mb-4">
                  <label className="text-xs text-slate-400 mb-2 block">Blade Presets</label>
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                    {BLADE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => loadPreset(preset)}
                        className={`p-1.5 rounded-lg text-center transition-all ${
                          selectedPreset === preset.id
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                        }`}
                        title={preset.description}
                      >
                        <span className="text-base">{preset.icon}</span>
                        <span className="block text-[9px] truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hull Tab Content */}
          {activeTab === 'hull' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                {/* Hull Type Selection */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Hull Type</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {(['monohull', 'catamaran', 'trimaran', 'hydrofoil'] as HullType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setHull({ type })}
                        className={`p-4 rounded-xl text-center transition-all ${
                          hull.type === type
                            ? 'bg-cyan-500 text-white ring-2 ring-cyan-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        } ${type === 'hydrofoil' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={type === 'hydrofoil'}
                      >
                        <span className="text-2xl block mb-1">
                          {type === 'monohull' && '⛵'}
                          {type === 'catamaran' && '🚤'}
                          {type === 'trimaran' && '⛴️'}
                          {type === 'hydrofoil' && '🔒'}
                        </span>
                        <span className="text-sm capitalize font-medium">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hull Dimensions */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div>
                    <Slider
                      label="Length"
                      value={hull.length}
                      min={6}
                      max={20}
                      step={0.5}
                      unit="m"
                      onChange={(v) => setHull({ length: v })}
                    />
                  </div>
                  <div>
                    <Slider
                      label="Beam (Width)"
                      value={hull.beam}
                      min={2}
                      max={12}
                      step={0.5}
                      unit="m"
                      onChange={(v) => setHull({ beam: v })}
                    />
                  </div>
                  <div>
                    <Slider
                      label="Draft (Depth)"
                      value={hull.draft}
                      min={0.5}
                      max={2}
                      step={0.1}
                      unit="m"
                      onChange={(v) => setHull({ draft: v })}
                    />
                  </div>
                </div>

                {/* Bow Shape */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Bow Shape</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { shape: 'piercing', label: 'Piercing', desc: 'Optimized for speed', icon: '🏎️' },
                      { shape: 'flared', label: 'Flared', desc: 'Better wave handling', icon: '🌊' },
                      { shape: 'bulbous', label: 'Bulbous', desc: 'Fuel efficiency', icon: '💡' },
                    ] as const).map(({ shape, label, desc, icon }) => (
                      <button
                        key={shape}
                        onClick={() => setHull({ bowShape: shape })}
                        className={`p-4 rounded-xl text-left transition-all ${
                          hull.bowShape === shape
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-xl">{icon}</span>
                        <span className="block text-sm font-medium mt-1">{label}</span>
                        <span className="block text-xs opacity-70">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hull Performance */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Hull Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <StatBar
                      value={stats.dragCoefficient}
                      max={0.15}
                      color="bg-red-500"
                      label="Drag Coefficient"
                    />
                    <StatBar
                      value={stats.stability}
                      max={50}
                      color="bg-blue-500"
                      label="Stability Rating"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Power Tab Content */}
          {activeTab === 'power' && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-2xl mx-auto">
                {/* Solar Panels */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Solar Panels</h3>
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <Slider
                      label="Deck Coverage"
                      value={solar.deckCoverage}
                      min={0}
                      max={100}
                      step={10}
                      unit="%"
                      onChange={(v) => setSolar({ deckCoverage: v })}
                    />

                    <label className="flex items-center gap-3 cursor-pointer mt-3">
                      <input
                        type="checkbox"
                        checked={solar.turbineIntegrated}
                        onChange={(e) => setSolar({ turbineIntegrated: e.target.checked })}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="text-sm text-slate-300">Turbine-integrated panels</span>
                    </label>
                  </div>
                </div>

                {/* Power Stats */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Power Output</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400">{stats.solarOutput.toFixed(1)}</div>
                      <div className="text-xs text-slate-400">Solar kW (peak)</div>
                    </div>
                    <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">{(stats.turbineEfficiency * 100).toFixed(0)}%</div>
                      <div className="text-xs text-slate-400">Turbine Efficiency</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex justify-between items-center">
            <div className="flex gap-8">
              <div>
                <span className="text-xs text-slate-400">Max Speed</span>
                <span className="text-lg font-bold text-cyan-400 ml-2">{stats.maxSpeed.toFixed(1)} kts</span>
              </div>
              <div>
                <span className="text-xs text-slate-400">Range</span>
                <span className="text-lg font-bold text-yellow-400 ml-2">{stats.range.toFixed(0)} km</span>
              </div>
              <div>
                <span className="text-xs text-slate-400">Efficiency</span>
                <span className="text-lg font-bold text-green-400 ml-2">{(stats.turbineEfficiency * 100).toFixed(0)}%</span>
              </div>
            </div>
            <button className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-all">
              Save Design
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - 3D Preview (1/3 width) */}
      <div className="w-1/3 h-full relative">
        {/* This area is transparent to show the 3D canvas behind */}
        <div className="absolute inset-0 pointer-events-none" />

        {/* Preview label */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <span className="text-xs text-slate-400">Live Preview</span>
        </div>

        {/* Rotation hint */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 backdrop-blur-sm px-3 py-2 rounded-lg">
          <p className="text-xs text-slate-400 text-center">
            Drag to rotate • Scroll to zoom
          </p>
        </div>
      </div>
    </div>
  )
}
