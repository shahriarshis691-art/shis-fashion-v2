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
      {eyebrow ? <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--color-gold)] sm:text-[11px]">{eyebrow}</p> : null}
      <h2
        className="text-[2.05rem] font-medium leading-[0.95] tracking-[-0.01em] text-[#111111] sm:text-[2.65rem] md:text-[3rem]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {description ? <p className="mt-3 text-[0.95rem] leading-7 text-[var(--color-muted)] sm:text-base">{description}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}
