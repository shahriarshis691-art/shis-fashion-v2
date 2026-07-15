import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'

export default function ContactPage() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <Container>
        <SectionTitle eyebrow="Let’s talk" title="Book a private styling consultation" description="Whether you're planning a wardrobe refresh or a special event, our team is ready to assist." />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-10">
          <Card className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(201,162,39,0.2),rgba(17,17,17,0.06))] p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">Studio</p>
              <h3 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">Visit our showroom</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">shisfashion18@gmail.com<br />+88 01887848304</p>
            </div>
            <div className="space-y-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8">
              <p className="text-sm leading-7 text-[var(--color-muted)]">Tell us what you’re looking for and our team will respond with a tailored recommendation.</p>
              <Button to="/" className="w-full justify-center">Request a consultation</Button>
            </div>
          </Card>
        </motion.div>
      </Container>
    </section>
  )
}
