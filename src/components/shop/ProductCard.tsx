import { motion } from 'framer-motion'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { ShopProduct } from '../../data/shopData'
import { isDemoImageUrl, normalizeCatalogImageUrl } from '../../utils/media'

interface ProductCardProps {
  product: ShopProduct
  onToggleWishlist?: (product: ShopProduct) => void
  isInWishlist?: boolean
  onProductClick?: (product: ShopProduct) => void
}

const IMAGE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"%3E%3Crect width="1200" height="1200" fill="%23f8f5ed"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="%23c9a227"%3ESHIS Fashion%3C/text%3E%3C/svg%3E'

function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.src = IMAGE_PLACEHOLDER
}

const ProductCard = memo(function ProductCard({ product, onToggleWishlist, isInWishlist, onProductClick }: ProductCardProps) {
  const imageSrc = normalizeCatalogImageUrl(product.image, 960, 1200) || IMAGE_PLACEHOLDER
  const imageToneClass = isDemoImageUrl(imageSrc) ? 'shis-media-tone' : ''
  const isSoldOut = (product.stock ?? 0) <= 0

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.2 }}
      className="product-card min-w-0"
    >
      <Link to={`/shop/${product.category}/${product.slug}`} className="group block" onClick={() => onProductClick?.(product)}>
        <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className={`h-full w-full object-cover object-center ${imageToneClass}`}
            fetchPriority="low"
            sizes="(max-width: 419px) 50vw, (max-width: 1023px) 33vw, 25vw"
          />
          {onToggleWishlist ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onToggleWishlist(product)
              }}
              className="absolute right-2 top-2 border border-black/15 bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-black hover:bg-white"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isInWishlist ? '♥' : '♡'}
            </button>
          ) : null}
        </div>
        {isSoldOut ? (
          <p className="mt-2 text-center text-caption font-semibold uppercase tracking-[0.12em] text-black">
            Sold out
          </p>
        ) : null}
        <div className={`product-card-meta ${isSoldOut ? 'pt-1.5' : 'pt-2'}`}>
          <h3 className="line-clamp-1 text-sm font-medium text-black">{product.name}</h3>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-sm font-semibold text-black">{product.price}</p>
            {product.comparePrice ? (
              <p className="text-xs text-black/50 line-through">{product.comparePrice}</p>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.article>
  )
})

export default ProductCard
