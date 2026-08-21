import { parseBDT } from './currency'
import { isBillableOrderStatus } from './orderStatus'

export const LOW_STOCK_THRESHOLD = 5

interface ReportOrderItem {
  name?: string
  price?: string
  quantity?: number
}

interface ReportOrder {
  status: string
  total: number
  createdAt?: string | { seconds: number }
  items: ReportOrderItem[]
}

function toDate(createdAt?: string | { seconds: number }) {
  if (!createdAt) {
    return null
  }

  const parsed = typeof createdAt === 'string' ? new Date(createdAt) : new Date(createdAt.seconds * 1000)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function buildOpsReport(orders: ReportOrder[], now = new Date()) {
  const billable = orders.filter((order) => isBillableOrderStatus(order.status))
  const cancelled = orders.filter((order) => order.status === 'cancelled' || order.status === 'returned')
  const revenue = billable.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last7 = billable.filter((order) => {
    const date = toDate(order.createdAt)
    return Boolean(date && date >= sevenDaysAgo)
  })
  const last7Revenue = last7.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)
  const pending = orders.filter((order) => order.status === 'new')
  const pendingValue = pending.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)

  const byName = new Map<string, { name: string; quantity: number; revenue: number }>()
  for (const order of billable) {
    for (const item of order.items ?? []) {
      const name = (item.name ?? 'Item').trim() || 'Item'
      const current = byName.get(name) ?? { name, quantity: 0, revenue: 0 }
      current.quantity += item.quantity ?? 0
      current.revenue += parseBDT(item.price ?? 0) * (item.quantity ?? 0)
      byName.set(name, current)
    }
  }

  return {
    billableOrders: billable.length,
    aov: billable.length ? Math.round(revenue / billable.length) : 0,
    last7Orders: last7.length,
    last7Revenue,
    cancelledRate: orders.length ? Math.round((cancelled.length / orders.length) * 100) : 0,
    pendingValue,
    bestSellers: Array.from(byName.values()).sort((left, right) => right.quantity - left.quantity).slice(0, 5),
  }
}
