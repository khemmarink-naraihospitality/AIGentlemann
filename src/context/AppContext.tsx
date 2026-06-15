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
  syncPin: string
  syncUsername: string
  settingsUnlocked: boolean
  connectSync: (pin: string, username: string) => Promise<SyncResult>
  changeSyncUsername: (username: string) => Promise<SyncResult>
  unlockWithPin: (pin: string) => boolean
  disconnectSync: () => void
  syncToServer: (settings: SyncedSettings) => Promise<SyncResult>
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
  const [syncPin, setSyncPinState] = useState(() => localStorage.getItem('sync-pin') ?? '')
  const [syncUsername, setSyncUsernameState] = useState(() => localStorage.getItem('sync-username') ?? '')
  const [settingsUnlocked, setSettingsUnlocked] = useState(() => !localStorage.getItem('sync-pin'))

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

  const connectSync = async (pin: string, username: string): Promise<SyncResult> => {
    const trimmedUsername = username.trim().toLowerCase()
    const result = await pullSettings(pin, trimmedUsername)
    if (result.ok) {
      localStorage.setItem('sync-pin', pin)
      localStorage.setItem('sync-username', trimmedUsername)
      setSyncPinState(pin)
      setSyncUsernameState(trimmedUsername)
      setSettingsUnlocked(true)
      if (result.data) applySyncedSettings(result.data)
    }
    return result
  }

  const changeSyncUsername = async (username: string): Promise<SyncResult> => {
    if (!syncPin) return { ok: false, message: 'ยังไม่ได้เชื่อมต่อ Sync' }
    const trimmedUsername = username.trim().toLowerCase()
    const result = await pullSettings(syncPin, trimmedUsername)
    if (result.ok) {
      localStorage.setItem('sync-username', trimmedUsername)
      setSyncUsernameState(trimmedUsername)
      if (result.data) applySyncedSettings(result.data)
    }
    return result
  }

  const unlockWithPin = (pin: string): boolean => {
    if (syncPin && pin === syncPin) {
      setSettingsUnlocked(true)
      return true
    }
    return false
  }

  const disconnectSync = () => {
    localStorage.removeItem('sync-pin')
    localStorage.removeItem('sync-username')
    setSyncPinState('')
    setSyncUsernameState('')
    setSettingsUnlocked(true)
  }

  const syncToServer = (settings: SyncedSettings): Promise<SyncResult> => {
    if (!syncPin) return Promise.resolve({ ok: false, message: 'ยังไม่ได้เชื่อมต่อ Sync' })
    return pushSettings(syncPin, settings, syncUsername)
  }

  const pullFromServer = async (): Promise<SyncResult> => {
    if (!syncPin) return { ok: false, message: 'ยังไม่ได้เชื่อมต่อ Sync' }
    const result = await pullSettings(syncPin, syncUsername)
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
        syncPin, syncUsername, settingsUnlocked, connectSync, changeSyncUsername, unlockWithPin, disconnectSync, syncToServer, pullFromServer,
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
