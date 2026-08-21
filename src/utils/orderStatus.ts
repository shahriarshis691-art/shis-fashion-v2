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

export const ORDER_LIFECYCLE: OrderStatus[] = [
  'new',
  'confirmed',
  'processing',
  'in_courier',
  'delivered',
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

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  confirmed: 'Confirmed',
  processing: 'Processing',
  in_courier: 'In courier',
  shipped: 'Shipped',
  delivered: 'Delivered',
  returned: 'Returned',
  cancelled: 'Cancelled',
}

export const TRACKING_TIMELINE: Array<{ status: OrderStatus; label: string }> = [
  { status: 'new', label: 'Received' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'processing', label: 'Preparing' },
  { status: 'in_courier', label: 'In courier' },
  { status: 'delivered', label: 'Delivered' },
]

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus)
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus) {
  if (from === to) {
    return true
  }

  return (ORDER_STATUS_TRANSITIONS[from] ?? []).includes(to)
}

export function isBillableOrderStatus(status: string) {
  return status !== 'cancelled' && status !== 'returned'
}

export function orderMatchesStatusFilter(status: string, filter: OrderStatus | 'all') {
  if (filter === 'all') {
    return true
  }

  if (filter === 'in_courier') {
    return status === 'in_courier' || status === 'shipped'
  }

  return status === filter
}

export function shouldRestockOnStatus(status: string) {
  return status === 'returned' || status === 'cancelled'
}

export function notifyChannelForStatus(status: string): OrderNotifyChannel | null {
  switch (status) {
    case 'confirmed':
      return 'order-placed'
    case 'processing':
      return 'order-processing'
    case 'shipped':
      return 'order-shipped'
    case 'in_courier':
      return 'order-in-courier'
    case 'delivered':
      return 'order-delivered'
    case 'cancelled':
      return 'order-cancelled'
    case 'returned':
      return 'order-returned'
    default:
      return null
  }
}

export function trackingTimelineStatus(status: string): OrderStatus | 'cancelled' | 'returned' {
  if (status === 'shipped') {
    return 'in_courier'
  }

  return isOrderStatus(status) ? status : 'new'
}

export function getTrackingStepState(status: string, stepStatus: OrderStatus): 'complete' | 'current' | 'upcoming' {
  const normalized = trackingTimelineStatus(status)
  if (normalized === 'cancelled') {
    return 'upcoming'
  }

  if (normalized === 'returned' || normalized === 'delivered') {
    return 'complete'
  }

  const currentIndex = TRACKING_TIMELINE.findIndex((step) => step.status === normalized)
  const stepIndex = TRACKING_TIMELINE.findIndex((step) => step.status === stepStatus)
  if (currentIndex < 0 || stepIndex < 0) {
    return 'upcoming'
  }

  if (stepIndex < currentIndex) {
    return 'complete'
  }

  if (stepIndex === currentIndex) {
    return 'current'
  }

  return 'upcoming'
}
