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

export interface OpsReportRange {
  from?: string
  to?: string
}

export interface OpsDailyPoint {
  date: string
  orders: number
  revenue: number
}

export interface OpsProductSale {
  name: string
  quantity: number
  revenue: number
}

function toDate(createdAt?: string | { seconds: number }) {
  if (!createdAt) {
    return null
  }

  const parsed = typeof createdAt === 'string' ? new Date(createdAt) : new Date(createdAt.seconds * 1000)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function toDayKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftDayKey(dayKey: string, days: number) {
  const [year, month, day] = dayKey.split('-').map(Number)
  const next = new Date(year || 1970, (month || 1) - 1, (day || 1) + days)
  return toDayKey(next)
}

export function defaultOpsReportRange(now = new Date()): OpsReportRange {
  return {
    from: shiftDayKey(toDayKey(now), -6),
    to: toDayKey(now),
  }
}

function inRange(date: Date | null, range?: OpsReportRange) {
  if (!date) {
    return !range?.from && !range?.to
  }

  const key = toDayKey(date)
  if (range?.from && key < range.from) {
    return false
  }

  if (range?.to && key > range.to) {
    return false
  }

  return true
}

export function buildOpsReport(orders: ReportOrder[], options?: { range?: OpsReportRange; now?: Date }) {
  const now = options?.now ?? new Date()
  const range = options?.range
  const scoped = orders.filter((order) => inRange(toDate(order.createdAt), range))
  const billable = scoped.filter((order) => isBillableOrderStatus(order.status))
  const cancelled = scoped.filter((order) => order.status === 'cancelled' || order.status === 'returned')
  const revenue = billable.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last7 = billable.filter((order) => {
    const date = toDate(order.createdAt)
    return Boolean(date && date >= sevenDaysAgo)
  })
  const last7Revenue = last7.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)
  const pending = scoped.filter((order) => order.status === 'new')
  const pendingValue = pending.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)

  const byName = new Map<string, OpsProductSale>()
  for (const order of billable) {
    for (const item of order.items ?? []) {
      const name = (item.name ?? 'Item').trim() || 'Item'
      const current = byName.get(name) ?? { name, quantity: 0, revenue: 0 }
      current.quantity += item.quantity ?? 0
      current.revenue += parseBDT(item.price ?? 0) * (item.quantity ?? 0)
      byName.set(name, current)
    }
  }

  const productSales = Array.from(byName.values()).sort((left, right) => right.quantity - left.quantity)
  const dailyMap = new Map<string, OpsDailyPoint>()
  for (const order of scoped) {
    const date = toDate(order.createdAt)
    if (!date) {
      continue
    }

    const key = toDayKey(date)
    const current = dailyMap.get(key) ?? { date: key, orders: 0, revenue: 0 }
    current.orders += 1
    if (isBillableOrderStatus(order.status)) {
      current.revenue += Number.isFinite(order.total) ? order.total : 0
    }
    dailyMap.set(key, current)
  }

  return {
    scopedOrders: scoped.length,
    billableOrders: billable.length,
    revenue: Math.round(revenue),
    aov: billable.length ? Math.round(revenue / billable.length) : 0,
    last7Orders: last7.length,
    last7Revenue,
    cancelledRate: scoped.length ? Math.round((cancelled.length / scoped.length) * 100) : 0,
    pendingValue,
    bestSellers: productSales.slice(0, 8),
    productSales,
    daily: Array.from(dailyMap.values()).sort((left, right) => left.date.localeCompare(right.date)),
  }
}
