import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { shopCategories, type ShopCategory, type ShopProduct } from '../data/shopData'
import { subscribeToCategories, subscribeToProducts, type AdminCategory, type AdminProduct } from '../firebase/adminService'
import { getManagedImageEntries } from '../utils/media'
import { parseBDT } from '../utils/currency'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function mapProduct(product: AdminProduct): ShopProduct {
  const imageEntries = getManagedImageEntries(product, 1)

  return {
    id: product.id,
    slug: slugify(product.name),
    name: product.name,
    price: product.price,
    category: product.category,
    image: imageEntries[0]?.url ?? '',
    description: product.description,
    galleryImages: imageEntries.map((entry) => entry.url).filter(Boolean),
    stock: product.stock,
    featured: product.featured,
    newArrival: product.newArrival,
    discount: product.stock <= 5 ? 'Low stock' : undefined,
  }
}

function mapCategory(category: AdminCategory): ShopCategory {
  return {
    slug: category.slug,
    title: category.name,
    description: 'Premium edits curated for your wardrobe.',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80',
  }
}

const categoryAliasMap: Record<string, string[]> = {
  mens: ['mens', 'mens-shirt', 'men', 'menswear'],
  womens: ['womens', 'womens-dresses', 'women', 'womenswear'],
  couples: ['couples', 'couple', 'couple-set'],
  kids: ['kids', 'kid', 'children'],
  western: ['western', 'western-outfits'],
  denim: ['denim'],
}

function categoryMatches(productCategory: string, activeSlug?: string) {
  if (!activeSlug) {
    return true
  }

  const normalizedSlug = activeSlug.trim().toLowerCase()
  const normalizedCategory = productCategory.trim().toLowerCase()

  if (normalizedCategory === normalizedSlug) {
    return true
  }

  const aliases = categoryAliasMap[normalizedSlug]
  if (!aliases?.length) {
    return false
  }

  return aliases.some((alias) => normalizedCategory.includes(alias))
}

function getWhatsAppHref() {
  return 'https://wa.me/8801887848304'
}

export default function ShopPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const slug = location.pathname.split('/').filter(Boolean).at(-1)
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [ready, setReady] = useState(false)
  const [categories, setCategories] = useState<ShopCategory[]>(shopCategories)
  const [sortBy, setSortBy] = useState<'curated' | 'price-low' | 'price-high' | 'new-arrivals'>('curated')
  const searchQuery = new URLSearchParams(location.search).get('q') ?? ''
  const supportWhatsAppHref = getWhatsAppHref()

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts((nextProducts) => {
      setProducts(nextProducts.map(mapProduct))
      setReady(true)
    })

    const unsubscribeCategories = subscribeToCategories((nextCategories) => {
      if (!nextCategories.length) {
        return
      }
      setCategories(nextCategories.map(mapCategory))
    })

    return () => {
      unsubscribeProducts()
      unsubscribeCategories()
    }
  }, [])

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(location.search)
    if (value.trim()) {
      params.set('q', value)
    } else {
      params.delete('q')
    }

    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
      },
      { replace: true },
    )
  }

  const activeCategories = categories.length ? categories : shopCategories
  const category = slug && slug !== 'shop'
    ? activeCategories.find((item) => item.slug === slug)
      ?? shopCategories.find((item) => item.slug === slug)
      ?? (categoryAliasMap[slug]
        ? {
          slug,
          title: slug.charAt(0).toUpperCase() + slug.slice(1),
          description: 'Premium edits curated for your wardrobe.',
          image: '',
        }
        : undefined)
    : undefined
  const isNewArrivalsRoute = location.pathname === '/shop/new-arrivals'
  const isBestSellersRoute = location.pathname === '/shop/best-sellers'
  const newArrivalProducts = useMemo(() => {
    const flagged = products.filter((product) => product.newArrival)
    return flagged.length ? flagged : products.slice(0, 8)
  }, [products])
  const bestSellerProducts = useMemo(() => [...products].sort((left, right) => (right.stock ?? 0) - (left.stock ?? 0)).slice(0, 8), [products])

  const visibleProducts = useMemo(() => {
    const baseProducts = isNewArrivalsRoute
      ? newArrivalProducts
      : isBestSellersRoute
        ? bestSellerProducts
        : slug && slug !== 'shop'
          ? products.filter((product) => categoryMatches(product.category, slug))
          : products
    const query = searchQuery.trim().toLowerCase()

    const filtered = query
      ? baseProducts.filter((product) => [product.name, product.description, product.category].some((value) => value.toLowerCase().includes(query)))
      : baseProducts

    if (sortBy === 'price-low') {
      return [...filtered].sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
    }

    if (sortBy === 'price-high') {
      return [...filtered].sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
    }

    if (sortBy === 'new-arrivals') {
      return [...filtered].sort((left, right) => Number(Boolean(right.newArrival)) - Number(Boolean(left.newArrival)))
    }

    return filtered
  }, [bestSellerProducts, isBestSellersRoute, isNewArrivalsRoute, newArrivalProducts, products, searchQuery, slug, sortBy])

  const headingTitle = isNewArrivalsRoute
    ? 'New Arrivals'
    : isBestSellersRoute
      ? 'Best Sellers'
      : category?.title ?? 'Curated essentials'

  const headingDescription = isNewArrivalsRoute
    ? 'Fresh pieces newly added to the SHIS collection.'
    : isBestSellersRoute
      ? 'Most in-demand essentials selected from the live catalog.'
      : category?.description ?? 'Discover premium essentials crafted for modern dressing and timeless comfort.'

  return (
    <section className="px-2.5 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        {!ready ? (
          <div className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-6 py-10 text-center text-sm text-[var(--color-muted)]">
            Loading collection...
          </div>
        ) : null}

        <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">SHIS SHOP</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">
                {headingTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                {headingDescription}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <label htmlFor="shop-search" className="sr-only">Search SHIS Fashion collection</label>
              <input
                id="shop-search"
                type="search"
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search the collection"
                className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none ring-0 sm:w-56"
              />
              <Button to="/shop" onClick={() => handleSearchChange('')} variant="secondary" className="px-4 py-2.5">
                All
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-[0.95rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] sm:hidden">
            <span>Swipe filters below</span>
            <a href={supportWhatsAppHref} target="_blank" rel="noreferrer" className="text-[var(--color-accent)]">WhatsApp help</a>
          </div>

          <div className="sticky top-[4.35rem] z-20 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/92 p-3 backdrop-blur-xl sm:static sm:bg-[var(--color-bg)]/70 sm:backdrop-blur-none">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">Browse edits</p>
              <div className="flex items-center gap-2">
                <label htmlFor="shop-sort" className="sr-only">Sort products</label>
                <select
                  id="shop-sort"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as 'curated' | 'price-low' | 'price-high' | 'new-arrivals')}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text)] outline-none"
                >
                  <option value="curated">Curated</option>
                  <option value="new-arrivals">New first</option>
                  <option value="price-low">Price low-high</option>
                  <option value="price-high">Price high-low</option>
                </select>
                <p className="text-xs text-[var(--color-muted)]">{visibleProducts.length} pieces</p>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className={`snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${location.pathname === '/shop' ? 'border-[var(--color-accent)] bg-[rgba(0,0,0,0.06)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-accent)]'}`}
            >
              All categories
            </button>
            <button
              type="button"
              onClick={() => navigate('/shop/new-arrivals')}
              className={`snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${isNewArrivalsRoute ? 'border-[var(--color-accent)] bg-[rgba(0,0,0,0.06)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-accent)]'}`}
            >
              New Arrivals
            </button>
            <button
              type="button"
              onClick={() => navigate('/shop/best-sellers')}
              className={`snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${isBestSellersRoute ? 'border-[var(--color-accent)] bg-[rgba(0,0,0,0.06)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-accent)]'}`}
            >
              Best Sellers
            </button>
            {activeCategories.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => navigate(`/shop/${item.slug}`)}
                className={`snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${location.pathname === `/shop/${item.slug}` ? 'border-[var(--color-accent)] bg-[rgba(0,0,0,0.06)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-accent)]'}`}
              >
                {item.title}
              </button>
            ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Live collection</h2>
            <p className="text-sm text-[var(--color-muted)]">{visibleProducts.length} results</p>
          </div>

          {visibleProducts.length ? (
            <div className="-mx-4 px-2 sm:mx-0 sm:px-0">
              <div className="grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-3 lg:gap-4 xl:grid-cols-4">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/70 px-6 py-12 text-center shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">No matches</p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--color-text)]">Nothing matched your search yet</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--color-muted)]">Try a broader term or reset the filters to see more of the collection.</p>
              <div className="mt-6 flex justify-center">
                <Button onClick={() => handleSearchChange('')} variant="secondary">Reset search</Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
