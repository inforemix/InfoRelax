import { useGameStore, EnvironmentType } from '../../state/useGameStore'

interface EnvironmentOption {
  id: EnvironmentType
  name: string
  description: string
  icon: string
}

const ENVIRONMENT_OPTIONS: EnvironmentOption[] = [
  {
    id: 'default',
    name: 'Open Ocean',
    description: 'Dynamic sky with clouds and weather',
    icon: '🌤️',
  },
  {
    id: 'glacier-360',
    name: 'Arctic Glacier',
    description: '360° panoramic glacier scenery',
    icon: '🏔️',
  },
]

export function EnvironmentToggle() {
  const { environmentType, setEnvironmentType } = useGameStore()

  return (
    <div className="absolute top-20 right-4 z-40">
      <div className="glass rounded-xl p-3">
        <div className="text-xs text-slate-400 mb-2 font-medium">Environment</div>
        <div className="flex flex-col gap-1">
          {ENVIRONMENT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setEnvironmentType(option.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left ${
                environmentType === option.id
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-transparent'
              }`}
              title={option.description}
            >
              <span className="text-lg">{option.icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{option.name}</span>
                <span className="text-xs text-slate-400 hidden sm:block">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Compact version for mobile or minimal UI
export function EnvironmentToggleCompact() {
  const { environmentType, toggleEnvironment } = useGameStore()
  const currentOption = ENVIRONMENT_OPTIONS.find((o) => o.id === environmentType)

  return (
    <button
      onClick={toggleEnvironment}
      className="glass rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-slate-700/50 transition-all"
      title={`Switch to ${environmentType === 'default' ? 'Glacier 360°' : 'Open Ocean'}`}
    >
      <span className="text-lg">{currentOption?.icon}</span>
      <span className="text-sm text-slate-300 hidden sm:inline">{currentOption?.name}</span>
    </button>
  )
}
