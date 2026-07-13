import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { useCart } from '../context/CartContext'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const [form, setForm] = useState({ name: '', email: '', address: '' })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearCart()
    navigate('/order-success')
  }

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Checkout</p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Secure your order</h1>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Full name" />
              <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Email address" />
              <textarea required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="min-h-28 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Delivery address" />
              <Button type="submit" className="w-full justify-center">Place order</Button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Your order</p>
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm text-[var(--color-muted)]">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="text-[var(--color-text)]">{item.price}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="text-[var(--color-text)]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-base font-semibold text-[var(--color-text)]">
                <span>Total</span>
                <span className="text-[var(--color-accent)]">${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
