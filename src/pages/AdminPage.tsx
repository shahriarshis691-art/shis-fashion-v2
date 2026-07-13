import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'

export default function AdminPage() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <Container>
        <SectionTitle eyebrow="Admin access" title="Secure your luxury operations" description="This foundation-ready view prepares the experience for future dashboards and commerce tools." />
        <Card className="mt-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[var(--color-text)]">Manage collection, inventory, and clients</h3>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">A clean entry point for future admin flows with premium styling and responsive structure.</p>
          </div>
          <Button to="/" variant="secondary">Return Home</Button>
        </Card>
      </Container>
    </section>
  )
}
