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
    'border border-[#1f1f1f] bg-[linear-gradient(180deg,#171717,#090909)] text-[#f7f3e9] shadow-[0_14px_34px_rgba(0,0,0,0.38)] hover:-translate-y-0.5 hover:border-[rgba(210,180,122,0.38)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.46)]',
  secondary:
    'border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] text-[var(--color-text)] hover:-translate-y-0.5 hover:border-[rgba(210,180,122,0.36)] hover:bg-[rgba(210,180,122,0.08)] hover:text-[var(--color-text)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--color-text)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--color-text)]',
}

export default function Button({ children, variant = 'primary', to, className = '', ...props }: ButtonProps) {
  const sharedClasses = `inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-base font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A96A] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${variants[variant]} ${className}`
  const ariaLabel = props['aria-label'] ?? (typeof children === 'string' ? children : undefined)

  if (to) {
    return (
      <Link to={to} className={sharedClasses} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={sharedClasses} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  )
}
