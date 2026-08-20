import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { useCart, clearBuyNowCheckout, readBuyNowCheckout } from '../context/CartContext'
import { createOrder, getCouponByCode, isOrderBackendReady, subscribeToHomepageContent } from '../firebase/adminService'
import { formatBDT, parseBDT } from '../utils/currency'
import { bangladeshDivisions, DEFAULT_FREE_DELIVERY_THRESHOLD, getDeliveryCharge, getDistrictsForDivision, getUpazilasForDistrict, type BangladeshDivision } from '../utils/bangladeshAddress'
import { googleAnalytics } from '../services/googleAnalytics'
import { metaPixel } from '../services/metaPixel'

const ORDER_CONFIRMATION_KEY = 'shis-fashion-last-order'
const CHECKOUT_ANTI_BOT_COOLDOWN_KEY = 'shis-checkout-last-submit-at'
const CHECKOUT_ANTI_BOT_MIN_DWELL_MS = 2000
const CHECKOUT_ANTI_BOT_COOLDOWN_MS = 15000

interface CheckoutFormState {
  name: string
  phone: string
  email: string
  division: BangladeshDivision
  district: string
  upazila: string
  streetAddress: string
  deliveryNote: string
}

function getWhatsAppHref() {
  return 'https://wa.me/8801887848304'
}

function normalizeBangladeshPhone(raw: string) {
  const digits = raw.replace(/\D/g, '')

  if (!digits) {
    return null
  }

  if (digits.startsWith('8801') && digits.length === 13) {
    return `0${digits.slice(3)}`
  }

  if (digits.startsWith('01') && digits.length === 11) {
    return digits
  }

  return null
}

function formatBangladeshPhoneInput(raw: string) {
  const digits = raw.replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  if (digits.startsWith('8801')) {
    return `0${digits.slice(3).slice(0, 10)}`
  }

  if (digits.startsWith('88')) {
    return `0${digits.slice(2).slice(0, 10)}`
  }

  if (digits.startsWith('01')) {
    return digits.slice(0, 11)
  }

  if (digits.length === 10) {
    return `0${digits}`
  }

  return digits.slice(0, 11)
}

function isPermissionDeniedError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code ?? '').toLowerCase()
    : ''

  return code.includes('permission-denied') || message.includes('permission-denied') || message.includes('missing or insufficient permissions')
}

function currentTimeMs() {
  return Date.now()
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items: cartItems, clearCart, appliedCoupon, applyCoupon, removeCoupon } = useCart()
  const [buyNowItems] = useState(() => readBuyNowCheckout())
  const items = buyNowItems ?? cartItems
  const isBuyNowCheckout = Boolean(buyNowItems?.length)
  const initialDivision = bangladeshDivisions[0]
  const initialDistrict = getDistrictsForDivision(initialDivision)[0]
  const initialUpazila = getUpazilasForDistrict(initialDistrict)[0]
  const [form, setForm] = useState<CheckoutFormState>({
    name: '',
    phone: '',
    email: '',
    division: initialDivision,
    district: initialDistrict,
    upazila: initialUpazila,
    streetAddress: '',
    deliveryNote: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [websiteField, setWebsiteField] = useState('')
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code ?? '')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState('')
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(DEFAULT_FREE_DELIVERY_THRESHOLD)
  const submissionLockRef = useRef(false)
  const hasTrackedCheckoutRef = useRef(false)
  const enteredAtRef = useRef(0)
  const subtotal = items.reduce((sum, item) => sum + parseBDT(item.price) * item.quantity, 0)
  const discountAmount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discountPercent / 100 * 100) / 100 : 0
  const deliveryCharge = getDeliveryCharge(form.division as BangladeshDivision, subtotal, freeDeliveryThreshold)
  const effectiveGrandTotal = subtotal + deliveryCharge - discountAmount
  const districtOptions = getDistrictsForDivision(form.division as BangladeshDivision)
  const upazilaOptions = getUpazilasForDistrict(form.district)
  const backendReady = isOrderBackendReady()
  const summaryLabel = formatBDT(effectiveGrandTotal)
  const supportWhatsAppHref = getWhatsAppHref()
  const normalizedPhone = useMemo(() => normalizeBangladeshPhone(form.phone), [form.phone])
  const isPhoneValid = normalizedPhone !== null
  const phoneHasValue = form.phone.trim().length > 0
  const previewItems = items.slice(0, 2)
  const remainingItemsCount = Math.max(0, items.length - previewItems.length)
  const canSubmit = Boolean(
    form.name.trim() &&
    isPhoneValid &&
    form.streetAddress.trim().length >= 5 &&
    form.division &&
    form.district &&
    form.upazila &&
    !isSubmitting,
  )

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => {
      setFreeDeliveryThreshold(content.freeDeliveryThreshold ?? DEFAULT_FREE_DELIVERY_THRESHOLD)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!items.length || hasTrackedCheckoutRef.current) {
      return
    }

    metaPixel.trackInitiateCheckout({
      value: subtotal - discountAmount,
      currency: 'BDT',
      content_type: 'product',
      content_ids: items.map((item) => String(item.id)),
    })

    googleAnalytics.beginCheckout({
      value: subtotal - discountAmount,
      currency: 'BDT',
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: parseBDT(item.price),
        quantity: item.quantity,
        brand: item.brand,
      })),
    })

    hasTrackedCheckoutRef.current = true
  }, [discountAmount, items, subtotal])

  useEffect(() => {
    enteredAtRef.current = currentTimeMs()
  }, [])

  if (!items.length) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Checkout</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">Your bag is empty.</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--color-muted)]">Select a piece from the collection before trying to place an order.</p>
            <div className="mt-8 flex justify-center">
              <Button to="/shop">Continue shopping</Button>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  const handleApplyCoupon = async () => {
    const trimmed = couponCode.trim()
    if (!trimmed) {
      setCouponMessage('Please enter a coupon code.')
      return
    }

    setCouponLoading(true)
    setCouponMessage('')

    try {
      const result = await getCouponByCode(trimmed, form.email)

      if (!result || result.status !== 'active' || !result.code) {
        setCouponMessage('Invalid or expired coupon code.')
        setCouponLoading(false)
        return
      }

      applyCoupon(result.code, result.id, result.discountPercent)
      setCouponMessage(`Coupon applied. You save ${result.discountPercent}%.`)
    } catch (error) {
      setCouponMessage(error instanceof Error ? error.message : 'Unable to validate coupon. Please try again.')
    }

    setCouponLoading(false)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting || submissionLockRef.current) {
      return
    }

    submissionLockRef.current = true
    setIsSubmitting(true)
    setSubmitError('')
    let shouldReleaseLock = true

    if (websiteField.trim()) {
      setSubmitError('Order যাচাই করা যায়নি। একটু পরে আবার চেষ্টা করুন।')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    if (currentTimeMs() - enteredAtRef.current < CHECKOUT_ANTI_BOT_MIN_DWELL_MS) {
      setSubmitError('Please wait a moment and submit again.')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    if (typeof window !== 'undefined') {
      const lastSubmitAt = Number(window.localStorage.getItem(CHECKOUT_ANTI_BOT_COOLDOWN_KEY) ?? '0')
      if (lastSubmitAt && currentTimeMs() - lastSubmitAt < CHECKOUT_ANTI_BOT_COOLDOWN_MS) {
        setSubmitError('You are submitting too quickly. Please wait a few seconds and try again.')
        setIsSubmitting(false)
        submissionLockRef.current = false
        return
      }
    }

    const phoneNumber = normalizeBangladeshPhone(form.phone)
    if (!phoneNumber) {
      setSubmitError('Please enter a valid Bangladesh phone number (01XXXXXXXXX).')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    if (form.streetAddress.trim().length < 5) {
      setSubmitError('Please enter your full address (house, road, or area).')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    const composedAddress = [form.streetAddress.trim(), form.upazila, form.district, form.division]
      .filter(Boolean)
      .join(', ')

    try {
      const createdOrder = await createOrder({
        customerName: form.name.trim(),
        customerPhone: phoneNumber,
        customerEmail: form.email.trim(),
        address: composedAddress,
        deliveryAddress: {
          division: form.division,
          district: form.district,
          upazila: form.upazila,
          streetAddress: form.streetAddress.trim(),
          deliveryNote: form.deliveryNote.trim(),
        },
        deliveryCharge,
        notes: form.deliveryNote.trim(),
        items: items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          slug: item.slug,
        })),
        total: effectiveGrandTotal,
        status: 'new',
        trackingNumber: '',
      }, appliedCoupon ? {
        code: appliedCoupon.code,
        discountPercent: appliedCoupon.discountPercent,
        discountAmount,
        couponId: appliedCoupon.couponId,
      } : null)

      const orderSnapshot = {
        orderId: createdOrder.id,
        customerName: form.name.trim(),
        customerPhone: phoneNumber,
        address: composedAddress,
        paymentMethod: 'Cash on Delivery',
        deliveryCharge: createdOrder.deliveryCharge ?? deliveryCharge,
        subtotal,
        grandTotal: createdOrder.total,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        couponCode: appliedCoupon?.code ?? createdOrder.couponCode ?? '',
        couponDiscountPercent: appliedCoupon?.discountPercent ?? createdOrder.couponDiscountPercent ?? 0,
        couponDiscountAmount: createdOrder.couponDiscountAmount ?? discountAmount,
        createdAt: new Date().toISOString(),
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(ORDER_CONFIRMATION_KEY, JSON.stringify(orderSnapshot))
        window.localStorage.setItem(CHECKOUT_ANTI_BOT_COOLDOWN_KEY, String(currentTimeMs()))
      }

      clearBuyNowCheckout()
      if (!isBuyNowCheckout) {
        clearCart()
      }
      shouldReleaseLock = false
      navigate('/order-success', { state: { orderId: createdOrder.id } })
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Order submission failed. Please try again.'
      const message = isPermissionDeniedError(error)
        ? 'Order service temporarily unavailable. Please contact support on WhatsApp to confirm your order.'
        : rawMessage
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
      if (shouldReleaseLock) {
        submissionLockRef.current = false
      }
    }
  }

  return (
    <section className="bg-white px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4 text-[var(--color-text)] sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="mx-auto max-w-[760px]">
          <form id="checkout-form" className="space-y-8" onSubmit={handleSubmit}>
            <div className="hidden" aria-hidden>
              <label htmlFor="checkout-website">Website</label>
              <input
                id="checkout-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={websiteField}
                onChange={(event) => setWebsiteField(event.target.value)}
              />
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="checkout-name" className="text-sm font-medium text-[var(--color-text)]">Full Name *</label>
                <input
                  id="checkout-name"
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5"
                  placeholder="Full Name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="checkout-phone" className="text-sm font-medium text-[var(--color-text)]">Phone Number *</label>
                <input
                  id="checkout-phone"
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: formatBangladeshPhoneInput(event.target.value) })}
                  className={`w-full rounded-[1rem] border bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:bg-white focus:ring-2 ${isPhoneValid ? 'border-emerald-500 focus:border-emerald-600 focus:ring-emerald-100' : 'border-[var(--color-border)] focus:border-black focus:ring-black/5'}`}
                  placeholder="01XXXXXXXXX"
                  aria-describedby="phone-help"
                  aria-invalid={phoneHasValue ? !isPhoneValid : undefined}
                />
                <div id="phone-help" className="flex items-start justify-between gap-3 text-sm">
                  <p className={phoneHasValue && !isPhoneValid ? 'text-red-600' : 'text-[var(--color-muted)]'}>
                    {phoneHasValue && !isPhoneValid ? 'Enter a valid Bangladeshi mobile number.' : 'Example: 01712345678'}
                  </p>
                  {isPhoneValid ? <p className="shrink-0 text-emerald-600">Valid</p> : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--color-text)]">Division *</span>
                  <select
                    required
                    value={form.division}
                    onChange={(event) => {
                      const nextDivision = event.target.value as BangladeshDivision
                      const nextDistricts = getDistrictsForDivision(nextDivision)
                      const nextDistrict = nextDistricts[0]
                      const nextUpazilas = getUpazilasForDistrict(nextDistrict)
                      setForm({
                        ...form,
                        division: nextDivision,
                        district: nextDistrict,
                        upazila: nextUpazilas[0],
                      })
                    }}
                    className="w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition-colors focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5"
                  >
                    {bangladeshDivisions.map((division) => <option key={division} value={division}>{division}</option>)}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--color-text)]">District *</span>
                  <select
                    required
                    value={form.district}
                    onChange={(event) => {
                      const nextDistrict = event.target.value
                      const nextUpazilas = getUpazilasForDistrict(nextDistrict)
                      setForm({ ...form, district: nextDistrict, upazila: nextUpazilas[0] })
                    }}
                    className="w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition-colors focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5"
                  >
                    {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
                  </select>
                </label>

                <label className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <span className="text-sm font-medium text-[var(--color-text)]">Upazila *</span>
                  <select
                    required
                    value={form.upazila}
                    onChange={(event) => setForm({ ...form, upazila: event.target.value })}
                    className="w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition-colors focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5"
                  >
                    {upazilaOptions.map((upazila) => <option key={upazila} value={upazila}>{upazila}</option>)}
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-sm text-[var(--color-muted)]">
                <span>{form.division}</span>
                <span>{formatBDT(deliveryCharge)}</span>
              </div>

              <div className="space-y-2">
                <label htmlFor="checkout-address" className="text-sm font-medium text-[var(--color-text)]">Full Address *</label>
                <textarea
                  id="checkout-address"
                  required
                  minLength={5}
                  autoComplete="street-address"
                  value={form.streetAddress}
                  onChange={(event) => setForm({ ...form, streetAddress: event.target.value })}
                  className="min-h-24 w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5"
                  placeholder="House, road, village, or area"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="checkout-apartment" className="text-sm font-medium text-[var(--color-text)]">Apartment / Floor / Landmark (Optional)</label>
                <input
                  id="checkout-apartment"
                  value={form.deliveryNote}
                  onChange={(event) => setForm({ ...form, deliveryNote: event.target.value })}
                  className="w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5"
                  placeholder="Apartment, Floor, Landmark"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="checkout-email" className="text-sm font-medium text-[var(--color-text)]">Email Address (Optional)</label>
                <input
                  id="checkout-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-black focus:bg-white focus:ring-2 focus:ring-black/5"
                  placeholder="Email Address"
                />
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-[var(--color-text)]">Promo Code</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-black focus:ring-2 focus:ring-black/5"
                  maxLength={12}
                />
                <button
                  type="button"
                  onClick={() => { void handleApplyCoupon() }}
                  disabled={couponLoading || !couponCode.trim()}
                  className="ui-interactive rounded-[1rem] border border-black bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#121212] disabled:cursor-not-allowed disabled:bg-black/35"
                >
                  {couponLoading ? 'Applying…' : 'Apply'}
                </button>
              </div>
              {appliedCoupon ? (
                <div className="mt-2 flex items-center justify-between gap-3 text-sm text-emerald-600">
                  <p role="status">{couponMessage || `${appliedCoupon.code} applied`}</p>
                  <button type="button" onClick={removeCoupon} className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)] hover:text-black">
                    Remove
                  </button>
                </div>
              ) : couponMessage ? (
                <p className="mt-2 text-sm text-red-600" role="alert">{couponMessage}</p>
              ) : null}
            </div>

            <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">Order Summary</p>
                  <p className="text-sm text-[var(--color-muted)]">{items.length} product{items.length > 1 ? 's' : ''}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{summaryLabel}</p>
              </div>

              <div className="mt-4 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                {previewItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-1 text-sm">
                    <p className="min-w-0 truncate text-[var(--color-text)]">{item.name} × {item.quantity}</p>
                    <p className="shrink-0 text-[var(--color-text)]">{formatBDT(item.quantity * parseBDT(item.price))}</p>
                  </div>
                ))}
                {remainingItemsCount > 0 ? (
                  <p className="pt-1 text-xs text-[var(--color-muted)]">+{remainingItemsCount} more item{remainingItemsCount > 1 ? 's' : ''}</p>
                ) : null}
              </div>

              <div className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-4 text-sm">
                <div className="flex items-center justify-between text-[var(--color-muted)]">
                  <span>Subtotal</span>
                  <span className="text-[var(--color-text)]">{formatBDT(subtotal)}</span>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatBDT(discountAmount)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-[var(--color-muted)]">
                  <span>Delivery</span>
                  <span className="text-[var(--color-text)]">{deliveryCharge === 0 ? 'Free' : formatBDT(deliveryCharge)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-base font-semibold text-[var(--color-text)]">
                  <span>Grand Total</span>
                  <span>{summaryLabel}</span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-3 z-20 bg-white/95 pb-1 pt-1 backdrop-blur-sm sm:static sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
              <Button type="submit" className="w-full justify-center rounded-full bg-black px-5 py-4 text-[16px] font-semibold text-white shadow-none hover:bg-black/90 disabled:bg-black/25 disabled:text-white/70" disabled={!canSubmit}>
                {isSubmitting ? 'Placing order...' : 'Place Order'}
              </Button>
            </div>

            {submitError ? <p className="text-sm text-red-600" role="alert">{submitError}</p> : null}

            <div className="space-y-1 text-sm text-[var(--color-muted)]">
              <p>Need help?</p>
              <a href={supportWhatsAppHref} target="_blank" rel="noreferrer" className="inline-flex font-medium text-[var(--color-text)] underline underline-offset-4">Chat on WhatsApp</a>
            </div>
          </form>

          {!backendReady ? <p className="mt-4 text-sm text-[var(--color-muted)]">Live order backend is not connected. Please verify Firebase production credentials before launch.</p> : null}
        </div>
      </Container>
    </section>
  )
}
