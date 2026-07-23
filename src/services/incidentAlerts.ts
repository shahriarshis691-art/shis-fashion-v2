interface IncidentAlertPayload {
  source: string
  message: string
  fatal: boolean
}

function alertsEnabled() {
  return String(import.meta.env.VITE_ERROR_ALERTS_ENABLED ?? 'false').trim().toLowerCase() === 'true'
}

class IncidentAlertsService {
  private initialized = false
  private recentMessages = new Map<string, number>()

  initialize() {
    if (this.initialized) {
      return
    }

    this.initialized = true
  }

  notify(payload: IncidentAlertPayload) {
    if (!alertsEnabled()) {
      return
    }

    const key = `${payload.source}:${payload.message}`.slice(0, 220)
    const now = Date.now()
    const lastSent = this.recentMessages.get(key) ?? 0

    if (now - lastSent < 30_000) {
      return
    }

    this.recentMessages.set(key, now)

    void fetch('/api/incident-alert', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify({
        source: payload.source,
        message: payload.message,
        fatal: payload.fatal,
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    }).catch(() => {
      // Do not throw from alert transport.
    })
  }
}

export const incidentAlerts = new IncidentAlertsService()
