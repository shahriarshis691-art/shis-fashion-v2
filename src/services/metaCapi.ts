import { getMetaFbc, getMetaFbp } from '../utils/attribution'
import { isMetaCapiEventName, type MetaCapiEventName } from '../utils/metaEvents'

export interface MetaCapiUserData {
  email?: string
  phone?: string
  firstName?: string
  city?: string
  country?: string
}

export interface MetaCapiEventInput {
  eventName: MetaCapiEventName
  eventId: string
  eventSourceUrl?: string
  customData?: Record<string, unknown>
  userData?: MetaCapiUserData
}

function canSend(): boolean {
  return import.meta.env.PROD && typeof window !== 'undefined'
}

export function sendMetaCapiEvent(input: MetaCapiEventInput): void {
  if (!canSend() || !isMetaCapiEventName(input.eventName) || !input.eventId.trim()) {
    return
  }

  const payload = {
    eventName: input.eventName,
    eventId: input.eventId.trim(),
    eventTime: Math.floor(Date.now() / 1000),
    eventSourceUrl: input.eventSourceUrl || window.location.href,
    customData: input.customData ?? {},
    userData: {
      ...input.userData,
      fbp: getMetaFbp(),
      fbc: getMetaFbc(),
    },
  }

  void fetch('/api/meta-capi', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Never block shopper flows on attribution transport.
  })
}
