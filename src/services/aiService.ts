const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'
// SD3.5-Large-Turbo: better prompt following, 8 steps
const HF_IMAGE_MODEL_SD35  = '/api/hf/hf-inference/models/stabilityai/stable-diffusion-3.5-large-turbo'
// FLUX.1-schnell: fast fallback
const HF_IMAGE_MODEL_FLUX  = '/api/hf/hf-inference/models/black-forest-labs/FLUX.1-schnell'
const FAL_BASE = '/api/fal'
const FAL_VIDEO_MODEL = 'fal-ai/wan/v2.1/1.3b/text-to-video'
const PEXELS_BASE = '/api/pexels'

export interface GenerateParams {
  backgroundImage?: string  // base64 data URL
  personImage?: string      // base64 data URL
  description?: string
  speak?: string
}

function geminiHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-goog-api-key': apiKey,
  }
}

function buildTextPrompt({ description, speak }: GenerateParams): string {
  const parts: string[] = []
  if (description) parts.push(description)
  if (speak) parts.push(`with text/caption: "${speak}"`)
  return parts.length ? parts.join(', ') : 'Create a visually compelling, artistic image'
}

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const [header, data] = dataUrl.split(',')
  const mimeType = header.replace(/^data:/, '').replace(/;base64$/, '')
  return { mimeType, data }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Translate non-English text to English — pure translation, no creative additions
async function translatePrompt(apiKey: string, text: string): Promise<string> {
  const res = await fetch(`${GEMINI_BASE}/models/gemini-2.5-flash:generateContent`, {
    method: 'POST',
    headers: geminiHeaders(apiKey),
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: `Convert this to a clear English image generation prompt (10-20 words). Rules:\n- Translate the meaning faithfully, do NOT change the subject\n- If it's an animal, include the word "animal"\n- Add basic visual context (standing, in natural setting, etc.) only if needed to clarify the subject\n- Output ONLY the prompt, no explanation\n\nInput: "${text}"` }],
      }],
    }),
  })
  if (!res.ok) return text
  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? text
}

// Used only when reference images are uploaded — describes what's visible and merges with user description
async function buildImagePrompt(
  apiKey: string,
  params: GenerateParams
): Promise<string> {
  const visionParts: object[] = []
  const parts: string[] = [
    'Describe the content of the reference image(s) in a short English phrase (subject + key visual details only).',
    'Then combine with the user description below into ONE English image generation prompt.',
    'Keep the user description\'s intent as the PRIMARY subject. Do NOT add unrelated elements.',
    'Append at the end: high quality, sharp focus.',
    'Output ONLY the final prompt — no labels, no quotes.',
  ]

  if (params.backgroundImage) {
    const { mimeType, data } = splitDataUrl(params.backgroundImage)
    parts.push('Image 1 = background/scene')
    visionParts.push({ inlineData: { mimeType, data } })
  }
  if (params.personImage) {
    const { mimeType, data } = splitDataUrl(params.personImage)
    parts.push('Image 2 = person/character to feature')
    visionParts.push({ inlineData: { mimeType, data } })
  }
  if (params.description) parts.push(`User description: "${params.description}"`)
  if (params.speak)       parts.push(`Include this caption text in the image: "${params.speak}"`)

  const res = await fetch(`${GEMINI_BASE}/models/gemini-2.5-flash:generateContent`, {
    method: 'POST',
    headers: geminiHeaders(apiKey),
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: parts.join('\n') }, ...visionParts],
      }],
    }),
  })

  if (!res.ok) return buildTextPrompt(params)
  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || buildTextPrompt(params)
}

// ---------------------------------------------------------------------------
// Google image generation (tries Gemini native → Imagen 3)
// ---------------------------------------------------------------------------

async function generateImageGoogle(apiKey: string, prompt: string): Promise<string> {
  // 1) Try Gemini 2.5 Flash native image output (may be free)
  const geminiRes = await fetch(`${GEMINI_BASE}/models/gemini-2.5-flash:generateContent`, {
    method: 'POST',
    headers: geminiHeaders(apiKey),
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `Generate an image: ${prompt}` }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  })

  if (geminiRes.ok) {
    const json = await geminiRes.json()
    const imgPart = json.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType: string; data: string } }) =>
        p.inlineData?.mimeType?.startsWith('image/')
    )
    if (imgPart?.inlineData) {
      const { mimeType, data } = imgPart.inlineData
      return `data:${mimeType};base64,${data}`
    }
  }

  // 2) Try Imagen 3 (requires billing enabled on Google Cloud project)
  const imagenRes = await fetch(`${GEMINI_BASE}/models/imagen-3.0-generate-002:predict`, {
    method: 'POST',
    headers: geminiHeaders(apiKey),
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '1:1' },
    }),
  })

  if (!imagenRes.ok) {
    const json = await imagenRes.json().catch(() => ({}))
    const msg: string = json?.error?.message ?? `HTTP ${imagenRes.status}`
    const needsBilling = /paid|billing|upgrade|quota/i.test(msg)
    if (needsBilling) {
      throw new Error(
        'Imagen ต้องการเปิด Billing ก่อน\n\n' +
        '1. ไปที่ console.cloud.google.com/billing\n' +
        '2. Link billing account กับ project ที่ใช้ AI Studio Key\n' +
        'ราคา ~$0.04 ต่อภาพ (Google Workspace ของคุณมี billing แล้ว)'
      )
    }
    throw new Error(`Google AI image: ${msg}`)
  }

  const json = await imagenRes.json()
  const imageData: string | undefined = json.predictions?.[0]?.bytesBase64Encoded
  if (imageData) return `data:image/png;base64,${imageData}`
  throw new Error('Google AI: ไม่พบข้อมูลภาพในผลลัพธ์')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateImage(
  apiKey: string,
  hfToken: string,
  params: GenerateParams
): Promise<string> {
  if (!hfToken) {
    throw new Error(
      'กรุณาเพิ่ม Hugging Face Token ในหน้า Settings\n' +
      'รับ token ฟรีได้ที่ huggingface.co/settings/tokens'
    )
  }

  const hasImages = !!(params.backgroundImage || params.personImage)
  let prompt: string

  if (hasImages && apiKey) {
    prompt = await buildImagePrompt(apiKey, params)
  } else if (apiKey && params.description) {
    const translated = await translatePrompt(apiKey, params.description)
    const caption = params.speak ? `, with caption text "${params.speak}"` : ''
    prompt = `${translated}${caption}, high quality, sharp focus`
  } else {
    prompt = buildTextPrompt(params)
  }

  // Primary: Google AI (Gemini native → Imagen 3)
  if (apiKey) {
    try {
      return await generateImageGoogle(apiKey, prompt)
    } catch (err) {
      const msg = (err as Error).message
      if (/billing|paid|upgrade|quota/i.test(msg)) throw err
      // Other Google errors → fallback to HF
    }
  }


  const models = [
    { url: HF_IMAGE_MODEL_SD35, body: { inputs: prompt, parameters: { num_inference_steps: 8,  guidance_scale: 1.0 } } },
    { url: HF_IMAGE_MODEL_FLUX, body: { inputs: prompt, parameters: { num_inference_steps: 8 } } },
  ]

  // Statuses that mean "this model is gone/unavailable — try next one"
  const SKIP_STATUSES = new Set([400, 402, 404, 410, 422, 503])

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await fetch(model.url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(model.body),
      })

      // Cold start: retry once after 8s
      if (res.status === 503 && attempt === 1) {
        await new Promise(r => setTimeout(r, 8000))
        continue
      }

      // Model unavailable/deprecated/quota — try next model
      if (SKIP_STATUSES.has(res.status)) break

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        let msg = `Hugging Face API ไม่สามารถใช้งานได้ (${res.status})`
        if (res.status === 401 || res.status === 403) {
          msg = 'HF Token ไม่ถูกต้องหรือหมดอายุ กรุณาตรวจสอบ Token ในหน้า Settings'
        } else if (text) {
          msg += `\n${text.slice(0, 200)}`
        }
        throw new Error(msg)
      }

      const blob = await res.blob()
      return blobToDataUrl(blob)
    }
  }

  throw new Error('ไม่สามารถสร้างภาพได้ กรุณาลองใหม่อีกครั้ง')
}

// ---------------------------------------------------------------------------
// Pexels stock photo search
// ---------------------------------------------------------------------------

export async function searchStockPhoto(
  pexelsKey: string,
  apiKey: string,
  params: GenerateParams
): Promise<string> {
  if (!pexelsKey) {
    throw new Error(
      'กรุณาเพิ่ม Pexels API Key ในหน้า Settings\n' +
      'รับ Key ฟรีได้ที่ pexels.com/api'
    )
  }

  const description = params.description?.trim()
  if (!description) {
    throw new Error('กรุณากรอก Description เพื่อใช้เป็นคำค้นหารูปภาพ')
  }

  const query = apiKey ? await translatePrompt(apiKey, description) : description

  const res = await fetch(
    `${PEXELS_BASE}/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=portrait`,
    { headers: { 'Authorization': pexelsKey } }
  )

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Pexels API Key ไม่ถูกต้อง กรุณาตรวจสอบ Key ในหน้า Settings')
    }
    throw new Error(`Pexels API ไม่สามารถใช้งานได้ (${res.status})`)
  }

  const json = await res.json()
  const photos: Array<{ src: Record<string, string> }> = json.photos ?? []
  if (photos.length === 0) {
    throw new Error('ไม่พบรูปภาพที่ตรงกับคำอธิบาย ลองเปลี่ยนคำอธิบายดูใหม่')
  }

  const pick = photos[Math.floor(Math.random() * photos.length)]
  const imgUrl = pick.src.large2x || pick.src.large || pick.src.original

  try {
    const imgRes = await fetch(imgUrl)
    if (imgRes.ok) return blobToDataUrl(await imgRes.blob())
  } catch {
    // CORS or network issue — fall back to the direct image URL
  }
  return imgUrl
}

async function generateVideoFal(
  falKey: string,
  params: GenerateParams
): Promise<string> {
  const prompt = buildTextPrompt(params)

  const submitRes = await fetch(`${FAL_BASE}/${FAL_VIDEO_MODEL}`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, num_frames: 49, resolution: '480p', num_inference_steps: 20 }),
  })

  if (!submitRes.ok) {
    const text = await submitRes.text().catch(() => '')
    if (submitRes.status === 401 || submitRes.status === 403) {
      throw new Error('Fal.ai Key ไม่ถูกต้อง กรุณาตรวจสอบ Key ในหน้า Settings')
    }
    throw new Error(`Fal.ai API ไม่สามารถใช้งานได้ (${submitRes.status})\n${text.slice(0, 200)}`)
  }

  const { request_id } = await submitRes.json()
  const statusUrl = `${FAL_BASE}/${FAL_VIDEO_MODEL}/requests/${request_id}/status`
  const resultUrl = `${FAL_BASE}/${FAL_VIDEO_MODEL}/requests/${request_id}`

  for (let i = 0; i < 60; i++) {
    await new Promise<void>(r => setTimeout(r, 5000))
    const st = await fetch(statusUrl, { headers: { 'Authorization': `Key ${falKey}` } })
    const { status } = await st.json()

    if (status === 'COMPLETED') {
      const res = await fetch(resultUrl, { headers: { 'Authorization': `Key ${falKey}` } })
      const result = await res.json()
      const videoUrl: string | undefined = result.video?.url
      if (!videoUrl) throw new Error('ไม่พบข้อมูลวิดีโอในผลลัพธ์ กรุณาลองใหม่')
      return videoUrl
    }
    if (status === 'FAILED') {
      throw new Error('การสร้างวิดีโอล้มเหลว กรุณาลองใหม่อีกครั้ง')
    }
  }

  throw new Error('หมดเวลารอผลลัพธ์ (5 นาที) กรุณาลองสร้างวิดีโออีกครั้ง')
}

export async function generateVideo(
  apiKey: string,
  falKey: string,
  params: GenerateParams
): Promise<string> {
  // Use Fal.ai (Wan2.1) when key is provided — cheaper & no quota issues
  if (falKey) return generateVideoFal(falKey, params)
  const prompt = buildTextPrompt(params)

  const res = await fetch(
    `${GEMINI_BASE}/models/veo-3.1-generate-preview:predictLongRunning`,
    {
      method: 'POST',
      headers: geminiHeaders(apiKey),
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { aspectRatio: '9:16', sampleCount: 1 },
      }),
    }
  )

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    const msg: string = json?.error?.message ?? `HTTP ${res.status}`
    const isQuota = res.status === 429 || msg.toLowerCase().includes('quota')
    const isPaid  = msg.toLowerCase().includes('paid') || msg.toLowerCase().includes('billing')
    const hint = isQuota || isPaid
      ? '\n\nVeo ต้องการ Paid Plan — เปิด billing ที่ console.cloud.google.com/billing แล้ว link กับ project ที่ใช้ AI Studio Key'
      : '\n\nกรุณาตรวจสอบว่า API Key ของคุณรองรับ Veo และมี quota เพียงพอ'
    throw new Error(`Veo API ไม่สามารถใช้งานได้: ${msg}${hint}`)
  }

  const op = await res.json()
  const opName: string = op.name

  for (let i = 0; i < 24; i++) {
    await new Promise<void>(r => setTimeout(r, 5000))
    const poll     = await fetch(`${GEMINI_BASE}/${opName}`, { headers: geminiHeaders(apiKey) })
    const pollData = await poll.json()

    if (pollData.done) {
      const videoData: string | undefined =
        pollData.response?.predictions?.[0]?.bytesBase64Encoded
      if (videoData) return `data:video/mp4;base64,${videoData}`
      throw new Error('ไม่พบข้อมูลวิดีโอในผลลัพธ์ กรุณาลองใหม่')
    }
  }

  throw new Error('หมดเวลารอผลลัพธ์ (120 วินาที) กรุณาลองสร้างวิดีโออีกครั้ง')
}
