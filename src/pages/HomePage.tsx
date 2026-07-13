import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'

const highlights = [
  { title: 'Crafted essentials', description: 'Refined staples with a couture finish.' },
  { title: 'Soft structure', description: 'Comfort-first tailoring that moves with you.' },
  { title: 'Limited drops', description: 'Exclusive pieces released in curated capsules.' },
]

const stats = [
  { value: '24/7', label: 'Luxury concierge' },
  { value: '4.9/5', label: 'Client rating' },
  { value: '48h', label: 'Priority dispatch' },
]

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(201,162,39,0.2),_transparent_40%)]" />
        <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
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
            <Card className="relative overflow-hidden rounded-[2rem] border-[var(--color-accent)]/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,244,232,0.95))] p-8 sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(201,162,39,0.2),_transparent_35%)]" />
              <div className="relative space-y-6">
                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_26px_80px_rgba(0,0,0,0.08)]">
                  <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">New arrival</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">The Atelier Edit</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    Sculpted tailoring with fluid comfort and a refined finish for day-to-evening dressing.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 text-center">
                      <p className="text-xl font-semibold text-[var(--color-text)]">{stat.value}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </Container>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <Container>
          <SectionTitle eyebrow="Why SHIS" title="Designed for the modern wardrobe" description="Every piece balances polished aesthetics with effortless ease, delivering a premium experience from first touch to final wear." align="center" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {highlights.map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.3, delay: index * 0.08 }}>
                <Card className="h-full">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">0{index + 1}</p>
                  <h3 className="mt-4 text-xl font-semibold text-[var(--color-text)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
