export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10" aria-label="Loading content">
      <div className="flex min-w-[260px] flex-col items-center gap-4 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-6 py-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:min-w-[320px]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 animate-bounce rounded-full bg-[var(--color-accent)] [animation-delay:-0.2s]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-[var(--color-accent)] [animation-delay:-0.1s]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-[var(--color-accent)]" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Loading</p>
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">Preparing your premium experience…</p>
        </div>
      </div>
    </div>
  )
}
