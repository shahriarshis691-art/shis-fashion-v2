import { createHash } from 'node:crypto'

export type MetaCapiEventName = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'

export interface MetaCapiUserDataInput {
  email?: string
  phone?: string
  firstName?: string
  city?: string
  country?: string
  fbp?: string
  fbc?: string
  clientIpAddress?: string
  clientUserAgent?: string
}

export interface MetaCapiSendInput {
  eventName: MetaCapiEventName
  eventId: string
  eventTime?: number
  eventSourceUrl?: string
  actionSource?: 'website' | 'system'
  customData?: Record<string, unknown>
  userData?: MetaCapiUserDataInput
}

function readEnv(name: string) {
  return String(process.env[name] ?? '').trim()
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('8801') && digits.length === 13) {
    return digits
  }

  if (digits.startsWith('01') && digits.length === 11) {
    return `88${digits}`
  }

  return digits
}

function hashIfPresent(value: string | undefined, normalizer: (input: string) => string) {
  const normalized = normalizer(String(value ?? ''))
  return normalized ? sha256(normalized) : undefined
}

export function getMetaPixelId() {
  return readEnv('META_PIXEL_ID') || readEnv('VITE_META_PIXEL_ID')
}

export function getMetaCapiAccessToken() {
  return readEnv('META_CAPI_ACCESS_TOKEN')
}

export function isMetaCapiConfigured() {
  return Boolean(getMetaPixelId() && getMetaCapiAccessToken())
}

export async function sendConversionsApiEvent(input: MetaCapiSendInput): Promise<{ ok: boolean; skipped?: boolean }> {
  const pixelId = getMetaPixelId()
  const accessToken = getMetaCapiAccessToken()
  if (!pixelId || !accessToken || !input.eventId.trim()) {
    return { ok: true, skipped: true }
  }

  const user = input.userData ?? {}
  const userData: Record<string, string> = {}
  const email = hashIfPresent(user.email, normalizeEmail)
  const phone = hashIfPresent(user.phone, normalizePhone)
  const firstName = hashIfPresent(user.firstName, (value) => value.trim().toLowerCase())
  const city = hashIfPresent(user.city, (value) => value.trim().toLowerCase())
  const country = hashIfPresent(user.country || 'bd', (value) => value.trim().toLowerCase())

  if (email) userData.em = email
  if (phone) userData.ph = phone
  if (firstName) userData.fn = firstName
  if (city) userData.ct = city
  if (country) userData.country = country
  if (user.fbp?.trim()) userData.fbp = user.fbp.trim()
  if (user.fbc?.trim()) userData.fbc = user.fbc.trim()
  if (user.clientIpAddress?.trim()) userData.client_ip_address = user.clientIpAddress.trim()
  if (user.clientUserAgent?.trim()) userData.client_user_agent = user.clientUserAgent.trim()

  const customData = input.customData
    ? Object.fromEntries(
      Object.entries(input.customData).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    )
    : undefined

  const event = {
    event_name: input.eventName,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: input.eventId.trim(),
    action_source: input.actionSource ?? 'website',
    ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
    ...(Object.keys(userData).length ? { user_data: userData } : {}),
    ...(customData && Object.keys(customData).length ? { custom_data: customData } : {}),
  }

  const body: Record<string, unknown> = {
    data: [event],
  }

  const testEventCode = readEnv('META_CAPI_TEST_EVENT_CODE')
  if (testEventCode) {
    body.test_event_code = testEventCode
  }

  const response = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      ...body,
      access_token: accessToken,
    }),
  })

  if (!response.ok) {
    return { ok: false }
  }

  return { ok: true }
}
