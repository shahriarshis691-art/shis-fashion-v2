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
    'min-h-12 rounded-full border border-[#1f1f1f] bg-[linear-gradient(180deg,#1a1a1a,#000000)] px-6 py-3 text-[15px] !text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)] hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.25)] hover:shadow-[0_18px_40px_rgba(0,0,0,0.34)] sm:text-base',
  secondary:
    'min-h-12 rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-6 py-3 text-[15px] text-[var(--color-text)] hover:-translate-y-0.5 hover:border-[rgba(0,0,0,0.3)] hover:bg-[rgba(0,0,0,0.06)] hover:text-[var(--color-text)] sm:text-base',
  ghost:
    'min-h-12 rounded-full border border-transparent bg-transparent px-6 py-3 text-[15px] text-[var(--color-text)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[var(--color-text)] sm:text-base',
  cta: 'btn-glass-cta',
}

export default function Button({ children, variant = 'primary', to, className = '', type = 'button', ...props }: ButtonProps) {
  const isGlassCta = variant === 'cta'
  const focusClass = isGlassCta
    ? ''
    : 'luxury-tap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'
  const sharedClasses = `inline-flex items-center justify-center font-semibold leading-none transition-all duration-300 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-60 ${focusClass} ${variants[variant]} ${className}`
  const ariaLabel = props['aria-label'] ?? (typeof children === 'string' ? children : undefined)

  if (to) {
    return (
      <Link to={to} className={sharedClasses} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  }

  return (
    <button className={sharedClasses} aria-label={ariaLabel} {...props} type={type}>
      {children}
    </button>
  )
}
