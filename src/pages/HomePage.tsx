import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'

const categories = [
  { name: 'Tailored Layers', caption: 'Soft authority' },
  { name: 'Everyday Luxe', caption: 'Refined comfort' },
  { name: 'Evening Edit', caption: 'Quiet glamour' },
]

const bestSellers = [
  { name: 'Velvet Wrap Coat', price: '$280' },
  { name: 'Signature Knit Set', price: '$220' },
  { name: 'Silk Tailored Blouse', price: '$180' },
]

const arrivals = [
  { name: 'Monarch Linen', price: '$190' },
  { name: 'Studio Evening Bag', price: '$150' },
  { name: 'Sculpted Heel', price: '$210' },
]

const reviews = [
  {
    name: 'Aisha K.',
    quote: 'Every detail feels considered. The comfort is unreal and the finish is immaculate.',
  },
  {
    name: 'Mina R.',
    quote: 'The pieces feel elevated without being overdone. It is luxury in motion.',
  },
]

const stats = [
  { value: '24/7', label: 'Luxury concierge' },
  { value: '4.9/5', label: 'Client rating' },
  { value: '48h', label: 'Priority dispatch' },
]

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(201,162,39,0.2),_transparent_38%)]" />
        <Container className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--color-accent)]">SHIS FASHION</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-7xl">
              Style Meets Comfort.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Discover elevated staples designed for modern living, with premium materials and an effortless silhouette that turns every look into a statement.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button to="/shop">Shop Collection</Button>
              <Button to="/about" variant="secondary">
                Discover More
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.12 }}>
            <Card className="relative overflow-hidden rounded-[2rem] border-[var(--color-accent)]/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,244,232,0.95))] p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,162,39,0.2),_transparent_35%)]" />
              <div className="relative space-y-5">
                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.08)] sm:p-6">
                  <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">New arrival</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">The Atelier Edit</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    Sculpted tailoring with fluid comfort and a refined finish for day-to-evening dressing.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 text-center">
                      <p className="text-lg font-semibold text-[var(--color-text)]">{stat.value}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </Container>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Container>
          <SectionTitle eyebrow="Curated essentials" title="Premium categories for every moment" description="A calm, editorial approach to wardrobe essentials designed to feel as luxurious as they look." align="center" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {categories.map((category, index) => (
              <motion.div key={category.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.25, delay: index * 0.06 }}>
                <Card className="h-full rounded-[1.5rem]">
                  <div className="h-28 rounded-[1.25rem] bg-[linear-gradient(135deg,rgba(201,162,39,0.22),rgba(17,17,17,0.08))]" />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">{category.name}</h3>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{category.caption}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Container>
          <SectionTitle eyebrow="Best sellers" title="The pieces clients return for" description="Soft structure, refined texture, and everyday ease in every silhouette." />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {bestSellers.map((item, index) => (
              <motion.div key={item.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.25, delay: index * 0.06 }}>
                <Card className="h-full rounded-[1.5rem]">
                  <div className="h-36 rounded-[1.25rem] bg-[linear-gradient(135deg,rgba(201,162,39,0.18),rgba(17,17,17,0.06))]" />
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">{item.name}</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">Luxury staple</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-accent)]">{item.price}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Container>
          <SectionTitle eyebrow="New arrivals" title="Freshly composed for the season" description="Newly released pieces with an effortless, sculpted feel." />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {arrivals.map((item, index) => (
              <motion.div key={item.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.25, delay: index * 0.06 }}>
                <Card className="h-full rounded-[1.5rem]">
                  <div className="h-36 rounded-[1.25rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.8),rgba(201,162,39,0.16))]" />
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text)]">{item.name}</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">Limited release</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-accent)]">{item.price}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Container>
          <div className="grid gap-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Brand story</p>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)] sm:text-4xl">Luxury that feels personal.</h2>
              <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                SHIS Fashion is shaped by an obsession with texture, ease, and timeless silhouettes that make everyday dressing feel serene and elevated.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(201,162,39,0.16),rgba(255,255,255,0.6))] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Signature promise</p>
              <p className="mt-3 text-lg leading-8 text-[var(--color-text)]">Quiet luxury, elevated comfort, and a wardrobe that moves effortlessly from morning to midnight.</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
        <Container>
          <SectionTitle eyebrow="Client love" title="What our clients are saying" description="Trusted for thoughtful styling and a seamless luxury experience." align="center" />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {reviews.map((review, index) => (
              <motion.div key={review.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.25, delay: index * 0.06 }}>
                <Card className="h-full rounded-[1.5rem]">
                  <p className="text-sm leading-8 text-[var(--color-muted)]">“{review.quote}”</p>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-accent)]">{review.name}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
