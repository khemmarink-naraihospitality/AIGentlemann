export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const targetPath = url.pathname.replace(/^\/api\/hf/, '')
  const targetUrl = `https://router.huggingface.co${targetPath}${url.search}`

  const headers: Record<string, string> = {}
  const auth = request.headers.get('authorization')
  const ct = request.headers.get('content-type')
  if (auth) headers['Authorization'] = auth
  if (ct) headers['Content-Type'] = ct

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' ? request.body : undefined,
    // @ts-ignore
    duplex: 'half',
  })

  const resHeaders = new Headers()
  const resCt = upstream.headers.get('content-type')
  if (resCt) resHeaders.set('Content-Type', resCt)
  resHeaders.set('Access-Control-Allow-Origin', '*')

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  })
}
