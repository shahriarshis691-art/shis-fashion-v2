import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import ProductCard from '../components/shop/ProductCard'
import { useCart } from '../context/CartContext'
import { subscribeToProducts, type AdminProduct } from '../firebase/adminService'
import { getManagedImageEntries, isDemoImageUrl, normalizeCatalogImageUrl } from '../utils/media'
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
    sizes: product.sizes,
    stock: product.stock,
    featured: product.featured,
    newArrival: product.newArrival,
  }
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

function getPlaceholderDataUri() {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"%3E%3Crect width="800" height="800" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="34" fill="%23777777"%3EImage unavailable%3C/text%3E%3C/svg%3E'
}

function getStockLabel(stock: number) {
  if (stock <= 0) {
    return 'Out of stock'
  }

  if (stock <= 5) {
    return 'Low stock'
  }

  return 'In stock'
}

function buildHighlights(description: string, sizes: string[], stock: number) {
  const snippets = description
    .split(/[.!?]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 2)

  const sizeLine = sizes.length ? `Available sizes: ${sizes.join(', ')}.` : 'Standard sizing available.'
  const stockLine = stock <= 0 ? 'Temporarily unavailable for dispatch.' : stock <= 5 ? 'Limited stock in selected sizes.' : 'Ready for quick nationwide dispatch.'

  return [...snippets, sizeLine, stockLine].slice(0, 4)
}

export default function ProductDetailPage() {
  const { productSlug } = useParams()
  const decodedSlug = decodeURIComponent(productSlug ?? '')
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [products, setProducts] = useState<ReturnType<typeof toProduct>[]>([])
  const [ready, setReady] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [didAddToBag, setDidAddToBag] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      setProducts(nextProducts.map(toProduct))
      setReady(true)
    })

    return unsubscribe
  }, [])

  const product = products.find((entry) => entry.slug === decodedSlug)
  const fallbackImages = product?.image ? [product.image] : []
  const sourceImages = product?.galleryImages?.length ? product.galleryImages : fallbackImages
  const galleryImages = sourceImages
    .filter(Boolean)
    .map((image) => normalizeCatalogImageUrl(image, 1400, 1700))
  const resolvedGalleryImages = galleryImages.length ? galleryImages : [getPlaceholderDataUri()]

  const activeImage = resolvedGalleryImages[Math.min(activeImageIndex, resolvedGalleryImages.length - 1)] ?? resolvedGalleryImages[0]
  const availableStock = Math.max(0, product?.stock ?? 0)
  const maxQuantity = availableStock > 0 ? Math.min(availableStock, 10) : 1
  const effectiveQuantity = Math.max(1, Math.min(quantity, maxQuantity))
  const stockLabel = getStockLabel(availableStock)

  const relatedProducts = !product
    ? []
    : [
      ...products.filter((entry) => entry.id !== product.id && entry.category === product.category),
      ...products.filter((entry) => entry.id !== product.id && entry.category !== product.category),
    ].slice(0, 4)

  useEffect(() => {
    if (!product || !ready) {
      return
    }

    metaPixel.viewContent({
      content_name: product.name,
      content_ids: [String(product.id)],
      content_type: 'product',
      value: parseBDT(product.price),
      currency: 'BDT',
    })

    applySeoMetadata(location.pathname, {
      title: `${product.name} | SHIS Fashion Bangladesh`,
      description: `${product.description} Shop now with fast dispatch and cash on delivery in Bangladesh.`,
      schema: [
        buildProductSchema(
          {
            name: product.name,
            description: product.description,
            slug: product.slug,
            category: product.category,
            image: product.image,
            price: product.price,
            stock: product.stock,
          },
          location.pathname,
        ),
      ],
    })
  }, [location.pathname, product, ready])

  useEffect(() => {
    if (!isZoomOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsZoomOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isZoomOpen])

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = getPlaceholderDataUri()
  }

  const setPreviousImage = () => {
    setActiveImageIndex((current) => (current <= 0 ? resolvedGalleryImages.length - 1 : current - 1))
  }

  const setNextImage = () => {
    setActiveImageIndex((current) => (current >= resolvedGalleryImages.length - 1 ? 0 : current + 1))
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) {
      return
    }

    const delta = event.changedTouches[0].clientX - touchStartX
    if (delta > 45) {
      setPreviousImage()
    } else if (delta < -45) {
      setNextImage()
    }

    setTouchStartX(null)
  }

  const safeSize = selectedSize && product?.sizes.includes(selectedSize) ? selectedSize : product?.sizes[0] ?? 'M'
  const quickOrderHref = product ? getWhatsAppOrderHref(product.name, safeSize, effectiveQuantity) : getWhatsAppHref()

  const handleAddToBag = () => {
    if (!product || availableStock <= 0) {
      return
    }

    addToCart(product, { size: safeSize, color: 'Default', quantity: effectiveQuantity })
    metaPixel.addToCart({
      content_name: product.name,
      content_ids: [String(product.id)],
      content_type: 'product',
      value: parseBDT(product.price) * effectiveQuantity,
      currency: 'BDT',
    })

    setDidAddToBag(true)
    setTimeout(() => setDidAddToBag(false), 1500)
  }

  const handleBuyNow = () => {
    if (!product || availableStock <= 0) {
      return
    }

    addToCart(product, { size: safeSize, color: 'Default', quantity: effectiveQuantity })
    metaPixel.initiateCheckout({
      value: parseBDT(product.price) * effectiveQuantity,
      currency: 'BDT',
      content_type: 'product',
    })
    navigate('/checkout')
  }

  if (!ready) {
    return (
      <section className="bg-white px-3.5 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="py-14 text-center text-sm text-black/55">Loading product details...</div>
        </Container>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="bg-white px-3.5 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="border border-black/15 px-6 py-12 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">Product unavailable</p>
            <h1 className="mt-3 text-h2 text-black">This product is no longer available</h1>
            <p className="mt-3 text-sm leading-7 text-black/70">Return to the listing and continue browsing current products.</p>
            <div className="mt-6 flex justify-center">
              <Button to="/shop">Back to shop</Button>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  const highlights = buildHighlights(product.description, product.sizes, availableStock)

  return (
    <section className="bg-white px-3.5 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div>
            <div
              className="relative overflow-hidden bg-black/5"
              onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
              onTouchEnd={handleTouchEnd}
            >
              <div className="aspect-[4/5]">
                <img
                  src={activeImage}
                  alt={product.galleryImageTitles?.[activeImageIndex] || product.name}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onError={handleImageError}
                  onClick={() => setIsZoomOpen(true)}
                  className={`h-full w-full cursor-zoom-in object-cover ${isDemoImageUrl(activeImage) ? 'shis-media-tone' : ''}`}
                />
              </div>

              {resolvedGalleryImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={setPreviousImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 border border-black/15 bg-white/85 px-2.5 py-1.5 text-xs font-semibold text-black"
                    aria-label="Previous image"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={setNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 border border-black/15 bg-white/85 px-2.5 py-1.5 text-xs font-semibold text-black"
                    aria-label="Next image"
                  >
                    Next
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="absolute right-2 top-2 border border-black/15 bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-black"
              >
                Zoom
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {resolvedGalleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`overflow-hidden border ${index === activeImageIndex ? 'border-black' : 'border-black/15'}`}
                  aria-label={`Image ${index + 1}`}
                >
                  <div className="aspect-[4/5] bg-black/5">
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                      className={`h-full w-full object-cover ${isDemoImageUrl(image) ? 'shis-media-tone' : ''}`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">Product details</p>
            <h1 className="mt-1 text-h2 text-black">{product.name}</h1>

            <div className="mt-4 border border-black/15 p-4">
              <p className="text-caption uppercase tracking-[0.12em] text-black/55">Price</p>
              <p className="mt-1 text-2xl font-semibold text-black">{product.price}</p>
              <p className={`mt-2 text-sm font-medium ${availableStock <= 0 ? 'text-red-600' : 'text-black/70'}`}>{stockLabel}</p>
            </div>

            <div className="mt-4 border border-black/15 p-4">
              <p className="text-caption uppercase tracking-[0.12em] text-black/55">Size</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedSize(option)}
                    className={`ui-interactive border px-3 py-2 text-sm ${safeSize === option ? 'border-black bg-black text-white' : 'border-black/20 text-black hover:bg-black/5'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-caption uppercase tracking-[0.12em] text-black/55">Quantity</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="ui-interactive h-9 w-9 border border-black/20 text-lg text-black hover:bg-black/5"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="min-w-10 text-center text-sm font-semibold text-black">{effectiveQuantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                  className="ui-interactive h-9 w-9 border border-black/20 text-lg text-black hover:bg-black/5"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-4 hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={availableStock <= 0}
                className="ui-interactive flex-1 border border-black bg-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:bg-black/35 disabled:border-black/35"
              >
                {didAddToBag ? 'Added' : 'Add to Bag'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={availableStock <= 0}
                className="ui-interactive flex-1 border border-black px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/25 disabled:text-black/40"
              >
                Buy Now
              </button>
            </div>

            <a
              href={quickOrderHref}
              target="_blank"
              rel="noreferrer"
              className="ui-interactive mt-3 inline-flex w-full items-center justify-center border border-black/20 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black/5"
            >
              Order on WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="border border-black/15 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-black">Product Highlights</h2>
            <ul className="mt-3 space-y-2 text-sm text-black/75">
              {highlights.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-black" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-black/15 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-black">Delivery & Return</h2>
            <ul className="mt-3 space-y-2 text-sm text-black/75">
              <li>Delivery within 24-72 hours in major cities.</li>
              <li>Cash on Delivery available across Bangladesh.</li>
              <li>Exchange requests accepted within 3 days of delivery.</li>
              <li>
                Need fit support? <a href={getWhatsAppHref()} target="_blank" rel="noreferrer" className="underline">Chat on WhatsApp</a>.
              </li>
            </ul>
          </div>
        </div>

        {relatedProducts.length ? (
          <div className="mt-10">
            <div className="flex items-end justify-between gap-2 border-b border-black/10 pb-2.5">
              <h2 className="text-h2 text-black">Related Products</h2>
              <span className="text-caption uppercase tracking-[0.12em] text-black/55">You may also like</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-6 lg:grid-cols-4 lg:gap-x-4">
              {relatedProducts.map((item) => (
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
                    featured: item.featured,
                    newArrival: item.newArrival,
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Container>

      <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
        <div className="grid grid-cols-2 gap-2 border border-black/20 bg-white p-2 shadow-[0_10px_24px_rgba(0,0,0,0.14)]">
          <button
            type="button"
            onClick={handleAddToBag}
            disabled={availableStock <= 0}
            className="ui-interactive border border-black bg-black px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:bg-black/35 disabled:border-black/35"
          >
            {didAddToBag ? 'Added' : 'Add to Bag'}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={availableStock <= 0}
            className="ui-interactive border border-black px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-black disabled:cursor-not-allowed disabled:border-black/25 disabled:text-black/40"
          >
            Buy Now
          </button>
        </div>
      </div>

      {isZoomOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/90 px-3 py-6" onClick={() => setIsZoomOpen(false)}>
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-white/75">Zoom View</p>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="ui-interactive border border-white/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
              >
                Close
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden bg-black/25">
              <img
                src={activeImage}
                alt={`${product.name} zoom image`}
                onError={handleImageError}
                className={`h-full w-full object-contain ${isDemoImageUrl(activeImage) ? 'shis-media-tone' : ''}`}
              />

              {resolvedGalleryImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={setPreviousImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 border border-white/35 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={setNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 border border-white/35 bg-black/30 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white"
                  >
                    Next
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
