import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { useCart } from '../context/CartContext'
import { formatBDT, parseBDT } from '../utils/currency'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeFromCart, subtotal, itemCount } = useCart()
  const totalLabel = formatBDT(subtotal)

  if (items.length === 0) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Cart</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">Your bag is ready for a first edit.</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">Choose a piece from the shop and build your luxury capsule in a few taps.</p>
            <div className="mt-6 flex justify-center">
              <Button to="/shop">Continue shopping</Button>
            </div>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="px-3 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:rounded-[2rem] sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Cart</p>
                  <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{itemCount} item{itemCount > 1 ? 's' : ''} selected</h1>
                </div>
                <Link to="/shop" className="text-sm font-semibold text-[var(--color-accent)]">Continue shopping</Link>
              </div>
            </div>

            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.05)] sm:rounded-[1.8rem] sm:p-5"
              >
                <div className="flex gap-4">
                  <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="h-20 w-20 rounded-[0.9rem] object-cover sm:h-28 sm:w-28 sm:rounded-[1.2rem]" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-[var(--color-text)]">{item.name}</h2>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{item.color} • {item.size}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="text-sm font-semibold text-[var(--color-accent)]">Remove</button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] p-1">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 text-lg text-[var(--color-text)]">−</button>
                        <span className="min-w-8 text-center text-sm font-semibold text-[var(--color-text)]">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} className="h-8 w-8 text-lg text-[var(--color-text)]">+</button>
                      </div>
                      <p className="text-base font-semibold text-[var(--color-accent)]">{formatBDT(parseBDT(item.price) * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:block sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Summary</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-muted)]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="text-[var(--color-text)]">{totalLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span className="text-[var(--color-text)]">Calculated at checkout</span>
              </div>
              <div className="flex items-center justify-between pt-3 text-base font-semibold text-[var(--color-text)]">
                <span>Total</span>
                <span className="text-[var(--color-accent)]">{totalLabel}</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button onClick={() => navigate('/checkout')} className="w-full justify-center">Checkout</Button>
              <Button to="/shop" variant="secondary" className="w-full justify-center">Keep browsing</Button>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-2.5 bottom-3.5 z-40 rounded-[1.2rem] border border-[rgba(210,180,122,0.14)] bg-[rgba(7,7,7,0.95)] p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:hidden">
          <div className="flex items-center justify-between gap-3 rounded-[0.95rem] bg-[rgba(255,255,255,0.03)] px-3 py-2.5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">Bag total</p>
              <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{totalLabel}</p>
            </div>
            <Button onClick={() => navigate('/checkout')} className="min-w-[8.75rem] justify-center px-4.5">
              Checkout
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
