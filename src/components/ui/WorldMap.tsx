import { useState, useEffect, useRef } from 'react'
import { useWorldStore } from '../../state/useWorldStore'
import { useGameStore } from '../../state/useGameStore'
import { useRaceStore } from '../../state/useRaceStore'

interface WorldMapProps {
  size?: number
  minimized?: boolean
}

export function WorldMap({ size = 300, minimized = false }: WorldMapProps) {
  const world = useWorldStore((state) => state.world)
  const player = useGameStore((state) => state.player)
  const currentRace = useRaceStore((state) => state.currentRace)
  const currentCheckpoint = useRaceStore((state) => state.currentCheckpoint)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(!minimized)

  // Draggable state
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!world || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate world bounds
    const worldBounds = world.bounds
    const worldWidth = worldBounds.max[0] - worldBounds.min[0]
    const worldHeight = worldBounds.max[1] - worldBounds.min[1]

    // Scale factor for map rendering
    const scaleX = size / worldWidth
    const scaleY = size / worldHeight

    // Helper function to convert world coordinates to canvas coordinates
    const worldToCanvas = (x: number, z: number): [number, number] => {
      const canvasX = (x - worldBounds.min[0]) * scaleX
      const canvasY = (z - worldBounds.min[1]) * scaleY
      return [canvasX, canvasY]
    }

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw water background
    if (size > 0) {
      const waterGradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, Math.max(1, size / 2))
      waterGradient.addColorStop(0, '#1a3a4a')
      waterGradient.addColorStop(1, '#0d2530')
      ctx.fillStyle = waterGradient
      ctx.fillRect(0, 0, size, size)
    }

    // Draw subtle grid
    ctx.save()
    ctx.globalAlpha = 0.08
    ctx.strokeStyle = '#4a9090'
    ctx.lineWidth = 1
    const gridSize = size / 8
    for (let i = 1; i < 8; i++) {
      ctx.beginPath()
      ctx.moveTo(i * gridSize, 0)
      ctx.lineTo(i * gridSize, size)
      ctx.moveTo(0, i * gridSize)
      ctx.lineTo(size, i * gridSize)
      ctx.stroke()
    }
    ctx.restore()

    // Draw islands as landmasses
    world.islands.forEach((island) => {
      const [cx, cy] = worldToCanvas(island.position[0], island.position[1])
      const radius = Math.max(3, island.radius * scaleX)

      // Island color based on type - muted earth tones
      let fillColor: string
      switch (island.type) {
        case 'volcanic':
          fillColor = '#3d3d3d'
          break
        case 'coral':
          fillColor = '#7a6055'
          break
        case 'sandy':
          fillColor = '#8a7a55'
          break
        default:
          fillColor = '#5a5a5a'
      }

      ctx.fillStyle = fillColor
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      // Subtle outline
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Draw icebergs as small mountain icons
    world.icebergs.forEach((iceberg) => {
      const [ix, iy] = worldToCanvas(iceberg.position[0], iceberg.position[1])
      const icebergSize = Math.max(4, iceberg.radius * scaleX * 0.3)

      ctx.save()
      ctx.translate(ix, iy)

      // Draw mountain/iceberg icon (triangle with peak)
      ctx.fillStyle = '#b8d4e8'
      ctx.strokeStyle = '#8ab4cc'
      ctx.lineWidth = 1

      ctx.beginPath()
      ctx.moveTo(0, -icebergSize)           // Peak
      ctx.lineTo(-icebergSize, icebergSize * 0.6) // Bottom left
      ctx.lineTo(icebergSize, icebergSize * 0.6)  // Bottom right
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.restore()
    })

    // Draw marina as anchor icon
    const [marinaX, marinaY] = worldToCanvas(world.marina.position[0], world.marina.position[1])
    ctx.save()
    ctx.translate(marinaX, marinaY)

    // Marina circle
    ctx.fillStyle = '#2a5a7a'
    ctx.strokeStyle = '#4a9aba'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Anchor symbol
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚓', 0, 1)

    ctx.restore()

    // Draw race checkpoints if racing - small numbered squares
    if (currentRace) {
      currentRace.checkpoints.forEach((checkpoint, index) => {
        const [cpx, cpy] = worldToCanvas(checkpoint.position[0], checkpoint.position[1])
        const isPassed = index < currentCheckpoint
        const isCurrent = index === currentCheckpoint
        const isFinish = index === currentRace.checkpoints.length - 1

        ctx.save()
        ctx.globalAlpha = isPassed ? 0.4 : 1.0

        // Small square checkpoint
        const boxSize = isCurrent ? 8 : 6

        // Background
        if (isFinish) {
          ctx.fillStyle = isCurrent ? '#ffcc00' : '#aa8800'
        } else if (isPassed) {
          ctx.fillStyle = '#3a5a3a'
        } else {
          ctx.fillStyle = isCurrent ? '#4a8a4a' : '#2a4a5a'
        }

        // Draw rounded rectangle
        ctx.beginPath()
        ctx.roundRect(cpx - boxSize / 2, cpy - boxSize / 2, boxSize, boxSize, 2)
        ctx.fill()

        // Border
        ctx.strokeStyle = isCurrent ? '#88ff88' : isPassed ? '#5a8a5a' : '#5a8aaa'
        ctx.lineWidth = isCurrent ? 2 : 1
        ctx.stroke()

        // Checkmark for passed, number for upcoming
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${isCurrent ? 7 : 6}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        if (isPassed) {
          ctx.fillText('✓', cpx, cpy)
        } else if (isFinish) {
          ctx.fillText('🏁', cpx, cpy)
        } else {
          ctx.fillText((index + 1).toString(), cpx, cpy)
        }

        ctx.restore()
      })
    }

    // Draw player yacht - clean triangle pointing in movement direction
    const [px, py] = worldToCanvas(player.position[0], player.position[2])

    ctx.save()
    ctx.translate(px, py)

    // The boat moves in direction: (sin(rotation), cos(rotation))
    // On canvas: +Y is down, so cos(rotation) positive = moving down
    // Triangle default points up (-Y), so we need to rotate by rotation + PI
    // to make it point in the direction of movement
    ctx.rotate(player.rotation + Math.PI)

    // Outer glow for visibility
    ctx.shadowColor = '#00ff88'
    ctx.shadowBlur = 6

    // Draw yacht triangle - bow at front
    ctx.fillStyle = '#00dd66'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5

    ctx.beginPath()
    ctx.moveTo(0, -9)   // Bow (front)
    ctx.lineTo(-5, 7)   // Port stern
    ctx.lineTo(5, 7)    // Starboard stern
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.restore()

  }, [world, player, size, currentRace, currentCheckpoint])

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  if (!world) return null

  return (
    <div
      ref={containerRef}
      className="fixed z-10"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Leva-style panel */}
      <div
        className="rounded-lg overflow-hidden shadow-xl"
        style={{
          backgroundColor: 'rgba(24, 28, 36, 0.95)',
          fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
          minWidth: isExpanded ? '320px' : 'auto',
        }}
      >
        {/* Header - Leva style */}
        <div
          className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          style={{
            backgroundColor: 'rgba(36, 42, 54, 0.9)',
            borderBottom: isExpanded ? '1px solid rgba(76, 86, 106, 0.3)' : 'none',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: '#8b9cc7', fontSize: '11px', fontWeight: 500 }}>
              Nav Map
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="flex items-center justify-center w-5 h-5 rounded transition-colors"
            style={{
              color: '#6b7a99',
              fontSize: '14px',
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3">
            {/* Canvas with subtle border */}
            <div
              className="rounded overflow-hidden mb-3"
              style={{
                border: '1px solid rgba(76, 86, 106, 0.3)',
              }}
            >
              <canvas
                ref={canvasRef}
                width={size}
                height={size}
                style={{ display: 'block' }}
              />
            </div>

            {/* Legend - Leva style */}
            <div
              className="flex flex-wrap gap-4 px-1"
              style={{
                fontSize: '10px',
                color: '#8b9cc7',
              }}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderBottom: '7px solid #00dd66',
                  }}
                />
                <span>You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: '3px solid transparent',
                    borderRight: '3px solid transparent',
                    borderBottom: '6px solid #b8d4e8',
                  }}
                />
                <span>Iceberg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: '#5a5a5a' }}
                />
                <span>Island</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: '#2a5a7a', border: '1px solid #4a9aba' }}
                />
                <span>Marina</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
