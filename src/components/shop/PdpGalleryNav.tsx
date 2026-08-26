interface PdpGalleryNavProps {
  count: number
  index: number
  onPrev: () => void
  onNext: () => void
  onSelect: (index: number) => void
}

export default function PdpGalleryNav({ count, index, onPrev, onNext, onSelect }: PdpGalleryNavProps) {
  if (count < 2) {
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={onPrev}
        className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-black/10 bg-white text-lg text-black"
        aria-label="Previous image"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={onNext}
        className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-black/10 bg-white text-lg text-black"
        aria-label="Next image"
      >
        ›
      </button>
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
        {Array.from({ length: count }, (_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            onClick={() => onSelect(dotIndex)}
            aria-current={dotIndex === index ? 'true' : undefined}
            className={`h-1.5 ${dotIndex === index ? 'w-4 bg-neutral-900' : 'w-1.5 bg-neutral-400'}`}
            aria-label={`Go to image ${dotIndex + 1}`}
          />
        ))}
      </div>
    </>
  )
}
