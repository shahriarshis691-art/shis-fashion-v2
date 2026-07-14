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

export default function ProductCard({ product }: ProductCardProps) {
  const imageSrc = normalizeCatalogImageUrl(product.image, 960, 1200) || IMAGE_PLACEHOLDER
  const imageToneClass = isDemoImageUrl(imageSrc) ? 'shis-media-tone' : ''

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 shadow-[0_18px_55px_rgba(0,0,0,0.06)]"
    >
      <Link to={`/shop/${product.category}/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-bg)]">
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className={`h-full w-full object-cover ${imageToneClass}`}
            fetchPriority="low"
            sizes="(max-width: 419px) 50vw, (max-width: 1023px) 33vw, 25vw"
          />
        </div>
        <div className="p-3.5 sm:p-4">
          <h3 className="line-clamp-1 text-sm font-semibold text-[var(--color-text)] sm:text-base">{product.name}</h3>
          <p className="mt-1 text-sm font-semibold text-[var(--color-accent)]">{product.price}</p>
        </div>
      </Link>
    </motion.article>
  )
}
