import type { HTMLAttributes, ReactNode } from 'react'

interface ProductListingGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function ProductListingGrid({ children, className = '', ...props }: ProductListingGridProps) {
  return (
    <div
      className={`grid min-w-0 grid-cols-2 items-start gap-x-1.5 gap-y-4 sm:grid-cols-3 sm:gap-x-2.5 sm:gap-y-5 lg:grid-cols-4 lg:gap-x-3.5 tight-mobile-grid product-grid ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}
