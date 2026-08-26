import type { ReactNode } from 'react'

interface PdpAccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export default function PdpAccordion({ title, children, defaultOpen = false }: PdpAccordionProps) {
  return (
    <details className="group border-b border-gray-200" open={defaultOpen || undefined}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[12px] font-medium tracking-[0.14em] text-neutral-900 uppercase [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-neutral-500 transition-transform duration-200 group-open:rotate-180" aria-hidden>
          <path d="M3 6.5 8 11.5 13 6.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </summary>
      <div className="pb-4 text-sm leading-6 text-neutral-600">
        {children}
      </div>
    </details>
  )
}
