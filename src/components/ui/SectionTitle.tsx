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
      {eyebrow ? <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)] sm:text-xs">{eyebrow}</p> : null}
      <h2 className="text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl md:text-5xl">{title}</h2>
      {description ? <p className="mt-4 text-lg leading-7 text-[var(--color-muted)] sm:text-base">{description}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  )
}
