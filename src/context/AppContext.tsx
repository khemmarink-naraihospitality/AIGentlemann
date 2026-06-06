import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { db, type HistoryItem } from '../db/db'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'loading'
}

interface AppContextValue {
  apiKey: string
  saveApiKey: (key: string) => void
  hfToken: string
  saveHfToken: (token: string) => void
  falKey: string
  saveFalKey: (key: string) => void
  showSettings: boolean
  setShowSettings: (v: boolean) => void
  activeTab: 'create' | 'history'
  setActiveTab: (tab: 'create' | 'history') => void
  history: HistoryItem[]
  refreshHistory: () => Promise<void>
  deleteHistoryItem: (id: number) => Promise<void>
  toast: Toast | null
  showToast: (message: string, type: Toast['type']) => void
  dismissToast: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai-api-key') ?? '')
  const [hfToken, setHfToken] = useState(() => localStorage.getItem('hf-token') ?? '')
  const [falKey, setFalKey] = useState(() => localStorage.getItem('fal-key') ?? '')
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [toast, setToast] = useState<Toast | null>(null)

  const refreshHistory = useCallback(async () => {
    const items = await db.history.orderBy('createdAt').reverse().toArray()
    setHistory(items)
  }, [])

  useEffect(() => { refreshHistory() }, [refreshHistory])

  const saveApiKey = (key: string) => {
    const trimmed = key.trim()
    setApiKey(trimmed)
    localStorage.setItem('ai-api-key', trimmed)
  }

  const saveHfToken = (token: string) => {
    const trimmed = token.trim()
    setHfToken(trimmed)
    localStorage.setItem('hf-token', trimmed)
  }

  const saveFalKey = (key: string) => {
    const trimmed = key.trim()
    setFalKey(trimmed)
    localStorage.setItem('fal-key', trimmed)
  }

  const deleteHistoryItem = async (id: number) => {
    await db.history.delete(id)
    await refreshHistory()
  }

  const dismissToast = useCallback(() => setToast(null), [])

  const showToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now()
    setToast({ id, message, type })
    // success auto-dismisses; error and loading stay until manually closed
    if (type === 'success') {
      setTimeout(() => setToast(prev => (prev?.id === id ? null : prev)), 3500)
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        apiKey, saveApiKey,
        hfToken, saveHfToken,
        falKey, saveFalKey,
        showSettings, setShowSettings,
        activeTab, setActiveTab,
        history, refreshHistory, deleteHistoryItem,
        toast, showToast, dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
