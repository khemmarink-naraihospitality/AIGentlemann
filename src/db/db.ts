import Dexie, { type Table } from 'dexie'

export interface HistoryItem {
  id?: number
  type: 'image' | 'video'
  dataUrl: string
  mimeType: string
  prompt: string
  createdAt: number
}

class AppDB extends Dexie {
  history!: Table<HistoryItem>
  constructor() {
    super('aigentleman-db')
    this.version(1).stores({ history: '++id, createdAt' })
  }
}

export const db = new AppDB()
