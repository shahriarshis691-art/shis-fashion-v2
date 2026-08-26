import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import CouponApplyField from '../components/shop/CouponApplyField'
import { useCart, clearBuyNowCheckout, readBuyNowCheckout } from '../context/CartContext'
import { createOrder, isOrderBackendReady, subscribeToHomepageContent } from '../firebase/adminService'
import { formatBDT, parseBDT } from '../utils/currency'
import { bangladeshDivisions, DEFAULT_FREE_DELIVERY_THRESHOLD, formatBangladeshPhoneInput, getDeliveryCharge, getDistrictsForDivision, getUpazilasForDistrict, normalizeBangladeshPhone, type BangladeshDivision } from '../utils/bangladeshAddress'
import { STORE_POLICY, SUPPORT_WHATSAPP_HREF } from '../data/storePolicy'
import { PAYMENT_METHOD_COD } from '../utils/orderComms'
import { quoteCouponDiscount } from '../utils/coupon'
import {
  formatWalletDialNumber,
  getDefaultCheckoutPaymentConfig,
  getMerchantNumberForMethod,
  isManualWalletPayment,
  isValidWalletTransactionId,
  parseCheckoutPaymentConfig,
  PAYMENT_METHOD_BKASH,
  PAYMENT_METHOD_BKASH_MANUAL,
  PAYMENT_METHOD_NAGAD_MANUAL,
  type CheckoutPaymentConfig,
} from '../utils/prepaid'
import { googleAnalytics } from '../services/googleAnalytics'
import { metaPixel } from '../services/metaPixel'
import { getCatalogContentId, getCatalogContentIds } from '../utils/catalogIdentity'
import { getOrderAttribution } from '../utils/attribution'
import { createMetaEventId } from '../utils/metaEvents'

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
  const { items: cartItems, clearCart, appliedCoupon } = useCart()
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
  const [submitError, setSubmitError] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    const prepaid = new URLSearchParams(window.location.search).get('prepaid')
    if (prepaid === 'cancelled' || prepaid === 'failed' || prepaid === 'missing' || prepaid === 'unavailable') {
      return 'Online payment did not complete. You can try Cash on Delivery or pay again.'
    }

    return ''
  })
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD_COD)
  const [paymentTransactionId, setPaymentTransactionId] = useState('')
  const [paymentConfig, setPaymentConfig] = useState<CheckoutPaymentConfig>(() => getDefaultCheckoutPaymentConfig())
  const walletMerchantNumber = useMemo(
    () => getMerchantNumberForMethod(paymentMethod),
    [paymentMethod],
  )
  const requiresWalletTrxId = isManualWalletPayment(paymentMethod)
  const [websiteField, setWebsiteField] = useState('')
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(DEFAULT_FREE_DELIVERY_THRESHOLD)
  const submissionLockRef = useRef(false)
  const hasTrackedCheckoutRef = useRef(false)
  const enteredAtRef = useRef(0)
  const subtotal = items.reduce((sum, item) => sum + parseBDT(item.price) * item.quantity, 0)
  const couponQuote = appliedCoupon
    ? quoteCouponDiscount(appliedCoupon, items.map((item) => ({
      category: item.category,
      price: parseBDT(item.price),
      quantity: item.quantity,
    })))
    : null
  const discountAmount = couponQuote?.ok ? couponQuote.amount : 0
  const deliveryCharge = getDeliveryCharge(form.division as BangladeshDivision, subtotal, freeDeliveryThreshold)
  const effectiveGrandTotal = subtotal + deliveryCharge - discountAmount
  const districtOptions = getDistrictsForDivision(form.division as BangladeshDivision)
  const upazilaOptions = getUpazilasForDistrict(form.district)
  const backendReady = isOrderBackendReady()
  const summaryLabel = formatBDT(effectiveGrandTotal)
  const supportWhatsAppHref = SUPPORT_WHATSAPP_HREF
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
    (!requiresWalletTrxId || isValidWalletTransactionId(paymentTransactionId)) &&
    !(appliedCoupon && couponQuote && !couponQuote.ok) &&
    !isSubmitting,
  )

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => {
      setFreeDeliveryThreshold(content.freeDeliveryThreshold ?? DEFAULT_FREE_DELIVERY_THRESHOLD)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false

    void fetch('/api/payment-config', {
      headers: { accept: 'application/json' },
    })
      .then(async (response) => {
        const contentType = response.headers.get('content-type') ?? ''
        if (!response.ok || !contentType.includes('application/json')) {
          return null
        }

        return response.json()
      })
      .then((payload) => {
        if (cancelled) {
          return
        }

        const parsed = parseCheckoutPaymentConfig(payload)
        if (parsed) {
          setPaymentConfig(parsed)
        }
      })
      .catch(() => {
        // Keep build-time defaults when the config API is unavailable.
      })

    return () => {
      cancelled = true
    }
  }, [])

  const showPrepaidOption = paymentConfig.bkashOnline
  const bkashMerchantNumber = paymentConfig.bkashMerchantNumber
  const nagadMerchantNumber = paymentConfig.nagadMerchantNumber

  useEffect(() => {
    if (!items.length || hasTrackedCheckoutRef.current) {
      return
    }

    metaPixel.trackInitiateCheckout({
      value: subtotal - discountAmount,
      currency: 'BDT',
      content_type: 'product',
      content_ids: getCatalogContentIds(items),
    })

    googleAnalytics.beginCheckout({
      value: subtotal - discountAmount,
      currency: 'BDT',
      items: items.map((item) => ({
        item_id: getCatalogContentId(item),
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
              <Button to="/shop" variant="cta">Continue shopping</Button>
            </div>
          </div>
        </Container>
      </section>
    )
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

    if (requiresWalletTrxId && !isValidWalletTransactionId(paymentTransactionId)) {
      setSubmitError('Enter the Transaction ID (TrxID) from your bKash or Nagad app.')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    const composedAddress = [form.streetAddress.trim(), form.upazila, form.district, form.division]
      .filter(Boolean)
      .join(', ')

    try {
      const purchaseEventId = createMetaEventId('Purchase')
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
        paymentMethod,
        paymentTransactionId: requiresWalletTrxId ? paymentTransactionId.trim().toUpperCase() : undefined,
        attribution: getOrderAttribution() ?? undefined,
        purchaseEventId,
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
        paymentMethod,
        paymentTransactionId: requiresWalletTrxId ? paymentTransactionId.trim().toUpperCase() : '',
        deliveryCharge: createdOrder.deliveryCharge ?? deliveryCharge,
        subtotal,
        grandTotal: createdOrder.total,
        items: items.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        })),
        customerEmail: form.email.trim(),
        purchaseEventId: createdOrder.purchaseEventId ?? purchaseEventId,
        couponCode: appliedCoupon?.code ?? createdOrder.couponCode ?? '',
        couponDiscountPercent: appliedCoupon?.discountPercent ?? createdOrder.couponDiscountPercent ?? 0,
        couponDiscountAmount: createdOrder.couponDiscountAmount ?? discountAmount,
        createdAt: new Date().toISOString(),
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(ORDER_CONFIRMATION_KEY, JSON.stringify(orderSnapshot))
        window.localStorage.setItem(CHECKOUT_ANTI_BOT_COOLDOWN_KEY, String(currentTimeMs()))
      }

      if (createdOrder.redirectUrl) {
        shouldReleaseLock = false
        window.location.assign(createdOrder.redirectUrl)
        return
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
              <CouponApplyField customerEmail={form.email} quoteSourceItems={items} />
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
                  <div className={`flex items-center justify-between ${couponQuote?.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>{couponQuote?.ok ? `-${formatBDT(discountAmount)}` : 'Not eligible'}</span>
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

            <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-white p-4 sm:p-5">
              <p className="text-sm font-medium text-[var(--color-text)]">Payment</p>
              <div className="mt-3 space-y-2">
                <label className={`block cursor-pointer border px-4 py-3 ${paymentMethod === PAYMENT_METHOD_COD ? 'border-black' : 'border-black/15'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    className="sr-only"
                    checked={paymentMethod === PAYMENT_METHOD_COD}
                    onChange={() => setPaymentMethod(PAYMENT_METHOD_COD)}
                  />
                  <p className="text-sm font-semibold text-[var(--color-text)]">{PAYMENT_METHOD_COD}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">Pay the courier when your order arrives. {STORE_POLICY.phoneConfirm}</p>
                </label>
                {paymentConfig.bkashManual ? (
                  <label className={`block cursor-pointer border px-4 py-3 ${paymentMethod === PAYMENT_METHOD_BKASH_MANUAL ? 'border-black' : 'border-black/15'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="sr-only"
                      checked={paymentMethod === PAYMENT_METHOD_BKASH_MANUAL}
                      onChange={() => setPaymentMethod(PAYMENT_METHOD_BKASH_MANUAL)}
                    />
                    <p className="text-sm font-semibold text-[var(--color-text)]">{PAYMENT_METHOD_BKASH_MANUAL}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      Send Money to <span className="font-semibold text-[var(--color-text)]">{formatWalletDialNumber(bkashMerchantNumber)}</span>, then enter your TrxID below.
                    </p>
                  </label>
                ) : null}
                {paymentConfig.nagadManual ? (
                  <label className={`block cursor-pointer border px-4 py-3 ${paymentMethod === PAYMENT_METHOD_NAGAD_MANUAL ? 'border-black' : 'border-black/15'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="sr-only"
                      checked={paymentMethod === PAYMENT_METHOD_NAGAD_MANUAL}
                      onChange={() => setPaymentMethod(PAYMENT_METHOD_NAGAD_MANUAL)}
                    />
                    <p className="text-sm font-semibold text-[var(--color-text)]">{PAYMENT_METHOD_NAGAD_MANUAL}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      Send Money to <span className="font-semibold text-[var(--color-text)]">{formatWalletDialNumber(nagadMerchantNumber)}</span>, then enter your TrxID below.
                    </p>
                  </label>
                ) : null}
                {showPrepaidOption ? (
                  <label className={`block cursor-pointer border px-4 py-3 ${paymentMethod === PAYMENT_METHOD_BKASH ? 'border-black' : 'border-black/15'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="sr-only"
                      checked={paymentMethod === PAYMENT_METHOD_BKASH}
                      onChange={() => setPaymentMethod(PAYMENT_METHOD_BKASH)}
                    />
                    <p className="text-sm font-semibold text-[var(--color-text)]">{PAYMENT_METHOD_BKASH} (Online)</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">Pay now with bKash checkout. Your order is confirmed after payment succeeds.</p>
                  </label>
                ) : null}
              </div>

              {requiresWalletTrxId ? (
                <div className="mt-4 space-y-3 rounded-[1rem] border border-black/10 bg-black/[0.02] p-4">
                  <p className="text-sm font-medium text-[var(--color-text)]">Pay {summaryLabel} to {formatWalletDialNumber(walletMerchantNumber)}</p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--color-muted)]">
                    <li>Open your {paymentMethod.includes('bKash') ? 'bKash' : 'Nagad'} app</li>
                    <li>Choose <span className="font-medium text-[var(--color-text)]">Send Money</span></li>
                    <li>Enter merchant number <span className="font-medium text-[var(--color-text)]">{formatWalletDialNumber(walletMerchantNumber)}</span></li>
                    <li>Send exactly <span className="font-medium text-[var(--color-text)]">{summaryLabel}</span></li>
                    <li>Copy the Transaction ID (TrxID) and paste it below</li>
                  </ol>
                  <div className="space-y-2">
                    <label htmlFor="checkout-trxid" className="text-sm font-medium text-[var(--color-text)]">Transaction ID (TrxID) *</label>
                    <input
                      id="checkout-trxid"
                      required
                      value={paymentTransactionId}
                      onChange={(event) => setPaymentTransactionId(event.target.value.toUpperCase())}
                      className="w-full rounded-[1rem] border border-[var(--color-border)] bg-white px-4 py-3 text-[16px] uppercase tracking-[0.08em] text-[var(--color-text)] outline-none transition-colors placeholder:normal-case placeholder:tracking-normal focus:border-black focus:ring-2 focus:ring-black/5"
                      placeholder="e.g. 8N90ABCD12"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-3 z-[55] bg-white/95 pb-1 pt-1 backdrop-blur-sm sm:static sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
              <Button type="submit" variant="cta" className="w-full" disabled={!canSubmit}>
                {isSubmitting ? 'Placing order...' : 'Place Order'}
              </Button>
            </div>

            {submitError ? <p className="text-sm text-red-600" role="alert">{submitError}</p> : null}

            <div className="space-y-1 text-sm text-[var(--color-muted)]">
              <p>{STORE_POLICY.phoneConfirm} {STORE_POLICY.exchangeWindow}</p>
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
