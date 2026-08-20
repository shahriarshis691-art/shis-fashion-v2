interface LooseRequest {
  method?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  json: (payload: unknown) => void
}

export const config = {
  runtime: 'nodejs',
}

export default function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  res.status(401).json({ ok: false, error: 'Unauthorized' })
}
