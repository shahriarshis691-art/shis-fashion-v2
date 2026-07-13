import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { useCart } from '../context/CartContext'
import { getProductsByCategory, shopProducts } from '../data/shopData'

export default function ProductDetailPage() {
  const { productSlug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [size, setSize] = useState('M')
  const [color, setColor] = useState('Ivory')
  const [quantity, setQuantity] = useState(1)
  const product = shopProducts.find((entry) => entry.slug === productSlug)

  if (!product) {
    return null
  }

  const related = getProductsByCategory(product.category).filter((entry) => entry.id !== product.id).slice(0, 3)
  const gallery = [product.image, product.image, product.image]

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="grid gap-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            <img src={product.image} alt={product.name} loading="eager" decoding="async" className="h-[320px] w-full rounded-[1.5rem] object-cover sm:h-[420px]" />
            <div className="grid grid-cols-3 gap-3">
              {gallery.map((image, index) => (
                <img key={`${image}-${index}`} src={image} alt={`${product.name} view ${index + 1}`} loading="lazy" decoding="async" className="h-24 w-full rounded-[1.2rem] object-cover" />
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Product detail</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{product.name}</h1>
            <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">{product.description}</p>
            <div className="mt-6 flex items-center justify-between gap-4">
              <span className="text-2xl font-semibold text-[var(--color-accent)]">{product.price}</span>
              <Link to="/shop" className="text-sm font-semibold text-[var(--color-text)]">Back to shop</Link>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text)]">Size</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['S', 'M', 'L', 'XL'].map((option) => (
                    <button key={option} type="button" onClick={() => setSize(option)} className={`rounded-full border px-3 py-2 text-sm ${size === option ? 'border-[var(--color-accent)] bg-[rgba(201,162,39,0.12)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text)]">Color</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Ivory', 'Black', 'Stone'].map((option) => (
                    <button key={option} type="button" onClick={() => setColor(option)} className={`rounded-full border px-3 py-2 text-sm ${color === option ? 'border-[var(--color-accent)] bg-[rgba(201,162,39,0.12)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text)]">Quantity</p>
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 rounded-full border border-[var(--color-border)] text-lg text-[var(--color-text)]">−</button>
                  <span className="min-w-8 text-center text-base font-semibold text-[var(--color-text)]">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-10 w-10 rounded-full border border-[var(--color-border)] text-lg text-[var(--color-text)]">+</button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => { addToCart(product, { size, color, quantity }); navigate('/cart') }} className="justify-center">Add to cart</Button>
              <Button onClick={() => { addToCart(product, { size, color, quantity }); navigate('/checkout') }} variant="secondary" className="justify-center">Buy now</Button>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">You may also like</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.id} to={`/shop/${item.category}/${item.slug}`} className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90">
                <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="h-40 w-full object-cover" />
                <div className="p-4">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">{item.name}</h3>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
