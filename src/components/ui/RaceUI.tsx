import { useEffect, useState } from 'react'
import { useRaceStore, RaceDifficulty } from '../../state/useRaceStore'
import { getAllRaces } from '../../data/races'
import { useGameStore } from '../../state/useGameStore'

export function RaceMenu() {
  const isRacing = useRaceStore((state) => state.isRacing)
  const startRace = useRaceStore((state) => state.startRace)
  const difficulty = useRaceStore((state) => state.difficulty)
  const setDifficulty = useRaceStore((state) => state.setDifficulty)
  const [showRaceSelect, setShowRaceSelect] = useState(false)
  const [selectedRace, setSelectedRace] = useState<string | null>(null)

  const races = getAllRaces()

  // Don't show if already racing
  if (isRacing) return null

  const difficultyInfo = {
    peaceful: { label: 'Peaceful', icebergs: 'Few', damage: 'Low', color: 'bg-green-500' },
    moderate: { label: 'Moderate', icebergs: 'Medium', damage: 'Normal', color: 'bg-yellow-500' },
    challenging: { label: 'Challenging', icebergs: 'Many', damage: 'High', color: 'bg-red-500' },
  }

  // Race selection dropdown/modal
  if (showRaceSelect) {
    const race = selectedRace ? races.find(r => r.id === selectedRace) : null

    return (
      <>
        {/* Button in nav bar */}
        <button
          onClick={() => setShowRaceSelect(false)}
          className="px-6 py-2 rounded-lg font-medium transition-all bg-orange-500 text-white shadow-lg shadow-orange-500/30"
        >
          Race
        </button>

        {/* Dropdown panel */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[60] bg-gray-900/95 border-2 border-orange-500/50 rounded-lg p-4 w-80 pointer-events-auto shadow-xl">
          {!selectedRace ? (
            <>
              <h3 className="text-white font-bold text-sm mb-3">SELECT RACE</h3>
              {races.map((race) => (
                <button
                  key={race.id}
                  onClick={() => setSelectedRace(race.id)}
                  className="w-full p-2 mb-2 bg-orange-500 text-white rounded font-bold text-xs hover:bg-orange-400 transition-colors"
                >
                  {race.name}
                  <div className="text-[10px] mt-1 font-normal opacity-80">
                    {race.checkpoints.length} Checkpoints - A to B
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowRaceSelect(false)}
                className="w-full p-2 bg-slate-600 text-white rounded text-xs hover:bg-slate-500 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <h3 className="text-white font-bold text-sm mb-3">START RACE</h3>
              <p className="text-orange-300 text-xs mb-3">{race?.name}</p>
              <p className="text-slate-400 text-xs mb-3">
                Difficulty based on world: <span className="text-cyan-400 font-bold">{difficulty}</span>
              </p>
              <p className="text-slate-500 text-[10px] mb-3">
                {difficultyInfo[difficulty].icebergs} icebergs | {difficultyInfo[difficulty].damage} damage
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setSelectedRace(null)}
                  className="flex-1 p-2 bg-slate-600 text-white rounded text-xs hover:bg-slate-500 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (race) {
                      startRace(race, 'Player')
                      setShowRaceSelect(false)
                      setSelectedRace(null)
                    }
                  }}
                  className="flex-1 p-2 bg-green-500 text-white rounded font-bold text-xs hover:bg-green-400 transition-colors"
                >
                  START RACE
                </button>
              </div>
            </>
          )}
        </div>
      </>
    )
  }

  // Default: just the button
  return (
    <button
      onClick={() => setShowRaceSelect(true)}
      className="px-6 py-2 rounded-lg font-medium transition-all bg-slate-800/90 text-slate-300 hover:bg-slate-700"
    >
      Race
    </button>
  )
}

export function RaceStatus() {
  const isRacing = useRaceStore((state) => state.isRacing)
  const currentRace = useRaceStore((state) => state.currentRace)
  const currentCheckpoint = useRaceStore((state) => state.currentCheckpoint)
  const lapTimes = useRaceStore((state) => state.lapTimes)
  const finishRace = useRaceStore((state) => state.finishRace)
  const abandonRace = useRaceStore((state) => state.abandonRace)
  const damage = useRaceStore((state) => state.damage)
  const difficulty = useRaceStore((state) => state.difficulty)
  const raceFinished = useRaceStore((state) => state.raceFinished)
  const passCheckpoint = useRaceStore((state) => state.passCheckpoint)
  const nearbyCheckpoints = useGameStore((state) => state.nearbyCheckpoints)

  const [raceTime, setRaceTime] = useState(0)

  // Format time helper (moved to top for use in both sections)
  const formatTimeLocal = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const hundredths = Math.floor((ms % 1000) / 10)
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (!isRacing) return

    const interval = setInterval(() => {
      setRaceTime(Date.now() - (lapTimes[0]?.startTime || 0))
    }, 100)

    return () => clearInterval(interval)
  }, [isRacing, lapTimes])

  // Auto-pass checkpoint when nearby
  useEffect(() => {
    if (!isRacing || !currentRace) return

    const nextCheckpoint = currentRace.checkpoints[currentCheckpoint]
    if (nextCheckpoint && nearbyCheckpoints.includes(nextCheckpoint.id)) {
      passCheckpoint(nextCheckpoint.id)

      // Check if race is complete (reached last checkpoint)
      if (currentCheckpoint >= currentRace.checkpoints.length - 1) {
        finishRace()
      }
    }
  }, [nearbyCheckpoints, currentCheckpoint, currentRace, isRacing, passCheckpoint, finishRace])

  if (!currentRace) return null

  // Show race results when finished
  if (raceFinished && !isRacing) {
    const totalCheckpoints = currentRace.checkpoints.length
    const passedCheckpoints = currentCheckpoint

    return (
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.95)',
          border: damage.hullIntegrity > 0 ? '3px solid #00ff00' : '3px solid #ff3333',
          borderRadius: 12,
          padding: 24,
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: 14,
          zIndex: 1000,
          minWidth: 320,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 16, fontWeight: 'bold' }}>
          {damage.hullIntegrity > 0 ? 'RACE COMPLETE!' : 'HULL DESTROYED!'}
        </div>

        <div style={{ marginBottom: 20, padding: 12, background: 'rgba(100, 100, 100, 0.3)', borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#aaa' }}>Time: </span>
            <span style={{ color: '#ffff00', fontSize: 18 }}>{formatTimeLocal(raceTime)}</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#aaa' }}>Checkpoints: </span>
            <span style={{ color: '#00ff00' }}>{passedCheckpoints}/{totalCheckpoints}</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#aaa' }}>Collisions: </span>
            <span style={{ color: damage.collisionCount > 0 ? '#ff6666' : '#00ff00' }}>
              {damage.collisionCount}
            </span>
          </div>
          <div>
            <span style={{ color: '#aaa' }}>Hull Integrity: </span>
            <span style={{
              color: damage.hullIntegrity > 50 ? '#00ff00' :
                     damage.hullIntegrity > 20 ? '#ffff00' : '#ff3333'
            }}>
              {damage.hullIntegrity.toFixed(0)}%
            </span>
          </div>
        </div>

        <button
          onClick={() => abandonRace()}
          style={{
            width: '100%',
            padding: 12,
            background: '#00aa00',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 'bold',
          }}
        >
          CONTINUE
        </button>
      </div>
    )
  }

  if (!isRacing) return null

  const nextCheckpoint = currentRace.checkpoints[currentCheckpoint]
  const isNearCheckpoint = nearbyCheckpoints.includes(nextCheckpoint?.id || '')
  const isLastCheckpoint = currentCheckpoint >= currentRace.checkpoints.length - 1

  // Difficulty colors
  const difficultyColors = {
    peaceful: '#00ff00',
    moderate: '#ffff00',
    challenging: '#ff6666',
  }

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
        minWidth: 260,
      }}
    >
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{currentRace.name}</strong>
        <span style={{ fontSize: 10, color: difficultyColors[difficulty], textTransform: 'uppercase' }}>
          {difficulty}
        </span>
      </div>

      {/* Hull Integrity Bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#aaa' }}>HULL INTEGRITY</span>
          <span style={{
            fontSize: 11,
            color: damage.hullIntegrity > 50 ? '#00ff00' :
                   damage.hullIntegrity > 20 ? '#ffff00' : '#ff3333'
          }}>
            {damage.hullIntegrity.toFixed(0)}%
          </span>
        </div>
        <div style={{
          height: 8,
          background: '#333',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${damage.hullIntegrity}%`,
            height: '100%',
            background: damage.hullIntegrity > 50 ? '#00ff00' :
                        damage.hullIntegrity > 20 ? '#ffff00' : '#ff3333',
            transition: 'width 0.3s, background 0.3s',
          }} />
        </div>
        {damage.collisionCount > 0 && (
          <div style={{ fontSize: 10, color: '#ff6666', marginTop: 4 }}>
            Collisions: {damage.collisionCount}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 5 }}>
        CHECKPOINT: <span style={{ color: '#ffff00' }}>{currentCheckpoint + 1}/{currentRace.checkpoints.length}</span>
      </div>

      <div style={{ marginBottom: 10 }}>
        TIME: <span style={{ color: '#ffff00' }}>{formatTimeLocal(raceTime)}</span>
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
          <div style={{ fontSize: 12 }}>
            {isLastCheckpoint ? 'FINISH LINE' : `NEXT: CP ${currentCheckpoint + 1}`}
          </div>
          <div style={{ fontSize: 10, color: isNearCheckpoint ? '#00ff00' : '#aaa' }}>
            {isNearCheckpoint ? '>>> APPROACHING <<<' : 'Head to checkpoint'}
          </div>
        </div>
      )}

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
        ABANDON RACE
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
            {(entry.bestTime / 1000).toFixed(2)}s | Hits: {entry.collisions || 0}
          </div>
        </div>
      ))}
    </div>
  )
}
