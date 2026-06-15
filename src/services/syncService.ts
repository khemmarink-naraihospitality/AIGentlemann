export interface SyncedSettings {
  apiKey?: string
  hfToken?: string
  falKey?: string
  pexelsKey?: string
  imageSource?: string
}

export interface SyncResult {
  ok: boolean
  message: string
  data?: SyncedSettings
}

async function parseErrorMessage(res: Response): Promise<string> {
  const json = await res.json().catch(() => ({}))
  if (res.status === 503) return json?.error ?? 'Server ยังไม่ได้ตั้งค่าสำหรับ Sync'
  if (res.status === 401) return 'PIN ไม่ถูกต้อง'
  return json?.error ?? `เกิดข้อผิดพลาด (HTTP ${res.status})`
}

function settingsUrl(username: string): string {
  const trimmed = username.trim()
  return trimmed ? `/api/settings?user=${encodeURIComponent(trimmed)}` : '/api/settings'
}

export async function pullSettings(pin: string, username = ''): Promise<SyncResult> {
  try {
    const res = await fetch(settingsUrl(username), {
      headers: { Authorization: `Bearer ${pin}` },
    })
    if (!res.ok) return { ok: false, message: await parseErrorMessage(res) }
    const data = (await res.json()) as SyncedSettings
    return { ok: true, message: 'ดึงข้อมูลจาก Server สำเร็จ', data }
  } catch {
    return { ok: false, message: 'เชื่อมต่อ Server ไม่สำเร็จ (เครือข่ายขัดข้อง)' }
  }
}

export async function pushSettings(pin: string, settings: SyncedSettings, username = ''): Promise<SyncResult> {
  try {
    const res = await fetch(settingsUrl(username), {
      method: 'POST',
      headers: { Authorization: `Bearer ${pin}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (!res.ok) return { ok: false, message: await parseErrorMessage(res) }
    return { ok: true, message: 'ซิงค์ขึ้น Server สำเร็จ' }
  } catch {
    return { ok: false, message: 'เชื่อมต่อ Server ไม่สำเร็จ (เครือข่ายขัดข้อง)' }
  }
}
