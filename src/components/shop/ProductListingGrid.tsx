import type { HTMLAttributes, ReactNode } from 'react'

interface ProductListingGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Shared listing grid — 2-col mobile, 3-col tablet, 4-col desktop. Homepage must not use this. */
export default function ProductListingGrid({ children, className = '', ...props }: ProductListingGridProps) {
  return (
    <div
      className={[
        'product-grid',
        'mx-auto grid min-w-0 w-full max-w-7xl',
        'grid-cols-2 gap-x-2 gap-y-5 px-2',
        'sm:gap-x-4 sm:gap-y-8 sm:px-4',
        'md:grid-cols-3',
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
