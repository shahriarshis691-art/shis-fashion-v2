import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { formatBDT } from '../utils/currency'
import { formatBangladeshPhoneInput, normalizeBangladeshPhone } from '../utils/bangladeshAddress'
import { STORE_POLICY } from '../data/storePolicy'
import {
  getCustomerOrderSupportHref,
  getPublicTrackingHref,
  PAYMENT_METHOD_COD,
} from '../utils/orderComms'
import {
  TRACKING_TIMELINE,
  getTrackingStepState,
  trackingTimelineStatus,
} from '../utils/orderStatus'

const STATUS_LABELS: Record<string, string> = {
  new: 'Received — we will call to confirm',
  confirmed: 'Confirmed',
  processing: 'Preparing for dispatch',
  in_courier: 'With the courier',
  shipped: 'Shipped',
  delivered: 'Delivered',
  returned: 'Returned',
  cancelled: 'Cancelled',
}

interface LookupOrder {
  orderId: string
  status: string
  trackingNumber: string
  paymentMethod?: string
  customerName: string
  area: string
  total: number
  deliveryCharge: number
  createdAt: string
  items: Array<{ name: string; quantity: number; size: string; color: string }>
}

function OrderStatusTimeline({ status }: { status: string }) {
  const normalized = trackingTimelineStatus(status)
  const isCancelled = normalized === 'cancelled'
  const isReturned = normalized === 'returned'

  return (
    <div className="mt-5 border border-black/10 bg-black/[0.02] px-3 py-4">
      <p className="text-caption uppercase tracking-[0.14em] text-black/55">Status timeline</p>
      <ol className="mt-3 space-y-2.5">
        {TRACKING_TIMELINE.map((step, index) => {
          const state = getTrackingStepState(status, step.status)
          const markerClass = state === 'complete'
            ? 'border-black bg-black text-white'
            : state === 'current'
              ? 'border-black bg-white text-black'
              : 'border-black/20 bg-white text-black/35'
          const labelClass = state === 'upcoming' ? 'text-black/40' : 'text-black'

          return (
            <li key={step.status} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center border text-[10px] font-semibold ${markerClass}`}
                aria-hidden="true"
              >
                {state === 'complete' ? '✓' : index + 1}
              </span>
              <span className={`text-sm font-medium ${labelClass}`}>
                {step.label}
                {state === 'current' ? ' — current' : ''}
              </span>
            </li>
          )
        })}
      </ol>
      {isCancelled ? (
        <p className="mt-3 text-sm font-semibold text-black">This order was cancelled.</p>
      ) : null}
      {isReturned ? (
        <p className="mt-3 text-sm font-semibold text-black">This order was returned after delivery.</p>
      ) : null}
    </div>
  )
}

export default function OrderLookupPage() {
  const [searchParams] = useSearchParams()
  const [orderId, setOrderId] = useState(searchParams.get('id')?.trim() ?? '')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<LookupOrder | null>(null)
  const [copied, setCopied] = useState(false)

  const isPhoneValid = useMemo(() => normalizeBangladeshPhone(phone) !== null, [phone])
  const trackingHref = order ? getPublicTrackingHref(order.trackingNumber) : ''
  const supportHref = getCustomerOrderSupportHref(order?.orderId ?? orderId)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedPhone = normalizeBangladeshPhone(phone)
    const trimmedId = orderId.trim()

    if (!trimmedId || !normalizedPhone) {
      setError('Enter your order ID and the phone number used at checkout.')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)
    setCopied(false)

    try {
      const response = await fetch('/api/lookup-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: trimmedId, phone: normalizedPhone }),
      })
      const payload = await response.json() as { error?: string; order?: LookupOrder }

      if (!response.ok || !payload.order) {
        setError(payload.error || 'We could not find an order with that ID and phone number.')
        return
      }

      setOrder(payload.order)
    } catch {
      setError('Unable to look up this order right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyTracking = async () => {
    if (!order?.trackingNumber) {
      return
    }

    try {
      await navigator.clipboard.writeText(order.trackingNumber)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="bg-white px-3.5 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
      <Container>
        <p className="text-caption uppercase tracking-[0.14em] text-black/55">Order status</p>
        <h1 className="mt-1 text-h1 text-black">Track your order</h1>
        <p className="mt-3 max-w-2xl text-body text-black/72">
          Enter the order ID from your confirmation and the phone number used at checkout. No account is required.
        </p>

        <form className="mt-8 max-w-lg space-y-4" onSubmit={(event) => { void handleSubmit(event) }}>
          <div>
            <label htmlFor="lookup-order-id" className="text-sm font-medium text-black">Order ID</label>
            <input
              id="lookup-order-id"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              className="mt-2 w-full rounded-[1rem] border border-black/15 bg-white px-4 py-3 text-[16px] text-black outline-none focus:border-black"
              placeholder="From your order confirmation"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="lookup-phone" className="text-sm font-medium text-black">Phone number</label>
            <input
              id="lookup-phone"
              value={phone}
              onChange={(event) => setPhone(formatBangladeshPhoneInput(event.target.value))}
              className={`mt-2 w-full rounded-[1rem] border bg-white px-4 py-3 text-[16px] text-black outline-none ${isPhoneValid || !phone.trim() ? 'border-black/15 focus:border-black' : 'border-rose-400'}`}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <Button type="submit" variant="cta" disabled={loading} className="w-full">
            {loading ? 'Looking up…' : 'Check status'}
          </Button>
          {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        </form>

        {order ? (
          <div className="mt-8 max-w-lg border border-black/15 p-5">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">Order {order.orderId}</p>
            <h2 className="mt-2 text-h2 text-black">{STATUS_LABELS[order.status] ?? order.status}</h2>
            <OrderStatusTimeline status={order.status} />
            {order.trackingNumber ? (
              <div className="mt-4 border border-black/10 bg-black/[0.02] px-3 py-3">
                <p className="text-caption uppercase tracking-[0.14em] text-black/55">Courier tracking</p>
                {trackingHref ? (
                  <a href={trackingHref} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm font-semibold text-black underline">
                    {order.trackingNumber}
                  </a>
                ) : (
                  <p className="mt-1 break-all text-sm font-semibold text-black">{order.trackingNumber}</p>
                )}
                <button
                  type="button"
                  onClick={() => { void handleCopyTracking() }}
                  className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/60 hover:text-black"
                >
                  {copied ? 'Copied' : 'Copy tracking'}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-black/65">Tracking appears here after the order is with the courier.</p>
            )}
            <div className="mt-4 space-y-2 text-sm text-black/75">
              <p><span className="text-black/55">Name:</span> {order.customerName}</p>
              {order.area ? <p><span className="text-black/55">Area:</span> {order.area}</p> : null}
              {order.createdAt ? <p><span className="text-black/55">Placed:</span> {order.createdAt.slice(0, 10)}</p> : null}
              <p><span className="text-black/55">Payment:</span> {order.paymentMethod || PAYMENT_METHOD_COD}</p>
              <p><span className="text-black/55">Delivery:</span> {formatBDT(order.deliveryCharge)}</p>
              <p><span className="text-black/55">Total:</span> {formatBDT(order.total)}</p>
            </div>
            <div className="mt-4 space-y-1 border-t border-black/10 pt-3 text-sm text-black/75">
              {order.items.map((item, index) => (
                <p key={`${item.name}-${index}`}>
                  {item.name} × {item.quantity}{item.size ? ` • ${item.size}` : ''}{item.color ? ` • ${item.color}` : ''}
                </p>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-black/65">{STORE_POLICY.exchangeWindow} {STORE_POLICY.phoneConfirm}</p>
            <a href={supportHref} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-semibold underline">
              WhatsApp about this order
            </a>
          </div>
        ) : null}

        <p className="mt-8 text-sm text-black/65">
          Need help? <a href={supportHref} target="_blank" rel="noreferrer" className="underline">Chat on WhatsApp</a>
          {' · '}
          <Link to="/terms" className="underline">Returns & exchange</Link>
        </p>
      </Container>
    </section>
  )
}
