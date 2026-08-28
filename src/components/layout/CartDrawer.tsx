import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, clearBuyNowCheckout } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import { subscribeToHomepageContent } from '../../firebase/adminService'
import { formatBDT, parseBDT } from '../../utils/currency'
import { catalogImageAttrs, CATALOG_IMAGE_PLACEHOLDER } from '../../utils/media'
import { DEFAULT_FREE_DELIVERY_THRESHOLD, getAmountToFreeDelivery } from '../../utils/bangladeshAddress'
import { buildWhatsAppOrderHref } from '../../utils/whatsappOrder'
import CouponApplyField from '../shop/CouponApplyField'

export default function CartDrawer() {
  const navigate = useNavigate()
  const { isOpen, closeCart } = useCartDrawer()
  const { items, updateQuantity, removeFromCart, subtotal, itemCount, appliedCoupon, discountAmount, grandTotal } = useCart()
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(DEFAULT_FREE_DELIVERY_THRESHOLD)
  const remainingForFreeDelivery = getAmountToFreeDelivery(subtotal, freeDeliveryThreshold)
  const progressPercent = freeDeliveryThreshold > 0
    ? Math.max(0, Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100)))
    : 100
  const whatsappHref = buildWhatsAppOrderHref(items, grandTotal)

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => {
      setFreeDeliveryThreshold(content.freeDeliveryThreshold ?? DEFAULT_FREE_DELIVERY_THRESHOLD)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCart()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeCart, isOpen])

  const handleCheckout = () => {
    clearBuyNowCheckout()
    closeCart()
    navigate('/checkout')
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button
        type="button"
        className="luxury-fade-in absolute inset-0 bg-black/40"
        aria-label="Close cart"
        onClick={closeCart}
      />
      <aside className="luxury-sheet-up absolute inset-y-0 right-0 flex w-full max-w-[28rem] flex-col bg-white shadow-[-18px_0_48px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-medium tracking-[0.2em] text-neutral-400 uppercase">Bag</p>
            <h2 className="mt-1 text-xl text-[#111111]" style={{ fontFamily: 'var(--font-display)' }}>
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="ui-interactive inline-flex h-10 w-10 items-center justify-center text-[#111111]"
            aria-label="Close cart"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M6 6 18 18" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="border-b border-neutral-200 px-5 py-3">
          <p className="text-xs text-neutral-600">
            {remainingForFreeDelivery > 0
              ? `Spend ${formatBDT(remainingForFreeDelivery)} more for free delivery.`
              : 'You unlocked free delivery.'}
          </p>
          <div className="mt-2 h-1 w-full overflow-hidden bg-neutral-100">
            <div
              className="h-full gold-progress transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-[#111111]" style={{ fontFamily: 'var(--font-display)' }}>
                Your bag is empty.
              </p>
              <p className="mt-2 text-sm text-neutral-500">Add a piece to begin checkout.</p>
              <Link
                to="/shop"
                onClick={closeCart}
                className="mt-6 inline-flex min-h-11 items-center border border-[#111111] bg-[#111111] px-5 text-[11px] font-semibold tracking-[0.16em] text-white uppercase"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {items.map((item) => {
                const thumb = catalogImageAttrs(item.image, 160, 160, '80px', [80, 160])
                return (
                  <li key={item.id} className="flex gap-3 py-4">
                    <div className="h-20 w-16 shrink-0 overflow-hidden bg-[var(--color-sand)]">
                      <img
                        src={thumb.src || CATALOG_IMAGE_PLACEHOLDER}
                        srcSet={thumb.srcSet}
                        sizes={thumb.sizes}
                        alt={item.name}
                        width={80}
                        height={100}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-[#111111]">{item.name}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">{item.color} · {item.size}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#111111]">{formatBDT(parseBDT(item.price) * item.quantity)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-neutral-200">
                          <button type="button" onClick={() => updateQuantity(item.id, -1)} className="h-8 w-8 text-[#111111]" aria-label="Decrease quantity">−</button>
                          <span className="min-w-6 text-center text-xs font-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.quantity >= (item.stock ?? 0)}
                            className="h-8 w-8 text-[#111111] disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.id)} className="text-[11px] tracking-[0.12em] text-neutral-500 uppercase hover:text-[#111111]">
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-neutral-200 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <CouponApplyField />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="text-[#111111]">{formatBDT(subtotal)}</span>
              </div>
              {appliedCoupon ? (
                <div className="flex justify-between text-[var(--color-gold)]">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{formatBDT(discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-[#111111]">
                <span>Total</span>
                <span>{formatBDT(grandTotal)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center bg-[#111111] text-[12px] font-semibold tracking-[0.16em] text-white uppercase"
            >
              Checkout
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center border border-neutral-200 text-[12px] font-semibold tracking-[0.16em] text-[#111111] uppercase"
            >
              Order on WhatsApp
            </a>
            <Link
              to="/cart"
              onClick={closeCart}
              className="mt-3 block text-center text-[11px] tracking-[0.14em] text-neutral-500 uppercase hover:text-[#111111]"
            >
              View full bag
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
