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
        'grid-cols-2 gap-x-2 gap-y-6',
        'max-md:-mx-2 max-md:px-2',
        'md:grid-cols-3 md:gap-x-4 md:gap-y-7 md:mx-auto md:px-0',
        'lg:grid-cols-4 lg:gap-x-5 lg:gap-y-8',
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
