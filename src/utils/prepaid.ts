export const PAYMENT_METHOD_BKASH = 'bKash'

export function isPrepaidCheckoutEnabled() {
  return (import.meta.env.VITE_PREPAID_ENABLED ?? 'false') === 'true'
}
