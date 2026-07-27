import { Component, type ReactNode } from 'react'
import Button from '../ui/Button'

const CHUNK_RECOVERY_KEY = 'shis:chunk-recovery-attempted'

function isChunkLoadFailure(error: Error) {
  const message = error?.message ?? ''
  return (
    message.includes('Failed to fetch dynamically imported module')
    || message.includes('Importing a module script failed')
    || message.includes('Loading chunk')
    || message.includes('ChunkLoadError')
  )
}

function triggerChunkRecoveryReload() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    if (window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1') {
      return false
    }

    window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1')
    const url = new URL(window.location.href)
    url.searchParams.set('__chunk_retry', Date.now().toString())
    window.location.replace(url.toString())
    return true
  } catch {
    return false
  }
}

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

    if (isChunkLoadFailure(error)) {
      triggerChunkRecoveryReload()
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY)
      } catch {
        // Ignore sessionStorage failures.
      }
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
