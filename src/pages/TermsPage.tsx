import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'

export default function TermsPage() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <Container>
        <h1 className="sr-only">Terms and Conditions</h1>
        <SectionTitle
          eyebrow="Legal"
          title="Terms and Conditions"
          description="The terms governing your use of SHIS Fashion and purchase of products."
        />

        <div className="mt-10 space-y-6 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 text-sm leading-7 text-[var(--color-muted)] sm:p-8">
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)]">Orders and Payment</h2>
            <p className="mt-2">Orders are confirmed after checkout and may be verified by phone before dispatch. Cash on Delivery policies apply where offered.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)]">Product Information</h2>
            <p className="mt-2">We aim for accurate product details and images, but colors and minor visual differences may vary by display.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)]">Returns and Support</h2>
            <p className="mt-2">For order issues, contact support promptly so we can review and assist based on store policy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)]">Contact</h2>
            <p className="mt-2">For terms-related questions, contact shisfashion18@gmail.com.</p>
          </section>
        </div>
      </Container>
    </section>
  )
}
