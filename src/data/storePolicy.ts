export const SUPPORT_WHATSAPP_HREF = 'https://wa.me/8801887848304'
export const EXCHANGE_WINDOW_DAYS = 3

export const STORE_POLICY = {
  deliveryWindow: 'Delivery within 24-72 hours in major cities.',
  cashOnDelivery: 'Cash on Delivery available across Bangladesh.',
  exchangeWindow: `Exchange requests accepted within ${EXCHANGE_WINDOW_DAYS} days of delivery.`,
  phoneConfirm: 'We call to confirm the order on your phone before dispatch.',
  exchangeConditions: [
    'Items must be unused, unwashed, and returned with original tags and packaging.',
    'Exchanges cover size, fit, or an item sent in error. Cash refunds are not offered on COD unless the piece is defective or incorrectly sent.',
    `Request an exchange on WhatsApp within ${EXCHANGE_WINDOW_DAYS} days with your order ID and clear photos of the item.`,
  ],
} as const

export const DELIVERY_RETURN_BULLETS = [
  STORE_POLICY.deliveryWindow,
  STORE_POLICY.cashOnDelivery,
  STORE_POLICY.exchangeWindow,
] as const
