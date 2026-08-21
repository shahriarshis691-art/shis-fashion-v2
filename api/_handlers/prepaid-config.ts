import { getCheckoutPaymentConfig } from '../_paymentConfig.js'

interface LooseRequest {
  method?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  json: (payload: unknown) => void
}

function sendJson(res: LooseResponse, status: number, payload: unknown) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.status(status).json(payload)
}

export default function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method && req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const config = getCheckoutPaymentConfig()
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  sendJson(res, 200, {
    configured: config.configured,
    provider: config.provider,
    bkashOnline: config.bkashOnline,
    sslcommerz: config.sslcommerz,
    mobileWallet: config.mobileWallet,
    bkashManual: config.bkashManual,
    nagadManual: config.nagadManual,
    bkashMerchantNumber: config.bkashMerchantNumber,
    nagadMerchantNumber: config.nagadMerchantNumber,
    prepaidCheckoutEnabled: config.prepaidCheckoutEnabled,
  })
}
