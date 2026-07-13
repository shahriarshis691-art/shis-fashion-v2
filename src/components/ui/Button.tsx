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
    'border border-[var(--color-accent)] bg-[var(--color-accent)] text-black shadow-[0_12px_40px_rgba(201,162,39,0.25)] hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(201,162,39,0.35)]',
  secondary:
    'border border-[var(--color-border)] bg-[var(--color-surface)]/90 text-[var(--color-text)] hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]',
  ghost:
    'border border-transparent bg-transparent text-[var(--color-text)] hover:bg-[rgba(201,162,39,0.12)] hover:text-[var(--color-accent)]',
}

export default function Button({ children, variant = 'primary', to, className = '', ...props }: ButtonProps) {
  const sharedClasses = `inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`

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
