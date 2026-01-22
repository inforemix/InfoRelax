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
  const [isExpanded, setIsExpanded] = useState(!minimized)

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

  if (!world) return null

  return (
    <div className="absolute top-20 right-4 z-10">
      <div
        className={`bg-slate-900/95 border border-cyan-500/40 rounded-lg shadow-lg transition-all duration-300 ${
          isExpanded ? 'p-3' : 'p-2'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-cyan-400 font-semibold text-xs tracking-wide">
            {isExpanded ? 'NAV MAP' : '🗺️'}
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-cyan-500/20"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {/* Canvas */}
        {isExpanded && (
          <>
            <canvas
              ref={canvasRef}
              width={size}
              height={size}
              className="border border-cyan-500/20 rounded"
            />

            {/* Minimal Legend */}
            <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-500"></div>
                <span>You</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-sky-200"></div>
                <span>Iceberg</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                <span>Island</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
