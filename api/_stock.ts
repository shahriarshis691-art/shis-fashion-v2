import type { Transaction, DocumentReference } from 'firebase-admin/firestore'
import { getAvailableStock, type CatalogVariant } from './_catalog.js'

export interface StockLineItem {
  productRef: DocumentReference
  quantity: number
  size?: string
  color?: string
  variantIndex: number
  variants: CatalogVariant[]
  stock: number
}

export function buildStockLineItem(
  productRef: DocumentReference,
  product: { stock?: unknown; variants?: unknown },
  quantity: number,
  size?: string,
  color?: string,
): StockLineItem {
  const available = getAvailableStock(product, size ?? '', color ?? '')
  return {
    productRef,
    quantity,
    size,
    color,
    variantIndex: available.variantIndex,
    variants: available.variants,
    stock: available.stock,
  }
}

export function applyStockDecrement(transaction: Transaction, item: StockLineItem) {
  if (item.variantIndex >= 0) {
    const nextVariants = item.variants.map((variant, index) => (
      index === item.variantIndex
        ? { ...variant, stock: Math.max(0, variant.stock - item.quantity) }
        : variant
    ))
    const totalStock = nextVariants.reduce((sum, variant) => sum + variant.stock, 0)
    transaction.update(item.productRef, { variants: nextVariants, stock: totalStock })
    return
  }

  transaction.update(item.productRef, { stock: Math.max(0, item.stock - item.quantity) })
}

export function applyStockRestore(transaction: Transaction, item: StockLineItem) {
  if (item.variantIndex >= 0) {
    const nextVariants = item.variants.map((variant, index) => (
      index === item.variantIndex
        ? { ...variant, stock: variant.stock + item.quantity }
        : variant
    ))
    const totalStock = nextVariants.reduce((sum, variant) => sum + variant.stock, 0)
    transaction.update(item.productRef, { variants: nextVariants, stock: totalStock })
    return
  }

  transaction.update(item.productRef, { stock: item.stock + item.quantity })
}
