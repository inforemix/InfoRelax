import { useRef, useState, useCallback, useEffect } from 'react'
import { BladePoint } from '@/state/useYachtStore'
import {
  interpolateSpline,
  simplifyPath,
  applyKaleidoscope,
  normalizePoints,
  denormalizePoints,
} from './SplineUtils'
import { BLADE_PRESETS, BladePreset } from './BladePresets'

interface KaleidoscopeCanvasProps {
  bladeCount: number
  initialPoints?: BladePoint[]
  onPointsChange: (points: BladePoint[]) => void
  size?: number
}

export function KaleidoscopeCanvas({
  bladeCount,
  initialPoints = [],
  onPointsChange,
  size = 400,
}: KaleidoscopeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<BladePoint[]>(
    initialPoints.length > 0 ? denormalizePoints(initialPoints, size) : []
  )
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const center = size / 2

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, size, size)

    // Draw radial guidelines
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1

    // Concentric circles
    for (let r = 50; r < size / 2; r += 50) {
      ctx.beginPath()
      ctx.arc(center, center, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Radial lines for each blade
    const angleStep = (2 * Math.PI) / bladeCount
    ctx.strokeStyle = '#475569'
    for (let i = 0; i < bladeCount; i++) {
      const angle = angleStep * i - Math.PI / 2 // Start from top
      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.lineTo(
        center + Math.cos(angle) * (size / 2),
        center + Math.sin(angle) * (size / 2)
      )
      ctx.stroke()
    }

    // Draw center point
    ctx.fillStyle = '#06b6d4'
    ctx.beginPath()
    ctx.arc(center, center, 5, 0, Math.PI * 2)
    ctx.fill()

    // Draw the blade path with kaleidoscope effect
    if (currentPath.length > 1) {
      // Interpolate for smooth curves
      const smoothPath = interpolateSpline(currentPath, 6)

      // Apply kaleidoscope symmetry
      const allBlades = applyKaleidoscope(
        smoothPath.map((p) => ({ x: p.x - center, y: p.y - center })),
        bladeCount,
        { x: 0, y: 0 }
      )

      // Draw each blade
      allBlades.forEach((bladePath, index) => {
        ctx.beginPath()
        ctx.strokeStyle = index === 0 ? '#8b5cf6' : '#6d28d9'
        ctx.lineWidth = index === 0 ? 3 : 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        bladePath.forEach((point, i) => {
          const x = point.x + center
          const y = point.y + center
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.stroke()
      })

      // Draw control points on the main blade
      ctx.fillStyle = '#f472b6'
      currentPath.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }, [currentPath, bladeCount, size, center])

  // Redraw when dependencies change
  useEffect(() => {
    draw()
  }, [draw])

  // Handle mouse/touch events
  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): BladePoint | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getCanvasPoint(e)
    if (!point) return

    setIsDrawing(true)
    setCurrentPath([point])
    setSelectedPreset(null)
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return

    const point = getCanvasPoint(e)
    if (!point) return

    setCurrentPath((prev) => [...prev, point])
  }

  const handlePointerUp = () => {
    if (!isDrawing) return

    setIsDrawing(false)

    // Simplify the path and notify parent
    if (currentPath.length > 2) {
      const simplified = simplifyPath(currentPath, 5)
      setCurrentPath(simplified)
      onPointsChange(normalizePoints(simplified, size))
    }
  }

  // Load a preset
  const loadPreset = (preset: BladePreset) => {
    const denormalized = denormalizePoints(preset.points, size)
    setCurrentPath(denormalized)
    setSelectedPreset(preset.id)
    onPointsChange(preset.points)
  }

  // Clear the canvas
  const clearCanvas = () => {
    setCurrentPath([])
    setSelectedPreset(null)
    onPointsChange([])
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-xl cursor-crosshair touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Blade count indicator */}
        <div className="absolute top-2 left-2 bg-slate-800/80 px-2 py-1 rounded text-xs text-white">
          {bladeCount} blades ({360 / bladeCount}° symmetry)
        </div>

        {/* Clear button */}
        <button
          onClick={clearCanvas}
          className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 px-2 py-1 rounded text-xs text-white transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Instructions */}
      <p className="text-xs text-slate-400 text-center">
        Draw from center outward to create your blade shape. The pattern will mirror automatically.
      </p>

      {/* Presets */}
      <div>
        <h4 className="text-xs font-semibold text-slate-300 mb-2">Blade Presets</h4>
        <div className="grid grid-cols-4 gap-2">
          {BLADE_PRESETS.slice(0, 8).map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset)}
              className={`p-2 rounded-lg text-center transition-all ${
                selectedPreset === preset.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title={preset.description}
            >
              <span className="text-lg">{preset.icon}</span>
              <span className="block text-[10px] truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Modal wrapper for the Kaleidoscope Editor
interface KaleidoscopeModalProps {
  isOpen: boolean
  onClose: () => void
  bladeCount: number
  currentPoints: BladePoint[]
  onSave: (points: BladePoint[]) => void
}

export function KaleidoscopeModal({
  isOpen,
  onClose,
  bladeCount,
  currentPoints,
  onSave,
}: KaleidoscopeModalProps) {
  const [tempPoints, setTempPoints] = useState<BladePoint[]>(currentPoints)

  useEffect(() => {
    setTempPoints(currentPoints)
  }, [currentPoints, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    onSave(tempPoints)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Kaleidoscope Blade Editor</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <KaleidoscopeCanvas
          bladeCount={bladeCount}
          initialPoints={tempPoints}
          onPointsChange={setTempPoints}
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium transition-colors"
          >
            Apply Design
          </button>
        </div>
      </div>
    </div>
  )
}
