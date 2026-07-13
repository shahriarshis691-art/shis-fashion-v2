import type { ReactNode } from 'react'

interface SectionTitleProps {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  children?: ReactNode
}

export default function SectionTitle({ eyebrow, title, description, align = 'left', children }: SectionTitleProps) {
  const alignmentClass = align === 'center' ? 'mx-auto text-center' : 'text-left'

  return (
    <div className={`max-w-2xl ${alignmentClass}`}>
      {eyebrow ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">{eyebrow}</p> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">{description}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )
}
