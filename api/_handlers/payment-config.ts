import { getCheckoutPaymentConfig } from '../_paymentConfig.js'

interface LooseRequest {
  method?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  json: (payload: unknown) => void
}

export default function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  res.status(200).json(getCheckoutPaymentConfig())
}
