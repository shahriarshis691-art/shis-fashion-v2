import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ShopProduct } from '../../data/shopData'

interface ProductCardProps {
  product: ShopProduct
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 shadow-[0_18px_55px_rgba(0,0,0,0.06)]"
    >
      <Link to={`/shop/${product.category}/${product.slug}`} className="block">
        <img src={product.image} alt={product.name} className="h-56 w-full object-cover sm:h-64" />
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">{product.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{product.description}</p>
            </div>
            <span className="text-sm font-semibold text-[var(--color-accent)]">{product.price}</span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
