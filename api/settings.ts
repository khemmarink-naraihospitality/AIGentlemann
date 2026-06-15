import { Redis } from '@upstash/redis'

export const config = { runtime: 'edge' }

const SETTINGS_KEY_PREFIX = 'aigentlemann:settings'
const MAX_USERNAME_LENGTH = 64

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
  const expectedPin = process.env.SETTINGS_PIN
  if (!expectedPin) {
    return json({ error: 'ยังไม่ได้ตั้งค่า SETTINGS_PIN บน Server' }, 503)
  }

  const auth = request.headers.get('authorization') ?? ''
  const pin = auth.replace(/^Bearer\s+/i, '')
  if (!pin || pin !== expectedPin) {
    return json({ error: 'PIN ไม่ถูกต้อง' }, 401)
  }

  const redis = getRedis()
  if (!redis) {
    return json({ error: 'ยังไม่ได้เชื่อมต่อ Redis Database บน Vercel' }, 503)
  }

  const username = (new URL(request.url).searchParams.get('user') ?? '').trim().toLowerCase()
  if (username.length > MAX_USERNAME_LENGTH) {
    return json({ error: 'ชื่อผู้ใช้ยาวเกินไป' }, 400)
  }
  const settingsKey = username ? `${SETTINGS_KEY_PREFIX}:${username}` : SETTINGS_KEY_PREFIX

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
