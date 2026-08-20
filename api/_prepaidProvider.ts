export type PrepaidProvider = 'bkash' | 'sslcommerz'

function env(name: string) {
  return process.env[name] ?? ''
}

export function getConfiguredPrepaidProvider(): PrepaidProvider | null {
  if (env('BKASH_APP_KEY') && env('BKASH_APP_SECRET') && env('BKASH_USERNAME') && env('BKASH_PASSWORD')) {
    return 'bkash'
  }

  if (env('SSLCOMMERZ_STORE_ID') && env('SSLCOMMERZ_STORE_PASSWORD')) {
    return 'sslcommerz'
  }

  return null
}

export function getPrepaidCallbackUrl() {
  return env('PREPAID_CALLBACK_URL') || `${env('VITE_SITE_URL') || 'https://www.shisfashion.com'}/api/prepaid-callback`
}

export async function startPrepaidCheckout(input: {
  orderId: string
  amount: number
  customerName: string
  customerPhone: string
  customerEmail?: string
}) {
  const provider = getConfiguredPrepaidProvider()
  if (!provider) {
    return { configured: false as const, ok: false as const, error: 'Online payment is not configured.' }
  }

  if (provider === 'bkash') {
    return startBkashCheckout(input)
  }

  return startSslcommerzCheckout(input)
}

export async function completePrepaidCheckout(input: {
  provider?: string
  paymentId?: string
  tranId?: string
}) {
  const provider = (input.provider || getConfiguredPrepaidProvider() || '') as PrepaidProvider | ''
  if (provider === 'bkash' && input.paymentId) {
    return executeBkashPayment(input.paymentId)
  }

  if (provider === 'sslcommerz' && input.tranId) {
    return querySslcommerzPayment(input.tranId)
  }

  return { ok: false as const, status: 'unknown' }
}

async function startBkashCheckout(input: {
  orderId: string
  amount: number
  customerPhone: string
}) {
  const token = await grantBkashToken()
  if (!token) {
    return { configured: true as const, ok: false as const, error: 'bKash token request failed.' }
  }

  const base = bkashBaseUrl()
  const response = await fetch(`${base}/tokenized/checkout/create`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: token,
      'x-app-key': env('BKASH_APP_KEY'),
    },
    body: JSON.stringify({
      mode: '0011',
      payerReference: input.customerPhone,
      callbackURL: getPrepaidCallbackUrl(),
      amount: input.amount.toFixed(2),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber: input.orderId.replace(/[^A-Za-z0-9]/g, '').slice(0, 20) || input.orderId.slice(0, 20),
    }),
  })

  const payload = await readJson(response) as { bkashURL?: string; paymentID?: string; statusCode?: string; statusMessage?: string }
  if (!response.ok || !payload.bkashURL || !payload.paymentID) {
    return { configured: true as const, ok: false as const, error: payload.statusMessage || 'bKash checkout could not start.' }
  }

  return {
    configured: true as const,
    ok: true as const,
    provider: 'bkash' as const,
    redirectUrl: payload.bkashURL,
    paymentId: payload.paymentID,
  }
}

async function executeBkashPayment(paymentId: string) {
  const token = await grantBkashToken()
  if (!token) {
    return { ok: false as const, status: 'token-failed' }
  }

  const response = await fetch(`${bkashBaseUrl()}/tokenized/checkout/execute`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: token,
      'x-app-key': env('BKASH_APP_KEY'),
    },
    body: JSON.stringify({ paymentID: paymentId }),
  })

  const payload = await readJson(response) as { transactionStatus?: string; trxID?: string }
  const paid = String(payload.transactionStatus ?? '').toLowerCase() === 'completed'
  return { ok: paid, status: payload.transactionStatus || 'failed', trxId: payload.trxID }
}

async function grantBkashToken() {
  const response = await fetch(`${bkashBaseUrl()}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      username: env('BKASH_USERNAME'),
      password: env('BKASH_PASSWORD'),
    },
    body: JSON.stringify({
      app_key: env('BKASH_APP_KEY'),
      app_secret: env('BKASH_APP_SECRET'),
    }),
  })

  const payload = await readJson(response) as { id_token?: string }
  return payload.id_token || null
}

function bkashBaseUrl() {
  return env('BKASH_BASE_URL') || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
}

async function startSslcommerzCheckout(input: {
  orderId: string
  amount: number
  customerName: string
  customerPhone: string
  customerEmail?: string
}) {
  const endpoint = env('SSLCOMMERZ_BASE_URL') || 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
  const successUrl = `${getPrepaidCallbackUrl()}?provider=sslcommerz&tran_id=${encodeURIComponent(input.orderId)}`
  const body = new URLSearchParams({
    store_id: env('SSLCOMMERZ_STORE_ID'),
    store_passwd: env('SSLCOMMERZ_STORE_PASSWORD'),
    total_amount: input.amount.toFixed(2),
    currency: 'BDT',
    tran_id: input.orderId,
    success_url: successUrl,
    fail_url: successUrl,
    cancel_url: successUrl,
    cus_name: input.customerName,
    cus_email: input.customerEmail || 'orders@shisfashion.com',
    cus_phone: input.customerPhone,
    cus_add1: 'Bangladesh',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    shipping_method: 'Courier',
    product_name: 'SHIS Fashion order',
    product_category: 'Fashion',
    product_profile: 'general',
  })

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  const payload = await readJson(response) as { GatewayPageURL?: string; status?: string }
  if (!payload.GatewayPageURL) {
    return { configured: true as const, ok: false as const, error: 'SSLCOMMERZ checkout could not start.' }
  }

  return {
    configured: true as const,
    ok: true as const,
    provider: 'sslcommerz' as const,
    redirectUrl: payload.GatewayPageURL,
    paymentId: input.orderId,
  }
}

async function querySslcommerzPayment(tranId: string) {
  const endpoint = env('SSLCOMMERZ_VALIDATION_URL')
    || 'https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php'
  const url = `${endpoint}?tran_id=${encodeURIComponent(tranId)}&store_id=${encodeURIComponent(env('SSLCOMMERZ_STORE_ID'))}&store_passwd=${encodeURIComponent(env('SSLCOMMERZ_STORE_PASSWORD'))}&format=json`
  const response = await fetch(url)
  const payload = await readJson(response) as { element?: Array<{ status?: string }> }
  const status = String(payload.element?.[0]?.status ?? '').toUpperCase()
  return { ok: status === 'VALID' || status === 'VALIDATED', status: status || 'failed' }
}

async function readJson(response: Response) {
  try {
    return await response.json() as Record<string, unknown>
  } catch {
    return {}
  }
}
