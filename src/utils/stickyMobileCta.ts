/** Routes with a sticky mobile CTA bar — lift toasts/widgets so they never cover Buy Now / Checkout. */
export function hasStickyMobileCta(pathname: string) {
  if (/^\/kids\/[^/]+\/?$/.test(pathname)) {
    return true
  }
  if (/^\/sarees\/[^/]+\/?$/.test(pathname)) {
    return true
  }
  if (/^\/shop\/[^/]+\/[^/]+\/?$/.test(pathname)) {
    return true
  }
  if (/^\/product\/[^/]+\/?$/.test(pathname)) {
    return true
  }
  if (pathname === '/cart' || pathname === '/checkout') {
    return true
  }
  return false
}
