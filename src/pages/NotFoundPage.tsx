export default function NotFoundPage() {
  return (
    <section className="empty-state" aria-labelledby="not-found-title">
      <div className="empty-state__content">
        <p className="eyebrow">404</p>
        <h1 id="not-found-title">Page not found</h1>
        <p>The requested page could not be found.</p>
      </div>
    </section>
  )
}
