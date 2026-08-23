import { createHash } from 'node:crypto'

export type PrepaidProvider = 'bkash' | 'sslcommerz'

function env(name: string) {
  return process.env[name] ?? ''
}

function isProductionRuntime() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

function isSandboxPaymentEndpoint(provider: PrepaidProvider) {
  if (provider === 'bkash') {
    const base = env('BKASH_BASE_URL') || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
    return /sandbox|tokenized\.sandbox/i.test(base)
  }

  const sslBase = env('SSLCOMMERZ_BASE_URL') || 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
  const sslValidation = env('SSLCOMMERZ_VALIDATION_URL')
    || 'https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php'

  return /sandbox/i.test(sslBase) || /sandbox/i.test(sslValidation)
}

export function getConfiguredPrepaidProvider(): PrepaidProvider | null {
  let provider: PrepaidProvider | null = null

  if (env('BKASH_APP_KEY') && env('BKASH_APP_SECRET') && env('BKASH_USERNAME') && env('BKASH_PASSWORD')) {
    provider = 'bkash'
  } else if (env('SSLCOMMERZ_STORE_ID') && env('SSLCOMMERZ_STORE_PASSWORD')) {
    provider = 'sslcommerz'
  }

  if (!provider) {
    return null
  }

  if (isProductionRuntime() && isSandboxPaymentEndpoint(provider)) {
    console.error(`[prepaid] Refusing ${provider} sandbox endpoints in production. Set live BKASH_BASE_URL / SSLCOMMERZ_BASE_URL.`)
    return null
  }

  return provider
}

export function getPrepaidCallbackUrl() {
  return env('PREPAID_CALLBACK_URL') || `${env('VITE_SITE_URL') || 'https://www.shisfashion.com'}/api/prepaid-callback`
}

export function getSslcommerzIpnUrl() {
  return env('SSLCOMMERZ_IPN_URL') || `${env('VITE_SITE_URL') || 'https://www.shisfashion.com'}/api/sslcommerz-ipn`
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

export type PrepaidOutcome = 'paid' | 'failed' | 'pending'

export interface PrepaidVerification {
  provider: PrepaidProvider | ''
  /** `pending` means "not proven either way" — never settle an order on it. */
  outcome: PrepaidOutcome
  status: string
  amount: number
  trxId?: string
  valId?: string
  tranId?: string
  storeId?: string
}

/**
 * Statuses that providers only return once a payment can no longer succeed.
 * Anything outside this set (including our own internal `token-failed` marker)
 * is treated as `pending` so a transient provider error can never cancel a
 * customer's order.
 */
const TERMINAL_FAILURE_STATUSES = new Set([
  'FAILED',
  'FAILURE',
  'CANCEL',
  'CANCELED',
  'CANCELLED',
  'EXPIRED',
  'UNATTEMPTED',
  'DECLINED',
  'INVALID',
  'INVALID_TRANSACTION',
])

export function classifyPrepaidStatus(status: string, ok: boolean): PrepaidOutcome {
  if (ok) {
    return 'paid'
  }

  const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, '_')
  if (!normalized) {
    return 'pending'
  }

  return TERMINAL_FAILURE_STATUSES.has(normalized) ? 'failed' : 'pending'
}

export function getExpectedSslcommerzStoreId() {
  return env('SSLCOMMERZ_STORE_ID')
}

function resolveProvider(requested?: string): PrepaidProvider | '' {
  const normalized = String(requested ?? '').trim().toLowerCase()
  if (normalized === 'bkash' || normalized === 'sslcommerz') {
    return normalized
  }

  return getConfiguredPrepaidProvider() ?? ''
}

/**
 * Server-to-server verification of a gateway return. The browser-supplied
 * status is never trusted: the outcome always comes from the provider API.
 * For SSLCommerz the `val_id` validation endpoint is preferred because it also
 * returns `store_id` and `tran_id` for cross-checking.
 */
export async function verifyPrepaidReturn(input: {
  provider?: string
  paymentId?: string
  tranId?: string
  valId?: string
}): Promise<PrepaidVerification> {
  const provider = resolveProvider(input.provider)

  if (provider === 'bkash' && input.paymentId) {
    const result = await verifyBkashPayment(input.paymentId)
    const status = String(result.status ?? '')
    return {
      provider,
      outcome: classifyPrepaidStatus(status, result.ok),
      status: status || 'unknown',
      amount: Number(result.amount),
      trxId: result.trxId,
    }
  }

  if (provider === 'sslcommerz') {
    if (input.valId) {
      const validated = await validateSslcommerzByValId(input.valId)
      return {
        provider,
        outcome: classifyPrepaidStatus(validated.status, validated.ok),
        status: validated.status || 'unknown',
        amount: Number('amount' in validated ? validated.amount : Number.NaN),
        trxId: 'trxId' in validated ? validated.trxId : undefined,
        valId: 'valId' in validated ? validated.valId : input.valId,
        tranId: 'tranId' in validated ? validated.tranId : undefined,
        storeId: 'storeId' in validated ? validated.storeId : undefined,
      }
    }

    if (input.tranId) {
      const queried = await querySslcommerzPayment(input.tranId)
      return {
        provider,
        outcome: classifyPrepaidStatus(queried.status, queried.ok),
        status: queried.status || 'unknown',
        amount: Number(queried.amount),
        trxId: queried.trxId,
        valId: queried.valId,
        tranId: queried.tranId,
      }
    }
  }

  return { provider, outcome: 'pending', status: 'unknown', amount: Number.NaN }
}

export function getPrepaidPublicConfig() {
  const provider = getConfiguredPrepaidProvider()
  return {
    configured: Boolean(provider),
    provider,
    bkashOnline: provider === 'bkash',
    sslcommerz: provider === 'sslcommerz',
  }
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

  const payload = await readJson(response) as { transactionStatus?: string; trxID?: string; amount?: string }
  const paid = String(payload.transactionStatus ?? '').toLowerCase() === 'completed'
  return {
    ok: paid,
    status: payload.transactionStatus || 'failed',
    trxId: payload.trxID,
    amount: Number.parseFloat(String(payload.amount ?? '')),
  }
}

async function queryBkashPayment(paymentId: string) {
  const token = await grantBkashToken()
  if (!token) {
    return { ok: false as const, status: 'token-failed' }
  }

  const response = await fetch(`${bkashBaseUrl()}/tokenized/checkout/payment/status`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: token,
      'x-app-key': env('BKASH_APP_KEY'),
    },
    body: JSON.stringify({ paymentID: paymentId }),
  })

  const payload = await readJson(response) as { transactionStatus?: string; trxID?: string; amount?: string }
  const status = String(payload.transactionStatus ?? '').toLowerCase()
  return {
    ok: status === 'completed',
    status: payload.transactionStatus || 'unknown',
    trxId: payload.trxID,
    amount: Number.parseFloat(String(payload.amount ?? '')),
  }
}

export async function verifyBkashPayment(paymentId: string) {
  const queried = await queryBkashPayment(paymentId)
  if (queried.ok) {
    return queried
  }

  const status = String(queried.status ?? '').toLowerCase()
  if (status === 'initiated' || status === 'unknown' || status === 'token-failed') {
    const executed = await executeBkashPayment(paymentId)
    if (executed.ok) {
      return executed
    }

    const retry = await queryBkashPayment(paymentId)
    if (retry.ok) {
      return retry
    }

    return executed.ok ? executed : { ...queried, ok: false as const }
  }

  return queried
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
    ipn_url: getSslcommerzIpnUrl(),
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
  const payload = await readJson(response) as { element?: Array<{ status?: string; val_id?: string; amount?: string; bank_tran_id?: string; tran_id?: string }> }
  const row = payload.element?.[0]
  const status = String(row?.status ?? '').toUpperCase()
  return {
    ok: status === 'VALID' || status === 'VALIDATED',
    status: status || 'failed',
    valId: row?.val_id,
    trxId: row?.bank_tran_id,
    amount: Number.parseFloat(String(row?.amount ?? '')),
    tranId: row?.tran_id || tranId,
  }
}

function sslcommerzValIdUrl() {
  const explicit = env('SSLCOMMERZ_VAL_ID_URL')
  if (explicit) {
    return explicit
  }

  const validation = env('SSLCOMMERZ_VALIDATION_URL')
  if (validation.includes('merchantTransIDvalidationAPI.php')) {
    return validation.replace('merchantTransIDvalidationAPI.php', 'validationserverAPI.php')
  }

  if (/sandbox/i.test(validation) || !validation) {
    return 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
  }

  return 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
}

export async function validateSslcommerzByValId(valId: string) {
  const trimmed = valId.trim()
  if (!trimmed) {
    return { ok: false as const, status: 'missing-val-id' }
  }

  const endpoint = sslcommerzValIdUrl()
  const url = `${endpoint}?val_id=${encodeURIComponent(trimmed)}&store_id=${encodeURIComponent(env('SSLCOMMERZ_STORE_ID'))}&store_passwd=${encodeURIComponent(env('SSLCOMMERZ_STORE_PASSWORD'))}&format=json`
  const response = await fetch(url)
  const payload = await readJson(response) as {
    status?: string
    tran_id?: string
    amount?: string
    currency_amount?: string
    bank_tran_id?: string
    val_id?: string
    store_id?: string
  }
  const status = String(payload.status ?? '').toUpperCase()
  return {
    ok: status === 'VALID' || status === 'VALIDATED',
    status: status || 'failed',
    valId: payload.val_id || trimmed,
    trxId: payload.bank_tran_id,
    amount: Number.parseFloat(String(payload.currency_amount || payload.amount || '')),
    tranId: payload.tran_id,
    storeId: payload.store_id,
  }
}

export function verifySslcommerzIpnHash(fields: Record<string, string>) {
  const verifySign = fields.verify_sign?.trim().toLowerCase()
  const verifyKey = fields.verify_key?.trim()
  const storePasswd = env('SSLCOMMERZ_STORE_PASSWORD')
  if (!verifySign || !verifyKey || !storePasswd) {
    return false
  }

  const keys = verifyKey.split(',').map((key) => key.trim()).filter(Boolean)
  const hashed: Record<string, string> = {}
  for (const key of keys) {
    if (key in fields) {
      hashed[key] = fields[key]
    }
  }
  hashed.store_passwd = md5Hex(storePasswd)

  const sortedKeys = Object.keys(hashed).sort()
  const hashString = sortedKeys.map((key) => `${key}=${hashed[key]}`).join('&')
  return md5Hex(hashString) === verifySign
}

function md5Hex(value: string) {
  return createHash('md5').update(value).digest('hex')
}

async function readJson(response: Response) {
  try {
    return await response.json() as Record<string, unknown>
  } catch {
    return {}
  }
}
