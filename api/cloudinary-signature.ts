import { createHash } from 'node:crypto'

interface LooseRequest {
  method?: string
  query?: Record<string, string | string[] | undefined>
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

export default function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
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
}
