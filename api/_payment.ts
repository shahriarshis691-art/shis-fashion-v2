export const PAYMENT_METHOD_COD = 'Cash on Delivery'
export const PAYMENT_METHOD_BKASH_API = 'bKash'
export const PAYMENT_METHOD_BKASH_MANUAL = 'bKash Send Money'
export const PAYMENT_METHOD_NAGAD_MANUAL = 'Nagad Send Money'

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

export function resolvePaymentStatus(input: {
  isApiPrepaid: boolean
  isManualWallet: boolean
}) {
  if (input.isApiPrepaid) {
    return 'pending' as const
  }

  if (input.isManualWallet) {
    return 'pending_verification' as const
  }

  return 'unpaid' as const
}
