import { createHash } from 'node:crypto'

interface LooseRequest {
  method?: string
  body?: unknown
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  json: (payload: unknown) => void
}

function readEnv(name: string) {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  return env[name] ?? ''
}

function makeSignature(params: Record<string, string>, apiSecret: string) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value.length > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex')
}

function extractPublicId(url: string) {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return ''
  }

  const marker = '/upload/'
  const markerIndex = parsed.pathname.indexOf(marker)
  if (markerIndex < 0) {
    return ''
  }

  const pathAfterUpload = parsed.pathname.slice(markerIndex + marker.length)
  const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '')
  const dotIndex = withoutVersion.lastIndexOf('.')
  if (dotIndex < 0) {
    return withoutVersion
  }

  return withoutVersion.slice(0, dotIndex)
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const cloudName = readEnv('CLOUDINARY_CLOUD_NAME')
  const apiKey = readEnv('CLOUDINARY_API_KEY')
  const apiSecret = readEnv('CLOUDINARY_API_SECRET')

  if (!cloudName || !apiKey || !apiSecret) {
    res.status(500).json({ ok: false, error: 'Cloudinary signed delete is not configured' })
    return
  }

  const body = (req.body ?? {}) as { url?: string }
  const publicId = body.url ? extractPublicId(body.url) : ''

  if (!publicId) {
    res.status(400).json({ ok: false, error: 'Invalid Cloudinary URL' })
    return
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const signature = makeSignature(
    {
      public_id: publicId,
      timestamp: String(timestamp),
    },
    apiSecret,
  )

  const destroyEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`
  const formData = new URLSearchParams()
  formData.set('public_id', publicId)
  formData.set('api_key', apiKey)
  formData.set('timestamp', String(timestamp))
  formData.set('signature', signature)
  formData.set('invalidate', 'true')

  const response = await fetch(destroyEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    const details = await response.text()
    res.status(502).json({ ok: false, error: `Cloudinary destroy failed: ${details}` })
    return
  }

  res.status(200).json({ ok: true })
}
