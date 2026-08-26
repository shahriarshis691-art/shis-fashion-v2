import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import AarongProductCard from '../components/shop/AarongProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import PdpAccordion from '../components/shop/PdpAccordion'
import PdpActionButtons from '../components/shop/PdpActionButtons'
import PdpGalleryNav from '../components/shop/PdpGalleryNav'
import PdpQuantityStepper from '../components/shop/PdpQuantityStepper'
import PdpShareButton from '../components/shop/PdpShareButton'
import { useCart, writeBuyNowCheckout, type CartItem } from '../context/CartContext'
import {
  getKidsProductBySlug,
  KIDS_COLOR_LABELS,
  KIDS_PRODUCT_CARE,
  KIDS_PRODUCT_FABRIC,
  KIDS_SIZE_GUIDE_ROWS,
  kidsOversizedTeeProducts,
  type KidsOversizedTeeProduct,
} from '../data/kidsOversizedTeeCollection'
import { DELIVERY_RETURN_BULLETS } from '../data/storePolicy'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { usePdpActionGate } from '../hooks/usePdpActionGate'
import { googleAnalytics } from '../services/googleAnalytics'
import { metaPixel } from '../services/metaPixel'
import { getCatalogContentId } from '../utils/catalogIdentity'
import { formatTkPrice, parseBDT } from '../utils/currency'
import { getVariantStock } from '../utils/variantStock'
import { applyNotFoundSeo, applySeoMetadata, buildProductSchema } from '../utils/seo'

const InstantCheckoutSheet = lazy(() => import('../components/shop/InstantCheckoutSheet'))
const prefetchKidsProductDetail = () => import('./KidsProductDetailPage')
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

export default function KidsProductDetailPage() {
  const { productSlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  const product = useMemo(() => getKidsProductBySlug(productSlug ?? ''), [productSlug])

  const colorFromQuery = searchParams.get('color')?.trim() ?? ''
  const initialColor = colorFromQuery
    ? (product?.colors?.find((color) => color.toLowerCase() === colorFromQuery.toLowerCase()) ?? '')
    : ''

  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState(initialColor)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [didAddToBag, setDidAddToBag] = useState(false)
  const [instantCheckoutOpen, setInstantCheckoutOpen] = useState(false)
  const [instantCheckoutItems, setInstantCheckoutItems] = useState<CartItem[]>([])
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [activeProductId, setActiveProductId] = useState(product?.id)

  if (product && product.id !== activeProductId) {
    setActiveProductId(product.id)
    setSelectedSize('')
    setSelectedColor(initialColor)
    setQuantity(1)
    setActiveImageIndex(0)
    setIsZoomOpen(false)
    setDidAddToBag(false)
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [product?.id])

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
    if (!isZoomOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isZoomOpen])

  const gallery = product?.galleryImages?.length ? product.galleryImages : product ? [product.image] : []
  const activeImage = gallery[activeImageIndex] ?? product?.image ?? '/og-image.svg'
  const sizes = product?.sizes ?? []
  const colors = product?.colors ?? []
  const isSizeSelected = Boolean(selectedSize && sizes.includes(selectedSize))
  const hasColorOptions = colors.length > 0
  const isColorSelected = !hasColorOptions || Boolean(selectedColor && colors.includes(selectedColor))
  const safeSize = isSizeSelected ? selectedSize : sizes[0] ?? '8-9Y'
  const safeColor = isColorSelected ? selectedColor : colors[0] ?? 'Default'
  const availableStock = product
    ? Math.max(0, isSizeSelected && isColorSelected
      ? getVariantStock(product, selectedSize, selectedColor)
      : (product.stock ?? 0))
    : 0
  const maxQuantity = availableStock > 0 ? Math.min(availableStock, 10) : 1
  const effectiveQuantity = Math.max(1, Math.min(quantity, maxQuantity))
  const stockLabel = getStockLabel(availableStock)
  const { actionError, shakeToken, clearActionError, requireReadyToPurchase } = usePdpActionGate({
    isSizeSelected,
    isColorSelected,
    availableStock,
    sizeHint: 'Please select a size / দয়া করে সাইজ সিলেক্ট করুন',
    colorHint: 'Please select a color / দয়া করে কালার সিলেক্ট করুন',
  })

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
    if (!requireReadyToPurchase() || !product) {
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

    clearActionError()
    setDidAddToBag(true)
    window.setTimeout(() => setDidAddToBag(false), 1500)
  }

  const handleBuyNow = () => {
    if (!requireReadyToPurchase() || !product) {
      return
    }

    const line: CartItem = {
      ...product,
      id: `${product.slug}-${safeSize}-${safeColor}`,
      size: safeSize,
      color: safeColor,
      quantity: effectiveQuantity,
      stock: availableStock,
    }

    writeBuyNowCheckout([line])
    clearActionError()

    const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
    if (isMobileViewport) {
      setInstantCheckoutItems([line])
      setInstantCheckoutOpen(true)
      return
    }

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
          <p className="text-[12px] font-normal tracking-wide text-neutral-400">Product unavailable</p>
          <h1 className="mt-2 text-2xl text-neutral-900" style={{ fontFamily: 'var(--font-brand)' }}>
            Kids style not found
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-neutral-600">
            This kids oversized tee is no longer available or the link is incorrect.
          </p>
          <Button to="/kids" variant="cta" className="mt-6">
            Back to Kids Collection
          </Button>
        </Container>
      </section>
    )
  }

  const optionChipClass = (active: boolean) =>
    `inline-flex min-h-10 min-w-10 items-center justify-center border px-3 text-xs tracking-[0.08em] ${
      active ? 'border-black bg-black text-white' : 'border-gray-200 text-neutral-900'
    }`

  return (
    <section className="bg-white pb-16">
      <nav aria-label="Breadcrumb" className="px-4 py-3 sm:px-8">
        <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 text-[12px] font-normal tracking-wide text-neutral-400">
          <li>
            <Link to="/" className="transition-colors hover:text-neutral-700">
              Home
            </Link>
          </li>
          <li aria-hidden className="text-neutral-300">
            /
          </li>
          <li>
            <Link to="/kids" className="transition-colors hover:text-neutral-700">
              Kids
            </Link>
          </li>
          <li aria-hidden className="text-neutral-300">
            /
          </li>
          <li className="max-w-[14rem] truncate text-neutral-500 sm:max-w-none">{product.name}</li>
        </ol>
      </nav>

      <div className="mx-auto grid max-w-7xl lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-2">
        <div>
          <div
            className="relative aspect-[3/4] w-full bg-[#f7f7f8]"
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
                sizes="(max-width: 1023px) 100vw, 50vw"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="pdp-main-image absolute inset-0 h-full w-full object-contain object-[center_top] md:object-cover"
                onError={(event) => {
                  event.currentTarget.src = '/og-image.svg'
                }}
              />
            </button>
            <PdpGalleryNav
              count={gallery.length}
              index={activeImageIndex}
              onPrev={setPreviousImage}
              onNext={setNextImage}
              onSelect={setActiveImageIndex}
            />
          </div>
        </div>

        <div className="px-4 pt-5 sm:px-8 lg:px-0 lg:pt-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[15px] font-medium leading-snug tracking-[0.06em] text-neutral-900 sm:text-lg">
              {product.name}
            </h1>
            <PdpShareButton title={product.name} />
          </div>

          <p className="mt-2 text-base font-bold tabular-nums text-neutral-900">
            {formatTkPrice(product.price)}
          </p>
          {product.originalPrice ? (
            <p className="mt-0.5 text-sm text-neutral-400 line-through tabular-nums">
              {formatTkPrice(product.originalPrice)}
            </p>
          ) : null}
          <p className={`mt-1 text-xs ${availableStock <= 0 ? 'text-red-600' : 'text-neutral-500'}`}>
            {stockLabel}
            {isSizeSelected && availableStock > 0 && availableStock <= 5 ? ` · ${availableStock} remaining` : ''}
          </p>

          <div className="mt-5">
            <p className="text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase">Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={optionChipClass(selectedSize === size)}
                >
                  {size}
                </button>
              ))}
            </div>
            {!isSizeSelected ? (
              <p className="mt-2 text-xs text-neutral-500">Select a size to continue.</p>
            ) : null}
          </div>

          {hasColorOptions ? (
            <div className="mt-4">
              <p className="text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase">Color</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colorHexes.map((hex) => {
                  const label = KIDS_COLOR_LABELS[hex] ?? hex
                  const selected = selectedColor === label
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setSelectedColor(label)}
                      className={optionChipClass(selected)}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {!isColorSelected ? (
                <p className="mt-2 text-xs text-neutral-500">Select a color to continue.</p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4">
            <PdpQuantityStepper
              value={effectiveQuantity}
              max={maxQuantity}
              onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
              onIncrease={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
            />
          </div>

          <div className="mt-6 border-t border-gray-200">
            <PdpAccordion title="Product Code">
              <p className="font-medium tracking-[0.08em] text-neutral-900 uppercase">{product.id}</p>
            </PdpAccordion>
            <PdpAccordion title="Product Description">
              <p>{product.description}</p>
              <p className="mt-3">{KIDS_PRODUCT_FABRIC}</p>
              <ul className="mt-3 space-y-1.5">
                {KIDS_PRODUCT_CARE.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <ul className="mt-3 space-y-1.5">
                {DELIVERY_RETURN_BULLETS.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </PdpAccordion>
            <PdpAccordion title="Reviews / Size Guide">
              <p className="mb-2 text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase">Size Guide</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[280px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] tracking-[0.12em] text-neutral-500 uppercase">
                      <th className="py-2 font-medium">Size</th>
                      <th className="py-2 font-medium">Age</th>
                      <th className="py-2 font-medium">Chest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {KIDS_SIZE_GUIDE_ROWS.map((row) => (
                      <tr key={row.size} className="border-b border-gray-100">
                        <td className="py-2 font-medium text-neutral-900">{row.size}</td>
                        <td className="py-2">{row.age}</td>
                        <td className="py-2">{row.chestCm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm">No reviews yet.</p>
            </PdpAccordion>
          </div>

          <Link
            to="/contact"
            className="mt-4 inline-block text-[12px] font-medium tracking-[0.16em] text-neutral-900 uppercase underline underline-offset-4"
          >
            FIND IN STORE
          </Link>

          <PdpActionButtons
            didAddToBag={didAddToBag}
            actionError={actionError}
            shakeToken={shakeToken}
            onAddToBag={handleAddToBag}
            onBuyNow={handleBuyNow}
          />
        </div>
      </div>

      {relatedProducts.length ? (
        <Container className="mt-12">
          <h2 className="border-b border-gray-200 pb-3 text-[13px] font-medium tracking-[0.16em] text-neutral-900 uppercase">
            Similar Products
          </h2>
          <ProductListingGrid className="mt-5">
            {relatedProducts.map((item, index) => (
              <AarongProductCard
                key={item.id}
                product={item}
                href={`/kids/${item.slug}`}
                prefetchModule={prefetchKidsProductDetail}
                priority={index < 4}
                isInWishlist={isInWishlist(String(item.id))}
                onToggleWishlist={(itemProduct) => handleToggleWishlist(itemProduct as KidsOversizedTeeProduct)}
              />
            ))}
          </ProductListingGrid>
        </Container>
      ) : null}

      {instantCheckoutOpen ? (
        <Suspense fallback={null}>
          <InstantCheckoutSheet
            open={instantCheckoutOpen}
            onClose={() => setInstantCheckoutOpen(false)}
            items={instantCheckoutItems}
          />
        </Suspense>
      ) : null}

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

    </section>
  )
}
