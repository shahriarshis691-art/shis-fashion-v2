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
  if (typeof stock !== 'number') {
    return 'Available'
  }

  if (stock <= 0) {
    return 'Sold out'
  }

  if (stock <= 5) {
    return 'Low stock'
  }

  return 'In stock'
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageSrc = normalizeCatalogImageUrl(product.image, 960, 1200) || IMAGE_PLACEHOLDER
  const imageToneClass = isDemoImageUrl(imageSrc) ? 'shis-media-tone' : ''
  const stockLabel = getStockLabel(product.stock)
  const isSoldOut = stockLabel === 'Sold out'
  const imagePositionClass = product.category.includes('tee') || product.category.includes('shirt')
    ? 'object-[center_14%]'
    : product.category.includes('dress') || product.category.includes('western')
      ? 'object-[center_18%]'
      : 'object-[center_12%]'

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 shadow-[0_18px_55px_rgba(0,0,0,0.06)]"
    >
      <Link to={`/shop/${product.category}/${product.slug}`} className="block">
        <div className="relative aspect-[4/4.7] overflow-hidden bg-[var(--color-bg)]">
          {isSoldOut ? (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-[#111111]/88 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
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
        <div className="p-3 sm:p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">SHIS Selection</p>
          <h3 className="mt-1 line-clamp-2 min-h-[2.45rem] text-[0.94rem] font-semibold leading-5 text-[var(--color-text)] sm:min-h-0 sm:text-base">{product.name}</h3>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-[var(--color-accent)] sm:text-sm">{product.price}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${isSoldOut ? 'border-[#111111]/15 bg-[#111111]/[0.04] text-[#111111]/60' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>
              {stockLabel}
            </span>
          </div>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]/78">View details</p>
        </div>
      </Link>
    </motion.article>
  )
}
