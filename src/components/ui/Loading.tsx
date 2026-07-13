export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" aria-label="Loading content">
      <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-5 py-3 shadow-sm">
        <span className="h-3 w-3 animate-pulse rounded-full bg-[var(--color-accent)]" />
        <span className="text-sm font-medium text-[var(--color-muted)]">Preparing your experience…</span>
      </div>
    </div>
  )
}
