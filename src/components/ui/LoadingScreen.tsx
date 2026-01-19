export function LoadingScreen() {
  return (
    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-cyan-500 border-t-transparent rounded-full loading-spinner" />
        <h2 className="text-xl font-bold text-white mb-2">InfoRelax</h2>
        <p className="text-slate-400">Loading sustainable yacht simulator...</p>
      </div>
    </div>
  )
}
