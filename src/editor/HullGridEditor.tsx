/**
 * Hull Grid Editor - Interactive grid-based hull cross-section drawing system
 * Allows users to draw and modify hull shapes from multiple views
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import {
  HullPoint,
  ControlPoint,
  HullView,
  HullGridEditorState,
  ProceduralHullConfig,
} from './HullTypes'
import { HULL_CATEGORIES, getPresetsByCategory } from './HullPresets'
import type { HullPreset } from './HullPresets'

interface HullGridEditorProps {
  config: ProceduralHullConfig
  onConfigChange: (config: Partial<ProceduralHullConfig>) => void
  size?: number
}

// Catmull-Rom spline interpolation
function catmullRomPoint(
  p0: HullPoint,
  p1: HullPoint,
  p2: HullPoint,
  p3: HullPoint,
  t: number
): HullPoint {
  const t2 = t * t
  const t3 = t2 * t

  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  }
}

// Interpolate a path using Catmull-Rom splines
function interpolatePath(points: HullPoint[], segments: number = 10): HullPoint[] {
  if (points.length < 2) return points
  if (points.length === 2) {
    const result: HullPoint[] = []
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      result.push({
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t,
      })
    }
    return result
  }

  const result: HullPoint[] = []
  const extended = [points[0], ...points, points[points.length - 1]]

  for (let i = 0; i < extended.length - 3; i++) {
    for (let j = 0; j <= segments; j++) {
      if (i === extended.length - 4 && j === segments) continue
      const t = j / segments
      result.push(catmullRomPoint(extended[i], extended[i + 1], extended[i + 2], extended[i + 3], t))
    }
  }
  result.push(points[points.length - 1])

  return result
}

// Simplify path using Douglas-Peucker algorithm
function simplifyPath(points: HullPoint[], tolerance: number): HullPoint[] {
  if (points.length < 3) return points

  const sqDist = (p1: HullPoint, p2: HullPoint) =>
    (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2

  const perpDist = (p: HullPoint, lineStart: HullPoint, lineEnd: HullPoint) => {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const lineLenSq = dx * dx + dy * dy
    if (lineLenSq === 0) return Math.sqrt(sqDist(p, lineStart))
    const t = Math.max(0, Math.min(1, ((p.x - lineStart.x) * dx + (p.y - lineStart.y) * dy) / lineLenSq))
    return Math.sqrt(sqDist(p, { x: lineStart.x + t * dx, y: lineStart.y + t * dy }))
  }

  let maxDist = 0
  let maxIdx = 0
  const end = points.length - 1

  for (let i = 1; i < end; i++) {
    const dist = perpDist(points[i], points[0], points[end])
    if (dist > maxDist) {
      maxDist = dist
      maxIdx = i
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIdx + 1), tolerance)
    const right = simplifyPath(points.slice(maxIdx), tolerance)
    return [...left.slice(0, -1), ...right]
  }

  return [points[0], points[end]]
}

export function HullGridEditor({ config, onConfigChange, size = 400 }: HullGridEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [editorState, setEditorState] = useState<HullGridEditorState>({
    activeView: 'top',
    activeTool: 'draw',
    gridSize: 20,
    snapToGrid: true,
    showWaterline: true,
    showSections: true,
    selectedPoints: [],
    currentSection: 0,
    symmetryMode: true,
  })

  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<HullPoint[]>([])
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<keyof typeof HULL_CATEGORIES>('cruising')
  const [showPresets, setShowPresets] = useState(false)
  const [isModified, setIsModified] = useState(false)
  const [savedConfig, setSavedConfig] = useState<ProceduralHullConfig | null>(null)

  const center = size / 2
  const scale = size / 2.4 // Leave margin

  // Convert normalized coords to canvas coords
  const toCanvas = useCallback(
    (p: HullPoint): HullPoint => ({
      x: center + p.x * scale,
      y: center - p.y * scale, // Flip Y
    }),
    [center, scale]
  )

  // Convert canvas coords to normalized
  const toNormalized = useCallback(
    (p: HullPoint): HullPoint => ({
      x: (p.x - center) / scale,
      y: -(p.y - center) / scale, // Flip Y
    }),
    [center, scale]
  )

  // Snap to grid
  const snapToGrid = useCallback(
    (p: HullPoint): HullPoint => {
      if (!editorState.snapToGrid) return p
      const gridStep = 2 / editorState.gridSize
      return {
        x: Math.round(p.x / gridStep) * gridStep,
        y: Math.round(p.y / gridStep) * gridStep,
      }
    },
    [editorState.snapToGrid, editorState.gridSize]
  )

  // Get the active profile based on view
  const activeProfile = useMemo(() => {
    switch (editorState.activeView) {
      case 'top':
        return config.waterlineProfile
      case 'side':
        return config.buttockProfile
      case 'front':
        return config.crossSections[editorState.currentSection]?.profile || []
      default:
        return []
    }
  }, [editorState.activeView, editorState.currentSection, config])

  // Draw the editor canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, size, size)

    // Draw grid
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 0.5
    const gridStep = size / editorState.gridSize

    for (let i = 0; i <= editorState.gridSize; i++) {
      const pos = i * gridStep
      // Vertical lines
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, size)
      ctx.stroke()
      // Horizontal lines
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(size, pos)
      ctx.stroke()
    }

    // Draw axis lines (thicker)
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    // Horizontal center
    ctx.beginPath()
    ctx.moveTo(0, center)
    ctx.lineTo(size, center)
    ctx.stroke()
    // Vertical center
    ctx.beginPath()
    ctx.moveTo(center, 0)
    ctx.lineTo(center, size)
    ctx.stroke()

    // Draw waterline indicator
    if (editorState.showWaterline && editorState.activeView !== 'top') {
      const waterY = center - (config.draft / config.freeboard) * 0.3 * scale
      ctx.strokeStyle = '#0ea5e9'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(0, waterY)
      ctx.lineTo(size, waterY)
      ctx.stroke()
      ctx.setLineDash([])

      // Label
      ctx.fillStyle = '#0ea5e9'
      ctx.font = '10px sans-serif'
      ctx.fillText('WL', 5, waterY - 3)
    }

    // Draw view-specific guides
    if (editorState.activeView === 'top') {
      // Draw bow/stern labels
      ctx.fillStyle = '#64748b'
      ctx.font = '11px sans-serif'
      ctx.fillText('BOW', size - 35, center - 5)
      ctx.fillText('STERN', 5, center - 5)

      // Draw beam reference lines
      const beamY = (config.beam / (config.length / 2)) * scale
      ctx.strokeStyle = '#334155'
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(0, center - beamY / 2)
      ctx.lineTo(size, center - beamY / 2)
      ctx.moveTo(0, center + beamY / 2)
      ctx.lineTo(size, center + beamY / 2)
      ctx.stroke()
      ctx.setLineDash([])
    } else if (editorState.activeView === 'side') {
      // Draw bow/stern labels for side view
      ctx.fillStyle = '#64748b'
      ctx.font = '11px sans-serif'
      ctx.fillText('BOW', size - 35, size - 10)
      ctx.fillText('STERN', 5, size - 10)
    } else if (editorState.activeView === 'front') {
      // Draw port/starboard labels
      ctx.fillStyle = '#64748b'
      ctx.font = '11px sans-serif'
      ctx.fillText('PORT', 5, center - 5)
      ctx.fillText('STBD', size - 35, center - 5)

      // Draw centerline
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(center, 0)
      ctx.lineTo(center, size)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw existing profile
    if (activeProfile.length > 1) {
      const smoothProfile = interpolatePath(activeProfile, 8)

      // Draw filled hull shape with better visibility
      ctx.beginPath()
      ctx.fillStyle = 'rgba(139, 92, 246, 0.35)'
      smoothProfile.forEach((p, i) => {
        const cp = toCanvas(p)
        if (i === 0) ctx.moveTo(cp.x, cp.y)
        else ctx.lineTo(cp.x, cp.y)
      })

      // If symmetry mode, mirror and close
      if (editorState.symmetryMode && editorState.activeView !== 'side') {
        const mirrored = [...smoothProfile].reverse().map(p => ({ x: p.x, y: -p.y }))
        mirrored.forEach(p => {
          const cp = toCanvas(p)
          ctx.lineTo(cp.x, cp.y)
        })
      }
      ctx.closePath()
      ctx.fill()

      // Draw profile line with better visibility
      ctx.beginPath()
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 3
      smoothProfile.forEach((p, i) => {
        const cp = toCanvas(p)
        if (i === 0) ctx.moveTo(cp.x, cp.y)
        else ctx.lineTo(cp.x, cp.y)
      })
      ctx.stroke()

      // Draw mirrored profile if symmetry mode
      if (editorState.symmetryMode && editorState.activeView !== 'side') {
        ctx.beginPath()
        ctx.strokeStyle = '#7c3aed'
        ctx.lineWidth = 2.5
        smoothProfile.forEach((p, i) => {
          const cp = toCanvas({ x: p.x, y: -p.y })
          if (i === 0) ctx.moveTo(cp.x, cp.y)
          else ctx.lineTo(cp.x, cp.y)
        })
        ctx.stroke()
      }

      // Draw control points with better visibility
      activeProfile.forEach((p, i) => {
        const cp = toCanvas(p)

        // Point - larger and more visible
        ctx.beginPath()
        ctx.fillStyle = editorState.selectedPoints.includes(i) ? '#f472b6' : '#22d3ee'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.arc(cp.x, cp.y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Index label
        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 10px sans-serif'
        ctx.fillText(`${i + 1}`, cp.x + 8, cp.y - 4)
      })
    }

    // Draw current drawing path with better visibility
    if (currentPath.length > 0) {
      ctx.beginPath()
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 3
      ctx.setLineDash([6, 4])
      currentPath.forEach((p, i) => {
        const cp = toCanvas(p)
        if (i === 0) ctx.moveTo(cp.x, cp.y)
        else ctx.lineTo(cp.x, cp.y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // Draw preview points
      currentPath.forEach(p => {
        const cp = toCanvas(p)
        ctx.beginPath()
        ctx.fillStyle = '#22d3ee'
        ctx.arc(cp.x, cp.y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      // Drawing indicator
      ctx.fillStyle = '#22d3ee'
      ctx.font = 'bold 10px sans-serif'
      ctx.fillText(`Drawing... (${currentPath.length} pts)`, 10, size - 10)
    }

    // Draw view label
    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 12px sans-serif'
    const viewLabel = {
      top: 'TOP VIEW (Plan)',
      side: 'SIDE VIEW (Profile)',
      front: 'FRONT VIEW (Section)',
      perspective: '3D VIEW',
    }[editorState.activeView]
    ctx.fillText(viewLabel, 10, 20)

    // Draw profile info
    if (activeProfile.length > 0) {
      ctx.fillStyle = '#a855f7'
      ctx.font = '10px sans-serif'
      ctx.fillText(`${activeProfile.length} control points`, 10, 34)
    } else {
      ctx.fillStyle = '#64748b'
      ctx.font = '10px sans-serif'
      ctx.fillText('Draw hull shape on canvas', 10, 34)
    }

  }, [
    size,
    center,
    scale,
    editorState,
    config,
    activeProfile,
    currentPath,
    toCanvas,
  ])

  // Redraw on changes
  useEffect(() => {
    draw()
  }, [draw])

  // Mouse event handlers
  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): HullPoint | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const canvasPoint = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }

    return snapToGrid(toNormalized(canvasPoint))
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasPoint(e)
    if (!point) return

    if (editorState.activeTool === 'draw') {
      setIsDrawing(true)
      setCurrentPath([point])
    } else if (editorState.activeTool === 'select') {
      // Find nearest control point
      const threshold = 0.1
      let nearestIdx = -1
      let nearestDist = threshold

      activeProfile.forEach((p, i) => {
        const dist = Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2)
        if (dist < nearestDist) {
          nearestDist = dist
          nearestIdx = i
        }
      })

      if (nearestIdx >= 0) {
        setEditorState(prev => ({
          ...prev,
          selectedPoints: e.shiftKey
            ? prev.selectedPoints.includes(nearestIdx)
              ? prev.selectedPoints.filter(i => i !== nearestIdx)
              : [...prev.selectedPoints, nearestIdx]
            : [nearestIdx],
        }))
      } else {
        setEditorState(prev => ({ ...prev, selectedPoints: [] }))
      }
    }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || editorState.activeTool !== 'draw') return

    const point = getCanvasPoint(e)
    if (!point) return

    // Add point if it's far enough from the last one
    const lastPoint = currentPath[currentPath.length - 1]
    const dist = Math.sqrt((point.x - lastPoint.x) ** 2 + (point.y - lastPoint.y) ** 2)
    if (dist > 0.02) {
      setCurrentPath(prev => [...prev, point])
    }
  }

  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (currentPath.length < 2) {
      setCurrentPath([])
      return
    }

    // Simplify the drawn path
    const simplified = simplifyPath(currentPath, 0.03)

    // Update the appropriate profile
    const newProfile: ControlPoint[] = simplified.map(p => ({ ...p }))

    switch (editorState.activeView) {
      case 'top':
        onConfigChange({ waterlineProfile: newProfile })
        break
      case 'side':
        onConfigChange({ buttockProfile: newProfile })
        break
      case 'front':
        // Update or add cross-section
        const sections = [...config.crossSections]
        if (sections[editorState.currentSection]) {
          sections[editorState.currentSection] = {
            ...sections[editorState.currentSection],
            profile: newProfile,
          }
        } else {
          sections.push({
            position: editorState.currentSection / 10,
            profile: newProfile,
            beamMultiplier: 1.0,
            deadrise: 15,
            freeboard: 1.0,
          })
        }
        onConfigChange({ crossSections: sections })
        break
    }

    setIsModified(true)
    setCurrentPath([])
  }

  // Clear current view profile and reset to default
  const clearProfile = () => {
    // Default profiles for each view (simple hull shape)
    const defaultWaterline: ControlPoint[] = [
      { x: -0.8, y: 0 },
      { x: -0.4, y: 0.3 },
      { x: 0.2, y: 0.4 },
      { x: 0.8, y: 0.2 },
    ]
    const defaultButtock: ControlPoint[] = [
      { x: -0.8, y: -0.2 },
      { x: -0.3, y: -0.1 },
      { x: 0.3, y: 0 },
      { x: 0.8, y: 0.1 },
    ]
    const defaultSection: ControlPoint[] = [
      { x: 0, y: -0.3 },
      { x: 0.2, y: -0.1 },
      { x: 0.4, y: 0.2 },
    ]

    switch (editorState.activeView) {
      case 'top':
        onConfigChange({ waterlineProfile: defaultWaterline })
        break
      case 'side':
        onConfigChange({ buttockProfile: defaultButtock })
        break
      case 'front':
        const sections = [...config.crossSections]
        sections[editorState.currentSection] = {
          ...sections[editorState.currentSection],
          profile: defaultSection,
        }
        onConfigChange({ crossSections: sections })
        break
    }
    setIsModified(true)
  }

  // Save current design
  const saveDesign = () => {
    setSavedConfig({ ...config })
    setIsModified(false)
  }

  // Reset to saved design
  const resetToSaved = () => {
    if (savedConfig) {
      onConfigChange(savedConfig)
      setIsModified(false)
    }
  }

  // Load preset
  const loadPreset = (preset: HullPreset) => {
    if (preset.config) {
      // Save current config before loading preset (allows reset)
      if (!savedConfig) {
        setSavedConfig({ ...config })
      }
      onConfigChange(preset.config)
      setIsModified(true)
    }
    setShowPresets(false)
  }

  const categoryPresets = useMemo(
    () => getPresetsByCategory(selectedPresetCategory),
    [selectedPresetCategory]
  )

  return (
    <div className="flex flex-col gap-3">
      {/* View selector */}
      <div className="flex gap-1">
        {(['top', 'side', 'front'] as HullView[]).map(view => (
          <button
            key={view}
            onClick={() => setEditorState(prev => ({ ...prev, activeView: view }))}
            className={`flex-1 py-1.5 rounded text-[10px] font-medium capitalize transition-all ${
              editorState.activeView === view
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-xl cursor-crosshair touch-none border border-slate-700"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Tool buttons overlay */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => setEditorState(prev => ({ ...prev, activeTool: 'draw' }))}
            className={`px-2 py-1 rounded text-[10px] transition-all ${
              editorState.activeTool === 'draw'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
            }`}
            title="Draw"
          >
            ✏️
          </button>
          <button
            onClick={() => setEditorState(prev => ({ ...prev, activeTool: 'select' }))}
            className={`px-2 py-1 rounded text-[10px] transition-all ${
              editorState.activeTool === 'select'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700'
            }`}
            title="Select"
          >
            👆
          </button>
          <button
            onClick={clearProfile}
            className="px-2 py-1 rounded text-[10px] bg-red-500/80 text-white hover:bg-red-500 transition-all"
            title="Clear"
          >
            🗑️
          </button>
        </div>

        {/* Symmetry toggle */}
        <button
          onClick={() => setEditorState(prev => ({ ...prev, symmetryMode: !prev.symmetryMode }))}
          className={`absolute bottom-2 left-2 px-2 py-1 rounded text-[10px] transition-all ${
            editorState.symmetryMode
              ? 'bg-purple-500/80 text-white'
              : 'bg-slate-800/80 text-slate-400'
          }`}
          title="Toggle Symmetry"
        >
          ⚖️ Mirror
        </button>

        {/* Grid toggle */}
        <button
          onClick={() => setEditorState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
          className={`absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] transition-all ${
            editorState.snapToGrid
              ? 'bg-slate-600/80 text-white'
              : 'bg-slate-800/80 text-slate-400'
          }`}
          title="Snap to Grid"
        >
          📐 Snap
        </button>
      </div>

      {/* Instructions and Save/Reset */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-500">
          Draw from {editorState.activeView === 'top' ? 'stern→bow' : editorState.activeView === 'side' ? 'left→right' : 'center→out'}
        </p>
        <div className="flex gap-1">
          {isModified && (
            <>
              <button
                onClick={resetToSaved}
                disabled={!savedConfig}
                className="px-2 py-0.5 rounded text-[9px] bg-slate-700 text-slate-400 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset to saved"
              >
                ↩ Reset
              </button>
              <button
                onClick={saveDesign}
                className="px-2 py-0.5 rounded text-[9px] bg-green-600 text-white hover:bg-green-500"
                title="Save design"
              >
                ✓ Save
              </button>
            </>
          )}
          {isModified && <span className="text-[9px] text-amber-400 ml-1">●</span>}
        </div>
      </div>

      {/* Section selector for front view */}
      {editorState.activeView === 'front' && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Section:</span>
          <input
            type="range"
            min={0}
            max={10}
            value={editorState.currentSection}
            onChange={e => setEditorState(prev => ({ ...prev, currentSection: parseInt(e.target.value) }))}
            className="flex-1 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-[10px] text-slate-400 font-mono w-8">
            {(editorState.currentSection * 10).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Presets section */}
      <div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="w-full flex items-center justify-between py-1.5 px-2 bg-slate-800 rounded text-[11px] text-slate-300 hover:bg-slate-700 transition-all"
        >
          <span>Hull Presets</span>
          <span className={`transition-transform ${showPresets ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showPresets && (
          <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 mb-2">
              {(Object.entries(HULL_CATEGORIES) as [keyof typeof HULL_CATEGORIES, typeof HULL_CATEGORIES[keyof typeof HULL_CATEGORIES]][]).map(
                ([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPresetCategory(key)}
                    className={`px-2 py-0.5 rounded text-[9px] transition-all ${
                      selectedPresetCategory === key
                        ? 'text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
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
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {categoryPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded text-left transition-all"
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm">{preset.icon}</span>
                    <span className="text-[10px] font-medium text-slate-200 truncate">
                      {preset.name}
                    </span>
                  </div>
                  <p className="text-[8px] text-slate-500 line-clamp-2">{preset.description}</p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-[8px] text-cyan-400">⚡{preset.performanceRating.speed}</span>
                    <span className="text-[8px] text-green-400">⚖️{preset.performanceRating.stability}</span>
                    <span className="text-[8px] text-yellow-400">⛽{preset.performanceRating.efficiency}</span>
                  </div>
                  {preset.unlockCost > 0 && (
                    <div className="text-[8px] text-amber-400 mt-0.5">🔒 {preset.unlockCost} EC</div>
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

// Export for use in modal
export function HullEditorModal({
  isOpen,
  onClose,
  config,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  config: ProceduralHullConfig
  onSave: (config: ProceduralHullConfig) => void
}) {
  const [tempConfig, setTempConfig] = useState<ProceduralHullConfig>(config)

  useEffect(() => {
    setTempConfig(config)
  }, [config, isOpen])

  if (!isOpen) return null

  const handleConfigChange = (changes: Partial<ProceduralHullConfig>) => {
    setTempConfig(prev => ({ ...prev, ...changes }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Hull Shape Editor</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <HullGridEditor config={tempConfig} onConfigChange={handleConfigChange} size={450} />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(tempConfig)
              onClose()
            }}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors"
          >
            Apply Hull Design
          </button>
        </div>
      </div>
    </div>
  )
}
