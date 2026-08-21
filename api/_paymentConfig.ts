import { getPrepaidPublicConfig } from './_prepaidProvider.js'

const DEFAULT_BKASH_MERCHANT = '01887848304'
const DEFAULT_NAGAD_MERCHANT = '01979614216'

function envValue(name: string) {
  return String(process.env[name] ?? '').trim()
}

function envTruthy(name: string, defaultValue: 'true' | 'false') {
  const raw = envValue(name)
  const value = raw || defaultValue
  return value.toLowerCase() === 'true'
}

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

export function getCheckoutPaymentConfig() {
  const mobileWallet = envTruthy('VITE_MOBILE_WALLET_PAYMENTS_ENABLED', 'true')
  const prepaidCheckoutEnabled = envTruthy('VITE_PREPAID_ENABLED', 'false')
  const prepaid = getPrepaidPublicConfig()

  return {
    cod: true,
    mobileWallet,
    bkashManual: mobileWallet,
    nagadManual: mobileWallet,
    prepaidCheckoutEnabled,
    bkashOnline: prepaidCheckoutEnabled && prepaid.bkashOnline,
    sslcommerz: prepaidCheckoutEnabled && prepaid.sslcommerz,
    bkashMerchantNumber: normalizeMerchantDigits(
      envValue('VITE_BKASH_MERCHANT_NUMBER') || DEFAULT_BKASH_MERCHANT,
      DEFAULT_BKASH_MERCHANT,
    ),
    nagadMerchantNumber: normalizeMerchantDigits(
      envValue('VITE_NAGAD_MERCHANT_NUMBER') || DEFAULT_NAGAD_MERCHANT,
      DEFAULT_NAGAD_MERCHANT,
    ),
    configured: prepaid.configured,
    provider: prepaid.provider,
  }
}

export type CheckoutPaymentConfig = ReturnType<typeof getCheckoutPaymentConfig>
