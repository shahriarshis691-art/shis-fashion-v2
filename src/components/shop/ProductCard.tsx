import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { ShopProduct } from '../../data/shopData'
import { isDemoImageUrl } from '../../utils/media'
import LuxuryImage from '../common/LuxuryImage'

interface ProductCardProps {
  product: ShopProduct
  onToggleWishlist?: (product: ShopProduct) => void
  isInWishlist?: boolean
  onProductClick?: (product: ShopProduct) => void
}

const ProductCard = memo(function ProductCard({ product, onToggleWishlist, isInWishlist, onProductClick }: ProductCardProps) {
  const imageToneClass = isDemoImageUrl(product.image) ? 'shis-media-tone' : ''
  const isSoldOut = (product.stock ?? 0) <= 0

  return (
    <article className="product-card luxury-tap min-w-0">
      <Link to={`/shop/${product.category}/${product.slug}`} className="group block" onClick={() => onProductClick?.(product)}>
        <div className="relative">
          <LuxuryImage
            src={product.image}
            alt={product.name}
            width={960}
            height={1200}
            sizes="(max-width: 419px) 50vw, (max-width: 1023px) 33vw, 25vw"
            widths={[320, 480, 768, 960]}
            hover
            imgClassName={imageToneClass}
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
    </article>
  )
})

export default ProductCard
