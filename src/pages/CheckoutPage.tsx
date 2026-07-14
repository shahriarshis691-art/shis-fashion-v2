import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { useCart } from '../context/CartContext'
import { createOrder } from '../firebase/adminService'
import { formatBDT, parseBDT } from '../utils/currency'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', notes: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionLockRef = useRef(false)
  const deliveryCharge = 0
  const grandTotal = subtotal + deliveryCharge

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting || submissionLockRef.current) {
      return
    }

    submissionLockRef.current = true
    setIsSubmitting(true)
    let shouldReleaseLock = true

    try {
      await createOrder({
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim(),
        address: form.address.trim(),
        notes: form.notes.trim(),
        items: items.map((item) => ({ name: item.name, price: item.price, quantity: item.quantity })),
        total: grandTotal,
        status: 'new',
        trackingNumber: '',
      })
      clearCart()
      shouldReleaseLock = false
      navigate('/order-success')
    } finally {
      setIsSubmitting(false)
      if (shouldReleaseLock) {
        submissionLockRef.current = false
      }
    }
  }

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Checkout</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">Cash on delivery, made simple</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">Built for Bangladesh shoppers who want a fast mobile checkout with only the details needed to deliver the order.</p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">COD only</span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">No account needed</span>
              <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">2 minute checkout</span>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)]" placeholder="Full name" />
                <input required type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)]" placeholder="Phone number" />
              </div>

              <textarea required autoComplete="street-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="min-h-28 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)]" placeholder="Delivery address" />

              <div className="grid gap-4 sm:grid-cols-2">
                <input type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)]" placeholder="Email (optional)" />
                <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-28 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)]" placeholder="Order notes (optional)" />
              </div>

              <Button type="submit" className="w-full justify-center" disabled={isSubmitting}>{isSubmitting ? 'Placing order...' : 'Place COD order'}</Button>
              <p className="text-center text-xs leading-6 text-[var(--color-muted)]">By placing this order, you confirm you want Cash on Delivery. We will contact you on the phone number provided.</p>
            </form>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7 lg:sticky lg:top-6 lg:self-start">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Order summary</p>
            <div className="mt-5 space-y-3 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                  <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="h-14 w-14 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[var(--color-text)]">{item.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">Qty: {item.quantity}</p>
                  </div>
                  <span className="shrink-0 font-semibold text-[var(--color-text)]">{formatBDT(item.quantity * parseBDT(item.price))}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="text-[var(--color-text)]">{formatBDT(subtotal)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span>Delivery charge</span>
                <span className="text-[var(--color-text)]">{deliveryCharge === 0 ? 'Free' : formatBDT(deliveryCharge)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-base font-semibold text-[var(--color-text)]">
                <span>Grand total</span>
                <span className="text-[var(--color-accent)]">{formatBDT(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
