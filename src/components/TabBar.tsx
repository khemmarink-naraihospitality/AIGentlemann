import { Wand2, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TABS = [
  { id: 'create' as const, label: 'Create', icon: Wand2 },
  { id: 'history' as const, label: 'History', icon: Clock },
]

export function TabBar() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <div className="fixed top-14 inset-x-0 z-30 bg-slate-900 border-b border-slate-700/50">
      <div className="max-w-lg mx-auto flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative
              ${activeTab === id
                ? 'text-indigo-400'
                : 'text-slate-500 hover:text-slate-300 active:text-slate-200'
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {activeTab === id && (
              <span className="absolute bottom-0 inset-x-4 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
