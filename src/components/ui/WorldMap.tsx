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
    const waterGradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    waterGradient.addColorStop(0, '#4a90a4')
    waterGradient.addColorStop(1, '#2a5a6a')
    ctx.fillStyle = waterGradient
    ctx.fillRect(0, 0, size, size)

    // Draw wind zones (semi-transparent circles)
    world.windZones.forEach((zone) => {
      const [cx, cy] = worldToCanvas(zone.position[0], zone.position[1])
      const radius = zone.radius * scaleX

      ctx.save()
      ctx.globalAlpha = 0.2

      // Color based on wind pattern
      switch (zone.pattern) {
        case 'trade-winds':
          ctx.fillStyle = '#90ee90'
          break
        case 'storm-path':
          ctx.fillStyle = '#ff6b6b'
          break
        case 'doldrums':
          ctx.fillStyle = '#ffffe0'
          break
        case 'monsoon':
          ctx.fillStyle = '#87ceeb'
          break
      }

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Draw wind direction arrow
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate((zone.direction * Math.PI) / 180)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.5

      ctx.beginPath()
      ctx.moveTo(0, -radius * 0.3)
      ctx.lineTo(0, radius * 0.3)
      ctx.moveTo(0, -radius * 0.3)
      ctx.lineTo(-radius * 0.1, -radius * 0.2)
      ctx.moveTo(0, -radius * 0.3)
      ctx.lineTo(radius * 0.1, -radius * 0.2)
      ctx.stroke()
      ctx.restore()
    })

    // Draw islands
    world.islands.forEach((island) => {
      const [cx, cy] = worldToCanvas(island.position[0], island.position[1])
      const radius = island.radius * scaleX

      // Island color based on type
      let fillColor: string
      switch (island.type) {
        case 'volcanic':
          fillColor = '#4a4a4a'
          break
        case 'coral':
          fillColor = '#ff9999'
          break
        case 'sandy':
          fillColor = '#f4d03f'
          break
        default:
          fillColor = '#888888'
      }

      // Draw island with gradient
      const islandGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      islandGradient.addColorStop(0, fillColor)
      islandGradient.addColorStop(1, fillColor + '80') // Add transparency to edge

      ctx.fillStyle = islandGradient
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fill()

      // Draw island outline
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Draw marina
    const [marinaX, marinaY] = worldToCanvas(world.marina.position[0], world.marina.position[1])
    ctx.fillStyle = '#ff9900'
    ctx.strokeStyle = '#ffcc00'
    ctx.lineWidth = 3

    ctx.beginPath()
    ctx.arc(marinaX, marinaY, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Draw marina label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('⚓', marinaX, marinaY - 12)

    // Draw POIs
    world.pois.forEach((poi) => {
      const [px, py] = worldToCanvas(poi.position[0], poi.position[1])

      // POI icon based on type
      ctx.save()
      ctx.globalAlpha = 0.7

      switch (poi.type) {
        case 'reef':
          ctx.fillStyle = '#ff6b6b'
          break
        case 'wreck':
          ctx.fillStyle = '#8b4513'
          break
        case 'buoy':
          ctx.fillStyle = '#ffa500'
          break
        case 'wildlife':
          ctx.fillStyle = '#90ee90'
          break
        case 'research-station':
          ctx.fillStyle = '#4169e1'
          break
        default:
          ctx.fillStyle = '#ffffff'
      }

      ctx.beginPath()
      ctx.arc(px, py, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // Draw race checkpoints if racing
    if (currentRace) {
      currentRace.checkpoints.forEach((checkpoint, index) => {
        const [cpx, cpy] = worldToCanvas(checkpoint.position[0], checkpoint.position[1])
        const isCurrentCheckpoint = index === currentCheckpoint
        const isPassed = index < currentCheckpoint

        ctx.save()
        ctx.globalAlpha = isPassed ? 0.3 : 1.0

        // Draw checkpoint circle
        ctx.strokeStyle = isCurrentCheckpoint ? '#00ff00' : isPassed ? '#666666' : '#0099ff'
        ctx.fillStyle = isCurrentCheckpoint ? '#00ff0040' : isPassed ? '#66666640' : '#0099ff40'
        ctx.lineWidth = isCurrentCheckpoint ? 3 : 2

        ctx.beginPath()
        ctx.arc(cpx, cpy, checkpoint.radius * scaleX, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Draw checkpoint number
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText((index + 1).toString(), cpx, cpy)

        ctx.restore()
      })
    }

    // Draw player yacht
    const [px, py] = worldToCanvas(player.position[0], player.position[2])

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(player.rotation)

    // Draw yacht triangle
    ctx.fillStyle = '#00ff00'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(0, -10)  // Bow
    ctx.lineTo(-6, 10)  // Port stern
    ctx.lineTo(6, 10)   // Starboard stern
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Draw speed indicator (wake)
    if (player.speed > 0.5) {
      ctx.globalAlpha = 0.3
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1

      ctx.beginPath()
      ctx.moveTo(-4, 10)
      ctx.lineTo(-6, 16)
      ctx.moveTo(4, 10)
      ctx.lineTo(6, 16)
      ctx.stroke()
    }

    ctx.restore()

    // Draw compass rose
    ctx.save()
    ctx.translate(size - 30, 30)
    ctx.globalAlpha = 0.7

    // Compass circle
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, 20, 0, Math.PI * 2)
    ctx.stroke()

    // North arrow
    ctx.fillStyle = '#ff0000'
    ctx.beginPath()
    ctx.moveTo(0, -18)
    ctx.lineTo(-5, -8)
    ctx.lineTo(5, -8)
    ctx.closePath()
    ctx.fill()

    // N label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('N', 0, 0)

    ctx.restore()

    // Draw grid lines (optional)
    ctx.save()
    ctx.globalAlpha = 0.1
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1

    const gridSize = size / 10
    for (let i = 1; i < 10; i++) {
      // Vertical lines
      ctx.beginPath()
      ctx.moveTo(i * gridSize, 0)
      ctx.lineTo(i * gridSize, size)
      ctx.stroke()

      // Horizontal lines
      ctx.beginPath()
      ctx.moveTo(0, i * gridSize)
      ctx.lineTo(size, i * gridSize)
      ctx.stroke()
    }

    ctx.restore()

  }, [world, player, size, currentRace, currentCheckpoint])

  if (!world) return null

  return (
    <div className="absolute top-20 right-4 z-10">
      <div
        className={`bg-gray-900/90 border-2 border-cyan-500/50 rounded-lg shadow-lg transition-all duration-300 ${
          isExpanded ? 'p-4' : 'p-2'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-sm">
            {isExpanded ? '🗺️ World Map' : '🗺️'}
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors text-xs"
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
              className="border border-cyan-500/30 rounded"
            />

            {/* Legend */}
            <div className="mt-3 text-xs text-gray-300 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Your Yacht</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Marina ⚓</span>
              </div>
              {currentRace && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  <span>Checkpoints</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
