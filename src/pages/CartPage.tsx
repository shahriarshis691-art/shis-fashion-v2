import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { useCart, clearBuyNowCheckout } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import type { ShopProduct } from '../data/shopData'
import { formatBDT, parseBDT } from '../utils/currency'

function getWhatsAppHref() {
  return 'https://wa.me/8801887848304'
}

export default function CartPage() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeFromCart, addToCart, subtotal, itemCount } = useCart()
  const { items: wishlistItems, removeFromWishlist } = useWishlist()
  const totalLabel = formatBDT(subtotal)
  const supportWhatsAppHref = getWhatsAppHref()

  const handleBeginCheckout = () => {
    clearBuyNowCheckout()
    navigate('/checkout')
  }

  const handleMoveToCart = (wishlistItem: { product: ShopProduct }) => {
    addToCart(wishlistItem.product, { size: 'M', color: 'Default', quantity: 1 })
    removeFromWishlist(String(wishlistItem.product.id))
  }

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
    <section className="px-3 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
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
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5">COD checkout</span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5">Phone confirm before dispatch</span>
                <a href={supportWhatsAppHref} target="_blank" rel="noreferrer" className="rounded-full border border-[rgba(0,0,0,0.2)] bg-[rgba(0,0,0,0.05)] px-3 py-1.5 text-[var(--color-accent)]">WhatsApp support</a>
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
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 639px) 80px, 112px"
                    className="h-20 w-20 rounded-[0.9rem] object-cover sm:h-28 sm:w-28 sm:rounded-[1.2rem]"
                  />
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

            {wishlistItems.length > 0 ? (
              <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:rounded-[2rem] sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Wishlist</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Saved for later</h2>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {wishlistItems.map((wishlistItem) => (
                    <div key={wishlistItem.id} className="flex items-center gap-3 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                      <img src={wishlistItem.product.image} alt={wishlistItem.product.name} loading="lazy" decoding="async" className="h-16 w-16 rounded-[0.75rem] object-cover sm:h-20 sm:w-20" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-[var(--color-text)]">{wishlistItem.product.name}</h3>
                        <p className="mt-1 text-sm text-[var(--color-accent)]">{wishlistItem.product.price}</p>
                      </div>
                      <Button to={`/shop/${wishlistItem.product.category}/${wishlistItem.product.slug}`} variant="secondary" className="text-xs">View</Button>
                      <button type="button" onClick={() => handleMoveToCart(wishlistItem)} className="text-xs font-semibold text-[var(--color-accent)]">Move to cart</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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
              <Button onClick={handleBeginCheckout} className="w-full justify-center">Checkout</Button>
              <Button to="/shop" variant="secondary" className="w-full justify-center">Keep browsing</Button>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
              <span>Phone confirmation</span>
              <a href={supportWhatsAppHref} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-accent)]">WhatsApp support</a>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-2 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-[1.1rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.97)] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:hidden">
          <div className="flex items-center justify-between gap-3 rounded-[0.9rem] bg-[rgba(0,0,0,0.03)] px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">Bag total</p>
              <p className="mt-1 text-[1rem] font-semibold text-[var(--color-text)]">{totalLabel}</p>
            </div>
            <Button onClick={handleBeginCheckout} className="min-w-[8.25rem] justify-center px-4 py-2.5 text-sm">
              Secure checkout
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
            <span>No prepayment required</span>
            <a href={supportWhatsAppHref} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-accent)]">Need help?</a>
          </div>
        </div>
      </Container>
    </section>
  )
}
