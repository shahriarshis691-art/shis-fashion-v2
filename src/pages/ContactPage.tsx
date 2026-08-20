import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
import { SUPPORT_WHATSAPP_HREF } from '../data/storePolicy'

export default function ContactPage() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <Container>
        <h1 className="sr-only">Contact SHIS Fashion</h1>
        <SectionTitle eyebrow="Let’s talk" title="Book a private styling consultation" description="Whether you're planning a wardrobe refresh or a special event, our team is ready to assist." />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mt-10">
          <Card className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(0,0,0,0.06),rgba(0,0,0,0.02))] p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">Studio</p>
              <h3 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">Visit our showroom</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                <a href="mailto:shisfashion18@gmail.com" className="ui-interactive hover:text-[var(--color-text)]">shisfashion18@gmail.com</a>
                <br />
                <a href="tel:+8801887848304" className="ui-interactive hover:text-[var(--color-text)]">+88 01887848304</a>
              </p>
            </div>
            <div className="space-y-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8">
              <p className="text-sm leading-7 text-[var(--color-muted)]">Tell us what you’re looking for and our team will respond with a tailored recommendation.</p>
              <Link
                to="/track-order"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#1f1f1f] bg-white px-6 py-3 text-[15px] font-semibold leading-none text-black"
              >
                Track an order
              </Link>
              <a
                href={SUPPORT_WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#1f1f1f] bg-[linear-gradient(180deg,#1a1a1a,#000000)] px-6 py-3 text-[15px] font-semibold leading-none !text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
              >
                Chat on WhatsApp
              </a>
            </div>
          </Card>
        </motion.div>
      </Container>
    </section>
  )
}
