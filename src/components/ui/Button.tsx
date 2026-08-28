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
    'min-h-12 rounded-none border border-[#111111] bg-[#111111] px-6 py-3 text-[12px] font-semibold tracking-[0.16em] uppercase !text-white hover:bg-neutral-800 sm:text-[13px]',
  secondary:
    'min-h-12 rounded-none border border-neutral-200 bg-white px-6 py-3 text-[12px] font-semibold tracking-[0.16em] uppercase text-[#111111] hover:border-[#111111] sm:text-[13px]',
  ghost:
    'min-h-12 rounded-none border border-transparent bg-transparent px-6 py-3 text-[12px] font-semibold tracking-[0.16em] uppercase text-[#111111] hover:bg-[var(--color-sand)] sm:text-[13px]',
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
