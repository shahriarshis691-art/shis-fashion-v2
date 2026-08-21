export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'processing'
  | 'in_courier'
  | 'shipped'
  | 'delivered'
  | 'returned'
  | 'cancelled'

export type OrderNotifyChannel =
  | 'order-placed'
  | 'order-processing'
  | 'order-shipped'
  | 'order-in-courier'
  | 'order-delivered'
  | 'order-cancelled'
  | 'order-returned'

export const ORDER_STATUSES: OrderStatus[] = [
  'new',
  'confirmed',
  'processing',
  'in_courier',
  'shipped',
  'delivered',
  'returned',
  'cancelled',
]

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['in_courier', 'cancelled'],
  shipped: ['in_courier', 'delivered', 'cancelled'],
  in_courier: ['delivered', 'cancelled'],
  delivered: ['returned'],
  returned: [],
  cancelled: [],
}

export const ORDER_NOTIFY_CHANNELS: OrderNotifyChannel[] = [
  'order-placed',
  'order-processing',
  'order-shipped',
  'order-in-courier',
  'order-delivered',
  'order-cancelled',
  'order-returned',
]

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus)
}

export function isOrderNotifyChannel(value: string): value is OrderNotifyChannel {
  return ORDER_NOTIFY_CHANNELS.includes(value as OrderNotifyChannel)
}

export function canTransitionOrderStatus(from: string, to: string) {
  if (!isOrderStatus(from) || !isOrderStatus(to)) {
    return false
  }

  if (from === to) {
    return true
  }

  return (ORDER_STATUS_TRANSITIONS[from] ?? []).includes(to)
}

export function shouldRestockOnStatus(status: string) {
  return status === 'returned' || status === 'cancelled'
}
