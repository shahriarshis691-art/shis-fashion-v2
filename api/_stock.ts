import type { DocumentReference, Transaction } from 'firebase-admin/firestore'
import { getAvailableStock, normalizeVariants, type CatalogVariant } from './_catalog.js'

/**
 * Variant-level stock engine.
 *
 * Every reservation and release is applied to a single in-memory working copy
 * per product, then written back once. That is what makes multiple cart lines
 * of the same product safe: two lines (for example size M and size L of one
 * tee) accumulate on the same `variants` array instead of each writing a full
 * array derived from the same pre-transaction snapshot, which previously let
 * the second write silently erase the first decrement and oversell.
 *
 * Stock is always evaluated at the `size` x `color` variant level whenever the
 * product has variants configured. The top-level `stock` field is treated as a
 * derived total in that case, never as the source of truth.
 */

export interface StockRequest {
  ref: DocumentReference | null | undefined
  quantity: number
  size?: string
  color?: string
  /** Customer-facing product name; used only to build error messages. */
  label?: string
}

export type StockFailureReason = 'missing-product' | 'unknown-variant' | 'insufficient-stock'

export interface StockFailure {
  reason: StockFailureReason
  label: string
  size: string
  color: string
  requested: number
  available: number
}

interface WorkingProduct {
  ref: DocumentReference
  variants: CatalogVariant[]
  stock: number
  variantsConfigured: boolean
  archived: boolean
  touched: boolean
}

export type StockWorkingSet = Map<string, WorkingProduct>

function toQuantity(value: unknown) {
  const parsed = Math.floor(Number(value ?? 0))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function resolvedTotal(product: WorkingProduct) {
  if (product.variantsConfigured) {
    return product.variants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0)
  }

  return Math.max(0, product.stock)
}

export function describeVariant(size?: string, color?: string) {
  return [size, color]
    .map((part) => String(part ?? '').trim())
    .filter((part) => part && part !== 'Default')
    .join(' / ')
}

/** Turns a structured failure into a message that is safe to show a shopper. */
export function formatStockFailure(failure: StockFailure) {
  const name = failure.label || 'A product in your bag'
  const variant = describeVariant(failure.size, failure.color)
  const subject = variant ? `${name} (${variant})` : name

  if (failure.reason === 'missing-product') {
    return `${subject} is no longer available. Remove it from your bag and try again.`
  }

  if (failure.reason === 'unknown-variant') {
    return `${subject} is no longer offered. Please choose a different size or colour.`
  }

  if (failure.available <= 0) {
    return `${subject} just sold out. Please choose a different size or colour.`
  }

  return `Only ${failure.available} left of ${subject}. Please reduce the quantity and try again.`
}

export interface StockProductSnapshot {
  ref: DocumentReference
  exists: boolean
  data: { stock?: unknown; variants?: unknown; archived?: boolean } | undefined
}

/**
 * Builds a working set from documents the caller already read inside its
 * transaction, so no product is fetched twice. Products that no longer exist
 * are omitted so `reserveStock` can report `missing-product`.
 */
export function buildStockWorkingSet(products: StockProductSnapshot[]): StockWorkingSet {
  const working: StockWorkingSet = new Map()

  for (const product of products) {
    if (!product.ref || !product.exists || working.has(product.ref.path)) {
      continue
    }

    const data = product.data ?? {}
    const variants = normalizeVariants(data.variants)

    working.set(product.ref.path, {
      ref: product.ref,
      variants,
      stock: variants.length
        ? variants.reduce((sum, variant) => sum + variant.stock, 0)
        : Math.max(0, Math.floor(Number(data.stock ?? 0)) || 0),
      variantsConfigured: variants.length > 0,
      archived: data.archived === true,
      touched: false,
    })
  }

  return working
}

/** Reads every distinct product once inside the transaction. */
export async function readStockWorkingSet(
  transaction: Transaction,
  refs: Array<DocumentReference | null | undefined>,
): Promise<StockWorkingSet> {
  const seen = new Set<string>()
  const snapshots: StockProductSnapshot[] = []

  for (const ref of refs) {
    if (!ref || seen.has(ref.path)) {
      continue
    }

    seen.add(ref.path)
    const snapshot = await transaction.get(ref)
    snapshots.push({ ref, exists: snapshot.exists, data: snapshot.data() as StockProductSnapshot['data'] })
  }

  return buildStockWorkingSet(snapshots)
}

/** Current availability for a variant without mutating the working set. */
export function peekAvailableStock(
  working: StockWorkingSet,
  request: Pick<StockRequest, 'ref' | 'size' | 'color'>,
) {
  if (!request.ref) {
    return 0
  }

  const product = working.get(request.ref.path)
  if (!product) {
    return 0
  }

  const available = getAvailableStock(
    { stock: product.stock, variants: product.variants },
    String(request.size ?? ''),
    String(request.color ?? ''),
  )

  return Math.max(0, available.stock)
}

/**
 * Reserves one cart line against the working set.
 * Returns `null` on success, or a structured failure the caller can surface.
 */
export function reserveStock(working: StockWorkingSet, request: StockRequest): StockFailure | null {
  const quantity = toQuantity(request.quantity)
  const size = String(request.size ?? '').trim()
  const color = String(request.color ?? '').trim()
  const base = {
    label: String(request.label ?? '').trim(),
    size,
    color,
    requested: quantity,
  }

  if (!request.ref) {
    return { ...base, reason: 'missing-product', available: 0 }
  }

  const product = working.get(request.ref.path)
  if (!product || product.archived) {
    return { ...base, reason: 'missing-product', available: 0 }
  }

  if (quantity <= 0) {
    return { ...base, reason: 'insufficient-stock', available: peekAvailableStock(working, request) }
  }

  const available = getAvailableStock(
    { stock: product.stock, variants: product.variants },
    size,
    color,
  )

  if (product.variantsConfigured && available.variantIndex < 0) {
    return { ...base, reason: 'unknown-variant', available: 0 }
  }

  if (available.stock < quantity) {
    return { ...base, reason: 'insufficient-stock', available: Math.max(0, available.stock) }
  }

  if (available.variantIndex >= 0) {
    product.variants = product.variants.map((variant, index) => (
      index === available.variantIndex
        ? { ...variant, stock: Math.max(0, variant.stock - quantity) }
        : variant
    ))
  } else {
    product.stock = Math.max(0, product.stock - quantity)
  }

  product.stock = resolvedTotal(product)
  product.touched = true
  return null
}

/** Returns previously reserved units for one cart line (cancellations, failed prepaid). */
export function releaseStock(working: StockWorkingSet, request: StockRequest) {
  const quantity = toQuantity(request.quantity)
  if (!request.ref || quantity <= 0) {
    return
  }

  const product = working.get(request.ref.path)
  if (!product) {
    return
  }

  const available = getAvailableStock(
    { stock: product.stock, variants: product.variants },
    String(request.size ?? ''),
    String(request.color ?? ''),
  )

  if (available.variantIndex >= 0) {
    product.variants = product.variants.map((variant, index) => (
      index === available.variantIndex
        ? { ...variant, stock: variant.stock + quantity }
        : variant
    ))
  } else {
    product.stock += quantity
  }

  product.stock = resolvedTotal(product)
  product.touched = true
}

/** Writes one update per mutated product. Untouched products are skipped. */
export function commitStockWorkingSet(transaction: Transaction, working: StockWorkingSet) {
  for (const product of working.values()) {
    if (!product.touched) {
      continue
    }

    if (product.variantsConfigured) {
      transaction.update(product.ref, {
        variants: product.variants,
        stock: resolvedTotal(product),
      })
      continue
    }

    transaction.update(product.ref, { stock: resolvedTotal(product) })
  }
}
