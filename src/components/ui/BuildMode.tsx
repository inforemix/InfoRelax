import { useState, useCallback } from 'react'
import { useYachtStore, HullType } from '@/state/useYachtStore'
import { KaleidoscopeCanvas } from '@/editor/KaleidoscopeCanvas'

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

type EditorPanel = 'turbine' | 'hull'

export function BuildMode() {
  const { currentYacht, setHull, setTurbine, setBladeProfile, stats } = useYachtStore()
  const { hull, turbine } = currentYacht
  const [activePanel, setActivePanel] = useState<EditorPanel>('turbine')

  const handleBladeChange = useCallback((points: typeof turbine.bladeProfile) => {
    setBladeProfile(points)
  }, [setBladeProfile])

  return (
    <div className="absolute inset-0 flex pointer-events-auto">
      {/* Left Panel - 1/3 width */}
      <div className="w-1/3 h-full bg-slate-900/95 backdrop-blur-md flex flex-col overflow-hidden">
        {/* Panel Tabs */}
        <div className="flex border-b border-slate-800">
          {(['turbine', 'hull'] as EditorPanel[]).map((panel) => (
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
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* TURBINE PANEL */}
          {activePanel === 'turbine' && (
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
                <Slider label="Height" value={turbine.height} min={5} max={15} step={0.5} unit="m" onChange={(v) => setTurbine({ height: v })} />
                <Slider label="Diameter" value={turbine.diameter} min={1} max={4} step={0.5} unit="m" onChange={(v) => setTurbine({ diameter: v })} />
                <div className="mb-2">
                  <span className="text-[10px] text-slate-500 block mb-1">Blades</span>
                  <div className="flex gap-1">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <button
                        key={n}
                        onClick={() => setTurbine({ bladeCount: n })}
                        className={`flex-1 py-1 rounded text-[10px] font-medium ${
                          turbine.bladeCount === n ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
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

          {/* HULL PANEL */}
          {activePanel === 'hull' && (
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-red-400">{stats.dragCoefficient.toFixed(3)}</div>
                    <div className="text-[9px] text-slate-500">Drag</div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-sm font-bold text-blue-400">{stats.stability.toFixed(1)}</div>
                    <div className="text-[9px] text-slate-500">Stability</div>
                  </div>
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

      {/* Right Panel - 2/3 preview (transparent) */}
      <div className="w-2/3 h-full relative">
        {/* Hint at bottom */}
        <div className="absolute bottom-4 right-4 bg-slate-900/60 backdrop-blur-sm px-2 py-1 rounded">
          <p className="text-[9px] text-slate-500">Drag to rotate • Scroll to zoom</p>
        </div>
      </div>
    </div>
  )
}
