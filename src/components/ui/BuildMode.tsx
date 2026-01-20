import { useState, useCallback } from 'react'
import { useYachtStore, HullType } from '@/state/useYachtStore'
import { KaleidoscopeCanvas } from '@/editor/KaleidoscopeCanvas'
import { BLADE_PRESETS, BladePreset } from '@/editor/BladePresets'

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
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono text-[11px]">{value.toFixed(step < 1 ? 1 : 0)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  )
}

// Compact slider for section controls
function MiniSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 w-8">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
      <span className="text-[10px] text-slate-400 w-8 text-right font-mono">{value.toFixed(1)}</span>
    </div>
  )
}

// Section group component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  )
}

// Tab type for the editor panels
type EditorTab = 'design' | 'shape' | 'hull'

export function BuildMode() {
  const { currentYacht, setHull, setTurbine, setBladeProfile, stats } = useYachtStore()
  const { hull, turbine } = currentYacht
  const [activeTab, setActiveTab] = useState<EditorTab>('design')
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
      {/* Left Panel - Editor (50% width) */}
      <div className="w-1/2 h-full bg-slate-900/95 backdrop-blur-md flex flex-col">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-slate-700/50">
          {(['design', 'shape', 'hull'] as EditorTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab === 'design' ? 'Blade Design' : tab === 'shape' ? 'Blade Shape' : 'Hull'}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Design Tab - Kaleidoscope Editor */}
          {activeTab === 'design' && (
            <div className="p-4">
              <div className="flex gap-4">
                {/* Canvas */}
                <div className="flex-shrink-0">
                  <KaleidoscopeCanvas
                    bladeCount={turbine.bladeCount}
                    initialPoints={turbine.bladeProfile}
                    onPointsChange={handleBladeChange}
                    size={300}
                  />
                  <p className="text-[10px] text-slate-500 mt-2 text-center">
                    Draw from center • {turbine.bladeCount}-way symmetry ({360 / turbine.bladeCount}°)
                  </p>
                </div>

                {/* Quick Settings & Presets */}
                <div className="flex-1 min-w-0">
                  <Section title="Turbine Size">
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
                  </Section>

                  <Section title="Blade Count">
                    <div className="flex gap-1">
                      {[2, 3, 4, 5, 6].map((count) => (
                        <button
                          key={count}
                          onClick={() => setTurbine({ bladeCount: count })}
                          className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${
                            turbine.bladeCount === count
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Presets">
                    <div className="grid grid-cols-4 gap-1">
                      {BLADE_PRESETS.slice(0, 8).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => loadPreset(preset)}
                          className={`p-1.5 rounded text-center transition-all ${
                            selectedPreset === preset.id
                              ? 'bg-purple-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                          title={preset.description}
                        >
                          <span className="text-sm">{preset.icon}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Material">
                    <div className="flex gap-1">
                      {(['solar', 'chrome', 'led'] as const).map((mat) => (
                        <button
                          key={mat}
                          onClick={() => setTurbine({ material: mat })}
                          className={`flex-1 py-1.5 rounded text-xs font-medium transition-all capitalize ${
                            turbine.material === mat
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {mat}
                        </button>
                      ))}
                    </div>
                  </Section>
                </div>
              </div>
            </div>
          )}

          {/* Shape Tab - Advanced Blade Parameters */}
          {activeTab === 'shape' && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-6">
                {/* Global Shape */}
                <div>
                  <Section title="Global Shape">
                    <Slider
                      label="Helical Twist"
                      value={turbine.twist ?? 45}
                      min={0}
                      max={120}
                      step={5}
                      unit="°"
                      onChange={(v) => setTurbine({ twist: v })}
                    />
                    <Slider
                      label="Taper (top/bottom)"
                      value={turbine.taper ?? 0.8}
                      min={0.3}
                      max={1.0}
                      step={0.1}
                      unit=""
                      onChange={(v) => setTurbine({ taper: v })}
                    />
                    <Slider
                      label="Sweep Angle"
                      value={turbine.sweep ?? 0}
                      min={-30}
                      max={30}
                      step={5}
                      unit="°"
                      onChange={(v) => setTurbine({ sweep: v })}
                    />
                  </Section>

                  <Section title="Turbine Style">
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
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={locked}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Section>
                </div>

                {/* Section Controls */}
                <div>
                  <Section title="Width by Section">
                    <div className="space-y-1.5 bg-slate-800/50 rounded-lg p-3">
                      <MiniSlider
                        label="Top"
                        value={turbine.widthTop ?? 1.0}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        onChange={(v) => setTurbine({ widthTop: v })}
                      />
                      <MiniSlider
                        label="Mid"
                        value={turbine.widthMid ?? 1.0}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        onChange={(v) => setTurbine({ widthMid: v })}
                      />
                      <MiniSlider
                        label="Bot"
                        value={turbine.widthBottom ?? 1.0}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        onChange={(v) => setTurbine({ widthBottom: v })}
                      />
                    </div>
                  </Section>

                  <Section title="Chord Angle by Section">
                    <div className="space-y-1.5 bg-slate-800/50 rounded-lg p-3">
                      <MiniSlider
                        label="Top"
                        value={turbine.angleTop ?? 0}
                        min={-45}
                        max={45}
                        step={5}
                        onChange={(v) => setTurbine({ angleTop: v })}
                      />
                      <MiniSlider
                        label="Mid"
                        value={turbine.angleMid ?? 0}
                        min={-45}
                        max={45}
                        step={5}
                        onChange={(v) => setTurbine({ angleMid: v })}
                      />
                      <MiniSlider
                        label="Bot"
                        value={turbine.angleBottom ?? 0}
                        min={-45}
                        max={45}
                        step={5}
                        onChange={(v) => setTurbine({ angleBottom: v })}
                      />
                    </div>
                  </Section>

                  {/* Reset Button */}
                  <button
                    onClick={() => setTurbine({
                      twist: 45,
                      taper: 0.8,
                      sweep: 0,
                      widthTop: 1.0,
                      widthMid: 1.0,
                      widthBottom: 1.0,
                      angleTop: 0,
                      angleMid: 0,
                      angleBottom: 0,
                    })}
                    className="w-full mt-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-all"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hull Tab */}
          {activeTab === 'hull' && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Section title="Hull Type">
                    <div className="grid grid-cols-2 gap-2">
                      {(['monohull', 'catamaran', 'trimaran', 'hydrofoil'] as HullType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setHull({ type })}
                          className={`p-3 rounded-lg text-center transition-all ${
                            hull.type === type
                              ? 'bg-cyan-500 text-white ring-1 ring-cyan-400'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          } ${type === 'hydrofoil' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={type === 'hydrofoil'}
                        >
                          <span className="text-lg block">
                            {type === 'monohull' && '⛵'}
                            {type === 'catamaran' && '🚤'}
                            {type === 'trimaran' && '⛴️'}
                            {type === 'hydrofoil' && '🔒'}
                          </span>
                          <span className="text-xs capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section title="Bow Shape">
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { shape: 'piercing', icon: '🏎️' },
                        { shape: 'flared', icon: '🌊' },
                        { shape: 'bulbous', icon: '💡' },
                      ] as const).map(({ shape, icon }) => (
                        <button
                          key={shape}
                          onClick={() => setHull({ bowShape: shape })}
                          className={`p-2 rounded-lg text-center transition-all ${
                            hull.bowShape === shape
                              ? 'bg-cyan-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <span className="text-lg">{icon}</span>
                          <span className="block text-[10px] capitalize">{shape}</span>
                        </button>
                      ))}
                    </div>
                  </Section>
                </div>

                <div>
                  <Section title="Dimensions">
                    <Slider
                      label="Length"
                      value={hull.length}
                      min={6}
                      max={20}
                      step={0.5}
                      unit="m"
                      onChange={(v) => setHull({ length: v })}
                    />
                    <Slider
                      label="Beam (Width)"
                      value={hull.beam}
                      min={2}
                      max={12}
                      step={0.5}
                      unit="m"
                      onChange={(v) => setHull({ beam: v })}
                    />
                    <Slider
                      label="Draft (Depth)"
                      value={hull.draft}
                      min={0.5}
                      max={2}
                      step={0.1}
                      unit="m"
                      onChange={(v) => setHull({ draft: v })}
                    />
                  </Section>

                  <Section title="Performance">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-lg font-bold text-red-400">{stats.dragCoefficient.toFixed(3)}</div>
                        <div className="text-[10px] text-slate-500">Drag</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2">
                        <div className="text-lg font-bold text-blue-400">{stats.stability.toFixed(1)}</div>
                        <div className="text-[10px] text-slate-500">Stability</div>
                      </div>
                    </div>
                  </Section>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex justify-between items-center text-xs">
            <div className="flex gap-6">
              <span><span className="text-slate-500">Speed</span> <span className="text-cyan-400 font-bold">{stats.maxSpeed.toFixed(1)} kts</span></span>
              <span><span className="text-slate-500">Range</span> <span className="text-yellow-400 font-bold">{stats.range.toFixed(0)} km</span></span>
              <span><span className="text-slate-500">Efficiency</span> <span className="text-green-400 font-bold">{(stats.turbineEfficiency * 100).toFixed(0)}%</span></span>
            </div>
            <button className="px-4 py-1.5 bg-green-600 hover:bg-green-500 rounded text-white font-medium transition-all">
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - 3D Preview (50% width) */}
      <div className="w-1/2 h-full relative">
        {/* Preview label */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <span className="text-xs text-slate-400">Live Preview</span>
        </div>

        {/* Controls hint */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
          <p className="text-[10px] text-slate-500">Drag to rotate • Scroll to zoom</p>
        </div>
      </div>
    </div>
  )
}
