import Container from '../ui/Container'
import Reveal from '../common/Reveal'

const TRUST_ITEMS = [
  {
    title: '100% Authentic Premium Fabric',
    caption: 'Considered materials, finished for daily luxury.',
  },
  {
    title: 'Fast Nationwide Delivery',
    caption: 'Dispatch across Bangladesh, typically 24–72 hours.',
  },
  {
    title: 'Easy Exchange & Cash on Delivery',
    caption: 'Simple size exchanges and COD on every order.',
  },
] as const

export default function TrustStrip() {
  return (
    <section
      className="border-y border-black/10 bg-white"
      aria-label="Store promises"
    >
      <Container>
        <ul className="grid gap-0 divide-y divide-black/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {TRUST_ITEMS.map((item, index) => (
            <Reveal key={item.title} as="li" delayMs={index * 60} className="px-1 py-5 text-center sm:px-6 sm:py-6">
              <p className="text-[1.05rem] leading-snug text-black sm:text-[1.15rem]" style={{ fontFamily: 'var(--font-display)' }}>
                {item.title}
              </p>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-black/55">
                {item.caption}
              </p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}
