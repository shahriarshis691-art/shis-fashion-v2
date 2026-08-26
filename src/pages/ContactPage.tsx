import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
import Reveal from '../components/common/Reveal'
import { SUPPORT_WHATSAPP_HREF } from '../data/storePolicy'

export default function ContactPage() {
  return (
    <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Container>
        <h1 className="sr-only">Contact SHIS Fashion</h1>
        <SectionTitle
          eyebrow="Let’s talk"
          title="Book a private styling consultation"
          description="Whether you're planning a wardrobe refresh or a special event, our team is ready to assist."
        />
        <Reveal className="mt-12">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="text-caption uppercase tracking-[0.24em] text-black/55">Studio</p>
              <h2
                className="mt-4 text-3xl font-normal leading-tight tracking-[-0.01em] text-neutral-900 sm:text-4xl"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Visit our showroom
              </h2>
              <p className="mt-4 text-sm leading-7 text-neutral-600">
                <a href="mailto:shisfashion18@gmail.com" className="ui-interactive hover:text-neutral-900">
                  shisfashion18@gmail.com
                </a>
                <br />
                <a href="tel:+8801887848304" className="ui-interactive hover:text-neutral-900">
                  +88 01887848304
                </a>
              </p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="border-b border-gray-100 pb-4 text-sm leading-7 text-neutral-600">
                Tell us what you’re looking for and our team will respond with a tailored recommendation.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/track-order"
                  className="inline-flex min-h-12 items-center justify-center border border-neutral-900 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
                >
                  Track an order
                </Link>
                <a
                  href={SUPPORT_WHATSAPP_HREF}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-glass-cta"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
