import { captureCampaignAttribution, hasCampaignSignals, hasStoredCampaignAttribution } from '../utils/attribution'

export type SoftLaunchMode = 'off' | 'percentage' | 'invite-only'

export interface SoftLaunchDecision {
  allowed: boolean
  mode: SoftLaunchMode
  bucket: number
  reason: 'off' | 'dev-bypass' | 'admin-route' | 'paid-traffic-bypass' | 'percentage-allow' | 'percentage-block' | 'invite-valid' | 'invite-session' | 'invite-invalid' | 'invite-missing'
}

const SOFT_LAUNCH_SESSION_KEY = 'shis-soft-launch-invite-ok'
const SOFT_LAUNCH_VISITOR_KEY = 'shis-soft-launch-visitor-id'

function isAdminPath(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/shis-admin')
}

function getMode(): SoftLaunchMode {
  const raw = String(import.meta.env.VITE_SOFT_LAUNCH_MODE ?? 'off').trim().toLowerCase()
  if (raw === 'percentage' || raw === 'invite-only') {
    return raw
  }

  return 'off'
}

function getRolloutPercent() {
  const raw = Number(import.meta.env.VITE_SOFT_LAUNCH_PERCENT ?? 30)
  if (Number.isNaN(raw)) {
    return 30
  }

  return Math.min(100, Math.max(0, Math.floor(raw)))
}

function shouldEnforceInDev() {
  return String(import.meta.env.VITE_SOFT_LAUNCH_ENFORCE_IN_DEV ?? 'false').trim().toLowerCase() === 'true'
}

function parseInviteCodes() {
  return String(import.meta.env.VITE_SOFT_LAUNCH_INVITE_CODES ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

function getOrCreateVisitorId() {
  if (typeof window === 'undefined') {
    return 'server-visitor'
  }

  const stored = window.localStorage.getItem(SOFT_LAUNCH_VISITOR_KEY)
  if (stored) {
    return stored
  }

  const generated = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(SOFT_LAUNCH_VISITOR_KEY, generated)
  return generated
}

function hashToBucket(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash % 100
}

function hasActiveInviteSession() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.sessionStorage.getItem(SOFT_LAUNCH_SESSION_KEY) === '1'
}

function markInviteSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(SOFT_LAUNCH_SESSION_KEY, '1')
}

function getInviteCodeFromSearch(search: string) {
  const params = new URLSearchParams(search)
  return params.get('invite')?.trim().toLowerCase() ?? ''
}

export function evaluateSoftLaunchAccess(pathname: string, search: string): SoftLaunchDecision {
  const mode = getMode()
  const visitorId = getOrCreateVisitorId()
  const bucket = hashToBucket(visitorId)
  captureCampaignAttribution(search, pathname)

  if (mode === 'off') {
    return { allowed: true, mode, bucket, reason: 'off' }
  }

  if (hasCampaignSignals(search) || hasStoredCampaignAttribution()) {
    return { allowed: true, mode, bucket, reason: 'paid-traffic-bypass' }
  }

  if (!import.meta.env.PROD && !shouldEnforceInDev()) {
    return { allowed: true, mode, bucket, reason: 'dev-bypass' }
  }

  if (isAdminPath(pathname)) {
    return { allowed: true, mode, bucket, reason: 'admin-route' }
  }

  if (mode === 'percentage') {
    const percent = getRolloutPercent()
    if (bucket < percent) {
      return { allowed: true, mode, bucket, reason: 'percentage-allow' }
    }

    return { allowed: false, mode, bucket, reason: 'percentage-block' }
  }

  const inviteCodes = parseInviteCodes()
  const inviteCode = getInviteCodeFromSearch(search)

  if (hasActiveInviteSession()) {
    return { allowed: true, mode, bucket, reason: 'invite-session' }
  }

  if (!inviteCode) {
    return { allowed: false, mode, bucket, reason: 'invite-missing' }
  }

  if (inviteCodes.includes(inviteCode)) {
    markInviteSession()
    return { allowed: true, mode, bucket, reason: 'invite-valid' }
  }

  return { allowed: false, mode, bucket, reason: 'invite-invalid' }
}
