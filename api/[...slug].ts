export const config = {
  runtime: 'nodejs',
}

interface LooseRequest {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
  body?: unknown
  url?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  send: (body: string) => void
  json: (payload: unknown) => void
}

type RouteHandler = (req: LooseRequest, res: LooseResponse) => void | Promise<void>

const ROUTES: Record<string, () => Promise<{ default: RouteHandler }>> = {
  'cloudinary-destroy': () => import('./_handlers/cloudinary-destroy.js'),
  'cloudinary-signature': () => import('./_handlers/cloudinary-signature.js'),
  'confirm-order-payment': () => import('./_handlers/confirm-order-payment.js'),
  'create-order': () => import('./_handlers/create-order.js'),
  'create-review': () => import('./_handlers/create-review.js'),
  'incident-alert': () => import('./_handlers/incident-alert.js'),
  'lookup-order': () => import('./_handlers/lookup-order.js'),
  'newsletter-signup': () => import('./_handlers/newsletter-signup.js'),
  'notify-order': () => import('./_handlers/notify-order.js'),
  'order-confirmation': () => import('./_handlers/order-confirmation.js'),
  'prepaid-callback': () => import('./_handlers/prepaid-callback.js'),
  'prepaid-config': () => import('./_handlers/prepaid-config.js'),
  'product-share': () => import('./_handlers/product-share.js'),
  sitemap: () => import('./_handlers/sitemap.js'),
  'validate-coupon': () => import('./_handlers/validate-coupon.js'),
}

function resolveRouteKey(req: LooseRequest) {
  const slug = req.query?.slug
  if (Array.isArray(slug)) {
    return slug.filter(Boolean).join('/')
  }

  if (typeof slug === 'string' && slug.trim()) {
    return slug.trim()
  }

  try {
    const url = new URL(req.url ?? '', 'https://www.shisfashion.com')
    const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
    return segments.join('/')
  } catch {
    return ''
  }
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  const routeKey = resolveRouteKey(req)
  if (!routeKey) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  const loadRoute = ROUTES[routeKey]
  if (!loadRoute) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  try {
    const route = await loadRoute()
    await route.default(req, res)
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
}
