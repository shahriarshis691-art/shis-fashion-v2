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
      className="overflow-x-hidden border-y border-black/10 bg-white"
      aria-label="Store promises"
    >
      <Container>
        <ul className="grid w-full min-w-0 grid-cols-3 gap-0 divide-x divide-black/10">
          {TRUST_ITEMS.map((item, index) => (
            <Reveal
              key={item.title}
              as="li"
              delayMs={index * 60}
              className="min-w-0 px-1.5 py-3.5 text-center sm:px-6 sm:py-6"
            >
              <p
                className="break-words text-[0.875rem] leading-[1.22] text-black sm:text-[1.15rem] sm:leading-snug"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {item.title}
              </p>
              <p className="mt-1 break-words text-[10px] leading-[1.4] uppercase tracking-[0.08em] text-black/55 sm:mt-1.5 sm:text-[11px] sm:tracking-[0.14em]">
                {item.caption}
              </p>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  )
}
