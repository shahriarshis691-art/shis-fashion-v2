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
      {eyebrow ? <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)] sm:text-[11px]">{eyebrow}</p> : null}
      <h2 className="text-[2.05rem] font-semibold leading-[0.95] tracking-[-0.01em] text-[var(--color-text)] sm:text-[2.65rem] md:text-[3rem]">{title}</h2>
      {description ? <p className="mt-3 text-[0.95rem] leading-7 text-[var(--color-muted)] sm:text-base">{description}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}
