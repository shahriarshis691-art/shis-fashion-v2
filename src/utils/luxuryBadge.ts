import { parseBDT } from './currency'

/** Ceiling used by kurti / shop price-range filters (BDT). */
export const LUXURY_PRICE_FILTER_MAX = 30_000

/** Suggested step for price-range sliders on the luxury scale. */
export const LUXURY_PRICE_FILTER_STEP = 500

export type LuxuryBadgeLabel = 'Luxury' | 'Exclusive' | 'Designer Edition'

/**
 * Assign storefront badges for high-end pieces above ৳15,000.
 * - ৳15,001–৳17,999 → Luxury
 * - ৳18,000–৳24,999 → Exclusive
 * - ৳25,000+ → Designer Edition
 */
export function getLuxuryBadgeForPrice(price: string | number): LuxuryBadgeLabel | null {
  const amount = parseBDT(price)
  if (!Number.isFinite(amount) || amount <= 15_000) {
    return null
  }
  if (amount >= 25_000) {
    return 'Designer Edition'
  }
  if (amount >= 18_000) {
    return 'Exclusive'
  }
  return 'Luxury'
}
