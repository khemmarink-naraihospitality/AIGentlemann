export const config = { runtime: 'edge' }

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const targetPath = url.pathname.replace(/^\/api\/pexels/, '')
  const targetUrl = `https://api.pexels.com${targetPath}${url.search}`

  const headers: Record<string, string> = {}
  const auth = request.headers.get('authorization')
  if (auth) headers['Authorization'] = auth

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
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
