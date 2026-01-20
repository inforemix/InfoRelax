import { useEffect, useState } from 'react'
import { useRaceStore } from '../../state/useRaceStore'
import { useGameStore } from '../../state/useGameStore'
import { getAllRaces } from '../../data/races'

export function RaceMenu() {
  const isRacing = useRaceStore((state) => state.isRacing)
  const startRace = useRaceStore((state) => state.startRace)
  const [showRaceSelect, setShowRaceSelect] = useState(false)

  const races = getAllRaces()

  if (showRaceSelect && !isRacing) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #0099ff',
          borderRadius: 8,
          padding: 15,
          color: '#0099ff',
          fontFamily: 'monospace',
          zIndex: 1000,
          maxWidth: 300,
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>SELECT RACE</h3>
        {races.map((race) => (
          <button
            key={race.id}
            onClick={() => {
              startRace(race, 'Player')
              setShowRaceSelect(false)
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: 8,
              marginBottom: 8,
              background: '#0099ff',
              color: '#000',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            {race.name}
            <div style={{ fontSize: 10, marginTop: 3 }}>
              {race.laps} Laps • {race.checkpoints.length} Checkpoints
            </div>
          </button>
        ))}
        <button
          onClick={() => setShowRaceSelect(false)}
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
          Cancel
        </button>
      </div>
    )
  }

  if (!isRacing) {
    return (
      <button
        onClick={() => setShowRaceSelect(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          padding: '10px 15px',
          background: '#0099ff',
          color: '#000',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          zIndex: 1000,
        }}
      >
        START RACE
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
