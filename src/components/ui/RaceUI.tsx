import { useEffect, useState } from 'react'
import { useRaceStore } from '../../state/useRaceStore'
import { useGameStore } from '../../state/useGameStore'
import { getAllRaces } from '../../data/races'

export function RaceMenu() {
  const isRacing = useRaceStore((state) => state.isRacing)
  const startRace = useRaceStore((state) => state.startRace)
  const gameMode = useGameStore((state) => state.gameMode)
  const [showRaceSelect, setShowRaceSelect] = useState(false)

  const races = getAllRaces()

  // Hide race menu in build mode
  if (gameMode === 'build') return null

  if (showRaceSelect && !isRacing) {
    return (
      <div className="absolute top-[360px] right-4 z-10 bg-gray-900/90 border-2 border-cyan-500/50 rounded-lg p-4 w-64 pointer-events-auto">
        <h3 className="text-white font-bold text-sm mb-3">SELECT RACE</h3>
        {races.map((race) => (
          <button
            key={race.id}
            onClick={() => {
              startRace(race, 'Player')
              setShowRaceSelect(false)
            }}
            className="w-full p-2 mb-2 bg-cyan-500 text-black rounded font-bold text-xs hover:bg-cyan-400 transition-colors"
          >
            {race.name}
            <div className="text-[10px] mt-1 font-normal">
              {race.laps} Laps • {race.checkpoints.length} Checkpoints
            </div>
          </button>
        ))}
        <button
          onClick={() => setShowRaceSelect(false)}
          className="w-full p-2 bg-slate-600 text-white rounded text-xs hover:bg-slate-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  if (!isRacing) {
    return (
      <button
        onClick={() => setShowRaceSelect(true)}
        className="absolute top-[360px] right-4 z-10 bg-cyan-500 text-white border-2 border-cyan-500/50 rounded-lg p-3 hover:bg-cyan-400 transition-all font-bold text-sm shadow-lg pointer-events-auto"
        title="Start Race"
      >
        🏁 START RACE
      </button>
    )
  }

  return null
}

export function RaceStatus() {
  const isRacing = useRaceStore((state) => state.isRacing)
  const currentRace = useRaceStore((state) => state.currentRace)
  const currentLap = useRaceStore((state) => state.currentLap)
  const currentCheckpoint = useRaceStore((state) => state.currentCheckpoint)
  const lapTimes = useRaceStore((state) => state.lapTimes)
  const finishRace = useRaceStore((state) => state.finishRace)
  const abandonRace = useRaceStore((state) => state.abandonRace)
  const nearbyCheckpoints = useGameStore((state) => state.nearbyCheckpoints)

  const [raceTime, setRaceTime] = useState(0)
  const [lapTime, setLapTime] = useState(0)

  useEffect(() => {
    if (!isRacing) return

    const interval = setInterval(() => {
      const currentLapData = lapTimes[lapTimes.length - 1]
      setLapTime(Date.now() - currentLapData.startTime)
      setRaceTime(Date.now() - (lapTimes[0]?.startTime || 0))
    }, 100)

    return () => clearInterval(interval)
  }, [isRacing, lapTimes])

  if (!isRacing || !currentRace) return null

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const hundredths = Math.floor((ms % 1000) / 10)
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`
  }

  const nextCheckpoint = currentRace.checkpoints[currentCheckpoint]
  const isNearCheckpoint = nearbyCheckpoints.includes(nextCheckpoint?.id || '')

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #00ff00',
        borderRadius: 8,
        padding: 15,
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: 14,
        zIndex: 999,
        minWidth: 250,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <strong>{currentRace.name}</strong>
      </div>

      <div style={{ marginBottom: 5 }}>
        LAP: <span style={{ color: '#ffff00' }}>{currentLap}/{currentRace.laps}</span>
      </div>

      <div style={{ marginBottom: 5 }}>
        LAP TIME: <span style={{ color: '#ffff00' }}>{formatTime(lapTime)}</span>
      </div>

      <div style={{ marginBottom: 10 }}>
        RACE TIME: <span style={{ color: '#ffff00' }}>{formatTime(raceTime)}</span>
      </div>

      {nextCheckpoint && (
        <div
          style={{
            marginBottom: 10,
            padding: 8,
            background: isNearCheckpoint ? 'rgba(0, 255, 0, 0.2)' : 'rgba(100, 100, 100, 0.2)',
            borderRadius: 4,
            border: isNearCheckpoint ? '1px solid #00ff00' : '1px solid #666',
          }}
        >
          <div style={{ fontSize: 12 }}>NEXT: CP {currentCheckpoint + 1}</div>
          <div style={{ fontSize: 10, color: isNearCheckpoint ? '#00ff00' : '#aaa' }}>
            {isNearCheckpoint ? '→ APPROACHING ←' : 'Head to checkpoint'}
          </div>
        </div>
      )}

      <button
        onClick={() => finishRace()}
        style={{
          width: '100%',
          padding: 8,
          background: '#ff3333',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          marginBottom: 5,
          fontSize: 12,
          fontWeight: 'bold',
        }}
      >
        FINISH RACE
      </button>

      <button
        onClick={() => abandonRace()}
        style={{
          width: '100%',
          padding: 8,
          background: '#666',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        ABANDON
      </button>
    </div>
  )
}

export function Leaderboard() {
  const leaderboard = useRaceStore((state) => state.leaderboard)

  if (leaderboard.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #ffaa00',
        borderRadius: 8,
        padding: 15,
        color: '#ffaa00',
        fontFamily: 'monospace',
        fontSize: 12,
        zIndex: 998,
        maxWidth: 300,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <strong>LEADERBOARD</strong>
      </div>

      {leaderboard.slice(0, 5).map((entry) => (
        <div key={entry.playerName} style={{ marginBottom: 5 }}>
          <span style={{ color: '#ffff00' }}>{entry.rank}.</span> {entry.playerName}
          <div style={{ fontSize: 10, color: '#aaa' }}>
            {(entry.bestTime / 1000).toFixed(2)}s
          </div>
        </div>
      ))}
    </div>
  )
}
