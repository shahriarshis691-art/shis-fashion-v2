import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ShopProduct } from '../../data/shopData'
import { isDemoImageUrl, normalizeCatalogImageUrl } from '../../utils/media'

interface ProductCardProps {
  product: ShopProduct
}

const IMAGE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"%3E%3Crect width="1200" height="1200" fill="%23f8f5ed"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="%23c9a227"%3ESHIS Fashion%3C/text%3E%3C/svg%3E'

function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.src = IMAGE_PLACEHOLDER
}

function getStockLabel(stock?: number) {
  if (typeof stock === 'number' && stock <= 0) {
    return 'Sold out'
  }

  if (typeof stock === 'number' && stock <= 5) {
    return 'Low stock'
  }

  return null
}

function getImagePositionClass(category: string) {
  switch (category) {
    case 'oversized-tee':
      return 'object-[center_10%]'
    case 'unisex-tee':
      return 'object-[center_12%]'
    case 'mens-shirt':
      return 'object-[center_14%]'
    case 'womens-dresses':
      return 'object-[center_16%]'
    case 'western-outfits':
      return 'object-[center_15%]'
    case 'denim':
      return 'object-[center_18%]'
    case 'couples':
      return 'object-[center_12%]'
    case 'kids':
      return 'object-[center_20%]'
    default:
      return 'object-[center_14%]'
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageSrc = normalizeCatalogImageUrl(product.image, 960, 1200) || IMAGE_PLACEHOLDER
  const imageToneClass = isDemoImageUrl(imageSrc) ? 'shis-media-tone' : ''
  const stockLabel = getStockLabel(product.stock)
  const isSoldOut = typeof product.stock === 'number' && product.stock <= 0
  const imagePositionClass = getImagePositionClass(product.category)

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-[0.95rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:rounded-[1.15rem]"
    >
      <Link to={`/shop/${product.category}/${product.slug}`} className="block">
        <div className="relative aspect-[4/4.55] overflow-hidden bg-[var(--color-bg)]">
          {isSoldOut ? (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-[#111111]/88 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm sm:text-[9px]">
              Sold out
            </span>
          ) : null}
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className={`h-full w-full object-cover ${imagePositionClass} transition duration-300 group-hover:scale-[1.03] ${imageToneClass}`}
            fetchPriority="low"
            sizes="(max-width: 419px) 50vw, (max-width: 1023px) 33vw, 25vw"
          />
        </div>
        <div className="px-3 pb-3 pt-3 sm:p-3.5">
          <h3 className="line-clamp-2 min-h-[2.7rem] text-[1.05rem] font-semibold leading-6 text-[var(--color-text)] sm:min-h-0 sm:text-lg">{product.name}</h3>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-lg font-semibold text-[var(--color-accent)] sm:text-base">{product.price}</p>
            {stockLabel ? (
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] sm:text-[10px] ${isSoldOut ? 'border-[#111111]/15 bg-[#111111]/[0.04] text-[#111111]/60' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>
                {stockLabel}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
