import { useYachtStore, HullType } from '@/state/useYachtStore'

export function BuilderPanel() {
  const { currentYacht, setHull, setTurbine, setSolar, stats } = useYachtStore()
  const { hull, turbine, solar } = currentYacht

  return (
    <div className="absolute left-4 top-20 bottom-20 w-80 glass rounded-2xl p-4 overflow-y-auto pointer-events-auto">
      <h2 className="text-xl font-bold text-white mb-4">🔧 Yacht Builder</h2>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 mb-6 p-3 bg-slate-800/50 rounded-xl">
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
            max="6"
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
            min="2"
            max="8"
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
        <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-all">
          ✨ Open Kaleidoscope Editor
        </button>
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
