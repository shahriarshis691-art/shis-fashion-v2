import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return <div className={`rounded-none border border-neutral-200 bg-white p-6 ${className}`.trim()}>{children}</div>
}
