import { Redis } from '@upstash/redis'

export const config = { runtime: 'edge' }

const SETTINGS_KEY_PREFIX = 'aigentlemann:settings'
const MAX_PIN_LENGTH = 64

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async function handler(request: Request): Promise<Response> {
  const auth = request.headers.get('authorization') ?? ''
  const pin = auth.replace(/^Bearer\s+/i, '').trim()
  if (!pin) {
    return json({ error: 'กรุณาระบุ PIN' }, 401)
  }
  if (pin.length > MAX_PIN_LENGTH) {
    return json({ error: 'PIN ยาวเกินไป' }, 400)
  }

  const redis = getRedis()
  if (!redis) {
    return json({ error: 'ยังไม่ได้เชื่อมต่อ Redis Database บน Vercel' }, 503)
  }

  const settingsKey = `${SETTINGS_KEY_PREFIX}:${pin}`

  if (request.method === 'GET') {
    const data = await redis.get(settingsKey)
    return json(data ?? {})
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400)
    }
    await redis.set(settingsKey, body)
    return json({ ok: true })
  }

  return json({ error: 'Method Not Allowed' }, 405)
}
