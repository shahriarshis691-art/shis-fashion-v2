import type { CartItem } from '../context/CartContext'
import { SUPPORT_WHATSAPP_HREF } from '../data/storePolicy'
import { formatBDT } from './currency'

export function buildWhatsAppOrderHref(items: CartItem[], grandTotal: number, extraNote = '') {
  const lines = items.map((item) => {
    const variant = [item.size, item.color !== 'Default' ? item.color : ''].filter(Boolean).join(', ')
    return `• ${item.name}${variant ? ` (${variant})` : ''} × ${item.quantity}`
  })

  const text = [
    'Hi SHIS Fashion, I would like to place an order:',
    '',
    ...lines,
    '',
    `Total: ${formatBDT(grandTotal)}`,
    extraNote,
  ]
    .filter((line) => line !== undefined)
    .join('\n')
    .trim()

  return `${SUPPORT_WHATSAPP_HREF}?text=${encodeURIComponent(text)}`
}
