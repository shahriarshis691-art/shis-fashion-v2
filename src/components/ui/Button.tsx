import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'cta'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  to?: string
  className?: string
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'border border-[#1f1f1f] bg-[linear-gradient(180deg,#1a1a1a,#000000)] !text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)] hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.25)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.34)]',
  secondary:
    'border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] text-[var(--color-text)] hover:-translate-y-0.5 hover:border-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.06)] hover:text-[var(--color-text)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--color-text)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--color-text)]',
  cta:
    'rounded-[2px] border border-black bg-black text-white shadow-none hover:translate-y-0 hover:bg-[#121212] hover:border-black',
}

export default function Button({ children, variant = 'primary', to, className = '', ...props }: ButtonProps) {
  const sharedClasses = `inline-flex min-h-12 items-center justify-center rounded-full px-6 py-3 text-[15px] font-semibold leading-none transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base ${variants[variant]} ${className}`
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
