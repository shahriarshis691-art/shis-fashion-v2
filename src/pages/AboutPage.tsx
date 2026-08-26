import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
import Reveal from '../components/common/Reveal'

const pillars = [
  'Luxury comfort in every silhouette',
  'Thoughtful craftsmanship and premium textiles',
  'A minimal approach to expressive dressing',
]

export default function AboutPage() {
  return (
    <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Container>
        <h1 className="sr-only">About SHIS Fashion</h1>
        <SectionTitle
          eyebrow="Our philosophy"
          title="Luxury, redefined for everyday life"
          description="We create pieces that feel as elevated as they look, balancing luxury details with effortless wearability."
        />
        <Reveal className="mt-12">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <div>
              <p className="text-caption uppercase tracking-[0.24em] text-black/55">Signature</p>
              <h2
                className="mt-4 text-3xl font-normal leading-tight tracking-[-0.01em] text-neutral-900 sm:text-4xl"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                A modern wardrobe with soul
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600">
                SHIS Fashion is dedicated to collecting refined essentials that transition beautifully from intimate evenings to elevated everyday moments.
              </p>
            </div>
            <ul>
              {pillars.map((pillar) => (
                <li
                  key={pillar}
                  className="border-b border-gray-100 py-4 text-sm leading-7 text-neutral-700 last:border-b-0"
                >
                  {pillar}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
