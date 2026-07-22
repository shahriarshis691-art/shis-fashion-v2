import { Link } from 'react-router-dom'

const saleCategories = [
  { title: 'Men’s Shirts', href: '/shop/mens-shirt' },
  { title: 'Women’s Dresses', href: '/shop/womens-dresses' },
  { title: 'Denim & Jackets', href: '/shop/denim' },
]

const saleFeatures = [
  {
    title: 'Up to 50% off',
    description: 'Limited-time reductions on premium essentials chosen for everyday wear and elevated styling.',
  },
  {
    title: 'Free nationwide delivery',
    description: 'Fast dispatch across Bangladesh with reliable service and cash-on-delivery available.',
  },
  {
    title: 'Limited quantities',
    description: 'Products are curated for standout quality; once they’re gone, they’re gone.',
  },
]

const saleBenefits = [
  'Shop premium essentials built for comfort, polish, and modern everyday style.',
  'Use our curated collections to update your wardrobe with confidence.',
  'Enjoy faster checkout and trusted delivery across the country.',
]

export default function SalePage() {
  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.05),_transparent_35%),linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] text-[var(--color-text)]">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.18)] bg-[rgba(0,0,0,0.05)] px-4 py-2 text-[0.78rem] uppercase tracking-[0.3em] text-[var(--color-accent)] sm:text-[0.86rem]">
            Limited time sale
          </p>
          <h1 className="text-[2.8rem] font-black leading-[1.02] text-[var(--color-text)] sm:text-[4rem] lg:text-[5rem]">
            Save Big on Premium Essentials
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--color-muted)] sm:text-lg sm:leading-9">
            Discover the SHIS Fashion sale: curated outfits, refined basics, and strong value across shirts, dresses, denim, and limited-release seasonal pieces.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition duration-200 hover:bg-[#2a2a2a]"
            >
              Shop the Sale
            </Link>
            <Link
              to="/shop/new-arrivals"
              className="inline-flex items-center justify-center rounded-full border border-[var(--color-border)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-text)] transition duration-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              New Arrivals
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-[0.82rem] uppercase tracking-[0.24em] text-[var(--color-muted)]">
            <span className="rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-3 py-2">Limited stock</span>
            <span className="rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-3 py-2">Free delivery</span>
            <span className="rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-3 py-2">Cash on delivery</span>
          </div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {saleFeatures.map((feature) => (
            <article key={feature.title} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 backdrop-blur-xl transition hover:border-[rgba(0,0,0,0.3)]">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--color-accent)]">{feature.title}</p>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 backdrop-blur-xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">Sale strategy</p>
            <h2 className="mt-4 text-3xl font-bold text-[var(--color-text)] sm:text-4xl">The easiest way to refresh your wardrobe</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
              This sale is built for fast decision-making: premium essentials, curated categories, and clear value so your styling feels luxurious without the premium markup.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-[var(--color-muted)]">
              {saleBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(0,0,0,0.08)] text-[var(--color-accent)]">✓</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[2.2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 backdrop-blur-xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-muted)]">Shop the top categories</p>
            <div className="mt-6 space-y-4">
              {saleCategories.map((category) => (
                <Link
                  key={category.href}
                  to={category.href}
                  className="block rounded-3xl border border-[var(--color-border)] bg-[rgba(0,0,0,0.02)] px-5 py-4 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
                >
                  {category.title}
                </Link>
              ))}
            </div>
            <div className="mt-8 rounded-[1.8rem] border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] p-6">
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--color-muted)]">Quick savings</p>
              <p className="mt-3 text-lg font-semibold text-[var(--color-text)]">Shop now before the best sellers sell out.</p>
            </div>
          </section>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Premium value</p>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">Get premium pieces that feel elevated and comfortable without the usual markup.</p>
          </div>
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Confidence shipping</p>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">Fast nationwide delivery with careful packing and reliable service across Bangladesh.</p>
          </div>
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Easy support</p>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">Questions? Contact us instantly via WhatsApp and get help before you checkout.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
