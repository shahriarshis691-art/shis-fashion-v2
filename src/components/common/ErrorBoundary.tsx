import { Component, type ReactNode } from 'react'
import Button from '../ui/Button'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-6 py-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Something went wrong</p>
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              This section could not load. Please try again or return to the homepage.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button onClick={this.handleReset}>Try again</Button>
              <Button to="/" variant="secondary">Back home</Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
