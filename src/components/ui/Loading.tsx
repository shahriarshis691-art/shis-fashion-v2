export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12" aria-label="Loading content" aria-busy="true">
      <div className="w-full max-w-sm space-y-4">
        <div className="luxury-skeleton mx-auto h-10 w-40 rounded-full" />
        <div className="luxury-skeleton aspect-[4/5] w-full rounded-sm" />
        <div className="luxury-skeleton h-3 w-3/4 rounded-sm" />
        <div className="luxury-skeleton h-3 w-1/3 rounded-sm" />
        <p className="pt-2 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
          Preparing…
        </p>
      </div>
    </div>
  )
}
