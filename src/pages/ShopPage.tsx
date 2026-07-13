import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'

const featuredItems = [
  { name: 'Velvet Wrap Coat', price: '$280' },
  { name: 'Signature Knit Set', price: '$220' },
  { name: 'Silk Tailored Blouse', price: '$180' },
]

export default function ShopPage() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <Container>
        <SectionTitle eyebrow="Curated edit" title="The season's most covetable essentials" description="Elevated staples with thoughtful structure and lasting comfort." />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featuredItems.map((item, index) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.08 }}>
              <Card className="h-full">
                <div className="h-40 rounded-[1.25rem] bg-[linear-gradient(135deg,rgba(201,162,39,0.2),rgba(17,17,17,0.08))]" />
                <h3 className="mt-6 text-xl font-semibold text-[var(--color-text)]">{item.name}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">Premium finish • Limited release</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-lg font-semibold text-[var(--color-accent)]">{item.price}</span>
                  <Button to="/contact" variant="secondary" className="px-4 py-2.5">
                    Enquire
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  )
}
