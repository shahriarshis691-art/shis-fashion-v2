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
  const imagePositionClass = getImagePositionClass(product.category)

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden product-card"
    >
      <Link to={`/shop/${product.category}/${product.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-black/5">
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className={`h-full w-full object-cover ${imagePositionClass} transition duration-300 group-hover:scale-[1.02] ${imageToneClass}`}
            fetchPriority="low"
            sizes="(max-width: 419px) 50vw, (max-width: 1023px) 33vw, 25vw"
          />
        </div>
        <div className="pt-2 product-card-meta">
          <h3 className="line-clamp-1 text-sm font-medium text-black">{product.name}</h3>
          <p className="mt-0.5 text-sm font-semibold text-black">{product.price}</p>
        </div>
      </Link>
    </motion.article>
  )
}
