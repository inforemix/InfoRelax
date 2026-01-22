import { useState, useCallback, useEffect } from 'react'
import { useYachtStore, HullType } from '@/state/useYachtStore'
import { KaleidoscopeCanvas } from '@/editor/KaleidoscopeCanvas'
import { HullGridEditor } from '@/editor/HullGridEditor'
import { TurbineSectionEditor } from '@/editor/TurbineSectionEditor'
import { createDefaultHullConfig, createDefaultProceduralTurbineConfig } from '@/editor'
import type { ProceduralHullConfig } from '@/editor/HullTypes'
import type { ProceduralTurbineConfig } from '@/editor/TurbineTypes'

// Compact slider
function Slider({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
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
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[10px] text-slate-500 w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-500"
      />
      <span className="text-[10px] text-slate-400 w-10 text-right font-mono">
        {value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}{unit}
      </span>
    </div>
  )
}

// Collapsible section
function Section({
  title,
  children,
  defaultOpen = true
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 w-full text-left mb-1.5"
      >
        <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
      </button>
      {isOpen && <div className="pl-3">{children}</div>}
    </div>
  )
}

// Button group
function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string; locked?: boolean }[]
  value: T
  onChange: (v: T) => void
  disabled?: T[]
}) {
  return (
    <div className="flex gap-1 mb-2">
      {options.map((opt) => {
        const isDisabled = opt.locked || disabled?.includes(opt.value)
        return (
          <button
            key={opt.value}
            onClick={() => !isDisabled && onChange(opt.value)}
            className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${
              value === opt.value
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={isDisabled}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

type EditorPanel = 'turbine' | 'hull' | 'energy'
type EditorMode = 'simple' | 'advanced'

export function BuildMode() {
  const { currentYacht, setHull, setTurbine, setBladeProfile, setSolar, setBattery, stats, setProceduralHullConfig } = useYachtStore()
  const { hull, turbine, solar, battery } = currentYacht
  const [activePanel, setActivePanel] = useState<EditorPanel>('turbine')
  const [editorMode, setEditorMode] = useState<EditorMode>('simple')

  // Advanced editor configs (extended from basic config)
  const [advancedHullConfig, setAdvancedHullConfig] = useState<ProceduralHullConfig>(() => {
    const config = createDefaultHullConfig()
    return {
      ...config,
      length: hull.length,
      beam: hull.beam,
      draft: hull.draft,
      category: hull.type === 'hydrofoil' ? 'monohull' : hull.type,
      bow: { ...config.bow, type: hull.bowShape },
    }
  })

  const [advancedTurbineConfig, setAdvancedTurbineConfig] = useState<ProceduralTurbineConfig>(() => {
    const config = createDefaultProceduralTurbineConfig()
    return {
      ...config,
      height: turbine.height,
      diameter: turbine.diameter,
      bladeCount: turbine.bladeCount,
      blade: {
        ...config.blade,
        style: turbine.style === 'helix' ? 'helix' : turbine.style === 'infinity' ? 'infinity' : 'helix',
        twist: turbine.twist ?? 45,
        taper: turbine.taper ?? 0.8,
      },
    }
  })

  const handleBladeChange = useCallback((points: typeof turbine.bladeProfile) => {
    setBladeProfile(points)
  }, [setBladeProfile])

  // Set/clear procedural hull config based on editor mode and active panel
  useEffect(() => {
    if (editorMode === 'advanced' && activePanel === 'hull') {
      // When in advanced hull mode, use procedural hull rendering
      setProceduralHullConfig(advancedHullConfig)
    } else {
      // When not in advanced hull mode, use parametric hull
      setProceduralHullConfig(null)
    }
  }, [editorMode, activePanel, advancedHullConfig, setProceduralHullConfig])

  // Sync advanced config changes back to basic store and procedural hull
  const handleAdvancedHullChange = useCallback((changes: Partial<ProceduralHullConfig>) => {
    setAdvancedHullConfig(prev => {
      const updated = { ...prev, ...changes }
      // Merge nested objects properly
      if (changes.bow) updated.bow = { ...prev.bow, ...changes.bow }
      if (changes.stern) updated.stern = { ...prev.stern, ...changes.stern }
      if (changes.keel) updated.keel = { ...prev.keel, ...changes.keel }
      if (changes.chine) updated.chine = { ...prev.chine, ...changes.chine }
      if (changes.deck) updated.deck = { ...prev.deck, ...changes.deck }
      if (changes.rocker) updated.rocker = { ...prev.rocker, ...changes.rocker }
      if (changes.colors) updated.colors = { ...prev.colors, ...changes.colors }

      // Sync key properties back to basic hull config
      if (changes.length !== undefined) setHull({ length: changes.length })
      if (changes.beam !== undefined) setHull({ beam: changes.beam })
      if (changes.draft !== undefined) setHull({ draft: changes.draft })
      if (changes.bow?.type !== undefined) setHull({ bowShape: changes.bow.type as typeof hull.bowShape })

      // Update procedural hull config in store for 3D rendering
      setProceduralHullConfig(updated)

      return updated
    })
  }, [setHull, setProceduralHullConfig])

  const handleAdvancedTurbineChange = useCallback((changes: Partial<ProceduralTurbineConfig>) => {
    setAdvancedTurbineConfig(prev => {
      const updated = {
        ...prev,
        ...changes,
        blade: changes.blade ? { ...prev.blade, ...changes.blade } : prev.blade,
      }
      // Sync key properties back to basic turbine config
      if (changes.height !== undefined) setTurbine({ height: changes.height })
      if (changes.diameter !== undefined) setTurbine({ diameter: changes.diameter })
      if (changes.bladeCount !== undefined) setTurbine({ bladeCount: changes.bladeCount })
      if (changes.blade?.twist !== undefined) setTurbine({ twist: changes.blade.twist })
      if (changes.blade?.taper !== undefined) setTurbine({ taper: changes.blade.taper })
      return updated
    })
  }, [setTurbine])

  return (
    <div className="absolute inset-0 flex pointer-events-auto">
      {/* Left Panel - 1/3 width */}
      <div className="w-1/3 h-full bg-slate-900/95 backdrop-blur-md flex flex-col overflow-hidden">
        {/* Panel Tabs */}
        <div className="flex border-b border-slate-800">
          {(['turbine', 'hull', 'energy'] as EditorPanel[]).map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className={`flex-1 py-2 text-xs font-medium transition-all capitalize ${
                activePanel === panel
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {panel}
            </button>
          ))}
          {/* Mode Toggle - Pro Button */}
          <button
            onClick={() => setEditorMode(editorMode === 'simple' ? 'advanced' : 'simple')}
            className={`px-4 py-2 text-xs font-bold transition-all border-l border-slate-700 ${
              editorMode === 'advanced'
                ? 'text-purple-300 bg-purple-600/40 border-purple-500'
                : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
            }`}
            title={editorMode === 'simple' ? 'Switch to Advanced Editor' : 'Switch to Simple Editor'}
          >
            {editorMode === 'advanced' ? '✓ PRO MODE' : '⚡ PRO MODE'}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* TURBINE PANEL */}
          {activePanel === 'turbine' && editorMode === 'simple' && (
            <>
              {/* Kaleidoscope Canvas */}
              <div className="flex justify-center mb-3">
                <KaleidoscopeCanvas
                  bladeCount={turbine.bladeCount}
                  initialPoints={turbine.bladeProfile}
                  onPointsChange={handleBladeChange}
                  size={220}
                />
              </div>

              <Section title="Turbine">
                <Slider label="Height" value={turbine.height} min={5} max={12} step={0.5} unit="m" onChange={(v) => setTurbine({ height: v })} />
                <Slider label="Diameter" value={turbine.diameter} min={1} max={8} step={0.5} unit="m" onChange={(v) => setTurbine({ diameter: v })} />
                <div className="mb-2">
                  <span className="text-[10px] text-slate-500 block mb-1">Blades</span>
                  <div className="flex gap-1 flex-wrap">
                    {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => setTurbine({ bladeCount: n })}
                        className={`min-w-[28px] py-1 rounded text-[10px] font-medium ${
                          turbine.bladeCount === n ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>

              <Section title="Blade Shape">
                <Slider label="Twist" value={turbine.twist ?? 45} min={0} max={120} step={5} unit="°" onChange={(v) => setTurbine({ twist: v })} />
                <Slider label="Taper" value={turbine.taper ?? 0.8} min={0.3} max={1.0} step={0.05} onChange={(v) => setTurbine({ taper: v })} />
                <Slider label="Sweep" value={turbine.sweep ?? 0} min={-30} max={30} step={5} unit="°" onChange={(v) => setTurbine({ sweep: v })} />
                <Slider label="Thickness" value={turbine.thickness ?? 0.08} min={0.02} max={0.2} step={0.01} onChange={(v) => setTurbine({ thickness: v })} />
                <Slider label="Camber" value={turbine.camber ?? 0} min={-0.5} max={0.5} step={0.05} onChange={(v) => setTurbine({ camber: v })} />
              </Section>

              <Section title="Width by Section" defaultOpen={false}>
                <Slider label="Top" value={turbine.widthTop ?? 1.0} min={0.5} max={2.0} step={0.1} onChange={(v) => setTurbine({ widthTop: v })} />
                <Slider label="Mid" value={turbine.widthMid ?? 1.0} min={0.5} max={2.0} step={0.1} onChange={(v) => setTurbine({ widthMid: v })} />
                <Slider label="Bottom" value={turbine.widthBottom ?? 1.0} min={0.5} max={2.0} step={0.1} onChange={(v) => setTurbine({ widthBottom: v })} />
              </Section>

              <Section title="Pitch by Section" defaultOpen={false}>
                <Slider label="Top" value={turbine.angleTop ?? 0} min={-45} max={45} step={5} unit="°" onChange={(v) => setTurbine({ angleTop: v })} />
                <Slider label="Mid" value={turbine.angleMid ?? 0} min={-45} max={45} step={5} unit="°" onChange={(v) => setTurbine({ angleMid: v })} />
                <Slider label="Bottom" value={turbine.angleBottom ?? 0} min={-45} max={45} step={5} unit="°" onChange={(v) => setTurbine({ angleBottom: v })} />
              </Section>

              <Section title="Material">
                <ButtonGroup
                  options={[
                    { value: 'solar', label: 'Solar' },
                    { value: 'chrome', label: 'Chrome' },
                    { value: 'led', label: 'LED' },
                  ]}
                  value={turbine.material}
                  onChange={(v) => setTurbine({ material: v })}
                />
              </Section>

              <Section title="Style" defaultOpen={false}>
                <ButtonGroup
                  options={[
                    { value: 'helix', label: 'Helix' },
                    { value: 'infinity', label: 'Infinity', locked: true },
                    { value: 'ribbon', label: 'Ribbon', locked: true },
                  ]}
                  value={turbine.style}
                  onChange={(v) => setTurbine({ style: v })}
                />
              </Section>
            </>
          )}

          {/* ADVANCED TURBINE PANEL */}
          {activePanel === 'turbine' && editorMode === 'advanced' && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-purple-400 font-medium">Pro Turbine Editor</span>
                <span className="text-[8px] text-slate-500">Section-based blade design</span>
              </div>
              <TurbineSectionEditor
                config={advancedTurbineConfig}
                onConfigChange={handleAdvancedTurbineChange}
                size={280}
              />

              {/* Quick stats */}
              <div className="mt-3 p-2 bg-slate-800/50 rounded">
                <div className="text-[9px] text-slate-400 mb-1">Turbine Specs</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] font-bold text-cyan-400">{advancedTurbineConfig.height}m</div>
                    <div className="text-[8px] text-slate-500">Height</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-purple-400">{advancedTurbineConfig.bladeCount}</div>
                    <div className="text-[8px] text-slate-500">Blades</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-green-400">{advancedTurbineConfig.blade.twist}°</div>
                    <div className="text-[8px] text-slate-500">Twist</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* HULL PANEL - SIMPLE MODE */}
          {activePanel === 'hull' && editorMode === 'simple' && (
            <>
              <Section title="Hull Type">
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {(['monohull', 'catamaran', 'trimaran', 'hydrofoil'] as HullType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => type !== 'hydrofoil' && setHull({ type })}
                      className={`p-2 rounded text-center transition-all ${
                        hull.type === type
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      } ${type === 'hydrofoil' ? 'opacity-40 cursor-not-allowed' : ''}`}
                      disabled={type === 'hydrofoil'}
                    >
                      <span className="text-sm block">
                        {type === 'monohull' && '⛵'}
                        {type === 'catamaran' && '🚤'}
                        {type === 'trimaran' && '⛴️'}
                        {type === 'hydrofoil' && '🔒'}
                      </span>
                      <span className="text-[9px] capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Dimensions">
                <Slider label="Length" value={hull.length} min={6} max={20} step={0.5} unit="m" onChange={(v) => setHull({ length: v })} />
                <Slider label="Beam" value={hull.beam} min={2} max={12} step={0.5} unit="m" onChange={(v) => setHull({ beam: v })} />
                <Slider label="Draft" value={hull.draft} min={0.5} max={2} step={0.1} unit="m" onChange={(v) => setHull({ draft: v })} />
              </Section>

              <Section title="Bow Shape">
                <ButtonGroup
                  options={[
                    { value: 'piercing', label: 'Piercing' },
                    { value: 'flared', label: 'Flared' },
                    { value: 'bulbous', label: 'Bulbous' },
                  ]}
                  value={hull.bowShape}
                  onChange={(v) => setHull({ bowShape: v })}
                />
              </Section>

              <Section title="Performance">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-cyan-400">{stats.maxSpeed.toFixed(1)}</div>
                    <div className="text-[9px] text-slate-500">Max Speed (kts)</div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-blue-400">{stats.hullSpeed.toFixed(1)}</div>
                    <div className="text-[9px] text-slate-500">Hull Speed (kts)</div>
                  </div>
                </div>
              </Section>

              <Section title="Drag Analysis">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Total Drag</span>
                    <span className="text-red-400 font-mono">{stats.totalDrag.toFixed(0)} N</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Form Drag</span>
                    <span className="text-slate-400 font-mono">{stats.formDrag.toFixed(0)} N</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Friction</span>
                    <span className="text-slate-400 font-mono">{stats.frictionDrag.toFixed(0)} N</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Wave Drag</span>
                    <span className="text-slate-400 font-mono">{stats.waveDrag.toFixed(0)} N</span>
                  </div>
                </div>
              </Section>

              <Section title="Stability">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-green-400">{stats.stability.toFixed(0)}</div>
                    <div className="text-[9px] text-slate-500">Index (0-100)</div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className={`text-sm font-bold ${
                      stats.stabilityRating === 'Excellent' ? 'text-green-400' :
                      stats.stabilityRating === 'Good' ? 'text-cyan-400' :
                      stats.stabilityRating === 'Fair' ? 'text-yellow-400' : 'text-red-400'
                    }`}>{stats.stabilityRating}</div>
                    <div className="text-[9px] text-slate-500">Rating</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">GM Height</span>
                    <span className="text-slate-400 font-mono">{stats.metacentricHeight.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Roll Period</span>
                    <span className="text-slate-400 font-mono">{stats.rollPeriod.toFixed(1)} s</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Max Heel</span>
                    <span className="text-slate-400 font-mono">{stats.maxHeelAngle.toFixed(0)}°</span>
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* HULL PANEL - ADVANCED MODE */}
          {activePanel === 'hull' && editorMode === 'advanced' && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] text-purple-400 font-medium">Pro Hull Editor</span>
                <span className="text-[8px] text-slate-500">Draw cross-sections & profiles</span>
              </div>
              <HullGridEditor
                config={advancedHullConfig}
                onConfigChange={handleAdvancedHullChange}
                size={280}
              />

              {/* Advanced hull controls */}
              <div className="mt-3 space-y-2">
                <Section title="Bow Configuration" defaultOpen={false}>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {(['piercing', 'flared', 'bulbous', 'clipper'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => handleAdvancedHullChange({
                          bow: { ...advancedHullConfig.bow, type }
                        })}
                        className={`py-1 rounded text-[8px] capitalize ${
                          advancedHullConfig.bow.type === type
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <Slider
                    label="Entry Angle"
                    value={advancedHullConfig.bow.angle}
                    min={10}
                    max={60}
                    step={5}
                    unit="°"
                    onChange={(v) => handleAdvancedHullChange({
                      bow: { ...advancedHullConfig.bow, angle: v }
                    })}
                  />
                  <Slider
                    label="Flare"
                    value={advancedHullConfig.bow.flare}
                    min={0}
                    max={30}
                    step={5}
                    unit="°"
                    onChange={(v) => handleAdvancedHullChange({
                      bow: { ...advancedHullConfig.bow, flare: v }
                    })}
                  />
                </Section>

                <Section title="Stern Configuration" defaultOpen={false}>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {(['transom', 'cruiser', 'canoe'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => handleAdvancedHullChange({
                          stern: { ...advancedHullConfig.stern, type }
                        })}
                        className={`py-1 rounded text-[8px] capitalize ${
                          advancedHullConfig.stern.type === type
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <Slider
                    label="Width"
                    value={advancedHullConfig.stern.width}
                    min={0.3}
                    max={1.0}
                    step={0.05}
                    onChange={(v) => handleAdvancedHullChange({
                      stern: { ...advancedHullConfig.stern, width: v }
                    })}
                  />
                </Section>

                <Section title="Keel Type" defaultOpen={false}>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {(['flat', 'v-hull', 'deep-v'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => handleAdvancedHullChange({
                          keel: { ...advancedHullConfig.keel, type }
                        })}
                        className={`py-1 rounded text-[8px] capitalize ${
                          advancedHullConfig.keel.type === type
                            ? 'bg-cyan-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {type.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                  <Slider
                    label="Depth"
                    value={advancedHullConfig.keel.depth}
                    min={0}
                    max={2}
                    step={0.1}
                    unit="m"
                    onChange={(v) => handleAdvancedHullChange({
                      keel: { ...advancedHullConfig.keel, depth: v }
                    })}
                  />
                </Section>
              </div>

              {/* Quick stats */}
              <div className="mt-3 p-2 bg-slate-800/50 rounded">
                <div className="text-[9px] text-slate-400 mb-1">Hull Specs</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[10px] font-bold text-cyan-400">{advancedHullConfig.length}m</div>
                    <div className="text-[8px] text-slate-500">Length</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-purple-400">{advancedHullConfig.beam}m</div>
                    <div className="text-[8px] text-slate-500">Beam</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-green-400">{advancedHullConfig.draft}m</div>
                    <div className="text-[8px] text-slate-500">Draft</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ENERGY PANEL */}
          {activePanel === 'energy' && (
            <>
              <Section title="Solar Panels">
                <Slider
                  label="Deck Coverage"
                  value={solar.deckCoverage}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  onChange={(v) => setSolar({ deckCoverage: v })}
                />

                <div className="mt-2 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={solar.turbineIntegrated}
                      onChange={(e) => setSolar({ turbineIntegrated: e.target.checked })}
                      className="w-3 h-3 accent-cyan-500"
                    />
                    <span className="text-[10px] text-slate-400">Turbine-Integrated Panels (+2m²)</span>
                  </label>
                </div>

                <div className="mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={solar.canopyEnabled}
                      onChange={(e) => setSolar({ canopyEnabled: e.target.checked })}
                      className="w-3 h-3 accent-cyan-500"
                    />
                    <span className="text-[10px] text-slate-400">Solar Canopy (adds shade & power)</span>
                  </label>
                </div>

                {/* Solar Stats */}
                <div className="mt-3 p-2 bg-slate-800/50 rounded">
                  <div className="text-[9px] text-slate-400 mb-1">Solar Specs</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] font-bold text-yellow-400">
                        {((hull.length * hull.beam * 0.6 * solar.deckCoverage / 100) + (solar.turbineIntegrated ? 2 : 0)).toFixed(1)}m²
                      </div>
                      <div className="text-[8px] text-slate-500">Panel Area</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-green-400">{stats.solarOutput.toFixed(2)} kW</div>
                      <div className="text-[8px] text-slate-500">Peak Output</div>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Engine Tier">
                <div className="mb-2">
                  <span className="text-[10px] text-slate-500 mb-2 block">Select motor power tier</span>
                  <div className="space-y-2">
                    {[
                      { tier: 'standard' as const, label: 'Standard', power: '1x', speed: '15', consumption: '1x', color: 'bg-blue-500' },
                      { tier: 'performance' as const, label: 'Performance', power: '2x', speed: '30', consumption: '2x', color: 'bg-purple-500' },
                      { tier: 'racing' as const, label: 'Racing', power: '3x', speed: '45', consumption: '3x', color: 'bg-red-500' },
                    ].map((option) => (
                      <button
                        key={option.tier}
                        onClick={() => {
                          const { setEngine } = useYachtStore.getState()
                          setEngine(option.tier)
                        }}
                        className={`w-full p-2 rounded text-left transition-all ${
                          currentYacht.engine.tier === option.tier
                            ? `${option.color} text-white`
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold">{option.label}</span>
                          <span className="text-[9px] opacity-80">Max {option.speed} kt</span>
                        </div>
                        <div className="text-[9px] opacity-80 mt-1">
                          Power: {option.power} • Consumption: {option.consumption}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Engine Stats */}
                <div className="mt-3 p-2 bg-slate-800/50 rounded">
                  <div className="text-[9px] text-slate-400 mb-1">Engine Specs</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] font-bold text-orange-400">{currentYacht.engine.powerMultiplier}x</div>
                      <div className="text-[8px] text-slate-500">Power Multiplier</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-cyan-400">{currentYacht.engine.maxSpeed} kt</div>
                      <div className="text-[8px] text-slate-500">Top Speed</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1">
                    <div>
                      <div className="text-[10px] font-bold text-red-400">{(15 * currentYacht.engine.powerMultiplier).toFixed(0)} kW</div>
                      <div className="text-[8px] text-slate-500">Max Draw @ 100%</div>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Battery System">
                <div className="mb-2">
                  <span className="text-[10px] text-slate-500 mb-1 block">Capacity</span>
                  <ButtonGroup
                    options={[
                      { value: '50', label: '50 kWh' },
                      { value: '100', label: '100 kWh' },
                      { value: '200', label: '200 kWh' },
                      { value: '500', label: '500 kWh' },
                    ]}
                    value={battery.capacity.toString()}
                    onChange={(v) => setBattery({ capacity: parseInt(v) })}
                  />
                </div>

                <Slider
                  label="Initial Charge"
                  value={battery.currentCharge}
                  min={0}
                  max={100}
                  step={5}
                  unit="%"
                  onChange={(v) => setBattery({ currentCharge: v })}
                />

                {/* Battery Stats */}
                <div className="mt-3 p-2 bg-slate-800/50 rounded">
                  <div className="text-[9px] text-slate-400 mb-1">Battery Specs</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] font-bold text-blue-400">{battery.capacity} kWh</div>
                      <div className="text-[8px] text-slate-500">Capacity</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-purple-400">
                        {(battery.capacity * battery.currentCharge / 100).toFixed(1)} kWh
                      </div>
                      <div className="text-[8px] text-slate-500">Current Charge</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1">
                    <div>
                      <div className="text-[10px] font-bold text-green-400">{stats.range.toFixed(0)} km</div>
                      <div className="text-[8px] text-slate-500">Estimated Range</div>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Energy System Info" defaultOpen={false}>
                <div className="text-[9px] text-slate-400 space-y-1">
                  <p>⚡ Energy credits (EC) are earned by harvesting wind and solar power</p>
                  <p>☀️ Solar output varies with time of day and weather</p>
                  <p>🔋 Battery stores excess energy for use when generation is low</p>
                  <p>🌊 Motor consumes battery power based on throttle and speed</p>
                  <p>💰 1 EC = 1 kWh of energy harvested</p>
                </div>
              </Section>
            </>
          )}
        </div>

        {/* Footer Stats */}
        <div className="px-3 py-2 border-t border-slate-800 bg-slate-900/80">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">Speed <span className="text-cyan-400 font-bold">{stats.maxSpeed.toFixed(1)}</span></span>
            <span className="text-slate-500">Range <span className="text-yellow-400 font-bold">{stats.range.toFixed(0)}km</span></span>
            <span className="text-slate-500">Eff <span className="text-green-400 font-bold">{(stats.turbineEfficiency * 100).toFixed(0)}%</span></span>
          </div>
        </div>
      </div>

      {/* Right Panel - 2/3 preview (transparent, pass-through mouse events) */}
      <div className="w-2/3 h-full relative pointer-events-none">
        {/* Hint at bottom */}
        <div className="absolute bottom-4 right-4 bg-slate-900/60 backdrop-blur-sm px-2 py-1 rounded pointer-events-auto">
          <p className="text-[9px] text-slate-500">Drag to rotate • Scroll to zoom</p>
        </div>
      </div>
    </div>
  )
}
