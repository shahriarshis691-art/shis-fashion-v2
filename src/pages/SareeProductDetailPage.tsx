import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import AarongProductCard from '../components/shop/AarongProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { useCart, writeBuyNowCheckout } from '../context/CartContext'
import {
  getSareeProductBySlug,
  sareeCollectionProducts,
  type SareeProduct,
} from '../data/sareeCollection'
import { DELIVERY_RETURN_BULLETS, STORE_POLICY } from '../data/storePolicy'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { googleAnalytics } from '../services/googleAnalytics'
import { metaPixel } from '../services/metaPixel'
import { getCatalogContentId } from '../utils/catalogIdentity'
import { parseBDT } from '../utils/currency'
import { applyNotFoundSeo, applySeoMetadata, buildProductSchema } from '../utils/seo'

const prefetchSareeProductDetail = () => import('./SareeProductDetailPage')
const SITE_URL = 'https://www.shisfashion.com'

const SAREE_TRUST = ['Premium Fabric', 'Blouse Piece', 'Cash on Delivery', 'Easy Exchange'] as const

function getStockLabel(stock: number) {
  if (stock <= 0) {
    return 'Out of stock'
  }
  if (stock <= 5) {
    return `Only ${stock} left`
  }
  return 'In stock'
}

function formatDisplayPrice(price: string) {
  const amount = parseBDT(price)
  return `Tk ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function SareeProductDetailPage() {
  const { productSlug } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  const product = useMemo(() => getSareeProductBySlug(productSlug ?? ''), [productSlug])

  const sizes = product?.sizes ?? ['Free Size']
  const colors = product?.colors ?? []
  const defaultSize = sizes[0] ?? 'Free Size'
  const defaultColor = colors[0] ?? 'Default'

  const [selectedSize, setSelectedSize] = useState(defaultSize)
  const [selectedColor, setSelectedColor] = useState(defaultColor)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [didAddToBag, setDidAddToBag] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [activeProductId, setActiveProductId] = useState(product?.id)

  if (product && product.id !== activeProductId) {
    setActiveProductId(product.id)
    setSelectedSize(product.sizes?.[0] ?? 'Free Size')
    setSelectedColor(product.colors?.[0] ?? 'Default')
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
      applyNotFoundSeo(`/sarees/${productSlug ?? ''}`)
      return
    }

    const path = `/sarees/${product.slug}`
    const image = product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`

    applySeoMetadata(path, {
      title: `${product.name} | Saree | SHIS Fashion Bangladesh`,
      description: product.description || 'Premium saree from SHIS Fashion Bangladesh.',
      canonicalPath: path,
      ogImage: image,
      keywords: `saree Bangladesh, ${product.name}, SHIS Fashion saree`,
      schema: [
        buildProductSchema(
          {
            name: product.name,
            description: product.description,
            slug: product.slug,
            category: product.category,
            image,
            price: product.price,
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

    googleAnalytics.viewItem(
      {
        item_id: getCatalogContentId(product),
        item_name: product.name,
        item_category: product.category,
        price: parseBDT(product.price),
        quantity: 1,
        brand: product.brand,
      },
      'BDT',
    )
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
  const availableStock = product?.inStock === false ? 0 : (product?.stock ?? 0)
  const hasColorOptions = colors.length > 0
  const isSizeSelected = Boolean(selectedSize && sizes.includes(selectedSize))
  const isColorSelected = !hasColorOptions || Boolean(selectedColor && colors.includes(selectedColor))
  const safeSize = isSizeSelected ? selectedSize : defaultSize
  const safeColor = isColorSelected ? selectedColor : defaultColor
  const maxQuantity = availableStock > 0 ? Math.min(availableStock, 10) : 1
  const effectiveQuantity = Math.max(1, Math.min(quantity, maxQuantity))
  const canPurchase = Boolean(product && availableStock > 0 && isSizeSelected && isColorSelected)
  const stockLabel = getStockLabel(availableStock)
  const wished = product ? isInWishlist(String(product.id)) : false

  const relatedProducts = useMemo(() => {
    if (!product) {
      return []
    }
    return sareeCollectionProducts.filter((item) => item.id !== product.id).slice(0, 4)
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

    googleAnalytics.addToBag(
      {
        item_id: getCatalogContentId(product),
        item_name: product.name,
        item_category: product.category,
        price: parseBDT(product.price),
        quantity: effectiveQuantity,
        brand: product.brand,
      },
      'BDT',
    )

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
          <p className="text-[12px] font-normal tracking-wide text-neutral-400">Product unavailable</p>
          <h1 className="mt-2 text-2xl text-neutral-900" style={{ fontFamily: 'var(--font-brand)' }}>
            Saree not found
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-7 text-neutral-600">
            This saree is no longer available or the link is incorrect.
          </p>
          <Button to="/sarees" className="mt-6">
            Back to Saree Collection
          </Button>
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-16">
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
            <Link to="/sarees" className="transition-colors hover:text-neutral-700">
              Sarees
            </Link>
          </li>
          <li aria-hidden className="text-neutral-300">
            /
          </li>
          <li className="max-w-[14rem] truncate text-neutral-500 sm:max-w-none">{product.name}</li>
        </ol>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:pt-2">
        <div>
          <div
            className="relative aspect-[3/4] w-full overflow-hidden bg-[#f7f7f8]"
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
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 ease-out hover:scale-[1.02]"
                onError={(event) => {
                  event.currentTarget.src = '/og-image.svg'
                }}
              />
            </button>

            {gallery.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={setPreviousImage}
                  className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 bg-white/80 px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-800 backdrop-blur-sm md:block"
                  aria-label="Previous image"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={setNextImage}
                  className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 bg-white/80 px-2.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-800 backdrop-blur-sm md:block"
                  aria-label="Next image"
                >
                  Next
                </button>
              </>
            ) : null}
          </div>

          {gallery.length > 1 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:px-8 lg:px-0">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden bg-[#f7f7f8] ring-1 transition-shadow ${
                    activeImageIndex === index ? 'ring-neutral-900' : 'ring-transparent'
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="px-4 pt-6 sm:px-8 lg:px-0 lg:pt-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">Saree</p>
          <h1
            className="mt-2 text-[1.65rem] font-normal leading-tight tracking-tight text-neutral-900 md:text-3xl"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            {product.name}
          </h1>

          <div className="mt-4 flex min-h-[2rem] items-baseline gap-3">
            <p className="text-xl font-medium tracking-tight text-neutral-900 tabular-nums md:text-2xl">
              {formatDisplayPrice(product.price)}
            </p>
          </div>
          <p className={`mt-1.5 text-sm ${availableStock <= 0 ? 'text-red-600' : 'text-neutral-500'}`}>{stockLabel}</p>

          <dl className="mt-6 grid gap-3 border-y border-neutral-100 py-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Fabric</dt>
              <dd className="text-right font-medium text-neutral-900">{product.fabric}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Blouse piece</dt>
              <dd className="text-right font-medium text-neutral-900">{product.blousePiece}</dd>
            </div>
          </dl>

          {sizes.length > 1 ? (
            <div className="mt-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Size</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const active = selectedSize === size
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3.75rem] rounded-full px-4 py-2.5 text-[12px] font-medium tracking-wide transition-colors duration-300 ${
                        active ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                      }`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-neutral-600">
              Size: <span className="font-medium text-neutral-900">{safeSize}</span>
            </p>
          )}

          {hasColorOptions ? (
            <div className="mt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Color</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((color) => {
                  const selected = selectedColor === color
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-full px-3.5 py-2 text-[12px] font-medium tracking-wide transition-colors ${
                        selected ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                      }`}
                      aria-pressed={selected}
                    >
                      {color}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Quantity</p>
            <div className="mt-3 inline-flex items-center rounded-full bg-neutral-100">
              <button
                type="button"
                className="px-4 py-2.5 text-sm text-neutral-700"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums text-neutral-900">
                {effectiveQuantity}
              </span>
              <button
                type="button"
                className="px-4 py-2.5 text-sm text-neutral-700"
                onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-8 hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={handleAddToBag}
              disabled={!canPurchase}
              className="flex-1 bg-neutral-900 px-4 py-3.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {didAddToBag ? 'Added to Bag' : 'Add to Bag'}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!canPurchase}
              className="flex-1 border border-neutral-900 px-4 py-3.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Buy Now
            </button>
            <button
              type="button"
              onClick={() => handleToggleWishlist(product)}
              className={`flex h-[3.25rem] w-12 items-center justify-center border transition-colors ${
                wished ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-700'
              }`}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SAREE_TRUST.map((item) => (
              <div
                key={item}
                className="bg-[#f7f7f8] px-2.5 py-3 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-600"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Container className="mt-10 sm:mt-14">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Product Details</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-700">{product.description}</p>
          </div>
          <div>
            <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">Delivery & Returns</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
              {DELIVERY_RETURN_BULLETS.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>{STORE_POLICY.phoneConfirm}</li>
            </ul>
          </div>
        </div>

        {relatedProducts.length ? (
          <div className="mt-12 sm:mt-16">
            <div className="flex items-end justify-between gap-2 border-b border-neutral-100 pb-3">
              <h2 className="text-lg text-neutral-900" style={{ fontFamily: 'var(--font-brand)' }}>
                More Sarees
              </h2>
              <Link
                to="/sarees"
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 hover:text-neutral-900"
              >
                View all
              </Link>
            </div>
            <ProductListingGrid className="mt-6">
              {relatedProducts.map((item, index) => (
                <AarongProductCard
                  key={item.id}
                  product={item}
                  href={`/sarees/${item.slug}`}
                  prefetchModule={prefetchSareeProductDetail}
                  priority={index < 4}
                  isInWishlist={isInWishlist(String(item.id))}
                  onToggleWishlist={(itemProduct) => handleToggleWishlist(itemProduct as SareeProduct)}
                />
              ))}
            </ProductListingGrid>
          </div>
        ) : null}
      </Container>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-100 bg-white/90 backdrop-blur-md sm:hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleAddToBag}
            disabled={!canPurchase}
            className="bg-neutral-900 px-3 py-3.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {didAddToBag ? 'Added' : 'Add to Bag'}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canPurchase}
            className="border border-neutral-900 px-3 py-3.5 text-sm font-medium text-neutral-900 disabled:opacity-40"
          >
            Buy Now
          </button>
          <button
            type="button"
            onClick={() => handleToggleWishlist(product)}
            className={`flex w-12 items-center justify-center border ${
              wished ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-700'
            }`}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
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
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
