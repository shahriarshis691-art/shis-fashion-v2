import type { HTMLAttributes, ReactNode } from 'react'

interface ProductListingGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Aarong catalog grid — 2 cols mobile, 3 cols tablet, 4 cols desktop. */
export default function ProductListingGrid({ children, className = '', ...props }: ProductListingGridProps) {
  return (
    <div
      className={`product-grid mx-auto grid min-w-0 max-w-7xl grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}
