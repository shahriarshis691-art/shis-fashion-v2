import { SUPPORT_WHATSAPP_HREF } from '../data/storePolicy'
import { normalizeBangladeshPhone } from './bangladeshAddress'

export const PAYMENT_METHOD_COD = 'Cash on Delivery'
export const STORE_TRACK_ORDER_URL = 'https://www.shisfashion.com/track-order'

export function buildWhatsAppHref(target: string, text: string) {
  const base = target.startsWith('http')
    ? target.split('?')[0]
    : `https://wa.me/${target.replace(/\D/g, '')}`

  return `${base}?text=${encodeURIComponent(text)}`
}

export function getCustomerOrderSupportHref(orderId: string) {
  const trimmedId = orderId.trim()
  const message = trimmedId
    ? `Hi SHIS Fashion, I need help with order ${trimmedId}.`
    : 'Hi SHIS Fashion, I need help with my order.'

  return buildWhatsAppHref(SUPPORT_WHATSAPP_HREF, message)
}

export function getAdminCustomerNotifyHref(input: {
  phone?: string
  customerName?: string
  orderId: string
  status: string
  trackingNumber?: string
}) {
  const phone = normalizeBangladeshPhone(input.phone ?? '')
  if (!phone) {
    return ''
  }

  const name = input.customerName?.trim() || 'there'
  const trackUrl = `${STORE_TRACK_ORDER_URL}?id=${encodeURIComponent(input.orderId)}`
  const tracking = input.trackingNumber?.trim()
  let text = `Hi ${name}, your SHIS Fashion order ${input.orderId} was received. We will call to confirm. Track: ${trackUrl}`

  if (input.status === 'confirmed') {
    text = `Hi ${name}, your SHIS Fashion order ${input.orderId} is confirmed. We will call before dispatch. Payment is Cash on Delivery. Track: ${trackUrl}`
  } else if (input.status === 'processing') {
    text = `Hi ${name}, your SHIS Fashion order ${input.orderId} is being prepared. Track: ${trackUrl}`
  } else if (input.status === 'in_courier') {
    text = `Hi ${name}, your SHIS Fashion order ${input.orderId} is with the courier.${tracking ? ` Tracking: ${tracking}.` : ''} Track: ${trackUrl}`
  } else if (input.status === 'shipped') {
    text = `Hi ${name}, your SHIS Fashion order ${input.orderId} has been shipped.${tracking ? ` Tracking: ${tracking}.` : ''} Track: ${trackUrl}`
  } else if (input.status === 'delivered') {
    text = `Hi ${name}, your SHIS Fashion order ${input.orderId} has been delivered. Thank you for shopping with SHIS Fashion.`
  } else if (input.status === 'returned') {
    text = `Hi ${name}, we received the return for SHIS Fashion order ${input.orderId}. Message us on WhatsApp if you need help.`
  } else if (input.status === 'cancelled') {
    text = `Hi ${name}, your SHIS Fashion order ${input.orderId} has been cancelled. Message us on WhatsApp if you need help.`
  }

  return `https://wa.me/88${phone}?text=${encodeURIComponent(text)}`
}

export function getPublicTrackingHref(trackingNumber: string) {
  const trimmed = trackingNumber.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : ''
}
