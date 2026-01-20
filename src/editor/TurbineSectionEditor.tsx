/**
 * Turbine Section Editor - Visual editor for blade sections and turbine customization
 * Allows users to customize blade shape at different heights with real-time preview
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import {
  ProceduralTurbineConfig,
  BladeSection,
  BladeStyle,
  AirfoilType,
  TurbineSectionEditorState,
  DEFAULT_BLADE_SECTION,
} from './TurbineTypes'
import {
  TURBINE_CATEGORIES,
  getTurbinePresetsByCategory,
  BLADE_STYLE_INFO,
  AIRFOIL_INFO,
} from './TurbineShapeLibrary'
import type { TurbinePreset } from './TurbineShapeLibrary'

interface TurbineSectionEditorProps {
  config: ProceduralTurbineConfig
  onConfigChange: (config: Partial<ProceduralTurbineConfig>) => void
  size?: number
}

// Interpolate section values
function interpolateSections(sections: BladeSection[], position: number): BladeSection {
  if (sections.length === 0) return DEFAULT_BLADE_SECTION
  if (sections.length === 1) return sections[0]

  // Find surrounding sections
  const sorted = [...sections].sort((a, b) => a.position - b.position)
  let lower = sorted[0]
  let upper = sorted[sorted.length - 1]

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].position <= position && sorted[i + 1].position >= position) {
      lower = sorted[i]
      upper = sorted[i + 1]
      break
    }
  }

  if (lower.position === upper.position) return lower

  const t = (position - lower.position) / (upper.position - lower.position)

  return {
    position,
    width: lower.width + (upper.width - lower.width) * t,
    thickness: lower.thickness + (upper.thickness - lower.thickness) * t,
    pitch: lower.pitch + (upper.pitch - lower.pitch) * t,
    twist: lower.twist + (upper.twist - lower.twist) * t,
    sweep: lower.sweep + (upper.sweep - lower.sweep) * t,
    camber: lower.camber + (upper.camber - lower.camber) * t,
    leadingEdge: lower.leadingEdge + (upper.leadingEdge - lower.leadingEdge) * t,
    trailingEdge: lower.trailingEdge + (upper.trailingEdge - lower.trailingEdge) * t,
    offset: {
      x: lower.offset.x + (upper.offset.x - lower.offset.x) * t,
      y: lower.offset.y + (upper.offset.y - lower.offset.y) * t,
    },
  }
}

export function TurbineSectionEditor({ config, onConfigChange, size = 350 }: TurbineSectionEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [editorState, setEditorState] = useState<TurbineSectionEditorState>({
    activeSection: 1,
    sectionCount: config.blade.sections.length,
    editMode: 'section',
    showWireframe: false,
    showSections: true,
    showAirflow: false,
    selectedTool: 'adjust',
    symmetryMode: true,
    previewRotation: true,
  })

  const [selectedPresetCategory, setSelectedPresetCategory] = useState<keyof typeof TURBINE_CATEGORIES>('efficiency')
  const [showPresets, setShowPresets] = useState(false)
  const [rotationAngle, setRotationAngle] = useState(0)

  const center = size / 2
  const scale = size / 3

  // Animation for rotation preview
  useEffect(() => {
    if (!editorState.previewRotation) return

    const interval = setInterval(() => {
      setRotationAngle(prev => (prev + 2) % 360)
    }, 50)

    return () => clearInterval(interval)
  }, [editorState.previewRotation])

  // Get current section or interpolated
  const currentSection = useMemo(() => {
    const sections = config.blade.sections
    const activePos = editorState.activeSection / (editorState.sectionCount - 1)
    return interpolateSections(sections, activePos)
  }, [config.blade.sections, editorState.activeSection, editorState.sectionCount])

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, size, size)

    // Draw radial grid
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 0.5

    // Concentric circles
    for (let r = 30; r < size / 2; r += 30) {
      ctx.beginPath()
      ctx.arc(center, center, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Radial lines for blades
    const bladeAngleStep = (Math.PI * 2) / config.bladeCount
    ctx.strokeStyle = '#334155'
    for (let i = 0; i < config.bladeCount; i++) {
      const angle = bladeAngleStep * i + (rotationAngle * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.lineTo(center + Math.cos(angle) * (size / 2.2), center + Math.sin(angle) * (size / 2.2))
      ctx.stroke()
    }

    // Draw hub
    const hubRadius = (config.hub.diameter / 2) * scale * 2
    ctx.beginPath()
    ctx.fillStyle = '#475569'
    ctx.arc(center, center, hubRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw blade cross-sections
    const sections = config.blade.sections
    const sectionCount = Math.max(3, sections.length)

    for (let s = 0; s < sectionCount; s++) {
      const sectionPos = s / (sectionCount - 1)
      const section = interpolateSections(sections, sectionPos)
      const isActive = s === editorState.activeSection

      // Calculate blade position for this section
      for (let blade = 0; blade < config.bladeCount; blade++) {
        const baseAngle = (blade / config.bladeCount) * Math.PI * 2 + (rotationAngle * Math.PI) / 180
        const twistOffset = (config.blade.twist * sectionPos * Math.PI) / 180
        const angle = baseAngle + twistOffset

        // Radial distance based on section
        const baseRadius = hubRadius + (scale * 0.8 - hubRadius) * (0.3 + sectionPos * 0.7)
        const offsetRadius = baseRadius + section.offset.x * scale * 0.3

        // Blade chord endpoints
        const chordLength = config.blade.chord * scale * section.width
        const pitchAngle = (section.pitch * Math.PI) / 180

        const x = center + Math.cos(angle) * offsetRadius
        const y = center + Math.sin(angle) * offsetRadius

        // Draw blade chord
        ctx.beginPath()
        const perpAngle = angle + Math.PI / 2 + pitchAngle

        const leadX = x + Math.cos(perpAngle) * chordLength / 2
        const leadY = y + Math.sin(perpAngle) * chordLength / 2
        const trailX = x - Math.cos(perpAngle) * chordLength / 2
        const trailY = y - Math.sin(perpAngle) * chordLength / 2

        ctx.moveTo(leadX, leadY)
        ctx.lineTo(trailX, trailY)

        ctx.strokeStyle = isActive ? '#22d3ee' : blade === 0 ? '#8b5cf6' : '#6d28d9'
        ctx.lineWidth = isActive ? 4 : Math.max(1, config.blade.thickness * 20 * section.thickness)
        ctx.lineCap = 'round'
        ctx.stroke()

        // Draw camber curve if active
        if (isActive && blade === 0 && Math.abs(section.camber) > 0.01) {
          ctx.beginPath()
          const camberOffset = section.camber * chordLength * 0.3
          const midX = (leadX + trailX) / 2 + Math.cos(angle) * camberOffset
          const midY = (leadY + trailY) / 2 + Math.sin(angle) * camberOffset

          ctx.moveTo(leadX, leadY)
          ctx.quadraticCurveTo(midX, midY, trailX, trailY)
          ctx.strokeStyle = '#f472b6'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
    }

    // Draw section indicators on the side
    if (editorState.showSections) {
      const indicatorX = size - 25
      const indicatorTop = 30
      const indicatorHeight = size - 60

      // Background bar
      ctx.fillStyle = '#1e293b'
      ctx.fillRect(indicatorX - 5, indicatorTop, 10, indicatorHeight)

      // Section markers
      sections.forEach((section, i) => {
        const y = indicatorTop + section.position * indicatorHeight
        ctx.beginPath()
        ctx.fillStyle = i === editorState.activeSection ? '#22d3ee' : '#8b5cf6'
        ctx.arc(indicatorX, y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      // Active position marker
      const activeY = indicatorTop + (editorState.activeSection / (editorState.sectionCount - 1)) * indicatorHeight
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(indicatorX - 10, activeY)
      ctx.lineTo(indicatorX + 10, activeY)
      ctx.stroke()
    }

    // Labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    ctx.fillText(`${config.bladeCount} blades`, 8, 18)
    ctx.fillText(`Section ${editorState.activeSection + 1}/${editorState.sectionCount}`, 8, 32)

    // Style indicator
    ctx.fillStyle = '#64748b'
    ctx.font = 'bold 11px sans-serif'
    const styleInfo = BLADE_STYLE_INFO[config.blade.style]
    ctx.fillText(`${styleInfo?.icon || ''} ${styleInfo?.name || config.blade.style}`, 8, size - 12)

  }, [size, center, scale, config, editorState, rotationAngle])

  useEffect(() => {
    draw()
  }, [draw])

  // Update a section property
  const updateSection = useCallback((property: keyof BladeSection, value: number) => {
    const sections = [...config.blade.sections]
    const activePos = editorState.activeSection / (editorState.sectionCount - 1)

    // Find or create section at this position
    let sectionIndex = sections.findIndex(s => Math.abs(s.position - activePos) < 0.01)

    if (sectionIndex === -1) {
      // Create new section
      const newSection = interpolateSections(sections, activePos)
      sections.push(newSection)
      sections.sort((a, b) => a.position - b.position)
      sectionIndex = sections.findIndex(s => Math.abs(s.position - activePos) < 0.01)
    }

    // Update the property by creating a new section object
    sections[sectionIndex] = {
      ...sections[sectionIndex],
      [property]: value,
    }

    onConfigChange({
      blade: {
        ...config.blade,
        sections,
      },
    })
  }, [config.blade, editorState.activeSection, editorState.sectionCount, onConfigChange])

  // Update global blade property
  const updateBlade = useCallback((property: keyof typeof config.blade, value: unknown) => {
    onConfigChange({
      blade: {
        ...config.blade,
        [property]: value,
      },
    })
  }, [config.blade, onConfigChange])

  // Load preset
  const loadPreset = (preset: TurbinePreset) => {
    if (preset.config) {
      onConfigChange(preset.config)
    }
    setShowPresets(false)
  }

  const categoryPresets = useMemo(
    () => getTurbinePresetsByCategory(selectedPresetCategory),
    [selectedPresetCategory]
  )

  // Compact slider component
  const Slider = ({ label, value, min, max, step, unit = '', onChange }: {
    label: string
    value: number
    min: number
    max: number
    step: number
    unit?: string
    onChange: (v: number) => void
  }) => (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-[9px] text-slate-500 w-14 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-500"
      />
      <span className="text-[9px] text-slate-400 w-10 text-right font-mono">
        {value.toFixed(step < 1 ? 1 : 0)}{unit}
      </span>
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-xl border border-slate-700"
        />

        {/* Control buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => setEditorState(prev => ({ ...prev, previewRotation: !prev.previewRotation }))}
            className={`px-2 py-1 rounded text-[9px] transition-all ${
              editorState.previewRotation ? 'bg-cyan-500 text-white' : 'bg-slate-800/80 text-slate-400'
            }`}
            title="Toggle rotation"
          >
            {editorState.previewRotation ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={() => setEditorState(prev => ({ ...prev, showSections: !prev.showSections }))}
            className={`px-2 py-1 rounded text-[9px] transition-all ${
              editorState.showSections ? 'bg-purple-500 text-white' : 'bg-slate-800/80 text-slate-400'
            }`}
            title="Show sections"
          >
            📊
          </button>
        </div>
      </div>

      {/* Section selector */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[9px] text-slate-500">Section</span>
        <input
          type="range"
          min={0}
          max={editorState.sectionCount - 1}
          value={editorState.activeSection}
          onChange={e => setEditorState(prev => ({ ...prev, activeSection: parseInt(e.target.value) }))}
          className="flex-1 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-500"
        />
        <span className="text-[9px] text-cyan-400 font-mono w-8">
          {((editorState.activeSection / (editorState.sectionCount - 1)) * 100).toFixed(0)}%
        </span>
      </div>

      {/* Section controls */}
      <div className="bg-slate-800/50 rounded-lg p-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold text-slate-300">Section Properties</span>
          <span className="text-[9px] text-slate-500">@ {((editorState.activeSection / (editorState.sectionCount - 1)) * 100).toFixed(0)}% height</span>
        </div>

        <Slider label="Width" value={currentSection.width} min={0.2} max={3.0} step={0.1} onChange={v => updateSection('width', v)} />
        <Slider label="Thickness" value={currentSection.thickness} min={0.5} max={2.0} step={0.1} onChange={v => updateSection('thickness', v)} />
        <Slider label="Pitch" value={currentSection.pitch} min={-60} max={60} step={5} unit="°" onChange={v => updateSection('pitch', v)} />
        <Slider label="Sweep" value={currentSection.sweep} min={-30} max={30} step={5} unit="°" onChange={v => updateSection('sweep', v)} />
        <Slider label="Camber" value={currentSection.camber} min={-0.5} max={0.5} step={0.05} onChange={v => updateSection('camber', v)} />
      </div>

      {/* Global blade controls */}
      <div className="bg-slate-800/50 rounded-lg p-2">
        <div className="text-[10px] font-semibold text-slate-300 mb-2">Global Blade Shape</div>

        <Slider label="Twist" value={config.blade.twist} min={0} max={180} step={5} unit="°" onChange={v => updateBlade('twist', v)} />
        <Slider label="Taper" value={config.blade.taper} min={0.3} max={1.5} step={0.05} onChange={v => updateBlade('taper', v)} />
        <Slider label="Chord" value={config.blade.chord} min={0.1} max={1.0} step={0.05} onChange={v => updateBlade('chord', v)} />

        {/* Blade count */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] text-slate-500 w-14">Blades</span>
          <div className="flex gap-1 flex-1 flex-wrap">
            {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
              <button
                key={n}
                onClick={() => onConfigChange({ bladeCount: n })}
                className={`min-w-[22px] py-0.5 rounded text-[9px] font-medium transition-all ${
                  config.bladeCount === n ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Blade style */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] text-slate-500 w-14">Style</span>
          <div className="flex gap-1 flex-1 flex-wrap">
            {(['helix', 'darrieus', 'savonius', 'h-rotor'] as BladeStyle[]).map(style => {
              const info = BLADE_STYLE_INFO[style]
              return (
                <button
                  key={style}
                  onClick={() => updateBlade('style', style)}
                  className={`px-1.5 py-0.5 rounded text-[8px] transition-all ${
                    config.blade.style === style ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                  title={info?.description}
                >
                  {info?.icon}
                </button>
              )
            })}
          </div>
        </div>

        {/* Airfoil type */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[9px] text-slate-500 w-14">Airfoil</span>
          <select
            value={config.blade.airfoil}
            onChange={e => updateBlade('airfoil', e.target.value)}
            className="flex-1 bg-slate-700 text-slate-300 text-[9px] py-0.5 px-1 rounded border-none outline-none"
          >
            {(Object.entries(AIRFOIL_INFO) as [AirfoilType, typeof AIRFOIL_INFO[AirfoilType]][]).map(([key, info]) => (
              <option key={key} value={key}>{info.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Presets */}
      <div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="w-full flex items-center justify-between py-1.5 px-2 bg-slate-800 rounded text-[10px] text-slate-300 hover:bg-slate-700 transition-all"
        >
          <span>Turbine Presets</span>
          <span className={`transition-transform ${showPresets ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showPresets && (
          <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 mb-2">
              {(Object.entries(TURBINE_CATEGORIES) as [keyof typeof TURBINE_CATEGORIES, typeof TURBINE_CATEGORIES[keyof typeof TURBINE_CATEGORIES]][]).map(
                ([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPresetCategory(key)}
                    className={`px-2 py-0.5 rounded text-[8px] transition-all ${
                      selectedPresetCategory === key ? 'text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                    style={{
                      backgroundColor: selectedPresetCategory === key ? cat.color : undefined,
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                )
              )}
            </div>

            {/* Preset cards */}
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {categoryPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="p-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded text-left transition-all"
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-sm">{preset.icon}</span>
                    <span className="text-[9px] font-medium text-slate-200 truncate">{preset.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="text-[7px] text-green-400">⚡{preset.performanceRating.power}</span>
                    <span className="text-[7px] text-cyan-400">🎯{preset.performanceRating.efficiency}</span>
                    <span className="text-[7px] text-yellow-400">🔊{10 - preset.performanceRating.noise}</span>
                  </div>
                  {preset.unlockCost > 0 && (
                    <div className="text-[7px] text-amber-400 mt-0.5">🔒 {preset.unlockCost} EC</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export modal wrapper
export function TurbineSectionEditorModal({
  isOpen,
  onClose,
  config,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  config: ProceduralTurbineConfig
  onSave: (config: ProceduralTurbineConfig) => void
}) {
  const [tempConfig, setTempConfig] = useState<ProceduralTurbineConfig>(config)

  useEffect(() => {
    setTempConfig(config)
  }, [config, isOpen])

  if (!isOpen) return null

  const handleConfigChange = (changes: Partial<ProceduralTurbineConfig>) => {
    setTempConfig(prev => ({
      ...prev,
      ...changes,
      blade: changes.blade ? { ...prev.blade, ...changes.blade } : prev.blade,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl p-5 max-w-md w-full mx-4 shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-white">Turbine Section Editor</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <TurbineSectionEditor config={tempConfig} onConfigChange={handleConfigChange} size={380} />

        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onSave(tempConfig); onClose() }}
            className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-white text-sm font-medium transition-colors"
          >
            Apply Design
          </button>
        </div>
      </div>
    </div>
  )
}
