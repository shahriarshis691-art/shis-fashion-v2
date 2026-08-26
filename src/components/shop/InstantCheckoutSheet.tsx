import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CartItem } from '../../context/CartContext'
import { clearBuyNowCheckout } from '../../context/CartContext'
import { createOrder, isOrderBackendReady, subscribeToHomepageContent } from '../../firebase/adminService'
import { PAYMENT_METHOD_COD } from '../../utils/orderComms'
import {
  DEFAULT_FREE_DELIVERY_THRESHOLD,
  DHAKA_DELIVERY_CHARGE,
  OUTSIDE_DHAKA_DELIVERY_CHARGE,
  formatBangladeshPhoneInput,
  normalizeBangladeshPhone,
  type BangladeshDivision,
} from '../../utils/bangladeshAddress'
import { formatBDT, parseBDT } from '../../utils/currency'
import { getOrderAttribution } from '../../utils/attribution'
import { createMetaEventId } from '../../utils/metaEvents'
import { getCatalogContentId, getCatalogContentIds } from '../../utils/catalogIdentity'
import { googleAnalytics } from '../../services/googleAnalytics'
import { metaPixel } from '../../services/metaPixel'

const ORDER_CONFIRMATION_KEY = 'shis-fashion-last-order'
const CHECKOUT_ANTI_BOT_COOLDOWN_KEY = 'shis-checkout-last-submit-at'
const CHECKOUT_ANTI_BOT_MIN_DWELL_MS = 1200
const CHECKOUT_ANTI_BOT_COOLDOWN_MS = 15000

type DeliveryArea = 'inside' | 'outside'

interface InstantCheckoutSheetProps {
  open: boolean
  onClose: () => void
  items: CartItem[]
}

function isPermissionDeniedError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code ?? '').toLowerCase()
    : ''

  return code.includes('permission-denied') || message.includes('permission-denied') || message.includes('missing or insufficient permissions')
}

function resolveDeliveryAddress(area: DeliveryArea, streetAddress: string) {
  if (area === 'inside') {
    return {
      division: 'Dhaka' as BangladeshDivision,
      district: 'Dhaka',
      upazila: 'Dhanmondi',
      streetAddress,
      deliveryNote: 'Inside Dhaka',
    }
  }

  return {
    division: 'Chattogram' as BangladeshDivision,
    district: 'Chattogram',
    upazila: 'Chattogram Sadar',
    streetAddress,
    deliveryNote: 'Outside Dhaka',
  }
}

export default function InstantCheckoutSheet({ open, onClose, items }: InstantCheckoutSheetProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryArea, setDeliveryArea] = useState<DeliveryArea>('inside')
  const [websiteField, setWebsiteField] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(DEFAULT_FREE_DELIVERY_THRESHOLD)
  const submissionLockRef = useRef(false)
  const enteredAtRef = useRef(0)
  const hasTrackedRef = useRef(false)

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + parseBDT(item.price) * item.quantity, 0),
    [items],
  )

  const baseDelivery =
    deliveryArea === 'inside' ? DHAKA_DELIVERY_CHARGE : OUTSIDE_DHAKA_DELIVERY_CHARGE
  const deliveryCharge =
    freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold ? 0 : baseDelivery
  const grandTotal = subtotal + deliveryCharge

  const normalizedPhone = useMemo(() => normalizeBangladeshPhone(phone), [phone])
  const isPhoneValid = normalizedPhone !== null
  const phoneHasValue = phone.trim().length > 0
  const backendReady = isOrderBackendReady()

  useEffect(() => {
    if (!open) {
      return
    }

    enteredAtRef.current = Date.now()
    hasTrackedRef.current = false
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const unsubscribe = subscribeToHomepageContent((content) => {
      setFreeDeliveryThreshold(content.freeDeliveryThreshold ?? DEFAULT_FREE_DELIVERY_THRESHOLD)
    })
    return unsubscribe
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open || !items.length || hasTrackedRef.current) {
      return
    }

    metaPixel.trackInitiateCheckout({
      value: subtotal,
      currency: 'BDT',
      content_type: 'product',
      content_ids: getCatalogContentIds(items),
    })

    googleAnalytics.beginCheckout({
      value: subtotal,
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

    hasTrackedRef.current = true
  }, [items, open, subtotal])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting || submissionLockRef.current || !items.length) {
      return
    }

    submissionLockRef.current = true
    setIsSubmitting(true)
    setSubmitError('')
    let shouldReleaseLock = true

    if (websiteField.trim()) {
      setSubmitError('Order verification failed. Please try again in a moment.')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    if (Date.now() - enteredAtRef.current < CHECKOUT_ANTI_BOT_MIN_DWELL_MS) {
      setSubmitError('Please wait a moment and confirm again.')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    if (typeof window !== 'undefined') {
      const lastSubmitAt = Number(window.localStorage.getItem(CHECKOUT_ANTI_BOT_COOLDOWN_KEY) ?? '0')
      if (lastSubmitAt && Date.now() - lastSubmitAt < CHECKOUT_ANTI_BOT_COOLDOWN_MS) {
        setSubmitError('You are submitting too quickly. Please wait a few seconds.')
        setIsSubmitting(false)
        submissionLockRef.current = false
        return
      }
    }

    if (!name.trim()) {
      setSubmitError('Please enter your full name.')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    const phoneNumber = normalizeBangladeshPhone(phone)
    if (!phoneNumber) {
      setSubmitError('Please enter a valid Bangladesh phone number (01XXXXXXXXX).')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    if (address.trim().length < 5) {
      setSubmitError('Please enter your full delivery address.')
      setIsSubmitting(false)
      submissionLockRef.current = false
      return
    }

    const deliveryAddress = resolveDeliveryAddress(deliveryArea, address.trim())
    const composedAddress = [
      address.trim(),
      deliveryArea === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
      deliveryAddress.district,
      deliveryAddress.division,
    ].join(', ')

    try {
      const purchaseEventId = createMetaEventId('Purchase')
      const createdOrder = await createOrder({
        customerName: name.trim(),
        customerPhone: phoneNumber,
        customerEmail: '',
        address: composedAddress,
        deliveryAddress,
        deliveryCharge,
        notes: deliveryAddress.deliveryNote,
        items: items.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          slug: item.slug,
        })),
        total: grandTotal,
        status: 'new',
        trackingNumber: '',
        paymentMethod: PAYMENT_METHOD_COD,
        attribution: getOrderAttribution() ?? undefined,
        purchaseEventId,
      })

      const orderSnapshot = {
        orderId: createdOrder.id,
        customerName: name.trim(),
        customerPhone: phoneNumber,
        address: composedAddress,
        paymentMethod: PAYMENT_METHOD_COD,
        paymentTransactionId: '',
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
        customerEmail: '',
        purchaseEventId: createdOrder.purchaseEventId ?? purchaseEventId,
        couponCode: '',
        couponDiscountPercent: 0,
        couponDiscountAmount: 0,
        createdAt: new Date().toISOString(),
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(ORDER_CONFIRMATION_KEY, JSON.stringify(orderSnapshot))
        window.localStorage.setItem(CHECKOUT_ANTI_BOT_COOLDOWN_KEY, String(Date.now()))
      }

      if (createdOrder.redirectUrl) {
        shouldReleaseLock = false
        window.location.assign(createdOrder.redirectUrl)
        return
      }

      clearBuyNowCheckout()
      shouldReleaseLock = false
      onClose()
      navigate('/order-success', { state: { orderId: createdOrder.id } })
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Order submission failed. Please try again.'
      const message = isPermissionDeniedError(error)
        ? 'Order service temporarily unavailable. Please contact support on WhatsApp.'
        : rawMessage
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
      if (shouldReleaseLock) {
        submissionLockRef.current = false
      }
    }
  }

  if (!open) {
    return null
  }

  const primaryItem = items[0]

  return (
    <div className="fixed inset-0 z-[80] sm:hidden" role="dialog" aria-modal="true" aria-label="Confirm order">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close checkout"
        onClick={onClose}
      />

      <div className="luxury-sheet-up absolute inset-x-0 bottom-0 flex max-h-[85vh] max-h-[90dvh] flex-col rounded-t-2xl bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.18)]">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Instant checkout</p>
            <h2 className="text-base font-semibold text-neutral-900">Confirm your order</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-neutral-700"
          >
            Close
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
            <div className="hidden" aria-hidden>
              <label htmlFor="instant-checkout-website">Website</label>
              <input
                id="instant-checkout-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={websiteField}
                onChange={(event) => setWebsiteField(event.target.value)}
              />
            </div>

            {primaryItem ? (
              <div className="mb-4 flex gap-3 rounded-xl bg-neutral-50 p-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-neutral-100">
                  <img
                    src={primaryItem.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-top"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-neutral-900">{primaryItem.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {primaryItem.size}
                    {primaryItem.color ? ` · ${primaryItem.color}` : ''}
                    {` · Qty ${primaryItem.quantity}`}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">{primaryItem.price}</p>
                </div>
              </div>
            ) : null}

            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-900">Full Name *</span>
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[16px] text-neutral-900 outline-none focus:border-neutral-900"
                  placeholder="Your full name"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-900">Phone Number *</span>
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(formatBangladeshPhoneInput(event.target.value))}
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-[16px] text-neutral-900 outline-none focus:border-neutral-900 ${
                    phoneHasValue && !isPhoneValid ? 'border-red-400' : 'border-neutral-200'
                  }`}
                  placeholder="01XXXXXXXXX"
                  aria-invalid={phoneHasValue ? !isPhoneValid : undefined}
                />
                {phoneHasValue && !isPhoneValid ? (
                  <span className="text-xs text-red-600">Enter a valid Bangladeshi mobile number.</span>
                ) : (
                  <span className="text-xs text-neutral-400">Example: 01712345678</span>
                )}
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-neutral-900">Full Address *</span>
                <textarea
                  required
                  rows={3}
                  autoComplete="street-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[16px] text-neutral-900 outline-none focus:border-neutral-900"
                  placeholder="House, road, area, landmark"
                />
              </label>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-neutral-900">Delivery Area *</legend>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50">
                  <input
                    type="radio"
                    name="delivery-area"
                    checked={deliveryArea === 'inside'}
                    onChange={() => setDeliveryArea('inside')}
                    className="h-4 w-4 accent-neutral-900"
                  />
                  <span className="flex-1 text-sm text-neutral-800">
                    Inside Dhaka
                    <span className="mt-0.5 block text-xs text-neutral-500">Delivery ৳{DHAKA_DELIVERY_CHARGE}</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-3 py-3 has-[:checked]:border-neutral-900 has-[:checked]:bg-neutral-50">
                  <input
                    type="radio"
                    name="delivery-area"
                    checked={deliveryArea === 'outside'}
                    onChange={() => setDeliveryArea('outside')}
                    className="h-4 w-4 accent-neutral-900"
                  />
                  <span className="flex-1 text-sm text-neutral-800">
                    Outside Dhaka
                    <span className="mt-0.5 block text-xs text-neutral-500">Delivery ৳{OUTSIDE_DHAKA_DELIVERY_CHARGE}</span>
                  </span>
                </label>
              </fieldset>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
                <p className="text-sm font-medium text-neutral-900">Payment Method</p>
                <p className="mt-1 text-sm text-neutral-600">Cash on Delivery (default)</p>
              </div>

              <div className="space-y-1.5 border-t border-neutral-100 pt-3 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatBDT(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Delivery</span>
                  <span>{deliveryCharge === 0 ? 'Free' : formatBDT(deliveryCharge)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-neutral-900">
                  <span>Total</span>
                  <span>{formatBDT(grandTotal)}</span>
                </div>
              </div>

              {!backendReady ? (
                <p className="text-xs text-amber-700">
                  Live order backend is offline — orders may save locally in development only.
                </p>
              ) : null}

              {submitError ? (
                <p className="text-sm text-red-600" role="alert">
                  {submitError}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-neutral-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="submit"
              disabled={isSubmitting || !items.length}
              className="btn-glass-cta w-full gap-2"
            >
              {isSubmitting ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  Placing order…
                </>
              ) : (
                `Confirm Order (${formatBDT(grandTotal)})`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
