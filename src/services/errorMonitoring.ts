import { googleAnalytics } from './googleAnalytics'
import { incidentAlerts } from './incidentAlerts'

function normalizeErrorMessage(value: unknown) {
  if (value instanceof Error) {
    return value.message
  }

  return String(value ?? 'Unknown error')
}

class ErrorMonitoringService {
  private initialized = false

  initialize() {
    if (this.initialized || typeof window === 'undefined') {
      return
    }

    window.addEventListener('error', (event) => {
      const errorMessage = normalizeErrorMessage(event.error ?? event.message)
      this.capture('window_error', errorMessage, true)
    })

    window.addEventListener('unhandledrejection', (event) => {
      const errorMessage = normalizeErrorMessage(event.reason)
      this.capture('unhandled_rejection', errorMessage, false)
    })

    this.initialized = true
  }

  capture(source: string, message: string, fatal: boolean) {
    googleAnalytics.trackEvent('exception', {
      description: `${source}: ${message}`.slice(0, 500),
      fatal,
    })

    incidentAlerts.notify({
      source,
      message,
      fatal,
    })
  }
}

export const errorMonitoring = new ErrorMonitoringService()
