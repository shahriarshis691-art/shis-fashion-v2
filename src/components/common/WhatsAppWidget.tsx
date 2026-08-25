import { useLocation } from 'react-router-dom'
import { SUPPORT_WHATSAPP_HREF } from '../../data/storePolicy'

/** Routes with a sticky mobile CTA bar — lift the bubble so it never covers Buy Now / Add to Bag. */
function hasStickyMobileCta(pathname: string) {
  if (/^\/kids\/[^/]+\/?$/.test(pathname)) {
    return true
  }
  if (/^\/shop\/[^/]+\/[^/]+\/?$/.test(pathname)) {
    return true
  }
  if (pathname === '/cart' || pathname === '/checkout') {
    return true
  }
  return false
}

export default function WhatsAppWidget() {
  const { pathname } = useLocation()
  const liftForCta = hasStickyMobileCta(pathname)

  return (
    <a
      href={`${SUPPORT_WHATSAPP_HREF}?text=${encodeURIComponent('Hi SHIS Fashion, I need help with an order.')}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with SHIS Fashion on WhatsApp"
      className={`fixed z-30 flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-black text-white shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black right-[max(1rem,env(safe-area-inset-right))] touch-manipulation ${
        liftForCta
          ? 'bottom-[calc(5.75rem+env(safe-area-inset-bottom))] sm:bottom-[max(1.15rem,env(safe-area-inset-bottom))]'
          : 'bottom-[max(1.15rem,env(safe-area-inset-bottom))]'
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M12.04 2C6.58 2 2.15 6.37 2.15 11.75c0 1.72.46 3.4 1.34 4.88L2 22l5.53-1.44a10.1 10.1 0 0 0 4.51 1.08h.01c5.46 0 9.89-4.37 9.89-9.75S17.5 2 12.04 2Zm0 17.82h-.01a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.28.86.88-3.16-.2-.32a8.16 8.16 0 0 1-1.27-4.36c0-4.54 3.75-8.24 8.37-8.24 4.62 0 8.37 3.7 8.37 8.24 0 4.55-3.75 8.32-8.33 8.32Zm4.58-6.22c-.25-.13-1.48-.73-1.71-.81-.23-.08-.4-.13-.56.12-.17.25-.64.81-.79.98-.15.16-.29.18-.54.06-.25-.13-1.05-.38-2-1.22-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.77-1.84-.2-.48-.41-.41-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.19-.06-.1-.23-.17-.48-.3Z" />
      </svg>
    </a>
  )
}
