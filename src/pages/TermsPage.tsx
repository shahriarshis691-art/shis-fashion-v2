import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
import { STORE_POLICY, SUPPORT_WHATSAPP_HREF } from '../data/storePolicy'

export default function TermsPage() {
  return (
    <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Container>
        <h1 className="sr-only">Terms and Conditions</h1>
        <SectionTitle
          eyebrow="Legal"
          title="Terms and Conditions"
          description="The terms governing your use of SHIS Fashion and purchase of products."
        />

        <div className="mt-10 space-y-8 text-sm leading-7 text-neutral-600">
          <section>
            <h2 className="text-base font-semibold text-neutral-900">Orders and Payment</h2>
            <p className="mt-2">{STORE_POLICY.phoneConfirm} {STORE_POLICY.cashOnDelivery} Orders are confirmed after checkout.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900">Delivery</h2>
            <p className="mt-2">{STORE_POLICY.deliveryWindow} Delivery charges and free-delivery thresholds are shown at checkout.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900">Product Information</h2>
            <p className="mt-2">We aim for accurate product details and images, but colors and minor visual differences may vary by display.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900">Returns and Exchange</h2>
            <p className="mt-2">{STORE_POLICY.exchangeWindow}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {STORE_POLICY.exchangeConditions.map((condition) => (
                <li key={condition}>{condition}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-neutral-900">Contact</h2>
            <p className="mt-2">
              For terms-related questions, contact shisfashion18@gmail.com or{' '}
              <a href={SUPPORT_WHATSAPP_HREF} target="_blank" rel="noreferrer" className="underline">chat on WhatsApp</a>.
            </p>
          </section>
        </div>
      </Container>
    </section>
  )
}
