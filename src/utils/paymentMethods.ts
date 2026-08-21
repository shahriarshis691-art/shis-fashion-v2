export const PAYMENT_METHOD_COD = 'Cash on Delivery'
export const PAYMENT_METHOD_BKASH_API = 'bKash'
export const PAYMENT_METHOD_BKASH_MANUAL = 'bKash Send Money'
export const PAYMENT_METHOD_NAGAD_MANUAL = 'Nagad Send Money'

const DEFAULT_BKASH_MERCHANT = '01887848304'
const DEFAULT_NAGAD_MERCHANT = '01979614216'

function normalizeMerchantDigits(raw: string, fallback: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8801') && digits.length === 13) {
    return `0${digits.slice(3)}`
  }

  if (digits.startsWith('01') && digits.length === 11) {
    return digits
  }

  const fallbackDigits = fallback.replace(/\D/g, '')
  return fallbackDigits.startsWith('01') && fallbackDigits.length === 11 ? fallbackDigits : fallback
}

export function isMobileWalletPaymentsEnabled() {
  return String(import.meta.env.VITE_MOBILE_WALLET_PAYMENTS_ENABLED ?? 'true').trim().toLowerCase() === 'true'
}

export function isPrepaidCheckoutEnabled() {
  return String(import.meta.env.VITE_PREPAID_ENABLED ?? 'false').trim().toLowerCase() === 'true'
}

export function getBkashMerchantNumber() {
  return normalizeMerchantDigits(
    String(import.meta.env.VITE_BKASH_MERCHANT_NUMBER ?? DEFAULT_BKASH_MERCHANT),
    DEFAULT_BKASH_MERCHANT,
  )
}

export function getNagadMerchantNumber() {
  return normalizeMerchantDigits(
    String(import.meta.env.VITE_NAGAD_MERCHANT_NUMBER ?? DEFAULT_NAGAD_MERCHANT),
    DEFAULT_NAGAD_MERCHANT,
  )
}

export function getMerchantNumberForMethod(method: string) {
  if (method === PAYMENT_METHOD_BKASH_MANUAL) {
    return getBkashMerchantNumber()
  }

  if (method === PAYMENT_METHOD_NAGAD_MANUAL) {
    return getNagadMerchantNumber()
  }

  return ''
}

export function isManualWalletPayment(method: string) {
  return method === PAYMENT_METHOD_BKASH_MANUAL || method === PAYMENT_METHOD_NAGAD_MANUAL
}

export function isApiPrepaidPayment(method: string) {
  const normalized = method.trim()
  return normalized === PAYMENT_METHOD_BKASH_API || /sslcommerz/i.test(normalized)
}

export function isValidWalletTransactionId(value: string) {
  return /^[A-Z0-9]{6,20}$/i.test(value.trim())
}

export function normalizeWalletTransactionId(value: string) {
  return value.trim().toUpperCase()
}

export function formatWalletDialNumber(number: string) {
  const digits = number.replace(/\D/g, '')
  if (digits.startsWith('01') && digits.length === 11) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
  }

  return number
}

export interface CheckoutPaymentConfig {
  cod: boolean
  mobileWallet: boolean
  bkashManual: boolean
  nagadManual: boolean
  prepaidCheckoutEnabled: boolean
  bkashOnline: boolean
  sslcommerz: boolean
  bkashMerchantNumber: string
  nagadMerchantNumber: string
  configured?: boolean
  provider?: string | null
}

export function getDefaultCheckoutPaymentConfig(): CheckoutPaymentConfig {
  const mobileWallet = isMobileWalletPaymentsEnabled()
  const prepaidCheckoutEnabled = isPrepaidCheckoutEnabled()

  return {
    cod: true,
    mobileWallet,
    bkashManual: mobileWallet,
    nagadManual: mobileWallet,
    prepaidCheckoutEnabled,
    bkashOnline: false,
    sslcommerz: false,
    bkashMerchantNumber: getBkashMerchantNumber(),
    nagadMerchantNumber: getNagadMerchantNumber(),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseCheckoutPaymentConfig(payload: unknown): CheckoutPaymentConfig | null {
  if (!isRecord(payload)) {
    return null
  }

  const defaults = getDefaultCheckoutPaymentConfig()
  const mobileWallet = payload.mobileWallet !== false
  const bkashManual = mobileWallet && payload.bkashManual !== false
  const nagadManual = mobileWallet && payload.nagadManual !== false

  return {
    cod: payload.cod !== false,
    mobileWallet,
    bkashManual,
    nagadManual,
    prepaidCheckoutEnabled: payload.prepaidCheckoutEnabled === true,
    bkashOnline: payload.bkashOnline === true,
    sslcommerz: payload.sslcommerz === true,
    bkashMerchantNumber: typeof payload.bkashMerchantNumber === 'string' && payload.bkashMerchantNumber
      ? payload.bkashMerchantNumber
      : defaults.bkashMerchantNumber,
    nagadMerchantNumber: typeof payload.nagadMerchantNumber === 'string' && payload.nagadMerchantNumber
      ? payload.nagadMerchantNumber
      : defaults.nagadMerchantNumber,
    configured: typeof payload.configured === 'boolean' ? payload.configured : undefined,
    provider: typeof payload.provider === 'string' ? payload.provider : payload.provider === null ? null : undefined,
  }
}
