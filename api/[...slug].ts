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
  'payment-config': () => import('./_handlers/payment-config.js'),
  'prepaid-callback': () => import('./_handlers/prepaid-callback.js'),
  'prepaid-config': () => import('./_handlers/prepaid-config.js'),
  'product-share': () => import('./_handlers/product-share.js'),
  sitemap: () => import('./_handlers/sitemap.js'),
  'sslcommerz-ipn': () => import('./_handlers/sslcommerz-ipn.js'),
  'update-order-status': () => import('./_handlers/update-order-status.js'),
  'validate-coupon': () => import('./_handlers/validate-coupon.js'),
}

function headerValue(headers: LooseRequest['headers'], name: string) {
  const value = headers?.[name] ?? headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function resolveRouteKey(req: LooseRequest) {
  const slug = req.query?.slug
  if (Array.isArray(slug)) {
    const joined = slug.filter(Boolean).join('/')
    if (joined) {
      return joined
    }
  } else if (typeof slug === 'string' && slug.trim()) {
    return slug.trim()
  }

  const forwardedPath = headerValue(req.headers, 'x-vercel-path')
    || headerValue(req.headers, 'x-invoke-path')
    || headerValue(req.headers, 'x-forwarded-uri')

  if (forwardedPath.startsWith('/api/')) {
    const segments = forwardedPath.replace(/^\/api\/?/, '').split('/').filter(Boolean)
    if (segments.length) {
      return segments.join('/')
    }
  }

  try {
    const url = new URL(req.url ?? '', 'https://www.shisfashion.com')
    const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
    if (segments.length) {
      return segments.join('/')
    }
  } catch {
    // Fall through.
  }

  return ''
}

function sendJson(res: LooseResponse, status: number, payload: unknown) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.status(status).json(payload)
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  const routeKey = resolveRouteKey(req)
  if (!routeKey) {
    sendJson(res, 404, { error: 'Not found' })
    return
  }

  const loadRoute = ROUTES[routeKey]
  if (!loadRoute) {
    sendJson(res, 404, { error: 'Not found' })
    return
  }

  try {
    const route = await loadRoute()
    await route.default(req, res)
  } catch {
    sendJson(res, 500, { error: 'Internal server error' })
  }
}
