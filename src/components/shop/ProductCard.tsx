import { memo } from 'react'
import type { ShopProduct } from '../../data/shopData'
import AarongProductCard from './AarongProductCard'

interface ProductCardProps {
  product: ShopProduct
  onToggleWishlist?: (product: ShopProduct) => void
  isInWishlist?: boolean
  onProductClick?: (product: ShopProduct) => void
  priority?: boolean
  href?: string
  prefetchModule?: () => Promise<unknown>
  variant?: 'default' | 'studio'
}

/**
 * Storefront listing card — thin wrapper around the universal Aarong card
 * so existing Shop / Sale / Home / Collection imports stay stable.
 */
const ProductCard = memo(function ProductCard({
  product,
  onToggleWishlist,
  isInWishlist,
  onProductClick,
  priority,
  href,
  prefetchModule,
  variant = 'default',
}: ProductCardProps) {
  const detailHref = href ?? (/half-shirt|oversized-tee|unisex-tee|western/i.test(product.category) ? `/product/${product.slug}` : undefined)

  return (
    <AarongProductCard
      product={product}
      href={detailHref}
      prefetchModule={prefetchModule}
      priority={priority}
      variant={variant}
      isInWishlist={isInWishlist}
      onToggleWishlist={onToggleWishlist ? (item) => onToggleWishlist(item as ShopProduct) : undefined}
      onProductClick={onProductClick ? (item) => onProductClick(item as ShopProduct) : undefined}
    />
  )
})

export default ProductCard
