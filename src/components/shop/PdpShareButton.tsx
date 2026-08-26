interface PdpShareButtonProps {
  title: string
}

export default function PdpShareButton({ title }: PdpShareButtonProps) {
  const handleShare = async () => {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled or share failed; ignore.
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Clipboard may be blocked; ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleShare()
      }}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-neutral-900"
      aria-label="Share product"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <circle cx="18" cy="5" r="2.25" />
        <circle cx="6" cy="12" r="2.25" />
        <circle cx="18" cy="19" r="2.25" />
        <path d="M8.1 13.1 15.9 17.9M15.9 6.1 8.1 10.9" />
      </svg>
    </button>
  )
}
