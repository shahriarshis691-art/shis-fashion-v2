import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { formatBDT } from '../utils/currency'
import { formatBangladeshPhoneInput, normalizeBangladeshPhone } from '../utils/bangladeshAddress'
import { STORE_POLICY, SUPPORT_WHATSAPP_HREF } from '../data/storePolicy'

const STATUS_LABELS: Record<string, string> = {
  new: 'Received — we will call to confirm',
  confirmed: 'Confirmed',
  processing: 'Preparing for dispatch',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

interface LookupOrder {
  orderId: string
  status: string
  trackingNumber: string
  customerName: string
  area: string
  total: number
  deliveryCharge: number
  createdAt: string
  items: Array<{ name: string; quantity: number; size: string; color: string }>
}

export default function OrderLookupPage() {
  const [searchParams] = useSearchParams()
  const [orderId, setOrderId] = useState(searchParams.get('id')?.trim() ?? '')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<LookupOrder | null>(null)

  const isPhoneValid = useMemo(() => normalizeBangladeshPhone(phone) !== null, [phone])

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
          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? 'Looking up…' : 'Check status'}
          </Button>
          {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        </form>

        {order ? (
          <div className="mt-8 max-w-lg border border-black/15 p-5">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">Order {order.orderId}</p>
            <h2 className="mt-2 text-h2 text-black">{STATUS_LABELS[order.status] ?? order.status}</h2>
            <div className="mt-4 space-y-2 text-sm text-black/75">
              <p><span className="text-black/55">Name:</span> {order.customerName}</p>
              {order.area ? <p><span className="text-black/55">Area:</span> {order.area}</p> : null}
              {order.createdAt ? <p><span className="text-black/55">Placed:</span> {order.createdAt.slice(0, 10)}</p> : null}
              {order.trackingNumber ? <p><span className="text-black/55">Tracking:</span> {order.trackingNumber}</p> : null}
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
          </div>
        ) : null}

        <p className="mt-8 text-sm text-black/65">
          Need help? <a href={SUPPORT_WHATSAPP_HREF} target="_blank" rel="noreferrer" className="underline">Chat on WhatsApp</a>
          {' · '}
          <Link to="/terms" className="underline">Returns & exchange</Link>
        </p>
      </Container>
    </section>
  )
}
