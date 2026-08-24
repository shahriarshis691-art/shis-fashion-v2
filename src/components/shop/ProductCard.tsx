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

  return (
    <article className="product-card luxury-tap min-w-0">
      <Link to={`/shop/${product.category}/${product.slug}`} className="group block" onClick={() => onProductClick?.(product)}>
        <div className="relative w-full aspect-[3/4] bg-neutral-100 overflow-hidden">
          <LuxuryImage
            src={product.image}
            alt={product.name}
            width={960}
            height={1280}
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
              className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm text-neutral-800 hover:text-black hover:bg-white transition-all shadow-sm sm:h-9 sm:w-9"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="pt-2.5 sm:pt-3 text-left">
          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-neutral-900 leading-snug group-hover:text-neutral-600 transition-colors">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs sm:text-sm font-normal text-neutral-800">{product.price}</p>
            {product.comparePrice ? (
              <p className="text-[10px] sm:text-xs text-neutral-400 line-through">{product.comparePrice}</p>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  )
})

export default ProductCard
