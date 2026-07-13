import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="app-shell">
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  )
}
