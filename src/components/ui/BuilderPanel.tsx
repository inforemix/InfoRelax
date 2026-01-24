import { useState } from 'react'
import { useYachtStore, HullType } from '@/state/useYachtStore'
import { KaleidoscopeModal } from '@/editor'

// Slider component for consistent styling
function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

// Visual bar indicator component
function StatBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const percentage = Math.min((value / max) * 100, 100)
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function BuilderPanel() {
  const {
    currentYacht, setHull, setTurbine, setSolar, setBladeProfile, stats,
    setSecondTurbineEnabled, setSecondTurbineYOffset, setSecondBladeProfile,
    setTurbineAnimation
  } = useYachtStore()
  const {
    hull, turbine, solar,
    secondTurbineEnabled, secondTurbine, secondTurbineYOffset,
    turbineAnimation
  } = currentYacht
  const [isKaleidoscopeOpen, setIsKaleidoscopeOpen] = useState(false)
  const [isSecondKaleidoscopeOpen, setIsSecondKaleidoscopeOpen] = useState(false)

  return (
    <div className="absolute left-4 top-20 bottom-20 w-80 glass rounded-2xl p-4 overflow-y-auto pointer-events-auto">
      <h2 className="text-xl font-bold text-white mb-4">Yacht Builder</h2>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-800/50 rounded-xl">
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-400">{stats.maxSpeed.toFixed(1)}</div>
          <div className="text-xs text-slate-400">Max Speed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{(stats.turbineEfficiency * 100).toFixed(0)}%</div>
          <div className="text-xs text-slate-400">Efficiency</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-400">{stats.range.toFixed(0)}</div>
          <div className="text-xs text-slate-400">Range (km)</div>
        </div>
      </div>

      {/* Drag & Stability Indicators */}
      <div className="mb-6 p-3 bg-slate-800/50 rounded-xl">
        <h4 className="text-xs font-semibold text-slate-300 mb-2">Hull Performance</h4>
        <StatBar
          value={stats.dragCoefficient}
          max={0.15}
          color="bg-red-500"
          label="Drag (lower is better)"
        />
        <StatBar
          value={stats.stability}
          max={50}
          color="bg-blue-500"
          label="Stability"
        />
      </div>

      {/* Hull Section */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          🚤 Hull Configuration
        </h3>

        {/* Hull Type */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1 block">Hull Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['monohull', 'catamaran', 'trimaran', 'hydrofoil'] as HullType[]).map((type) => (
              <button
                key={type}
                onClick={() => setHull({ type })}
                className={`px-3 py-2 rounded-lg text-sm capitalize transition-all ${
                  hull.type === type
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                } ${type === 'hydrofoil' ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={type === 'hydrofoil'}
              >
                {type}
                {type === 'hydrofoil' && <span className="text-xs ml-1">🔒</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Length Slider */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Length</span>
            <span className="text-white">{hull.length}m</span>
          </div>
          <input
            type="range"
            min="6"
            max="20"
            step="0.5"
            value={hull.length}
            onChange={(e) => setHull({ length: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Beam Slider */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Beam (Width)</span>
            <span className="text-white">{hull.beam}m</span>
          </div>
          <input
            type="range"
            min="2"
            max="12"
            step="0.5"
            value={hull.beam}
            onChange={(e) => setHull({ beam: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Draft Slider */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Draft (Depth)</span>
            <span className="text-white">{hull.draft}m</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={hull.draft}
            onChange={(e) => setHull({ draft: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Bow Shape */}
        <div className="mb-3">
          <label className="text-xs text-slate-400 mb-1 block">Bow Shape</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { shape: 'piercing', label: 'Piercing', desc: 'Speed' },
              { shape: 'flared', label: 'Flared', desc: 'Waves' },
              { shape: 'bulbous', label: 'Bulbous', desc: 'Efficiency' },
            ] as const).map(({ shape, label, desc }) => (
              <button
                key={shape}
                onClick={() => setHull({ bowShape: shape })}
                className={`px-2 py-2 rounded-lg text-xs transition-all ${
                  hull.bowShape === shape
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {label}
                <span className="block text-[10px] opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Turbine Section */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          🌀 VAWT Turbine
        </h3>

        {/* Turbine Style */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1 block">Turbine Style</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { style: 'helix', label: '🧬 Helix', locked: false },
              { style: 'infinity', label: '∞ Infinity', locked: true },
              { style: 'ribbon', label: '🎀 Ribbon', locked: true },
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
                {locked && <span className="block text-[10px]">🔒 1k EC</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Height Slider */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Height</span>
            <span className="text-white">{turbine.height}m</span>
          </div>
          <input
            type="range"
            min="5"
            max="15"
            step="0.5"
            value={turbine.height}
            onChange={(e) => setTurbine({ height: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Diameter Slider */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Diameter</span>
            <span className="text-white">{turbine.diameter}m</span>
          </div>
          <input
            type="range"
            min="1"
            max="4"
            step="0.5"
            value={turbine.diameter}
            onChange={(e) => setTurbine({ diameter: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Blade Count */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Blade Count</span>
            <span className="text-white">{turbine.bladeCount}</span>
          </div>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                onClick={() => setTurbine({ bladeCount: count })}
                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
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

        {/* Kaleidoscope Editor Button */}
        <button
          onClick={() => setIsKaleidoscopeOpen(true)}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-all"
        >
          Open Kaleidoscope Editor
        </button>

        {/* Kaleidoscope Modal */}
        <KaleidoscopeModal
          isOpen={isKaleidoscopeOpen}
          onClose={() => setIsKaleidoscopeOpen(false)}
          bladeCount={turbine.bladeCount}
          currentPoints={turbine.bladeProfile}
          onSave={setBladeProfile}
        />
      </section>

      {/* Second Turbine Section */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          🌀 Second Turbine
        </h3>

        {/* Enable Toggle */}
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={secondTurbineEnabled}
            onChange={(e) => setSecondTurbineEnabled(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-slate-300">Enable Second Turbine</span>
        </label>

        {secondTurbineEnabled && (
          <>
            {/* Y Offset */}
            <Slider
              label="Y Offset (Height)"
              value={secondTurbineYOffset}
              min={-10}
              max={10}
              step={0.1}
              unit="m"
              onChange={setSecondTurbineYOffset}
            />

            {/* Second Kaleidoscope Editor Button */}
            <button
              onClick={() => setIsSecondKaleidoscopeOpen(true)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-all"
            >
              Draw Second Turbine Blade
            </button>

            {/* Second Kaleidoscope Modal */}
            <KaleidoscopeModal
              isOpen={isSecondKaleidoscopeOpen}
              onClose={() => setIsSecondKaleidoscopeOpen(false)}
              bladeCount={secondTurbine.bladeCount}
              currentPoints={secondTurbine.bladeProfile}
              onSave={setSecondBladeProfile}
            />
          </>
        )}
      </section>

      {/* Turbine Animation Section */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          ✨ Turbine Animation
        </h3>

        {/* Breath Amplitude */}
        <Slider
          label="Breath Amplitude"
          value={turbineAnimation.breathAmplitude}
          min={0}
          max={0.5}
          step={0.01}
          onChange={(v) => setTurbineAnimation({ breathAmplitude: v })}
        />

        {/* Breath Frequency */}
        <Slider
          label="Breath Frequency"
          value={turbineAnimation.breathFrequency}
          min={0.2}
          max={3}
          step={0.1}
          onChange={(v) => setTurbineAnimation({ breathFrequency: v })}
        />

        {/* Z Cascade */}
        <Slider
          label="Z-Axis Cascade"
          value={turbineAnimation.zCascade}
          min={0}
          max={2}
          step={0.05}
          onChange={(v) => setTurbineAnimation({ zCascade: v })}
        />
        <p className="text-xs text-slate-500 -mt-1 mb-3">
          Each blade shifts Z by cumulative amount (blade 1: 0, blade 2: value, blade 3: 2×value...)
        </p>
      </section>

      {/* Solar Section */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          ☀️ Solar Panels
        </h3>

        {/* Deck Coverage */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Deck Coverage</span>
            <span className="text-white">{solar.deckCoverage}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={solar.deckCoverage}
            onChange={(e) => setSolar({ deckCoverage: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Turbine Integrated */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={solar.turbineIntegrated}
            onChange={(e) => setSolar({ turbineIntegrated: e.target.checked })}
            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-slate-300">Turbine-integrated panels</span>
        </label>
      </section>

      {/* Save Button */}
      <button className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-medium transition-all">
        💾 Save Design
      </button>
    </div>
  )
}
