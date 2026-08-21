import { getPrepaidPublicConfig } from '../_prepaidProvider.js'

export const config = {
  runtime: 'nodejs',
}

interface LooseRequest {
  method?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  json: (payload: unknown) => void
}

export default function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  res.status(200).json(getPrepaidPublicConfig())
}
