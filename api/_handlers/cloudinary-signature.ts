import { createHash } from 'node:crypto'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

interface LooseRequest {
  method?: string
  query?: Record<string, string | string[] | undefined>
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

export default function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  void (async () => {
    const hasAccess = await requireAdminAccess(req)

    if (!hasAccess) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const cloudName = readEnv('CLOUDINARY_CLOUD_NAME')
    const apiKey = readEnv('CLOUDINARY_API_KEY')
    const apiSecret = readEnv('CLOUDINARY_API_SECRET')

    if (!cloudName || !apiKey || !apiSecret) {
      res.status(500).json({ error: 'Cloudinary signed upload is not configured' })
      return
    }

    const folderParam = req.query?.folder
    const folder = Array.isArray(folderParam) ? folderParam[0] : folderParam ?? ''
    const timestamp = Math.floor(Date.now() / 1000)

    const signature = makeSignature(
      {
        folder,
        timestamp: String(timestamp),
      },
      apiSecret,
    )

    res.status(200).json({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
    })
  })().catch(() => {
    res.status(500).json({ error: 'Unable to create signed upload session' })
  })
}
