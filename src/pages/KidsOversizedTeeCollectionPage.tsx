import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import KidsSizeGuideModal from '../components/kids/KidsSizeGuideModal'
import LuxuryImage from '../components/common/LuxuryImage'
import { useCart } from '../context/CartContext'
import {
  getKidsBadge,
  KIDS_COLOR_LABELS,
  KIDS_OVERSIZED_SIZES,
  kidsOversizedTeeProducts,
  type KidsGenderCategory,
  type KidsOversizedTeeProduct,
} from '../data/kidsOversizedTeeCollection'
import { createOrder } from '../firebase/adminService'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { formatBDT, parseBDT } from '../utils/currency'
import { formatBangladeshPhoneInput, normalizeBangladeshPhone } from '../utils/bangladeshAddress'
import { applySeoMetadata, buildProductSchema } from '../utils/seo'

type GenderFilter = 'all' | KidsGenderCategory
type SortOption = 'newest' | 'price-low' | 'price-high'
type DeliveryArea = 'inside-dhaka' | 'outside-dhaka'
type PaymentMethod = 'cod' | 'bkash' | 'nagad'

const INSIDE_DHAKA_FEE = 60
const OUTSIDE_DHAKA_FEE = 120
const SITE_URL = 'https://www.shisfashion.com'
const ALL_KIDS_PRODUCTS = kidsOversizedTeeProducts

function prefetchKidsProductDetail() {
  void import('./KidsProductDetailPage')
}

function matchesGenderFilter(product: KidsOversizedTeeProduct, genderFilter: GenderFilter) {
  if (genderFilter === 'all') {
    return true
  }

  const selected = genderFilter.trim().toLowerCase()
  const productGender = product.genderCategory.trim().toLowerCase()
  const productCategory = String(product.category ?? '').trim().toLowerCase()

  if (productGender === selected) {
    return true
  }

  if (selected === 'kids boy' || selected === 'boys') {
    return productGender.includes('boy') || productCategory.includes('boy')
  }

  if (selected === 'kids girl' || selected === 'girls') {
    return productGender.includes('girl') || productCategory.includes('girl')
  }

  if (selected === 'unisex') {
    return productGender.includes('unisex') || productCategory.includes('unisex') || productCategory === 'kids'
  }

  return false
}

function matchesSizeFilter(product: KidsOversizedTeeProduct, sizeFilter: string) {
  if (sizeFilter === 'all') {
    return true
  }

  return (product.sizes ?? []).some((size) => size.trim().toLowerCase() === sizeFilter.trim().toLowerCase())
}

function matchesSearch(product: KidsOversizedTeeProduct, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [
    product.name,
    product.genderCategory,
    product.description ?? '',
    ...(product.colors ?? []),
    ...(product.colorHexes ?? []).map((hex) => KIDS_COLOR_LABELS[hex] ?? hex),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

const GENDER_OPTIONS: Array<{ value: GenderFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'Kids Boy', label: 'Boys' },
  { value: 'Kids Girl', label: 'Girls' },
  { value: 'Unisex', label: 'Unisex' },
]

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

interface QuickPickState {
  product: KidsOversizedTeeProduct
  size: string
  colorHex: string
  quantity: number
}

interface SuccessState {
  orderId: string
  productName: string
  total: number
  paymentMethod: PaymentMethod
}

function KidsProductCard({
  product,
  priority,
  onQuickAdd,
  onToggleWishlist,
  wished,
}: {
  product: KidsOversizedTeeProduct
  priority?: boolean
  onQuickAdd: (product: KidsOversizedTeeProduct, colorHex?: string) => void
  onToggleWishlist: (product: KidsOversizedTeeProduct) => void
  wished: boolean
}) {
  const [activeColorHex, setActiveColorHex] = useState(product.colorHexes[0])
  const badge = getKidsBadge(product)
  const secondaryImage = product.galleryImages?.[1]
  const sizesPreview = (product.sizes ?? []).slice(0, 4)
  const colorLabel = KIDS_COLOR_LABELS[activeColorHex] ?? activeColorHex
  const detailHref = `/kids/${product.slug}?color=${encodeURIComponent(colorLabel)}`

  return (
    <article className="group min-w-0 bg-[#fcfcfc]">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f8f8f8]">
        <Link
          to={detailHref}
          className="absolute inset-0 z-0 block h-full w-full"
          aria-label={`View ${product.name}`}
          onMouseEnter={prefetchKidsProductDetail}
          onFocus={prefetchKidsProductDetail}
        >
          <span className="sr-only">{product.name}</span>
        </Link>

        <img
          src={product.image}
          alt={product.name}
          width={960}
          height={1280}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          className={`pointer-events-none absolute inset-0 h-full w-full object-contain p-2 transition-[opacity,transform] duration-300 ease-out ${
            secondaryImage ? 'opacity-100 group-hover:opacity-0' : 'group-hover:scale-[1.02]'
          }`}
          onError={(event) => {
            event.currentTarget.src = '/og-image.svg'
          }}
        />

        {secondaryImage ? (
          <img
            src={secondaryImage}
            alt=""
            aria-hidden
            width={960}
            height={1280}
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full object-contain p-2 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
            onError={(event) => {
              event.currentTarget.src = '/og-image.svg'
            }}
          />
        ) : null}

        {badge ? (
          <span className="pointer-events-none absolute left-2 top-2 z-10 bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-800">
            {badge}
          </span>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleWishlist(product)
          }}
          className="absolute top-2.5 right-2.5 z-20 text-neutral-600 transition-colors hover:text-red-500"
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onQuickAdd(product, activeColorHex)
          }}
          className="absolute bottom-2.5 right-2.5 z-20 flex h-8 w-8 items-center justify-center border border-neutral-900/15 bg-white/95 text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white md:hidden"
          aria-label={`Quick add ${product.name}`}
        >
          <span className="text-lg leading-none">+</span>
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden bg-gradient-to-t from-black/40 via-black/10 to-transparent px-2 pb-2 pt-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block">
          <div className="flex flex-wrap gap-1">
            {sizesPreview.map((size) => (
              <span key={size} className="bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-neutral-900">
                {size}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Link
        to={detailHref}
        className="mt-2.5 block w-full text-left"
        onMouseEnter={prefetchKidsProductDetail}
        onFocus={prefetchKidsProductDetail}
      >
        <h2 className="line-clamp-1 text-xs font-semibold text-neutral-900 md:text-sm">{product.name}</h2>
        <p className="mt-0.5 text-xs font-medium text-neutral-800 md:text-sm">{product.price}</p>
      </Link>

      <div className="mt-1.5 flex flex-wrap gap-1 md:hidden">
        {sizesPreview.slice(0, 3).map((size) => (
          <span key={size} className="border border-black/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-neutral-600">
            {size}
          </span>
        ))}
      </div>

      {product.colorHexes.length > 1 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5" role="listbox" aria-label={`${product.name} colors`}>
          {product.colorHexes.map((hex) => (
            <button
              key={hex}
              type="button"
              role="option"
              aria-selected={activeColorHex === hex}
              aria-label={KIDS_COLOR_LABELS[hex] ?? hex}
              onClick={(event) => {
                event.stopPropagation()
                setActiveColorHex(hex)
              }}
              className={`h-3.5 w-3.5 rounded-full border transition-transform ${
                activeColorHex === hex ? 'scale-110 border-neutral-900' : 'border-black/20'
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function QuickAddSheet({
  pick,
  onChange,
  onClose,
  onAddToBag,
  onCodCheckout,
  onOpenSizeGuide,
}: {
  pick: QuickPickState
  onChange: (next: QuickPickState) => void
  onClose: () => void
  onAddToBag: () => void
  onCodCheckout: () => void
  onOpenSizeGuide: () => void
}) {
  const colorLabel = KIDS_COLOR_LABELS[pick.colorHex] ?? pick.colorHex

  return (
    <div className="fixed inset-0 z-[94] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Quick add">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Close quick add" onClick={onClose} />
      <div className="relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-w-md sm:rounded-2xl sm:p-5">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/55">Quick Buy</p>
            <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-neutral-900">{pick.product.name}</h2>
            <p className="mt-1 text-sm font-medium text-neutral-800">{pick.product.price}</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 border border-black/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
            Close
          </button>
        </div>

        <div className="mt-4 flex gap-3">
          <div className="h-24 w-[4.5rem] shrink-0 overflow-hidden bg-[#f8f8f8] sm:h-28 sm:w-20">
            <LuxuryImage
              src={pick.product.image}
              alt={pick.product.name}
              width={320}
              height={428}
              sizes="80px"
              widths={[160, 320]}
              aspectClassName="aspect-[3/4]"
              imgClassName="h-full w-full object-contain p-1"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{pick.product.genderCategory}</p>
            <p className="mt-2 text-xs text-neutral-600">
              {pick.size} · {colorLabel}
            </p>
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-800 underline underline-offset-4"
            >
              Size Guide
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Select Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {KIDS_OVERSIZED_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onChange({ ...pick, size })}
                className={`min-w-[3.25rem] border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                  pick.size === size ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pick.product.colorHexes.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onChange({ ...pick, colorHex: hex })}
                className={`flex items-center gap-2 border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                  pick.colorHex === hex ? 'border-neutral-900' : 'border-black/15'
                }`}
                aria-label={KIDS_COLOR_LABELS[hex] ?? hex}
              >
                <span className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ backgroundColor: hex }} />
                {KIDS_COLOR_LABELS[hex] ?? hex}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={onAddToBag}
            className="inline-flex w-full items-center justify-center bg-neutral-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white"
          >
            Add to Bag
          </button>
          <button
            type="button"
            onClick={onCodCheckout}
            className="inline-flex w-full items-center justify-center border border-neutral-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900"
          >
            Cash on Delivery
          </button>
        </div>
      </div>
    </div>
  )
}

function QuickOrderDrawer({
  order,
  onClose,
  onChange,
  onSuccess,
  onOpenSizeGuide,
}: {
  order: QuickPickState
  onClose: () => void
  onChange: (next: QuickPickState) => void
  onSuccess: (result: SuccessState) => void
  onOpenSizeGuide: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea>('inside-dhaka')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const unitPrice = parseBDT(order.product.price)
  const deliveryFee = deliveryArea === 'inside-dhaka' ? INSIDE_DHAKA_FEE : OUTSIDE_DHAKA_FEE
  const subtotal = unitPrice * order.quantity
  const total = subtotal + deliveryFee
  const colorLabel = KIDS_COLOR_LABELS[order.colorHex] ?? order.colorHex

  const handleConfirm = async () => {
    setSubmitError('')

    if (name.trim().length < 2) {
      setSubmitError('Please enter the customer full name.')
      return
    }

    const phoneNumber = normalizeBangladeshPhone(phone)
    if (!phoneNumber) {
      setSubmitError('Please enter a valid Bangladesh mobile number (01XXXXXXXXX).')
      return
    }

    if (address.trim().length < 8) {
      setSubmitError('Please enter a full delivery address.')
      return
    }

    if (!order.size) {
      setSubmitError('Please select a size.')
      return
    }

    setIsSubmitting(true)

    try {
      const created = await createOrder({
        customerName: name.trim(),
        customerPhone: phoneNumber,
        customerEmail: '',
        address: `${address.trim()} (${deliveryArea === 'inside-dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})`,
        deliveryAddress: {
          division: deliveryArea === 'inside-dhaka' ? 'Dhaka' : 'Chattogram',
          district: deliveryArea === 'inside-dhaka' ? 'Dhaka' : 'Chattogram',
          upazila: '',
          streetAddress: address.trim(),
          deliveryNote: `Kids oversized tee quick order · ${order.product.name} · ${
            deliveryArea === 'inside-dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'
          }`,
        },
        deliveryCharge: deliveryFee,
        notes: `Quick order · Size ${order.size} · Color ${colorLabel}`,
        items: [
          {
            name: order.product.name,
            price: order.product.price,
            quantity: order.quantity,
            size: order.size,
            color: colorLabel,
            slug: order.product.slug,
          },
        ],
        total,
        status: 'new',
        trackingNumber: '',
        paymentMethod,
      })

      onSuccess({
        orderId: created.id,
        productName: order.product.name,
        total,
        paymentMethod,
      })
    } catch {
      setSubmitError('Unable to place the order right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Quick order checkout">
      <button type="button" className="absolute inset-0 bg-black/65" aria-label="Close quick order" onClick={onClose} />
      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-5">
        <div className="flex items-start justify-between gap-3 border-b border-black/10 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/55">Quick Order</p>
            <h2 className="mt-1 text-sm font-semibold text-neutral-900 sm:text-base">{order.product.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="border border-black/15 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
            Close
          </button>
        </div>

        <div className="mt-4 flex gap-3">
          <div className="h-28 w-20 shrink-0 overflow-hidden bg-[#f8f8f8]">
            <LuxuryImage
              src={order.product.image}
              alt={order.product.name}
              width={320}
              height={428}
              sizes="80px"
              widths={[160, 320]}
              aspectClassName="aspect-[3/4]"
              imgClassName="h-full w-full object-contain p-1"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">{order.product.genderCategory}</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">{order.product.price}</p>
            <p className="mt-2 text-xs text-neutral-600">
              {order.size} · {colorLabel} · Qty {order.quantity}
            </p>
            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-800 underline underline-offset-4"
            >
              Size Guide
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {KIDS_OVERSIZED_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChange({ ...order, size })}
                  className={`min-w-[3.25rem] border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    order.size === size ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {order.product.colorHexes.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => onChange({ ...order, colorHex: hex })}
                  className={`flex items-center gap-2 border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    order.colorHex === hex ? 'border-neutral-900' : 'border-black/15'
                  }`}
                  aria-label={KIDS_COLOR_LABELS[hex] ?? hex}
                >
                  <span className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ backgroundColor: hex }} />
                  {KIDS_COLOR_LABELS[hex] ?? hex}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Quantity</p>
            <div className="mt-2 inline-flex items-center border border-black/15">
              <button
                type="button"
                className="px-3 py-2 text-sm"
                onClick={() => onChange({ ...order, quantity: Math.max(1, order.quantity - 1) })}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center text-sm font-semibold">{order.quantity}</span>
              <button
                type="button"
                className="px-3 py-2 text-sm"
                onClick={() => onChange({ ...order, quantity: Math.min(10, order.quantity + 1) })}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
              Full Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full border border-black/15 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none"
                placeholder="Customer full name"
                autoComplete="name"
              />
            </label>

            <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
              Mobile Number
              <input
                value={phone}
                onChange={(event) => setPhone(formatBangladeshPhoneInput(event.target.value))}
                className="mt-1.5 w-full border border-black/15 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none"
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>

            <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
              Full Delivery Address
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="mt-1.5 min-h-20 w-full border border-black/15 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none"
                placeholder="House, road, area, landmark"
              />
            </label>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Delivery Area</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryArea('inside-dhaka')}
                className={`border px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] ${
                  deliveryArea === 'inside-dhaka' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15'
                }`}
              >
                Inside Dhaka · {formatBDT(INSIDE_DHAKA_FEE)}
              </button>
              <button
                type="button"
                onClick={() => setDeliveryArea('outside-dhaka')}
                className={`border px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.1em] ${
                  deliveryArea === 'outside-dhaka' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15'
                }`}
              >
                Outside Dhaka · {formatBDT(OUTSIDE_DHAKA_FEE)}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Payment Method</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([
                ['cod', 'COD'],
                ['bkash', 'bKash'],
                ['nagad', 'Nagad'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={`border px-2 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    paymentMethod === value ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-black/10 bg-[#fafafa] px-3 py-3 text-sm">
            <div className="flex items-center justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>{formatBDT(subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-neutral-600">
              <span>Delivery</span>
              <span>{formatBDT(deliveryFee)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2 font-semibold text-neutral-900">
              <span>Total</span>
              <span>{formatBDT(total)}</span>
            </div>
          </div>

          {submitError ? <p className="text-sm text-red-700">{submitError}</p> : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleConfirm()}
            className="inline-flex w-full items-center justify-center bg-neutral-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? 'Placing Order…' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessPopup({ result, onClose }: { result: SuccessState; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4" role="alertdialog" aria-modal="true" aria-label="Order confirmed">
      <button type="button" className="absolute inset-0 bg-black/65" aria-label="Close success message" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md border border-white/20 bg-white p-6 text-center shadow-2xl transition-opacity duration-300">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Order Confirmed</p>
        <h2 className="mt-2 text-lg font-semibold text-neutral-900" style={{ fontFamily: 'var(--font-brand)' }}>
          Thank you
        </h2>
        <p className="mt-2 text-sm text-neutral-600">{result.productName}</p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-neutral-500">Order ID</p>
        <p className="mt-1 break-all text-sm font-semibold text-neutral-900">{result.orderId}</p>
        <p className="mt-3 text-sm text-neutral-700">
          Total {formatBDT(result.total)} · {result.paymentMethod.toUpperCase()}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex w-full items-center justify-center bg-neutral-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  )
}

export default function KidsOversizedTeeCollectionPage() {
  const location = useLocation()
  const { addToCart } = useCart()
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
  const [sizeFilter, setSizeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [quickAdd, setQuickAdd] = useState<QuickPickState | null>(null)
  const [quickOrder, setQuickOrder] = useState<QuickPickState | null>(null)
  const [success, setSuccess] = useState<SuccessState | null>(null)
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  const visibleProducts = useMemo(() => {
    const filtered = ALL_KIDS_PRODUCTS.filter((product) => {
      if (!matchesGenderFilter(product, genderFilter)) {
        return false
      }

      if (!matchesSizeFilter(product, sizeFilter)) {
        return false
      }

      if (!matchesSearch(product, searchQuery)) {
        return false
      }

      return product.inStock !== false
    })

    const sorted = [...filtered]
    if (sortBy === 'price-low') {
      sorted.sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
    } else if (sortBy === 'price-high') {
      sorted.sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
    } else {
      sorted.sort((left, right) => Number(right.newest) - Number(left.newest) || Number(right.featured) - Number(left.featured))
    }

    return sorted
  }, [genderFilter, sizeFilter, sortBy, searchQuery])

  useEffect(() => {
    const canonicalPath = location.pathname.startsWith('/collections/')
      ? location.pathname
      : '/kids'

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Kids Oversized Tee Collection',
      url: `${SITE_URL}${canonicalPath}`,
      numberOfItems: ALL_KIDS_PRODUCTS.length,
      itemListElement: ALL_KIDS_PRODUCTS.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/kids/${product.slug}`,
        name: product.name,
        image: product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
      })),
    }

    const productSchemas = ALL_KIDS_PRODUCTS.map((product) =>
      buildProductSchema(
        {
          name: product.name,
          description: product.description ?? 'Premium kids oversized tee from SHIS Fashion.',
          slug: product.slug,
          category: product.category,
          image: product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
          price: product.price,
          comparePrice: product.comparePrice,
          brand: product.brand,
          stock: product.stock ?? 0,
        },
        `/kids/${product.slug}`,
      ),
    )

    applySeoMetadata(canonicalPath, {
      title: 'Kids Oversized Tee Collection | SHIS Fashion Bangladesh',
      description:
        'Premium heavy cotton kids oversized drop-shoulder tees for boys, girls, and unisex styles. Shop SHIS Fashion Bangladesh.',
      canonicalPath,
      keywords: 'kids oversized tee, kids t-shirt Bangladesh, SHIS Fashion kids',
      schema: [itemListSchema, ...productSchemas],
    })
  }, [location.pathname])

  useEffect(() => {
    if (!quickAdd && !quickOrder && !success && !sizeGuideOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [quickAdd, quickOrder, success, sizeGuideOpen])

  const openQuickAdd = (product: KidsOversizedTeeProduct, colorHex?: string) => {
    setQuickAdd({
      product,
      size: product.sizes?.[2] ?? '8-9Y',
      colorHex: colorHex ?? product.colorHexes[0],
      quantity: 1,
    })
  }

  const handleAddToBag = () => {
    if (!quickAdd) {
      return
    }

    const colorLabel = KIDS_COLOR_LABELS[quickAdd.colorHex] ?? quickAdd.colorHex
    addToCart(quickAdd.product, {
      size: quickAdd.size,
      color: colorLabel,
      quantity: quickAdd.quantity,
    })
    setQuickAdd(null)
  }

  return (
    <section className="bg-white pb-24 pt-6 md:pb-20 md:pt-10">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
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
            <li className="text-black">Oversized Tees</li>
          </ol>
        </nav>

        <header className="mt-5 max-w-3xl border-b border-black/10 pb-6">
          <p className="text-caption uppercase tracking-[0.14em] text-black/55">Kids Edit</p>
          <h1
            className="mt-1 text-xl font-normal uppercase tracking-[0.16em] text-neutral-900 sm:text-2xl md:text-3xl"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            Kids Oversized Collection
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/70">
            Premium heavy cotton, relaxed drop-shoulder fits designed for modern kids.
          </p>
        </header>

        <div className="mt-6 flex flex-col gap-4 border border-black/10 bg-[#fafafa] p-3 sm:p-4">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
            Search
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search graphic tees, plain tees, colors..."
              className="mt-2 w-full border border-black/15 bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none"
            />
          </label>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Filter by Gender</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGenderFilter(option.value)}
                    className={`border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      genderFilter === option.value ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="border border-black/15 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-800 hover:border-neutral-900"
              >
                Size Guide
              </button>

              <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
                Sort
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="border border-black/15 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-900 outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Filter by Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSizeFilter('all')}
                className={`border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  sizeFilter === 'all' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                }`}
              >
                All
              </button>
              {KIDS_OVERSIZED_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSizeFilter(size)}
                  className={`border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    sizeFilter === size ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60">
            {visibleProducts.length} products
          </p>
        </div>

        {visibleProducts.length ? (
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-x-6 md:gap-y-10">
            {visibleProducts.map((product, index) => (
              <KidsProductCard
                key={product.id}
                product={product}
                priority={index < 4}
                wished={isInWishlist(String(product.id))}
                onToggleWishlist={handleToggleWishlist}
                onQuickAdd={openQuickAdd}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-black/20 px-4 py-10 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">No matching styles</p>
            <button
              type="button"
              onClick={() => {
                setGenderFilter('all')
                setSizeFilter('all')
                setSortBy('newest')
                setSearchQuery('')
              }}
              className="ui-interactive mt-4 inline-flex border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {quickAdd ? (
        <QuickAddSheet
          pick={quickAdd}
          onChange={setQuickAdd}
          onClose={() => setQuickAdd(null)}
          onAddToBag={handleAddToBag}
          onCodCheckout={() => {
            setQuickOrder(quickAdd)
            setQuickAdd(null)
          }}
          onOpenSizeGuide={() => setSizeGuideOpen(true)}
        />
      ) : null}

      {quickOrder ? (
        <QuickOrderDrawer
          order={quickOrder}
          onChange={setQuickOrder}
          onClose={() => setQuickOrder(null)}
          onOpenSizeGuide={() => setSizeGuideOpen(true)}
          onSuccess={(result) => {
            setQuickOrder(null)
            setSuccess(result)
          }}
        />
      ) : null}

      {sizeGuideOpen ? <KidsSizeGuideModal onClose={() => setSizeGuideOpen(false)} /> : null}

      {success ? <SuccessPopup result={success} onClose={() => setSuccess(null)} /> : null}
    </section>
  )
}
