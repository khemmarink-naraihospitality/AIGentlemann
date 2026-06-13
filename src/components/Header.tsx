import { Settings, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'

export function Header() {
  const { setActiveTab } = useApp()

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">
            AI Gentleman
          </span>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          aria-label="Settings"
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
