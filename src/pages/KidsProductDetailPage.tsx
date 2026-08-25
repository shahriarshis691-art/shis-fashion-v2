import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import KidsSizeGuideModal from '../components/kids/KidsSizeGuideModal'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { useCart, writeBuyNowCheckout } from '../context/CartContext'
import {
  getKidsBadge,
  getKidsProductBySlug,
  KIDS_COLOR_LABELS,
  KIDS_PRODUCT_CARE,
  KIDS_PRODUCT_FABRIC,
  KIDS_TRUST_BADGES,
  kidsOversizedTeeProducts,
  type KidsOversizedTeeProduct,
} from '../data/kidsOversizedTeeCollection'
import { DELIVERY_RETURN_BULLETS, STORE_POLICY } from '../data/storePolicy'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { googleAnalytics } from '../services/googleAnalytics'
import { metaPixel } from '../services/metaPixel'
import { getCatalogContentId } from '../utils/catalogIdentity'
import { parseBDT } from '../utils/currency'
import { applyNotFoundSeo, applySeoMetadata, buildProductSchema } from '../utils/seo'

const SITE_URL = 'https://www.shisfashion.com'

function getStockLabel(stock: number) {
  if (stock <= 0) {
    return 'Out of stock'
  }
  if (stock <= 5) {
    return `Only ${stock} left`
  }
  return 'In stock'
}

function RelatedKidsCard({ product }: { product: KidsOversizedTeeProduct }) {
  return (
    <Link
      to={`/kids/${product.slug}`}
      className="group min-w-0 block bg-[#fcfcfc]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f8f8f8]">
        <img
          src={product.image}
          alt={product.name}
          width={480}
          height={640}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
          onError={(event) => {
            event.currentTarget.src = '/og-image.svg'
          }}
        />
      </div>
      <h3 className="mt-2.5 line-clamp-1 text-xs font-semibold text-neutral-900 md:text-sm">{product.name}</h3>
      <p className="mt-0.5 text-xs font-medium text-neutral-800 md:text-sm">{product.price}</p>
    </Link>
  )
}

export default function KidsProductDetailPage() {
  const { productSlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  const product = useMemo(() => getKidsProductBySlug(productSlug ?? ''), [productSlug])

  const colorFromQuery = searchParams.get('color')?.trim() ?? ''
  const initialColor =
    product?.colors?.find((color) => color.toLowerCase() === colorFromQuery.toLowerCase())
    ?? product?.colors?.[0]
    ?? 'Default'

  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState(initialColor)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [didAddToBag, setDidAddToBag] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  useEffect(() => {
    setSelectedSize('')
    setSelectedColor(initialColor)
    setQuantity(1)
    setActiveImageIndex(0)
    setIsZoomOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [product?.id, initialColor])

  useEffect(() => {
    if (!product) {
      applyNotFoundSeo(`/kids/${productSlug ?? ''}`)
      return
    }

    const path = `/kids/${product.slug}`
    const image = product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`

    applySeoMetadata(path, {
      title: `${product.name} | Kids | SHIS Fashion Bangladesh`,
      description: product.description || 'Premium kids oversized tee from SHIS Fashion Bangladesh.',
      canonicalPath: path,
      ogImage: image,
      keywords: `kids oversized tee, ${product.name}, SHIS Fashion kids`,
      schema: [
        buildProductSchema(
          {
            name: product.name,
            description: product.description || 'Premium kids oversized tee from SHIS Fashion.',
            slug: product.slug,
            category: product.category,
            image,
            price: product.price,
            comparePrice: product.comparePrice,
            brand: product.brand,
            stock: product.stock ?? 0,
          },
          path,
        ),
      ],
    })

    metaPixel.trackViewContent({
      content_name: product.name,
      content_ids: [getCatalogContentId(product)],
      content_type: 'product',
      value: parseBDT(product.price),
      currency: 'BDT',
    })

    googleAnalytics.viewItem({
      item_id: getCatalogContentId(product),
      item_name: product.name,
      item_category: product.category,
      price: parseBDT(product.price),
      quantity: 1,
      brand: product.brand,
    }, 'BDT')
  }, [product, productSlug])

  useEffect(() => {
    if (!sizeGuideOpen && !isZoomOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sizeGuideOpen, isZoomOpen])

  const gallery = product?.galleryImages?.length ? product.galleryImages : product ? [product.image] : []
  const activeImage = gallery[activeImageIndex] ?? product?.image ?? '/og-image.svg'
  const badge = product ? getKidsBadge(product) : null
  const sizes = product?.sizes ?? []
  const colors = product?.colors ?? []
  const availableStock = product?.stock ?? 0
  const isSizeSelected = Boolean(selectedSize && sizes.includes(selectedSize))
  const hasColorOptions = colors.length > 0
  const isColorSelected = !hasColorOptions || Boolean(selectedColor && colors.includes(selectedColor))
  const safeSize = isSizeSelected ? selectedSize : sizes[0] ?? '8-9Y'
  const safeColor = isColorSelected ? selectedColor : colors[0] ?? 'Default'
  const maxQuantity = availableStock > 0 ? Math.min(availableStock, 10) : 1
  const effectiveQuantity = Math.max(1, Math.min(quantity, maxQuantity))
  const canPurchase = Boolean(product && availableStock > 0 && isSizeSelected && isColorSelected)
  const stockLabel = getStockLabel(availableStock)

  const relatedProducts = useMemo(() => {
    if (!product) {
      return []
    }

    return kidsOversizedTeeProducts
      .filter((item) => item.id !== product.id)
      .slice(0, 4)
  }, [product])

  const setPreviousImage = () => {
    setActiveImageIndex((current) => (current - 1 + gallery.length) % gallery.length)
  }

  const setNextImage = () => {
    setActiveImageIndex((current) => (current + 1) % gallery.length)
  }

  const handleAddToBag = () => {
    if (!product || !canPurchase) {
      return
    }

    addToCart(product, { size: safeSize, color: safeColor, quantity: effectiveQuantity })

    metaPixel.trackAddToCart({
      content_name: product.name,
      content_ids: [getCatalogContentId(product)],
      content_type: 'product',
      value: parseBDT(product.price) * effectiveQuantity,
      currency: 'BDT',
      brand: product.brand,
    })

    googleAnalytics.addToBag({
      item_id: getCatalogContentId(product),
      item_name: product.name,
      item_category: product.category,
      price: parseBDT(product.price),
      quantity: effectiveQuantity,
      brand: product.brand,
    }, 'BDT')

    setDidAddToBag(true)
    window.setTimeout(() => setDidAddToBag(false), 1500)
  }

  const handleBuyNow = () => {
    if (!product || !canPurchase) {
      return
    }

    writeBuyNowCheckout([
      {
        ...product,
        id: `${product.slug}-${safeSize}-${safeColor}`,
        size: safeSize,
        color: safeColor,
        quantity: effectiveQuantity,
        stock: availableStock,
      },
    ])

    googleAnalytics.beginCheckout({
      value: parseBDT(product.price) * effectiveQuantity,
      currency: 'BDT',
      items: [
        {
          item_id: String(product.id),
          item_name: product.name,
          item_category: product.category,
          price: parseBDT(product.price),
          quantity: effectiveQuantity,
          brand: product.brand,
        },
      ],
    })

    navigate('/checkout')
  }

  if (!product) {
    return (
      <section className="bg-white px-4 py-16 md:px-8">
        <Container>
          <p className="text-caption uppercase tracking-[0.14em] text-black/55">Product unavailable</p>
          <h1 className="mt-2 text-2xl text-neutral-900" style={{ fontFamily: 'var(--font-brand)' }}>
            Kids style not found
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-black/70">
            This kids oversized tee is no longer available or the link is incorrect.
          </p>
          <Button to="/kids" className="mt-6">
            Back to Kids Collection
          </Button>
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-white pb-28 pt-6 sm:pb-16 md:pt-10">
      <Container>
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-black/55">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="hover:text-black">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to="/kids" className="hover:text-black">
                Kids
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="max-w-[14rem] truncate text-black sm:max-w-none">{product.name}</li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div
              className="relative aspect-[3/4] overflow-hidden bg-[#f8f8f8]"
              onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
              onTouchEnd={(event) => {
                if (touchStartX == null || gallery.length < 2) {
                  setTouchStartX(null)
                  return
                }
                const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX
                if (delta > 45) {
                  setPreviousImage()
                } else if (delta < -45) {
                  setNextImage()
                }
                setTouchStartX(null)
              }}
            >
              <button
                type="button"
                className="absolute inset-0 z-[1]"
                onClick={() => setIsZoomOpen(true)}
                aria-label={`Zoom ${product.name}`}
              >
                <img
                  src={activeImage}
                  alt={product.name}
                  width={960}
                  height={1280}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-contain p-3 transition-transform duration-300 hover:scale-[1.01]"
                  onError={(event) => {
                    event.currentTarget.src = '/og-image.svg'
                  }}
                />
              </button>

              {badge ? (
                <span className="pointer-events-none absolute left-3 top-3 z-10 bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-800">
                  {badge}
                </span>
              ) : null}

              {gallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={setPreviousImage}
                    className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 border border-black/15 bg-white/90 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] md:block"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={setNextImage}
                    className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 border border-black/15 bg-white/90 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] md:block"
                  >
                    Next
                  </button>
                </>
              ) : null}
            </div>

            {gallery.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-20 w-16 shrink-0 overflow-hidden border bg-[#f8f8f8] ${
                      activeImageIndex === index ? 'border-neutral-900' : 'border-black/10'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-contain p-1" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/55">{product.genderCategory}</p>
            <h1 className="mt-2 text-2xl font-normal text-neutral-900 md:text-3xl" style={{ fontFamily: 'var(--font-brand)' }}>
              {product.name}
            </h1>

            <div className="mt-4 flex items-end gap-3 border border-black/10 bg-[#fafafa] px-4 py-3">
              <p className="text-2xl font-semibold text-neutral-900">{product.price}</p>
              {product.originalPrice ? (
                <p className="pb-1 text-sm text-neutral-400 line-through">{product.originalPrice}</p>
              ) : null}
            </div>
            <p className={`mt-2 text-sm font-medium ${availableStock <= 0 ? 'text-red-600' : 'text-neutral-600'}`}>
              {stockLabel}
              {isSizeSelected && availableStock > 0 && availableStock <= 5 ? ` · ${availableStock} remaining` : ''}
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Age / Size</p>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-800 underline underline-offset-4"
                >
                  Size Guide
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3.5rem] border px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                      selectedSize === size ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!isSizeSelected ? <p className="mt-2 text-xs text-black/55">Select a size to continue.</p> : null}
            </div>

            {hasColorOptions ? (
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Color</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colorHexes.map((hex) => {
                    const label = KIDS_COLOR_LABELS[hex] ?? hex
                    const selected = selectedColor === label
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setSelectedColor(label)}
                        className={`flex items-center gap-2 border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                          selected ? 'border-neutral-900' : 'border-black/15'
                        }`}
                        aria-pressed={selected}
                      >
                        <span className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ backgroundColor: hex }} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Quantity</p>
              <div className="mt-2 inline-flex items-center border border-black/15">
                <button
                  type="button"
                  className="px-3 py-2 text-sm"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-semibold">{effectiveQuantity}</span>
                <button
                  type="button"
                  className="px-3 py-2 text-sm"
                  onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={!canPurchase}
                className="flex-1 border border-neutral-900 bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {didAddToBag ? 'Added to Bag' : 'Add to Bag'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canPurchase}
                className="flex-1 border border-neutral-900 px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={() => handleToggleWishlist(product)}
                className={`w-12 border text-sm ${
                  isInWishlist(String(product.id)) ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                }`}
                aria-label={isInWishlist(String(product.id)) ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {isInWishlist(String(product.id)) ? '♥' : '♡'}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {KIDS_TRUST_BADGES.map((item) => (
                <div key={item} className="border border-black/10 bg-[#fafafa] px-2.5 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="border border-black/10 p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-900">Product Details</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-700">{product.description}</p>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Fabric</p>
            <p className="mt-1.5 text-sm leading-7 text-neutral-700">{KIDS_PRODUCT_FABRIC}</p>
          </div>

          <div className="border border-black/10 p-4 sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-neutral-900">Care & Delivery</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
              {KIDS_PRODUCT_CARE.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
            <ul className="mt-4 space-y-2 border-t border-black/10 pt-4 text-sm leading-6 text-neutral-700">
              {DELIVERY_RETURN_BULLETS.map((line) => (
                <li key={line}>• {line}</li>
              ))}
              <li>• {STORE_POLICY.phoneConfirm}</li>
            </ul>
          </div>
        </div>

        {relatedProducts.length ? (
          <div className="mt-12">
            <div className="flex items-end justify-between gap-2 border-b border-black/10 pb-3">
              <h2 className="text-lg text-neutral-900" style={{ fontFamily: 'var(--font-brand)' }}>
                More Kids Styles
              </h2>
              <Link to="/kids" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-600 hover:text-neutral-900">
                View all
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-6">
              {relatedProducts.map((item) => (
                <RelatedKidsCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        ) : null}
      </Container>

      <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 border border-black/15 bg-white p-2 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            onClick={handleAddToBag}
            disabled={!canPurchase}
            className="border border-neutral-900 bg-neutral-900 px-3 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {didAddToBag ? 'Added' : 'Add to Bag'}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canPurchase}
            className="border border-neutral-900 px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-900 disabled:opacity-40"
          >
            Buy Now
          </button>
          <button
            type="button"
            onClick={() => handleToggleWishlist(product)}
            className={`w-12 border text-sm ${
              isInWishlist(String(product.id)) ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15'
            }`}
            aria-label={isInWishlist(String(product.id)) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isInWishlist(String(product.id)) ? '♥' : '♡'}
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
                className="border border-white/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white"
              >
                Close
              </button>
            </div>
            <div className="relative flex-1 overflow-hidden bg-black/25">
              <img
                src={activeImage}
                alt={`${product.name} zoom`}
                className="h-full w-full object-contain"
                loading="eager"
                decoding="async"
              />
              {gallery.length > 1 ? (
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

      {sizeGuideOpen ? <KidsSizeGuideModal onClose={() => setSizeGuideOpen(false)} /> : null}
    </section>
  )
}
