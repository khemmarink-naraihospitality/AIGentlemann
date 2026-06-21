import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { db, type HistoryItem } from '../db/db'
import type { ImageSource } from '../services/aiService'
import { pullSettings, pushSettings, type SyncedSettings, type SyncResult } from '../services/syncService'

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
  pexelsKey: string
  savePexelsKey: (key: string) => void
  imageSource: ImageSource
  saveImageSource: (source: ImageSource) => void
  activeTab: 'create' | 'settings' | 'history'
  setActiveTab: (tab: 'create' | 'settings' | 'history') => void
  history: HistoryItem[]
  refreshHistory: () => Promise<void>
  deleteHistoryItem: (id: number) => Promise<void>
  toast: Toast | null
  showToast: (message: string, type: Toast['type']) => void
  dismissToast: () => void
  loginPin: string
  isLoggedIn: boolean
  login: (pin: string) => Promise<SyncResult>
  logout: () => void
  syncNow: (settings: SyncedSettings) => Promise<SyncResult>
  pullFromServer: () => Promise<SyncResult>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai-api-key') ?? '')
  const [hfToken, setHfToken] = useState(() => localStorage.getItem('hf-token') ?? '')
  const [falKey, setFalKey] = useState(() => localStorage.getItem('fal-key') ?? '')
  const [pexelsKey, setPexelsKey] = useState(() => localStorage.getItem('pexels-key') ?? '')
  const [imageSource, setImageSource] = useState<ImageSource>(() => {
    const saved = localStorage.getItem('image-source')
    return saved === 'google' || saved === 'huggingface' || saved === 'pexels' ? saved : 'auto'
  })
  const [activeTab, setActiveTab] = useState<'create' | 'settings' | 'history'>('create')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [toast, setToast] = useState<Toast | null>(null)
  const [loginPin, setLoginPinState] = useState(() => localStorage.getItem('login-pin') ?? '')
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('login-pin'))

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

  const savePexelsKey = (key: string) => {
    const trimmed = key.trim()
    setPexelsKey(trimmed)
    localStorage.setItem('pexels-key', trimmed)
  }

  const saveImageSource = (source: ImageSource) => {
    setImageSource(source)
    localStorage.setItem('image-source', source)
  }

  const applySyncedSettings = (data: SyncedSettings) => {
    if (typeof data.apiKey === 'string') saveApiKey(data.apiKey)
    if (typeof data.hfToken === 'string') saveHfToken(data.hfToken)
    if (typeof data.falKey === 'string') saveFalKey(data.falKey)
    if (typeof data.pexelsKey === 'string') savePexelsKey(data.pexelsKey)
    if (data.imageSource === 'google' || data.imageSource === 'huggingface' || data.imageSource === 'pexels' || data.imageSource === 'auto') {
      saveImageSource(data.imageSource)
    }
  }

  useEffect(() => {
    if (!loginPin) return
    pullSettings(loginPin).then(result => {
      if (result.ok && result.data) applySyncedSettings(result.data)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (pin: string): Promise<SyncResult> => {
    const trimmed = pin.trim()
    const result = await pullSettings(trimmed)
    if (result.ok) {
      localStorage.setItem('login-pin', trimmed)
      setLoginPinState(trimmed)
      setIsLoggedIn(true)
      if (result.data) applySyncedSettings(result.data)
    }
    return result
  }

  const logout = () => {
    localStorage.removeItem('login-pin')
    setLoginPinState('')
    setIsLoggedIn(false)
  }

  const syncNow = (settings: SyncedSettings): Promise<SyncResult> => {
    if (!loginPin) return Promise.resolve({ ok: false, message: 'ยังไม่ได้เข้าสู่ระบบ' })
    return pushSettings(loginPin, settings)
  }

  const pullFromServer = async (): Promise<SyncResult> => {
    if (!loginPin) return { ok: false, message: 'ยังไม่ได้เข้าสู่ระบบ' }
    const result = await pullSettings(loginPin)
    if (result.ok && result.data) applySyncedSettings(result.data)
    return result
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
        pexelsKey, savePexelsKey,
        imageSource, saveImageSource,
        activeTab, setActiveTab,
        history, refreshHistory, deleteHistoryItem,
        toast, showToast, dismissToast,
        loginPin, isLoggedIn, login, logout, syncNow, pullFromServer,
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
