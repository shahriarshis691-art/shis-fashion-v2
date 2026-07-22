import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'

const pillars = [
  'Luxury comfort in every silhouette',
  'Thoughtful craftsmanship and premium textiles',
  'A minimal approach to expressive dressing',
]

export default function AboutPage() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <Container>
        <h1 className="sr-only">About SHIS Fashion</h1>
        <SectionTitle eyebrow="Our philosophy" title="Luxury, redefined for everyday life" description="We create pieces that feel as elevated as they look, balancing luxury details with effortless wearability." />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-10">
          <Card className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(0,0,0,0.06),rgba(0,0,0,0.02))] p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">Signature</p>
              <h3 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">A modern wardrobe with soul</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                SHIS Fashion is dedicated to collecting refined essentials that transition beautifully from intimate evenings to elevated everyday moments.
              </p>
            </div>
            <div className="space-y-4">
              {pillars.map((pillar) => (
                <div key={pillar} className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-4 text-sm text-[var(--color-muted)]">
                  {pillar}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </Container>
    </section>
  )
}
