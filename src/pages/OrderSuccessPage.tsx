import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { useCart } from '../context/CartContext'
import { parseBDT } from '../utils/currency'
import { metaPixel } from '../services/metaPixel'

export default function OrderSuccessPage() {
  const { items } = useCart()

  useEffect(() => {
    // Fire Purchase event only when order is successfully placed
    if (items.length > 0) {
      const totalValue = items.reduce((sum, item) => sum + (parseBDT(item.price) * item.quantity), 0)
      const contentIds = items.map(item => String(item.id))
      
      metaPixel.purchase({
        value: totalValue,
        currency: 'BDT',
        content_type: 'product',
        content_ids: contentIds,
        content_name: items.length === 1 ? items[0].name : `${items.length} items`,
      })
    }
  }, [items])

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Order received</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">Your luxury order is on the way.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">A confirmation has been prepared for your inbox. We’ll keep you posted as your selected pieces make their way to your door.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/shop">Continue shopping</Button>
            <Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">Back home</Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
