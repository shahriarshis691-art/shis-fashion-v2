import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  to?: string
  className?: string
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'border border-[#111111] bg-[#111111] text-white shadow-[0_4px_12px_rgba(17,17,17,0.16)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(17,17,17,0.20)]',
  secondary:
    'border border-[var(--color-border)] bg-[var(--color-surface)]/90 text-[var(--color-text)] hover:-translate-y-0.5 hover:border-[#111111] hover:text-[#111111]',
  ghost:
    'border border-transparent bg-transparent text-[var(--color-text)] hover:bg-[rgba(17,17,17,0.08)] hover:text-[#111111]',
}

export default function Button({ children, variant = 'primary', to, className = '', ...props }: ButtonProps) {
  const sharedClasses = `inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A96A] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`

  if (to) {
    return (
      <Link to={to} className={sharedClasses}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={sharedClasses} {...props}>
      {children}
    </button>
  )
}
