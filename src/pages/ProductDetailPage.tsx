import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import ProductCard from '../components/shop/ProductCard'
import { useCart } from '../context/CartContext'
import { subscribeToProducts, type AdminProduct } from '../firebase/adminService'
import { isDemoImageUrl, normalizeCatalogImageUrl } from '../utils/media'
import { getManagedImageEntries } from '../utils/media'
import { parseBDT } from '../utils/currency'
import { metaPixel } from '../services/metaPixel'
import { applySeoMetadata, buildProductSchema } from '../utils/seo'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toProduct(product: AdminProduct) {
  const discountMatch = product.description.match(/(\d{1,2}%\s*off|save\s*\d{1,2}%)/i)
  const imageEntries = getManagedImageEntries(product, 1)

  return {
    id: product.id,
    slug: slugify(product.name),
    name: product.name,
    price: product.price,
    category: product.category,
    image: imageEntries[0]?.url ?? '',
    description: product.description,
    galleryImages: imageEntries.map((entry) => entry.url).filter(Boolean),
    galleryImageTitles: imageEntries.map((entry) => entry.title),
    galleryImageDescriptions: imageEntries.map((entry) => entry.description),
    sizes: product.sizes,
    stock: product.stock,
    discount: discountMatch?.[0],
  }
}

function buildHighlights(description: string, stock: number, sizes: string[]) {
  const sentenceHighlights = description
    .split(/[.!?]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)

  const stockLine = stock <= 0
    ? 'Currently out of stock for immediate dispatch.'
    : stock <= 5
      ? 'Limited stock available in select sizes.'
      : 'Ready for quick dispatch with Cash on Delivery.'

  const sizeLine = sizes.length
    ? `Available sizes: ${sizes.join(', ')}.`
    : 'Standard sizing available for this piece.'

  return [...sentenceHighlights, sizeLine, stockLine].slice(0, 4)
}

function getWhatsAppHref(phone?: string) {
  const digits = (phone ?? '').replace(/\D/g, '')
  const normalized = digits ? (digits.startsWith('88') ? digits : `88${digits}`) : '8801887848304'
  return `https://wa.me/${normalized}`
}

function getWhatsAppOrderHref(productName: string, size: string, quantity: number) {
  const baseHref = getWhatsAppHref()
  const message = encodeURIComponent(`Hi SHIS, I want to order ${productName}. Size: ${size}. Quantity: ${quantity}.`)
  return `${baseHref}?text=${message}`
}

export default function ProductDetailPage() {
  const { productSlug } = useParams()
  const decodedSlug = decodeURIComponent(productSlug ?? '')
  const navigate = useNavigate()
  const location = useLocation()
  const { addToCart } = useCart()
  const [products, setProducts] = useState<ReturnType<typeof toProduct>[]>([])
  const [ready, setReady] = useState(false)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState('')
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      setProducts(nextProducts.map(toProduct))
      setReady(true)
    })
    return unsubscribe
  }, [])

  const product = useMemo(() => products.find((entry) => entry.slug === decodedSlug), [decodedSlug, products])

  // Track ViewContent on product details page
  useEffect(() => {
    if (product && ready) {
      metaPixel.viewContent({
        content_name: product.name,
        content_ids: [String(product.id)],
        content_type: 'product',
        value: parseBDT(product.price),
        currency: 'BDT',
      })

      applySeoMetadata(location.pathname, {
        title: `${product.name} | SHIS Fashion Bangladesh`,
        description: `${product.description} Shop ${product.name} from SHIS Fashion Bangladesh with premium quality, fast dispatch and cash on delivery.`,
        schema: [buildProductSchema({
          name: product.name,
          description: product.description,
          slug: product.slug,
          category: product.category,
          image: product.image,
          price: product.price,
          stock: product.stock,
        }, location.pathname)],
      })
    }
  }, [location.pathname, product, ready])

  if (!ready) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Loading</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">Preparing product details...</h1>
          </div>
        </Container>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Product unavailable</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">This piece is no longer available.</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--color-muted)]">The product you requested could not be found. Return to the collection to continue browsing.</p>
            <div className="mt-8 flex justify-center">
              <Button to="/shop">Browse collection</Button>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  const sameCategoryRelated = products.filter((entry) => entry.category === product.category && entry.id !== product.id)
  const fallbackRelated = products.filter((entry) => entry.id !== product.id && entry.category !== product.category)
  const related = [...sameCategoryRelated, ...fallbackRelated].slice(0, 3)
  const galleryImages = [
    product.galleryImages?.[0] ?? product.image,
    product.galleryImages?.[1] ?? product.galleryImages?.[0] ?? product.image,
    product.galleryImages?.[2] ?? product.galleryImages?.[1] ?? product.galleryImages?.[0] ?? product.image,
  ].filter(Boolean)
  const normalizedGalleryImages = galleryImages.map((image) => normalizeCatalogImageUrl(image, 1200, 1400))
  const resolvedActiveImage = activeImage && normalizedGalleryImages.includes(activeImage) ? activeImage : normalizedGalleryImages[0] ?? normalizeCatalogImageUrl(product.image, 1200, 1400)
  const activeImageIndex = normalizedGalleryImages.findIndex((image) => image === resolvedActiveImage)
  const activeImageTitle = product.galleryImageTitles?.[activeImageIndex] || product.name
  const size = selectedSize && product.sizes.includes(selectedSize) ? selectedSize : (product.sizes[0] ?? 'M')
  const stockStatus = product.stock <= 0 ? 'Out of stock' : product.stock <= 5 ? 'Low stock' : 'In stock'
  const highlights = buildHighlights(product.description, product.stock, product.sizes)
  const supportWhatsAppHref = getWhatsAppHref()
  const quickOrderWhatsAppHref = getWhatsAppOrderHref(product.name, size, quantity)

  const handleSwipeEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) {
      return
    }

    const delta = event.changedTouches[0].clientX - touchStartX
    if (delta > 50) {
      const currentIndex = normalizedGalleryImages.findIndex((image) => image === activeImage)
      const previousIndex = currentIndex <= 0 ? normalizedGalleryImages.length - 1 : currentIndex - 1
      setActiveImage(normalizedGalleryImages[previousIndex])
    } else if (delta < -50) {
      const currentIndex = normalizedGalleryImages.findIndex((image) => image === activeImage)
      const nextIndex = currentIndex >= normalizedGalleryImages.length - 1 ? 0 : currentIndex + 1
      setActiveImage(normalizedGalleryImages[nextIndex])
    }

    setTouchStartX(null)
  }

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"%3E%3Crect width="800" height="800" fill="%23f8f5ed"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="%23c9a227"%3EImage unavailable%3C/text%3E%3C/svg%3E'
    event.currentTarget.src = placeholder
  }

  return (
    <section className="px-3 pb-14 pt-4 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="grid gap-5 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:rounded-[2rem] sm:p-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-2">
            <div className="relative" onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)} onTouchEnd={handleSwipeEnd}>
              <div className="aspect-[4/5] overflow-hidden rounded-[1.1rem] bg-[var(--color-bg)] sm:rounded-[1.5rem]">
                <img
                  src={resolvedActiveImage}
                  alt={activeImageTitle}
                  loading="eager"
                  decoding="async"
                  onError={handleImageError}
                  onClick={() => setIsZoomOpen(true)}
                  fetchPriority="high"
                  sizes="(max-width: 1023px) 100vw, 52vw"
                  className={`h-full w-full cursor-zoom-in object-cover transition-opacity duration-300 ${isDemoImageUrl(resolvedActiveImage) ? 'shis-media-tone' : ''}`}
                />
              </div>
              <button type="button" onClick={() => setIsZoomOpen(true)} className="absolute right-2.5 top-2.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text)] sm:right-3 sm:top-3 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.25em]">
                Zoom
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {normalizedGalleryImages.map((image, index) => (
                <button key={`${image}-${index}`} type="button" onClick={() => setActiveImage(image)} className={`overflow-hidden rounded-[0.9rem] border sm:rounded-[1.2rem] ${resolvedActiveImage === image ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                  <div className="aspect-[4/5] bg-[var(--color-bg)]">
                    <img src={image} alt={product.galleryImageTitles?.[index] || `${product.name} view ${index + 1}`} loading="lazy" decoding="async" onError={handleImageError} className={`h-full w-full object-cover ${isDemoImageUrl(image) ? 'shis-media-tone' : ''}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight text-[var(--color-text)] sm:mt-3 sm:text-3xl">{product.name}</h1>
            <div className="mt-3 space-y-2.5 rounded-[1.05rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3.5 sm:mt-5 sm:rounded-[1.25rem] sm:p-4">
              <div>
                <p className="text-sm text-[var(--color-muted)]">Price</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-2xl font-semibold text-[var(--color-text)]">{product.price}</span>
                </div>
              </div>
              {product.discount ? <p className="text-sm font-semibold text-[var(--color-accent)]">{product.discount}</p> : null}
              <p className={`text-sm font-semibold ${product.stock <= 0 ? 'text-red-600' : product.stock <= 5 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}>{stockStatus}</p>
            </div>

            <div className="mt-4 space-y-3 rounded-[1.05rem] border border-[var(--color-border)] bg-[var(--color-surface)]/92 p-3.5 sticky bottom-3 z-20 sm:rounded-[1.25rem] sm:p-4 md:static md:bg-transparent md:border-0 md:p-0">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text)]">Size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((option) => (
                    <button key={option} type="button" onClick={() => setSelectedSize(option)} className={`rounded-full border px-3 py-2 text-sm ${size === option ? 'border-[var(--color-accent)] bg-[rgba(201,162,39,0.12)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-text)]">Quantity</p>
                <div className="mt-2 flex items-center gap-3">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-10 w-10 rounded-full border border-[var(--color-border)] text-lg text-[var(--color-text)]">−</button>
                  <span className="min-w-8 text-center text-base font-semibold text-[var(--color-text)]">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => value + 1)} className="h-10 w-10 rounded-full border border-[var(--color-border)] text-lg text-[var(--color-text)]">+</button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => {
                  addToCart(product, { size, color: 'Default', quantity })
                  metaPixel.addToCart({
                    content_name: product.name,
                    content_ids: [String(product.id)],
                    content_type: 'product',
                    value: parseBDT(product.price) * quantity,
                    currency: 'BDT',
                  })
                  navigate('/cart')
                }} className="justify-center" disabled={product.stock <= 0}>Add to bag</Button>
                <Button onClick={() => {
                  addToCart(product, { size, color: 'Default', quantity })
                  metaPixel.initiateCheckout({
                    value: parseBDT(product.price) * quantity,
                    currency: 'BDT',
                    content_type: 'product',
                  })
                  navigate('/checkout')
                }} variant="secondary" className="justify-center" disabled={product.stock <= 0}>Buy now</Button>
              </div>

              <a
                href={quickOrderWhatsAppHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]"
              >
                Quick order on WhatsApp
              </a>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Dispatch in 24-72h</p>
                <a href={supportWhatsAppHref} target="_blank" rel="noreferrer" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                  Size help on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {isZoomOpen ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(5,5,5,0.88)] px-4 py-6" onClick={() => setIsZoomOpen(false)}>
            <div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
              <button type="button" onClick={() => setIsZoomOpen(false)} className="absolute right-3 top-3 z-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3 py-2 text-sm font-semibold text-[var(--color-text)]">
                Close
              </button>
              <img src={resolvedActiveImage} alt={`${product.name} zoom`} onError={handleImageError} className={`max-h-[80vh] w-full rounded-[1.8rem] object-contain ${isDemoImageUrl(resolvedActiveImage) ? 'shis-media-tone' : ''}`} />
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 sm:mt-10 sm:rounded-[1.75rem] sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">Description</h2>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
            {highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">Cash on Delivery available</p>
        </div>

        <div className="mt-8 sm:mt-10">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">You may also like</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-5 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={{
                  id: item.id,
                  slug: item.slug,
                  name: item.name,
                  price: item.price,
                  category: item.category,
                  image: item.image,
                  description: item.description,
                  galleryImages: item.galleryImages,
                  stock: item.stock,
                  discount: item.discount,
                }}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
