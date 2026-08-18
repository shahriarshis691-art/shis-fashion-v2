const INVITE_COOKIE = 'shis_soft_launch_invite_ok'
const VISITOR_COOKIE = 'shis_soft_launch_visitor'

function readCookie(cookieHeader: string, key: string) {
  const parts = cookieHeader.split(';').map((part) => part.trim())
  for (const part of parts) {
    if (!part) {
      continue
    }

    const [name, ...rest] = part.split('=')
    if (name === key) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return ''
}

function hashToBucket(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash % 100
}

function randomVisitorId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function isBypassedPath(pathname: string) {
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return true
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/shis-admin')) {
    return true
  }

  if (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/brands/') ||
    pathname === '/favicon.svg' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt')
  ) {
    return true
  }

  return false
}

function getMode() {
  const raw = String(process.env.SOFT_LAUNCH_MODE ?? 'off').trim().toLowerCase()
  if (raw === 'percentage' || raw === 'invite-only') {
    return raw
  }

  return 'off'
}

function getPercent() {
  const raw = Number(process.env.SOFT_LAUNCH_PERCENT ?? 30)
  if (Number.isNaN(raw)) {
    return 30
  }

  return Math.min(100, Math.max(0, Math.floor(raw)))
}

function getInviteCodes() {
  return String(process.env.SOFT_LAUNCH_INVITE_CODES ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

function blockedResponse(mode: string) {
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Soft Launch Access</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f6f4ee; color: #151515; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    section { max-width: 680px; background: #fff; border: 1px solid #ddd; border-radius: 16px; padding: 28px; text-align: center; }
    h1 { margin: 12px 0; font-size: 30px; }
    p { line-height: 1.6; margin: 10px 0; }
    a { color: #111; font-weight: 600; }
    .eyebrow { letter-spacing: 0.18em; text-transform: uppercase; font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <main>
    <section>
      <p class="eyebrow">SHIS Fashion Soft Launch</p>
      <h1>Limited access is active</h1>
      <p>This storefront is currently running in ${mode} mode for launch stabilization.</p>
      <p>If you are part of the campaign, please use your invite link or check back later.</p>
      <p><a href="https://wa.me/8801887848304" target="_blank" rel="noreferrer">Request access on WhatsApp</a></p>
    </section>
  </main>
</body>
</html>`

  return new Response(body, {
    status: 403,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export default function middleware(request: Request) {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return
  }

  const mode = getMode()
  if (mode === 'off') {
    return
  }

  if (process.env.VERCEL_ENV === 'production') {
    console.warn(`[middleware] Soft launch active in production: ${mode}`)
  }

  const url = new URL(request.url)
  if (isBypassedPath(url.pathname)) {
    return
  }

  const cookieHeader = request.headers.get('cookie') ?? ''

  if (mode === 'invite-only') {
    const inviteCookie = readCookie(cookieHeader, INVITE_COOKIE)
    if (inviteCookie === '1') {
      return
    }

    const codes = getInviteCodes()
    const inviteCode = url.searchParams.get('invite')?.trim().toLowerCase() ?? ''
    if (inviteCode && codes.includes(inviteCode)) {
      const redirectUrl = new URL(request.url)
      redirectUrl.searchParams.delete('invite')

      return new Response(null, {
        status: 307,
        headers: {
          location: redirectUrl.toString(),
          'set-cookie': `${INVITE_COOKIE}=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
          'cache-control': 'no-store',
        },
      })
    }

    return blockedResponse(mode)
  }

  const existingVisitorId = readCookie(cookieHeader, VISITOR_COOKIE)
  const visitorId = existingVisitorId || randomVisitorId()
  const bucket = hashToBucket(visitorId)

  if (bucket >= getPercent()) {
    return blockedResponse(mode)
  }

  if (!existingVisitorId) {
    const response = new Response(null, {
      status: 307,
      headers: {
        location: request.url,
        'set-cookie': `${VISITOR_COOKIE}=${encodeURIComponent(visitorId)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`,
        'cache-control': 'no-store',
      },
    })

    return response
  }
}
