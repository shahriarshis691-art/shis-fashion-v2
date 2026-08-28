import type { HTMLAttributes, ReactNode } from 'react'

interface ProductListingGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Aarong catalog grid — 2×2 luxury mobile, 3 cols tablet, 4 cols desktop. */
export default function ProductListingGrid({ children, className = '', ...props }: ProductListingGridProps) {
  return (
    <div
      className={[
        'product-grid',
        'mx-auto grid min-w-0 w-full max-w-7xl',
        'grid-cols-2 gap-x-3 gap-y-7 px-3',
        'md:grid-cols-3 md:gap-6 md:px-0',
        'lg:grid-cols-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
