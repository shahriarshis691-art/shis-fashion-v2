import { createHash } from 'node:crypto'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

interface LooseRequest {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  json: (payload: unknown) => void
}

function readEnv(name: string) {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  return env[name] ?? ''
}

function getHeaderValue(headers: LooseRequest['headers'], name: string) {
  const header = headers?.[name] ?? headers?.[name.toLowerCase()]
  return Array.isArray(header) ? header[0] : header ?? ''
}

function getFirebaseAdminAuth() {
  const projectId = readEnv('FIREBASE_ADMIN_PROJECT_ID') || readEnv('VITE_FIREBASE_PROJECT_ID')
  const clientEmail = readEnv('FIREBASE_ADMIN_CLIENT_EMAIL')
  const privateKey = readEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  }

  return getAuth()
}

function isConfiguredAdminEmail(email: string) {
  const rawValue = readEnv('VITE_ADMIN_EMAILS')
  if (!rawValue) {
    return false
  }

  return rawValue
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase())
}

async function requireAdminAccess(req: LooseRequest) {
  const authorization = getHeaderValue(req.headers, 'authorization')
  const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : ''

  if (!token) {
    return false
  }

  const auth = getFirebaseAdminAuth()
  if (!auth) {
    return false
  }

  try {
    const decoded = await auth.verifyIdToken(token)
    const email = decoded.email?.trim().toLowerCase() ?? ''
    return Boolean(decoded.admin === true || isConfiguredAdminEmail(email))
  } catch {
    return false
  }
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

function getResourceType(url: string) {
  try {
    const parsed = new URL(url)
    // Cloudinary URLs are typically /<resource_type>/upload/vN/...
    const match = parsed.pathname.match(/\/(image|video|raw)\/upload\//)
    return match?.[1] ?? 'image'
  } catch {
    return 'image'
  }
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const hasAccess = await requireAdminAccess(req)
  if (!hasAccess) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
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
  const resourceType = getResourceType(body.url ?? '')
  const signature = makeSignature(
    {
      public_id: publicId,
      timestamp: String(timestamp),
    },
    apiSecret,
  )

  const destroyEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`
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
