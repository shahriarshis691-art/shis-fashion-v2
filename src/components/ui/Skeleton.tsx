interface SkeletonProps {
  className?: string
  count?: number
}

/** Soft pulsing luxury shimmer — reserves space to prevent CLS. */
export default function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`luxury-skeleton rounded-sm ${className}`.trim()}
        />
      ))}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="min-w-0" aria-hidden="true">
      <div className="luxury-skeleton aspect-[3/4] w-full" />
      <div className="luxury-skeleton mt-2.5 h-3.5 w-4/5 rounded-sm" />
      <div className="luxury-skeleton mt-2 h-3 w-1/3 rounded-sm" />
    </div>
  )
}
