import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'

export default function PrivacyPage() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <Container>
        <h1 className="sr-only">Privacy Policy</h1>
        <SectionTitle
          eyebrow="Legal"
          title="Privacy Policy"
          description="How SHIS Fashion collects, uses, and protects your personal information."
        />

        <div className="mt-10 space-y-6 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 text-sm leading-7 text-[var(--color-muted)] sm:p-8">
          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)]">Information We Collect</h2>
            <p className="mt-2">We may collect your name, phone number, delivery address, and optional email when you place an order.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)]">How We Use Your Information</h2>
            <p className="mt-2">We use your information to process orders, coordinate delivery, and provide customer support.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)]">Data Sharing</h2>
            <p className="mt-2">We do not sell personal data. Information is shared only with service providers required for order fulfillment and operations.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[var(--color-text)]">Contact</h2>
            <p className="mt-2">For privacy questions, contact us at shisfashion18@gmail.com.</p>
          </section>
        </div>
      </Container>
    </section>
  )
}
