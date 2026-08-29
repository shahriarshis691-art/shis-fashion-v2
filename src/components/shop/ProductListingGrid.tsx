import type { HTMLAttributes, ReactNode } from 'react'

interface ProductListingGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** Global catalog grid — uniform 2-col mobile, 3-col tablet, 4-col desktop. */
export default function ProductListingGrid({ children, className = '', ...props }: ProductListingGridProps) {
  return (
    <div
      className={[
        'product-grid',
        'mx-auto grid min-w-0 w-full max-w-7xl',
        'grid-cols-2 gap-x-[2px] gap-y-6 px-1',
        'md:grid-cols-3 md:gap-x-6 md:gap-y-10 md:px-4',
        'lg:grid-cols-4 md:px-8',
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
