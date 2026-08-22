const CAPI_EVENT_NAMES = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'] as const

export type MetaCapiEventName = (typeof CAPI_EVENT_NAMES)[number]

export function isMetaCapiEventName(value: string): value is MetaCapiEventName {
  return (CAPI_EVENT_NAMES as readonly string[]).includes(value)
}

export function createMetaEventId(eventName: string): string {
  const prefix = eventName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'event'
  const unique = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

  return `${prefix}-${unique}`
}
