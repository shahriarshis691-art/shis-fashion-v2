export const COUPON_CODE_PATTERN = /^[A-Z][A-Z0-9]{2,11}(?:-[A-Z0-9]{2,14}){0,2}$/

export type CouponDiscountType = 'percent' | 'fixed'

export interface CouponQuoteItem {
  category?: string
  price: number
  quantity: number
}

export interface CouponRules {
  discountType?: CouponDiscountType
  discountPercent?: number
  discountFixedBdt?: number
  minSpend?: number
  applicableCategories?: string[]
  customerEmail?: string
  expiryDate?: string
  status?: string
  usageCount?: number
  maxUsage?: number
}

export interface CouponQuote {
  ok: boolean
  amount: number
  eligibleSubtotal: number
  error?: string
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase()
}

export function isValidCouponCode(code: string) {
  return COUPON_CODE_PATTERN.test(normalizeCouponCode(code))
}

export function isCouponExpired(expiryDate: string) {
  const parsed = new Date(expiryDate)
  return Number.isNaN(parsed.getTime()) || parsed <= new Date()
}

export function normalizeCouponCategories(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[]
  }

  const seen = new Set<string>()
  return value
    .map((entry) => String(entry ?? '').trim().toLowerCase())
    .filter((entry) => {
      if (!entry || seen.has(entry)) {
        return false
      }
      seen.add(entry)
      return true
    })
}

export function resolveCouponDiscountType(value: unknown): CouponDiscountType {
  return value === 'fixed' ? 'fixed' : 'percent'
}

export function eligibleCouponSubtotal(items: CouponQuoteItem[], categories?: string[]) {
  const allowed = normalizeCouponCategories(categories)
  return items.reduce((sum, item) => {
    const qty = Math.max(0, item.quantity)
    const price = Number.isFinite(item.price) ? item.price : 0
    if (qty <= 0 || price <= 0) {
      return sum
    }

    if (allowed.length) {
      const category = String(item.category ?? '').trim().toLowerCase()
      if (!allowed.includes(category)) {
        return sum
      }
    }

    return sum + price * qty
  }, 0)
}

export function quoteCouponDiscount(rules: CouponRules, items: CouponQuoteItem[]): CouponQuote {
  const eligible = Math.round(eligibleCouponSubtotal(items, rules.applicableCategories) * 100) / 100
  const minSpend = Math.max(0, Math.round(Number(rules.minSpend ?? 0) || 0))
  const categories = normalizeCouponCategories(rules.applicableCategories)

  if (categories.length && eligible <= 0) {
    return {
      ok: false,
      amount: 0,
      eligibleSubtotal: eligible,
      error: 'This coupon does not apply to items in your cart.',
    }
  }

  if (minSpend > 0 && eligible < minSpend) {
    return {
      ok: false,
      amount: 0,
      eligibleSubtotal: eligible,
      error: `Spend ৳ ${minSpend.toLocaleString('en-BD')} on eligible items to use this code.`,
    }
  }

  const type = resolveCouponDiscountType(rules.discountType)
  const rawAmount = type === 'fixed'
    ? Math.min(Math.max(0, Number(rules.discountFixedBdt ?? 0) || 0), eligible)
    : eligible * Math.min(100, Math.max(0, Number(rules.discountPercent ?? 0) || 0)) / 100
  const amount = Math.round(rawAmount * 100) / 100
  if (amount <= 0) {
    return {
      ok: false,
      amount: 0,
      eligibleSubtotal: eligible,
      error: 'This coupon has no discount for the current cart.',
    }
  }

  return { ok: true, amount, eligibleSubtotal: eligible }
}

export function assertCouponRedeemable(coupon: CouponRules, email = '') {
  if (coupon.status !== 'active') {
    return 'This coupon is no longer active.'
  }

  if (isCouponExpired(String(coupon.expiryDate ?? ''))) {
    return 'This coupon has expired.'
  }

  const usageCount = Number(coupon.usageCount ?? 0)
  const maxUsage = Math.max(1, Number(coupon.maxUsage ?? 1) || 1)
  if (usageCount >= maxUsage) {
    return 'This coupon has already been used.'
  }

  const boundEmail = String(coupon.customerEmail ?? '').trim().toLowerCase()
  const providedEmail = email.trim().toLowerCase()
  if (boundEmail) {
    if (!providedEmail) {
      return 'Enter the email this coupon was issued to.'
    }

    if (boundEmail !== providedEmail) {
      return 'This coupon is not valid for this email.'
    }
  }

  return ''
}

export function nextCouponUsage(usageCount: number, maxUsage: number) {
  const nextUsage = Math.max(0, usageCount) + 1
  const limit = Math.max(1, maxUsage)
  return {
    usageCount: nextUsage,
    status: (nextUsage >= limit ? 'used' : 'active') as 'used' | 'active',
  }
}

export function publicCouponPayload(id: string, coupon: CouponRules & { code?: string }) {
  return {
    id,
    code: String(coupon.code ?? ''),
    discountType: resolveCouponDiscountType(coupon.discountType),
    discountPercent: Math.min(100, Math.max(0, Number(coupon.discountPercent ?? 0) || 0)),
    discountFixedBdt: Math.max(0, Math.round(Number(coupon.discountFixedBdt ?? 0) || 0)),
    minSpend: Math.max(0, Math.round(Number(coupon.minSpend ?? 0) || 0)),
    applicableCategories: normalizeCouponCategories(coupon.applicableCategories),
    expiryDate: String(coupon.expiryDate ?? ''),
    status: coupon.status,
    usageCount: Number(coupon.usageCount ?? 0),
    maxUsage: Math.max(1, Number(coupon.maxUsage ?? 1) || 1),
  }
}
