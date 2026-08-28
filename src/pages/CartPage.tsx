import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { useCart, clearBuyNowCheckout } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import type { ShopProduct } from '../data/shopData'
import { formatBDT, parseBDT } from '../utils/currency'
import { catalogImageAttrs, CATALOG_IMAGE_PLACEHOLDER } from '../utils/media'
import { subscribeToHomepageContent } from '../firebase/adminService'
import { DEFAULT_FREE_DELIVERY_THRESHOLD, getAmountToFreeDelivery } from '../utils/bangladeshAddress'
import CouponApplyField from '../components/shop/CouponApplyField'

function getWhatsAppHref() {
  return 'https://wa.me/8801887848304'
}

function CartThumbImage({
  src,
  alt,
  width,
  height,
  sizes,
}: {
  src: string
  alt: string
  width: number
  height: number
  sizes: string
}) {
  const thumb = catalogImageAttrs(src, width * 2, height * 2, sizes, [width, width * 2])
  return (
    <img
      src={thumb.src || CATALOG_IMAGE_PLACEHOLDER}
      srcSet={thumb.srcSet}
      sizes={thumb.sizes}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className="gpu-media h-full w-full object-cover"
    />
  )
}

export default function CartPage() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeFromCart, addToCart, subtotal, itemCount, appliedCoupon, discountAmount, grandTotal } = useCart()
  const { items: wishlistItems, removeFromWishlist } = useWishlist()
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(DEFAULT_FREE_DELIVERY_THRESHOLD)
  const totalLabel = formatBDT(grandTotal)
  const supportWhatsAppHref = getWhatsAppHref()
  const remainingForFreeDelivery = getAmountToFreeDelivery(subtotal, freeDeliveryThreshold)

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => {
      setFreeDeliveryThreshold(content.freeDeliveryThreshold ?? DEFAULT_FREE_DELIVERY_THRESHOLD)
    })
    return unsubscribe
  }, [])

  const handleBeginCheckout = () => {
    clearBuyNowCheckout()
    navigate('/checkout')
  }

  const handleMoveToCart = (wishlistItem: { product: ShopProduct }) => {
    const sizes = wishlistItem.product.sizes ?? []
    const colors = wishlistItem.product.colors ?? []
    if (sizes.length > 1 || colors.length > 1) {
      navigate(`/shop/${wishlistItem.product.category}/${wishlistItem.product.slug}`)
      return
    }

    const size = sizes[0] || 'M'
    const color = colors[0] || 'Default'
    addToCart(wishlistItem.product, { size, color, quantity: 1 })
    removeFromWishlist(String(wishlistItem.product.id))
  }

  if (items.length === 0) {
    return (
      <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <Container>
          <div className="mx-auto max-w-2xl py-4 text-center">
            <p className="text-caption uppercase tracking-[0.24em] text-black/55">Cart</p>
            <h1
              className="mt-3 text-3xl font-normal text-neutral-900"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Your bag is ready for a first edit.
            </h1>
            <p className="mt-3 text-sm leading-7 text-neutral-600">Choose a piece from the shop and build your luxury capsule in a few taps.</p>
            <div className="mt-6 flex justify-center">
              <Button to="/shop" variant="cta">Continue shopping</Button>
            </div>
          </div>

          {wishlistItems.length > 0 ? (
            <div id="wishlist" className="mt-12 border-t border-gray-100 pt-10">
              <p className="text-caption uppercase tracking-[0.24em] text-black/55">Wishlist</p>
              <h2 className="mt-2 text-2xl font-normal text-neutral-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Saved for later</h2>
              <div className="mt-4">
                {wishlistItems.map((wishlistItem) => (
                  <div key={wishlistItem.id} className="flex items-center gap-3 border-b border-gray-100 py-4 last:border-b-0">
                    <div className="aspect-square h-16 w-16 shrink-0 overflow-hidden sm:h-20 sm:w-20">
                      <CartThumbImage src={wishlistItem.product.image} alt={wishlistItem.product.name} width={80} height={80} sizes="80px" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-neutral-900">{wishlistItem.product.name}</h3>
                      <p className="mt-1 text-sm text-neutral-600">{wishlistItem.product.price}</p>
                    </div>
                    <Button to={`/shop/${wishlistItem.product.category}/${wishlistItem.product.slug}`} variant="ghost" className="text-xs">View</Button>
                    <button type="button" onClick={() => handleMoveToCart(wishlistItem)} className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-900">Move to cart</button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-white px-3 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <p className="text-caption uppercase tracking-[0.24em] text-black/55">Cart</p>
                <h1 className="mt-2 text-2xl font-normal text-neutral-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{itemCount} item{itemCount > 1 ? 's' : ''} selected</h1>
              </div>
              <Link to="/shop" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-900">Continue shopping</Link>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
              COD checkout · Phone confirm before dispatch ·{' '}
              <a href={supportWhatsAppHref} target="_blank" rel="noreferrer" className="text-neutral-700 hover:text-neutral-900">WhatsApp support</a>
            </p>

            {items.map((item) => (
              <div
                key={item.id}
                className="luxury-fade-in border-b border-gray-100 py-5"
              >
                <div className="flex gap-4">
                  <div className="aspect-square h-20 w-20 shrink-0 overflow-hidden sm:h-28 sm:w-28">
                    <CartThumbImage src={item.image} alt={item.name} width={112} height={112} sizes="(max-width: 639px) 80px, 112px" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-[var(--color-text)]">{item.name}</h2>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">{item.color} • {item.size}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="text-sm font-semibold text-[var(--color-accent)]">Remove</button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 text-lg text-neutral-900">−</button>
                        <span className="min-w-8 text-center text-sm font-semibold text-neutral-900">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} disabled={item.quantity >= (item.stock ?? 0)} className="h-8 w-8 text-lg text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40">+</button>
                      </div>
                      <p className="text-base font-semibold text-[var(--color-accent)]">{formatBDT(parseBDT(item.price) * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="mt-8 border-t border-gray-100 pt-8">
              <CouponApplyField />
            </div>

            {wishlistItems.length > 0 ? (
              <div id="wishlist" className="mt-10 border-t border-gray-100 pt-10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-caption uppercase tracking-[0.24em] text-black/55">Wishlist</p>
                    <h2 className="mt-2 text-2xl font-normal text-neutral-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Saved for later</h2>
                  </div>
                </div>
                <div className="mt-4">
                  {wishlistItems.map((wishlistItem) => (
                    <div key={wishlistItem.id} className="flex items-center gap-3 border-b border-gray-100 py-4 last:border-b-0">
                      <div className="aspect-square h-16 w-16 shrink-0 overflow-hidden sm:h-20 sm:w-20">
                      <CartThumbImage src={wishlistItem.product.image} alt={wishlistItem.product.name} width={80} height={80} sizes="80px" />
                    </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-neutral-900">{wishlistItem.product.name}</h3>
                        <p className="mt-1 text-sm text-neutral-600">{wishlistItem.product.price}</p>
                      </div>
                      <Button to={`/shop/${wishlistItem.product.category}/${wishlistItem.product.slug}`} variant="ghost" className="text-xs">View</Button>
                      <button type="button" onClick={() => handleMoveToCart(wishlistItem)} className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-900">Move to cart</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden border-t border-gray-100 pt-8 sm:block lg:border-t-0 lg:pt-0">
            <p className="text-caption uppercase tracking-[0.24em] text-black/55">Summary</p>
            <div className="mt-5 space-y-3 text-sm text-[var(--color-muted)]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="text-[var(--color-text)]">{formatBDT(subtotal)}</span>
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{formatBDT(discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span className="text-right text-[var(--color-text)]">
                  {remainingForFreeDelivery > 0
                    ? `From ${formatBDT(80)} · free over ${formatBDT(freeDeliveryThreshold)}`
                    : 'Free delivery unlocked'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 text-base font-semibold text-[var(--color-text)]">
                <span>Total</span>
                <span className="text-[var(--color-accent)]">{totalLabel}</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button variant="cta" onClick={handleBeginCheckout} className="w-full">Checkout</Button>
              <Button to="/shop" variant="secondary" className="w-full justify-center">Keep browsing</Button>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
              <span>Phone confirmation</span>
              <a href={supportWhatsAppHref} target="_blank" rel="noreferrer" className="font-semibold text-[var(--color-accent)]">WhatsApp support</a>
            </div>
          </div>
        </div>

        <div className="fixed inset-x-2 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[55] rounded-[1.1rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.97)] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:hidden">
          <div className="flex items-center justify-between gap-3 rounded-[0.9rem] bg-[rgba(0,0,0,0.03)] px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">Bag total</p>
              <p className="mt-1 text-[1rem] font-semibold text-[var(--color-text)]">{totalLabel}</p>
            </div>
            <Button variant="cta" onClick={handleBeginCheckout} className="min-w-[8.25rem] px-4">
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
