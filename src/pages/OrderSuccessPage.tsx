import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { parseBDT, formatBDT } from '../utils/currency'
import { metaPixel } from '../services/metaPixel'
import { googleAnalytics } from '../services/googleAnalytics'

const ORDER_CONFIRMATION_KEY = 'shis-fashion-last-order'

interface LastOrderSnapshot {
  orderId: string
  customerName: string
  customerPhone: string
  address: string
  paymentMethod: string
  deliveryCharge: number
  subtotal: number
  grandTotal: number
  createdAt: string
  items: Array<{
    id: string
    name: string
    image: string
    price: string
    quantity: number
    size: string
    color: string
  }>
}

function getWhatsAppHref() {
  return 'https://wa.me/8801887848304'
}

export default function OrderSuccessPage() {
  const location = useLocation()
  const [order] = useState<LastOrderSnapshot | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const raw = window.sessionStorage.getItem(ORDER_CONFIRMATION_KEY)
      return raw ? (JSON.parse(raw) as LastOrderSnapshot) : null
    } catch {
      return null
    }
  })

  const orderItems = order?.items ?? []
  const hasTrackedPurchaseRef = useRef(false)

  const purchasePayload = useMemo(() => {
    if (!order) {
      return null
    }

    const contentIds = order.items.map((item) => item.id)
    return {
      value: order.grandTotal,
      currency: 'BDT',
      content_type: 'product' as const,
      content_ids: contentIds,
      content_name: order.items.length === 1 ? order.items[0].name : `${order.items.length} items`,
    }
  }, [order])

  useEffect(() => {
    if (!purchasePayload || !order || hasTrackedPurchaseRef.current) {
      return
    }

    metaPixel.purchase(purchasePayload)
    googleAnalytics.purchase({
      transaction_id: order.orderId,
      value: order.grandTotal,
      currency: 'BDT',
      items: order.items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: parseBDT(item.price),
        quantity: item.quantity,
      })),
    })

    hasTrackedPurchaseRef.current = true
  }, [order, purchasePayload])

  const supportWhatsAppHref = getWhatsAppHref()

  return (
    <section className="bg-white px-3.5 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <div className="border border-black/15 p-5 sm:p-7">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">Order Confirmed</p>
            <h1 className="mt-2 text-h2 text-black">Thank you. Your order has been placed.</h1>
            <p className="mt-3 text-sm leading-7 text-black/70">
              Our team will call your phone number to confirm delivery details before dispatch.
            </p>

            <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/70">
              Web confirmation is complete. Phone confirmation will be sent to <span className="font-semibold text-black">{order?.customerPhone ?? 'your number'}</span> shortly.
            </div>

            <div className="mt-5 grid gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60 sm:grid-cols-3">
              <span className="border border-black/15 px-3 py-2 text-center">COD confirmed</span>
              <span className="border border-black/15 px-3 py-2 text-center">Phone verification</span>
              <a href={supportWhatsAppHref} target="_blank" rel="noreferrer" className="border border-black/15 px-3 py-2 text-center hover:bg-black/5">
                WhatsApp support
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/shop">Continue shopping</Button>
              <Link to="/" className="ui-interactive inline-flex items-center justify-center border border-black px-5 py-3 text-sm font-semibold text-black hover:bg-black hover:text-white">
                Back home
              </Link>
            </div>
          </div>

          <div className="border border-black/15 p-5 sm:p-7">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black">Order Recap</h2>

            {order ? (
              <>
                <div className="mt-4 space-y-2 text-sm text-black/75">
                  <p><span className="text-black/55">Order ID:</span> {order.orderId}</p>
                  <p><span className="text-black/55">Name:</span> {order.customerName}</p>
                  <p><span className="text-black/55">Phone:</span> {order.customerPhone}</p>
                  <p><span className="text-black/55">Payment:</span> {order.paymentMethod}</p>
                  <p><span className="text-black/55">Address:</span> {order.address}</p>
                </div>

                <div className="mt-5 space-y-3 border-t border-black/10 pt-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-14 object-cover"
                        loading="lazy"
                        decoding="async"
                        sizes="56px"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-black">{item.name}</p>
                        <p className="text-xs text-black/60">Qty: {item.quantity} • {item.size}</p>
                      </div>
                      <p className="text-sm font-semibold text-black">{formatBDT(parseBDT(item.price) * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-black/10 pt-4 text-sm text-black/75">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="text-black">{formatBDT(order.subtotal)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Delivery</span>
                    <span className="text-black">{formatBDT(order.deliveryCharge)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-base font-semibold text-black">
                    <span>Total</span>
                    <span>{formatBDT(order.grandTotal)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 border border-dashed border-black/20 px-4 py-6 text-sm text-black/65">
                Order details are unavailable in this session. Check your admin panel or contact support.
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 text-center text-xs uppercase tracking-[0.12em] text-black/50">
          {location.state && typeof location.state === 'object' && 'orderId' in location.state
            ? `Reference: ${(location.state as { orderId?: string }).orderId ?? ''}`
            : null}
        </div>
      </Container>
    </section>
  )
}
