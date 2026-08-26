/** Routes with a sticky mobile CTA bar — lift toasts/widgets so they never cover Checkout. */
export function hasStickyMobileCta(pathname: string) {
  return pathname === '/cart' || pathname === '/checkout'
}
