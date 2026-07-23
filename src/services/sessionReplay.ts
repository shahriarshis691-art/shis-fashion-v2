declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void
  }
}

class SessionReplayService {
  private initialized = false
  private projectId: string | null = null

  constructor() {
    this.projectId = import.meta.env.VITE_CLARITY_PROJECT_ID || null
  }

  initialize() {
    if (this.initialized || !this.projectId || typeof window === 'undefined') {
      return
    }

    const existingScript = document.querySelector(`script[data-clarity-id="${this.projectId}"]`)
    if (existingScript) {
      this.initialized = true
      return
    }

    const clarityBootstrap = function clarityBootstrap(...args: unknown[]) {
      const globalWindow = window as unknown as { clarityQueue?: unknown[] }
      const queue = globalWindow.clarityQueue ?? []
      queue.push(args)
      globalWindow.clarityQueue = queue
    }

    window.clarity = clarityBootstrap

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.clarity.ms/tag/${this.projectId}`
    script.setAttribute('data-clarity-id', this.projectId)
    document.head.appendChild(script)

    this.initialized = true
  }
}

export const sessionReplay = new SessionReplayService()
