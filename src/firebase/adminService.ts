import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { deleteCloudinaryAssetByUrl, uploadMultipleAssets } from '../services/cloudinary'
import { homeCategoryItems } from '../data/homeCategories'
import { featuredCollectionCovers, categoryStripCovers } from '../data/featuredCollectionCovers'
import { shopCategories } from '../data/shopData'
import { brandEntries } from '../data/brandShowcase'
import { compactManagedImages, isOutdatedHardcodedMediaUrl, isPersistableMediaUrl, isRemoteMediaUrl, pickPreferredCategoryCoverUrl } from '../utils/media'
import { slugify } from '../utils/slugify'
import { normalizeSizes } from '../utils/sizes'
import { isValidCouponCode, isCouponExpired, normalizeCouponCategories, resolveCouponAudience, resolveCouponDiscountType, quoteCouponDiscount, nextCouponUsage, type CouponAudience, type CouponDiscountType, type CouponQuoteItem } from '../utils/coupon'
import { isApiPrepaidPayment } from '../utils/paymentMethods'
import { allocateProductSlug, getProductSlug, productMatchesSlug } from '../utils/productIdentity'
import { decrementMatchingVariant, incrementMatchingVariant, getProductStockTotal, normalizeVariants, type ProductVariantStock } from '../utils/variantStock'
import { hasAnyAdminAccessRole, resolveAdminAccessRole, type AdminAccessRole } from '../utils/adminAccess'
import { auth as firebaseAuth, db as firebaseDb, firebaseProjectId } from './firebase'
import type { DeliveryAddress } from '../utils/bangladeshAddress'
import type { OrderNotifyChannel, OrderStatus } from '../utils/orderStatus'
import { canTransitionOrderStatus, shouldRestockOnStatus } from '../utils/orderStatus'

export type HomepageSectionKey = 'hero' | 'featuredCollection' | 'newArrivals' | 'bestSellers' | 'brandPromise'

export interface HomepageSectionConfig {
  key: HomepageSectionKey
  label: string
  enabled: boolean
  order: number
}

export interface AdminProduct {
  id: string
  name: string
  slug?: string
  price: string
  comparePrice?: string
  brand?: string
  stock: number
  sizes: string[]
  colors: string[]
  variants?: ProductVariantStock[]
  description: string
  category: string
  featuredImage?: string
  thumbnail?: string
  coverImage?: string
  images: string[]
  imageTitles?: string[]
  imageDescriptions?: string[]
  videos: string[]
  featured: boolean
  newArrival: boolean
  hero: boolean
  createdAt?: string | { seconds: number }
  archived?: boolean
  archivedAt?: string | { seconds: number }
}

export interface AdminOrder {
  id: string
  customerName: string
  customerPhone?: string
  customerEmail: string
  address: string
  deliveryAddress?: DeliveryAddress
  deliveryCharge?: number
  notes?: string
  items: Array<{ name: string; price: string; quantity: number; size?: string; color?: string; slug?: string }>
  total: number
  status: OrderStatus
  trackingNumber?: string
  paymentMethod?: string
  paymentStatus?: 'unpaid' | 'pending' | 'pending_verification' | 'paid' | 'failed'
  paymentTransactionId?: string
  createdAt?: string | { seconds: number }
  archived?: boolean
  archivedAt?: string | { seconds: number }
  couponCode?: string
  couponDiscountPercent?: number
  couponDiscountAmount?: number
  couponId?: string
  stockCommitted?: boolean
  stockRestored?: boolean
  attribution?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
    utm_term?: string
    fbclid?: string
    gclid?: string
    ttclid?: string
    msclkid?: string
    landingPath?: string
    landingSearch?: string
    capturedAt?: string
  }
  purchaseEventId?: string
}

export interface AdminSessionUser {
  uid: string
  email: string | null
  role: AdminAccessRole
  canWrite: boolean
  needsAdminDoc: boolean
}

export interface AdminAccount {
  uid: string
  email?: string
  role: AdminAccessRole
  active: boolean
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface ProductReview {
  id: string
  productId: string
  productSlug?: string
  authorName: string
  rating: number
  body: string
  status: ReviewStatus
  createdAt?: string | { seconds: number }
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  createdAt?: string | { seconds: number }
  archived?: boolean
  archivedAt?: string | { seconds: number }
}

export interface AdminBrand {
  id: string
  slug: string
  name: string
  tag: string
  summary: string
  description: string
  website: string
  contactEmail: string
  contactPhone: string
  logo: string
  bannerImage?: string
  images: string[]
  createdAt?: string | { seconds: number }
  archived?: boolean
  archivedAt?: string | { seconds: number }
}

export interface FounderProfile {
  name: string
  title: string
  image: string
  bio: string
  story: string
  socials: {
    whatsapp: string
    facebook: string
    instagram: string
    email: string
  }
}

export interface HomepageShopCategory {
  title: string
  href: string
  image?: string
}

export type HomepageCategorySectionKey =
  | 'women'
  | 'saree'
  | 'men'
  | 'denim'
  | 'kids'
  | 'western'
  | 'sale'
  | 'new-arrivals'

export interface HomepageCategorySection {
  key: HomepageCategorySectionKey
  label: string
  href: string
  enabled: boolean
  order: number
  coverImage: string
  images: string[]
  updatedAt?: string | { seconds: number } | null
}

export type HomepageCategorySections = Record<HomepageCategorySectionKey, HomepageCategorySection>

export interface FeaturedCollectionPage {
  slug: string
  title: string
  subtitle: string
  description: string
  href: string
  images: string[]
  relatedCategorySlugs: string[]
}

export interface HomepageSeoEntry {
  title: string
  description: string
  keywords: string
  ogImage?: string
}

export interface HomepageSeoConfig {
  home?: HomepageSeoEntry
  shop?: HomepageSeoEntry
  oversized?: HomepageSeoEntry
}

const defaultHomepageSeo: Required<HomepageSeoConfig> = {
  home: {
    title: 'SHIS Fashion Bangladesh | Premium Oversized T-Shirts, Polo Shirts & Denim',
    description: 'Shop premium oversized T-shirts, Polo Shirts, Denim and Fashion Essentials from SHIS Fashion Bangladesh. Premium quality. Fast Delivery. Cash on Delivery available.',
    keywords: 'SHIS Fashion, Bangladesh Fashion, Oversized T Shirt Bangladesh, Premium Polo Shirt, Denim, Fashion Store Bangladesh',
    ogImage: 'https://www.shisfashion.com/og-image.png',
  },
  shop: {
    title: 'Shop SHIS Fashion Bangladesh | Premium T-Shirts, Polo Shirts & Denim',
    description: 'Browse premium oversized T-shirts, Polo Shirts, Shirts, Denim and women\'s and kids fashion at SHIS Fashion Bangladesh.',
    keywords: 'SHIS Fashion, Bangladesh Fashion, Oversized T Shirt Bangladesh, Premium Polo Shirt, Denim, Fashion Store Bangladesh',
    ogImage: 'https://www.shisfashion.com/og-image.png',
  },
  oversized: {
    title: 'Oversized Tee | SHIS Fashion Bangladesh',
    description: 'Shop premium oversized T-shirts from SHIS Fashion Bangladesh with fast Dhaka delivery and cash on delivery support.',
    keywords: 'Oversized T Shirt Bangladesh, SHIS oversized tee, baggy t shirt dhaka',
    ogImage: 'https://www.shisfashion.com/og-image.png',
  },
}

export interface HomepageContent {
  navbarBrandPrimary?: string
  navbarBrandSecondary?: string
  navbarSearchPlaceholder?: string
  heroEyebrow?: string
  heroTitle: string
  heroSubtitle: string
  heroCta: string
  heroPrimaryLink?: string
  heroSecondaryCta?: string
  heroSecondaryLink?: string
  heroImage?: string
  heroImageTitle?: string
  heroImageDescription?: string
  heroVideo?: string
  bannerImage?: string
  bannerImageTitle?: string
  bannerImageDescription?: string
  categories: Array<{ title: string; caption: string; href?: string; image?: string }>
  featuredCollectionPages: FeaturedCollectionPage[]
  shopByCategories: HomepageShopCategory[]
  categorySections?: HomepageCategorySections
  featuredCollectionEyebrow?: string
  featuredCollectionTitle?: string
  featuredCollectionSubtitle?: string
  newArrivalsEyebrow?: string
  newArrivalsTitle: string
  newArrivalsSubtitle: string
  bestSellerEyebrow?: string
  featuredTitle: string
  featuredSubtitle: string
  brandPromiseEyebrow?: string
  brandPromiseTitle?: string
  brandPromiseDescription?: string
  brandSignatureLabel?: string
  brandSignatureText?: string
  footerBrandTitle?: string
  footerDescription?: string
  footerContactEmail?: string
  footerContactPhone?: string
  footerContactAddress?: string
  footerBottomText?: string
  freeDeliveryThreshold?: number
  seo?: HomepageSeoConfig
  sections: HomepageSectionConfig[]
}

export interface HomepageSaveResult {
  content: HomepageContent
  mode: 'local' | 'live'
  path: 'settings/homepage'
  heroImage: string
  sareeCoverImage: string
  firebaseProjectId: string
  verified: boolean
  savedAt: string
}

export interface HomepageContentSnapshotMeta {
  source: 'local-seed' | 'local-storage-sync' | 'firestore' | 'firestore-missing-doc'
  path: 'settings/homepage'
  receivedAt: string
}

export function isFirebaseConfigured() {
  return Boolean(firebaseAuth && firebaseDb)
}

export function isOrderBackendReady() {
  return Boolean(firebaseDb)
}

const PRODUCTS_KEY = 'shis-admin-products'
const ORDERS_KEY = 'shis-admin-orders'
const HOMEPAGE_KEY = 'shis-admin-homepage'
const FOUNDER_KEY = 'shis-admin-founder'
const CATEGORIES_KEY = 'shis-admin-categories'
const DATA_MODE_KEY = 'shis-admin-data-mode'
const LEGACY_AUTH_KEY = 'shis-admin-auth'
const ACCESS_DENIED_KEY = 'shis-admin-access-denied'
const LAUNCH_MODE_USER_KEY = 'shis-launch-mode-user'
const AUDIT_LOGS_KEY = 'shis-admin-audit-logs'

type AdminAuditTarget = 'product' | 'order' | 'category' | 'homepage' | 'brand' | 'coupon' | 'admin'

interface AdminAuditLogEntry {
  id: string
  action: string
  targetType: AdminAuditTarget
  targetId: string
  actorUid: string
  actorEmail: string
  metadata?: Record<string, unknown>
  createdAt: string
}

function parseConfiguredAdminEmails() {
  const rawValue = (import.meta.env.VITE_ADMIN_EMAILS ?? '') as string
  return new Set(
    rawValue
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  )
}

const configuredAdminEmails = parseConfiguredAdminEmails()

function isProductionBuild() {
  return import.meta.env.PROD
}

function requiresLiveBackend() {
  if (isProductionBuild()) {
    return true
  }

  return (import.meta.env.VITE_ALLOW_LOCAL_FALLBACK ?? 'true') !== 'true'
}

/**
 * TEMPORARY LAUNCH MODE - Environment-based admin authentication
 * 
 * This is a temporary authentication mechanism to bypass Firebase API issues during launch.
 * It allows admin access for configured emails only when VITE_LAUNCH_MODE is enabled.
 * 
 * This will be replaced with full Firebase Authentication once the Firebase API issues are resolved.
 * To restore Firebase Authentication:
 * 1. Set VITE_LAUNCH_MODE to false or remove it
 * 2. Ensure Firebase API key is valid and Authentication API is enabled
 * 3. Create the admin user account in Firebase
 */

export function isLaunchModeEnabled() {
  return (import.meta.env.VITE_LAUNCH_MODE ?? 'false') === 'true' && !isProductionBuild()
}

function isLaunchModeSessionActive() {
  return isLaunchModeEnabled() && Boolean(getLaunchModeUser())
}

function getLaunchModeUser(): AdminSessionUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.sessionStorage.getItem(LAUNCH_MODE_USER_KEY)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored) as Partial<AdminSessionUser> & { uid: string; email: string }
    return {
      uid: parsed.uid,
      email: parsed.email,
      role: parsed.role ?? 'owner',
      canWrite: parsed.canWrite !== false,
      needsAdminDoc: parsed.needsAdminDoc === true,
    }
  } catch {
    return null
  }
}

function setLaunchModeUser(email: string) {
  if (typeof window === 'undefined') {
    return
  }

  // Generate a pseudo-uid from email for launch mode
  const pseudoUid = `launch-mode-${email.replace(/[^a-z0-9]/gi, '')}`
  const user: AdminSessionUser = { uid: pseudoUid, email, role: 'owner', canWrite: true, needsAdminDoc: false }
  window.sessionStorage.setItem(LAUNCH_MODE_USER_KEY, JSON.stringify(user))
}

function clearLaunchModeUser() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(LAUNCH_MODE_USER_KEY)
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

function isLocalFirstDataMode() {
  if (typeof window === 'undefined') {
    return false
  }

  return !isProductionBuild() && window.localStorage.getItem(DATA_MODE_KEY) === 'local-first'
}

export function isHomepageLocalFirstMode() {
  return isLocalFirstDataMode()
}

export function isLiveHomepageBackend() {
  return Boolean(firebaseDb) && !isLocalFirstDataMode()
}

function markAccessDenied() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(ACCESS_DENIED_KEY, '1')
}

export function consumeAdminAccessDeniedFlag() {
  if (typeof window === 'undefined') {
    return false
  }

  const denied = window.sessionStorage.getItem(ACCESS_DENIED_KEY) === '1'
  if (denied) {
    window.sessionStorage.removeItem(ACCESS_DENIED_KEY)
  }
  return denied
}

function clearLegacyAdminBypassState() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(LEGACY_AUTH_KEY)
}

function getCurrentAdminActor() {
  const authUser = firebaseAuth?.currentUser
  if (authUser) {
    return {
      uid: authUser.uid,
      email: authUser.email?.trim().toLowerCase() ?? 'unknown',
    }
  }

  const launchUser = getLaunchModeUser()
  if (launchUser) {
    return {
      uid: launchUser.uid,
      email: launchUser.email?.trim().toLowerCase() ?? 'unknown',
    }
  }

  return {
    uid: 'unknown',
    email: 'unknown',
  }
}

function appendLocalAuditLog(entry: AdminAuditLogEntry) {
  const current = readStored<AdminAuditLogEntry[]>(AUDIT_LOGS_KEY, [])
  writeStored(AUDIT_LOGS_KEY, [entry, ...current].slice(0, 300))
}

async function recordAdminAudit(
  action: string,
  targetType: AdminAuditTarget,
  targetId: string,
  metadata?: Record<string, unknown>,
) {
  const actor = getCurrentAdminActor()
  const entry: AdminAuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    targetType,
    targetId,
    actorUid: actor.uid,
    actorEmail: actor.email,
    metadata,
    createdAt: new Date().toISOString(),
  }

  appendLocalAuditLog(entry)

  if (!firebaseDb || isLocalFirstDataMode()) {
    return
  }

  try {
    await addDoc(collection(firebaseDb, 'adminAuditLogs'), {
      ...entry,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    if (!shouldFallbackToLocal(error) && import.meta.env.DEV) {
      console.warn('[admin-audit] failed to persist audit log', error)
    }
  }
}

async function getCurrentAdminIdToken() {
  if (!firebaseAuth?.currentUser) {
    return null
  }

  try {
    return await firebaseAuth.currentUser.getIdToken()
  } catch {
    return null
  }
}

function includesAdminRole(role: unknown, roles: unknown) {
  return hasAnyAdminAccessRole(role, roles)
}

let lastAdminSession: AdminSessionUser | null = null

function rememberAdminSession(session: AdminSessionUser | null) {
  lastAdminSession = session
}

function createAdminDocRequiredError(uid: string) {
  const error = new Error(`Create Firestore document admins/${uid} with role="admin" and active=true before making changes.`)
  ;(error as Error & { code?: string; adminUid?: string }).code = 'auth/admin-doc-required'
  ;(error as Error & { code?: string; adminUid?: string }).adminUid = uid
  return error
}

export function describeAdminWriteError(error: unknown, uid?: string | null) {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code ?? '')
    : ''
  const reason = error instanceof Error ? error.message : 'Unknown error'
  const uidHint = uid
    || (typeof error === 'object' && error !== null && 'adminUid' in error ? String((error as { adminUid?: unknown }).adminUid ?? '') : '')
    || lastAdminSession?.uid
    || '<uid>'
  const normalized = reason.toLowerCase()
  if (
    code === 'auth/admin-doc-required'
    || normalized.includes('permission-denied')
    || normalized.includes('missing or insufficient permissions')
  ) {
    return `${reason} Firestore rules require isAdmin() to write settings/homepage. Create admins/${uidHint} with role and active=true, or set the Auth token claim admin=true. The write was not saved locally as a fallback.`
  }

  return reason
}

function assertAdminCanWrite() {
  if (isLaunchModeSessionActive()) {
    return
  }

  if (lastAdminSession && !lastAdminSession.canWrite) {
    throw createAdminDocRequiredError(lastAdminSession.uid)
  }
}

type FirebaseAdminAccess =
  | { status: 'ok'; session: AdminSessionUser }
  | { status: 'denied'; code: 'auth/forbidden-admin' | 'auth/admin-inactive'; message: string }

async function resolveFirebaseAdminAccess(user: User): Promise<FirebaseAdminAccess> {
  const normalizedEmail = user.email?.trim().toLowerCase() ?? ''
  const isEmailAllowListed = configuredAdminEmails.size > 0
    ? Boolean(normalizedEmail && configuredAdminEmails.has(normalizedEmail))
    : null

  if (configuredAdminEmails.size > 0 && !isEmailAllowListed) {
    return {
      status: 'denied',
      code: 'auth/forbidden-admin',
      message: 'This account is not on the admin allow-list.',
    }
  }

  const tokenResult = await user.getIdTokenResult()
  const claims = tokenResult.claims as Record<string, unknown>
  const hasAdminClaim = claims.admin === true || includesAdminRole(claims.role, claims.roles)

  const sessionBase = {
    uid: user.uid,
    email: user.email,
  }

  if (!firebaseDb) {
    if (isEmailAllowListed === true || hasAdminClaim) {
      return {
        status: 'ok',
        session: {
          ...sessionBase,
          role: resolveAdminAccessRole(claims.role, claims.roles),
          canWrite: hasAdminClaim,
          needsAdminDoc: !hasAdminClaim,
        },
      }
    }

    return {
      status: 'denied',
      code: 'auth/forbidden-admin',
      message: 'This account is not authorized for admin dashboard access.',
    }
  }

  let adminDocSnapshot: Awaited<ReturnType<typeof getDoc>>
  let adminsSettingsSnapshot: Awaited<ReturnType<typeof getDoc>>

  try {
    ;[adminDocSnapshot, adminsSettingsSnapshot] = await Promise.all([
      getDoc(doc(firebaseDb, 'admins', user.uid)),
      getDoc(doc(firebaseDb, 'settings', 'admins')),
    ])
  } catch (error) {
    const details = describeFirebaseError(error)

    if (import.meta.env.DEV) {
      console.warn('[admin-auth] unable to read admin metadata', {
        code: details.code,
        message: details.message,
      })
    }

    if (isEmailAllowListed === true || hasAdminClaim) {
      return {
        status: 'ok',
        session: {
          ...sessionBase,
          role: 'owner',
          canWrite: hasAdminClaim,
          needsAdminDoc: !hasAdminClaim,
        },
      }
    }

    return {
      status: 'denied',
      code: 'auth/forbidden-admin',
      message: 'Unable to verify admin access right now. Please try again.',
    }
  }

  if (adminDocSnapshot.exists()) {
    const adminDocData = adminDocSnapshot.data() as Record<string, unknown>
    if (adminDocData.active === false) {
      return {
        status: 'denied',
        code: 'auth/admin-inactive',
        message: 'This admin account is marked inactive.',
      }
    }

    const hasRoleField = typeof adminDocData.role === 'string' || Array.isArray(adminDocData.roles)
    if (!hasRoleField || includesAdminRole(adminDocData.role, adminDocData.roles)) {
      return {
        status: 'ok',
        session: {
          ...sessionBase,
          role: resolveAdminAccessRole(adminDocData.role, adminDocData.roles),
          canWrite: true,
          needsAdminDoc: false,
        },
      }
    }

    return {
      status: 'denied',
      code: 'auth/forbidden-admin',
      message: 'This account does not have an admin role.',
    }
  }

  const settingsData = adminsSettingsSnapshot.exists()
    ? adminsSettingsSnapshot.data() as Record<string, unknown>
    : null
  const listedInSettings = Boolean(settingsData && (
    listIncludesIdentifier(settingsData.emails, normalizedEmail)
    || listIncludesIdentifier(settingsData.uids, user.uid.toLowerCase())
    || listIncludesIdentifier(settingsData.admins, normalizedEmail)
    || listIncludesIdentifier(settingsData.admins, user.uid.toLowerCase())
  ))

  if (hasAdminClaim) {
    return {
      status: 'ok',
      session: {
        ...sessionBase,
        role: resolveAdminAccessRole(claims.role, claims.roles),
        canWrite: true,
        needsAdminDoc: false,
      },
    }
  }

  if (isEmailAllowListed === true || listedInSettings) {
    return {
      status: 'ok',
      session: {
        ...sessionBase,
        role: 'owner',
        canWrite: false,
        needsAdminDoc: true,
      },
    }
  }

  return {
    status: 'denied',
    code: 'auth/forbidden-admin',
    message: 'This account is not authorized for admin dashboard access.',
  }
}

function listIncludesIdentifier(value: unknown, identifier: string) {
  if (!identifier) {
    return false
  }

  if (!Array.isArray(value)) {
    return false
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().toLowerCase())
    .includes(identifier)
}

function subscribeToStored<T>(key: string, fallback: T, callback: (value: T) => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key) {
      return
    }

    callback(readStored(key, fallback))
  }

  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

function createSharedListener<T>(connect: (emit: (value: T) => void) => () => void) {
  const listeners = new Set<(value: T) => void>()
  let disconnect: (() => void) | null = null
  let latest: T | undefined
  let hasLatest = false

  return (callback: (value: T) => void) => {
    listeners.add(callback)
    if (hasLatest) {
      callback(latest as T)
    }

    if (!disconnect) {
      disconnect = connect((value) => {
        latest = value
        hasLatest = true
        listeners.forEach((listener) => listener(value))
      })
    }

    return () => {
      listeners.delete(callback)
      if (listeners.size === 0 && disconnect) {
        disconnect()
        disconnect = null
        hasLatest = false
        latest = undefined
      }
    }
  }
}

function shouldFallbackToLocal(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code ?? '').toLowerCase()
    : ''

  // Never downgrade auth/permission errors to local writes in production.
  if (code.includes('permission-denied') || message.includes('permission-denied') || message.includes('missing or insufficient permissions')) {
    return false
  }

  return [
    'unavailable',
    'network-request-failed',
    'deadline-exceeded',
    'failed-precondition',
    'could not reach cloud firestore backend',
    'operation could not be completed',
  ].some((needle) => message.includes(needle) || code.includes(needle))
}

function toReadableError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string') {
    return new Error(error)
  }

  return new Error('Unknown error')
}

function describeFirebaseError(error: unknown) {
  const normalized = toReadableError(error)
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code ?? 'unknown')
    : 'unknown'

  return {
    code,
    message: normalized.message,
  }
}

const defaultProducts: AdminProduct[] = []

const defaultOrders: AdminOrder[] = []

const HOMEPAGE_CATEGORY_SECTION_LAYOUT: Array<{
  key: HomepageCategorySectionKey
  label: string
  href: string
  order: number
  legacyImageKey: string
}> = [
  { key: 'women', label: 'Women', href: '/women', order: 10, legacyImageKey: 'womens' },
  { key: 'saree', label: 'Saree', href: '/sarees', order: 15, legacyImageKey: 'saree' },
  { key: 'men', label: 'Men', href: '/men', order: 20, legacyImageKey: 'mens' },
  { key: 'denim', label: 'Denim', href: '/men?sub=denim', order: 25, legacyImageKey: 'denim' },
  { key: 'kids', label: 'Kids', href: '/kids', order: 30, legacyImageKey: 'kids' },
  { key: 'western', label: 'Western', href: '/women?sub=tunic', order: 40, legacyImageKey: 'western' },
  { key: 'sale', label: 'Half Shirt', href: '/men?sub=shirts', order: 50, legacyImageKey: 'oversized-tee' },
  { key: 'new-arrivals', label: 'New Arrivals', href: '/shop/new-arrivals', order: 60, legacyImageKey: 'couples' },
]

function getLegacyCategoryImage(legacyImageKey: string) {
  if (legacyImageKey === 'denim') {
    return categoryStripCovers.denim
  }

  return homeCategoryItems.find((item) => item.key === legacyImageKey)?.image ?? shopCategories.find((category) => category.slug === 'mens-shirt')?.image ?? ''
}

const defaultCategorySections: HomepageCategorySections = {
  women: {
    key: 'women',
    label: 'Women',
    href: '/women',
    enabled: true,
    order: 10,
    coverImage: getLegacyCategoryImage('womens'),
    images: [],
    updatedAt: null,
  },
  saree: {
    key: 'saree',
    label: 'Saree',
    href: '/sarees',
    enabled: true,
    order: 15,
    coverImage: getLegacyCategoryImage('saree'),
    images: [],
    updatedAt: null,
  },
  men: {
    key: 'men',
    label: 'Men',
    href: '/men',
    enabled: true,
    order: 20,
    coverImage: getLegacyCategoryImage('mens'),
    images: [],
    updatedAt: null,
  },
  denim: {
    key: 'denim',
    label: 'Denim',
    href: '/men?sub=denim',
    enabled: true,
    order: 25,
    coverImage: getLegacyCategoryImage('denim'),
    images: [],
    updatedAt: null,
  },
  kids: {
    key: 'kids',
    label: 'Kids',
    href: '/kids',
    enabled: true,
    order: 30,
    coverImage: getLegacyCategoryImage('kids'),
    images: [],
    updatedAt: null,
  },
  western: {
    key: 'western',
    label: 'Western',
    href: '/women?sub=tunic',
    enabled: true,
    order: 40,
    coverImage: getLegacyCategoryImage('western'),
    images: [],
    updatedAt: null,
  },
  sale: {
    key: 'sale',
    label: 'Half Shirt',
    href: '/men?sub=shirts',
    enabled: true,
    order: 50,
    coverImage: getLegacyCategoryImage('oversized-tee'),
    images: [],
    updatedAt: null,
  },
  'new-arrivals': {
    key: 'new-arrivals',
    label: 'New Arrivals',
    href: '/shop/new-arrivals',
    enabled: true,
    order: 60,
    coverImage: getLegacyCategoryImage('couples'),
    images: [],
    updatedAt: null,
  },
}

function normalizeSectionKeyFromHref(href: string): HomepageCategorySectionKey | null {
  const normalizedHref = href.trim().toLowerCase()

  if (!normalizedHref) {
    return null
  }

  if (normalizedHref.startsWith('/saree')) {
    return 'saree'
  }

  if (normalizedHref.startsWith('/women')) {
    if (normalizedHref.includes('sub=tunic')) {
      return 'western'
    }
    if (normalizedHref.includes('sub=saree')) {
      return 'saree'
    }
    return 'women'
  }

  if (normalizedHref.startsWith('/men')) {
    if (normalizedHref.includes('sub=denim')) {
      return 'denim'
    }
    return 'men'
  }

  if (normalizedHref.startsWith('/kids')) {
    return 'kids'
  }

  if (normalizedHref.startsWith('/sale')) {
    return 'sale'
  }

  if (normalizedHref.startsWith('/men') && normalizedHref.includes('sub=shirts')) {
    return 'sale'
  }

  if (normalizedHref.includes('new-arrivals')) {
    return 'new-arrivals'
  }

  return null
}

function omitUndefinedDeep<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }

  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined)
      .map((entry) => omitUndefinedDeep(entry)) as T
  }

  if (typeof value !== 'object') {
    return value
  }

  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (entry === undefined) {
      continue
    }
    result[key] = omitUndefinedDeep(entry)
  }

  return result as T
}

function toUniqueImages(images: unknown) {
  if (!Array.isArray(images)) {
    return [] as string[]
  }

  const seen = new Set<string>()
  const normalized: string[] = []
  for (const image of images) {
    if (typeof image !== 'string') {
      continue
    }

    const trimmed = image.trim()
    if (!trimmed || seen.has(trimmed)) {
      continue
    }

    seen.add(trimmed)
    normalized.push(trimmed)
  }

  return normalized
}

const HOMEPAGE_CATEGORY_SECTION_KEY_SET = new Set<HomepageCategorySectionKey>(
  HOMEPAGE_CATEGORY_SECTION_LAYOUT.map((layout) => layout.key),
)

function isHomepageCategorySectionKey(value: string): value is HomepageCategorySectionKey {
  return HOMEPAGE_CATEGORY_SECTION_KEY_SET.has(value as HomepageCategorySectionKey)
}

function aliasToSectionKey(value: string): HomepageCategorySectionKey | null {
  const normalized = value.trim().toLowerCase()
  if (isHomepageCategorySectionKey(normalized)) {
    return normalized
  }

  if (normalized === 'sarees' || normalized === 'sari' || normalized === 'saris') {
    return 'saree'
  }

  if (normalized === 'womens' || normalized === 'woman') {
    return 'women'
  }

  if (normalized === 'mens' || normalized === 'man') {
    return 'men'
  }

  if (normalized === 'denims' || normalized === 'jeans') {
    return 'denim'
  }

  return null
}

function resolveIncomingCategorySection(
  categorySections: unknown,
  key: HomepageCategorySectionKey,
): Partial<HomepageCategorySection> | undefined {
  if (!categorySections || typeof categorySections !== 'object') {
    return undefined
  }

  if (!Array.isArray(categorySections)) {
    const record = categorySections as Record<string, unknown>
    const direct = record[key]
    if (direct && typeof direct === 'object') {
      return direct as Partial<HomepageCategorySection>
    }

    for (const [entryKey, value] of Object.entries(record)) {
      if (aliasToSectionKey(entryKey) === key && value && typeof value === 'object') {
        return value as Partial<HomepageCategorySection>
      }
    }
  }

  const candidates = Array.isArray(categorySections)
    ? categorySections
    : Object.entries(categorySections as Record<string, unknown>).map(([entryKey, value]) => {
      if (!value || typeof value !== 'object') {
        return null
      }

      return {
        ...(value as Record<string, unknown>),
        key: (value as { key?: unknown }).key ?? entryKey,
      }
    })

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') {
      continue
    }

    const section = candidate as Partial<HomepageCategorySection>
    if (aliasToSectionKey(String(section.key ?? '')) === key) {
      return section
    }
  }

  return undefined
}

function readStoredCategoryCover(content: unknown, key: HomepageCategorySectionKey): string {
  if (!content || typeof content !== 'object') {
    return ''
  }

  const categorySections = (content as { categorySections?: unknown }).categorySections
  const section = resolveIncomingCategorySection(categorySections, key)
  const cover = typeof section?.coverImage === 'string' ? section.coverImage.trim() : ''
  const images = Array.isArray(section?.images) ? section.images : []
  const preferred = pickPreferredCategoryCoverUrl(cover, images, '')
  if (preferred) {
    return preferred
  }

  return isPersistableMediaUrl(cover) && !isOutdatedHardcodedMediaUrl(cover) ? cover : ''
}

function applyIntendedCategoryCovers(normalized: HomepageContent, original: Partial<HomepageContent>): HomepageContent {
  const sections: HomepageCategorySections = {
    ...defaultCategorySections,
    ...(normalized.categorySections ?? {}),
  }

  for (const layout of HOMEPAGE_CATEGORY_SECTION_LAYOUT) {
    const intended = readStoredCategoryCover(original, layout.key)
    if (!isPersistableMediaUrl(intended) || isOutdatedHardcodedMediaUrl(intended)) {
      continue
    }

    const current = sections[layout.key]
    if (!current) {
      continue
    }

    if (!isRemoteMediaUrl(intended) && isRemoteMediaUrl(current.coverImage)) {
      continue
    }

    sections[layout.key] = {
      ...current,
      coverImage: intended,
      images: toUniqueImages([intended, ...(current.images ?? [])]),
    }
  }

  const shopByCategories = (normalized.shopByCategories ?? []).map((item) => {
    const mappedKey = normalizeSectionKeyFromHref(item.href ?? '') ?? aliasToSectionKey(item.title ?? '')
    if (!mappedKey) {
      return item
    }

    const cover = sections[mappedKey]?.coverImage
    if (!isRemoteMediaUrl(cover)) {
      return item
    }

    return { ...item, image: cover }
  })

  return {
    ...normalized,
    categorySections: sections,
    shopByCategories,
  }
}

function mapLegacyShopByCategoriesToSections(shopByCategories: HomepageShopCategory[] | undefined) {
  const mapped: Partial<Record<HomepageCategorySectionKey, HomepageCategorySection>> = {}
  if (!shopByCategories?.length) {
    return mapped
  }

  for (const item of shopByCategories) {
    const sectionKey = normalizeSectionKeyFromHref(item.href ?? '')
    if (!sectionKey) {
      continue
    }

    const fallback = defaultCategorySections[sectionKey]
    mapped[sectionKey] = {
      ...fallback,
      label: item.title?.trim() || fallback.label,
      href: item.href?.trim() || fallback.href,
      coverImage: item.image?.trim() || fallback.coverImage,
      images: fallback.images,
    }
  }

  return mapped
}

function normalizeHomepageCategorySections(content: Partial<HomepageContent> | undefined) {
  const legacySections = mapLegacyShopByCategoriesToSections(content?.shopByCategories)
  const sectionEntries = HOMEPAGE_CATEGORY_SECTION_LAYOUT.map((layout) => {
    const fallback = defaultCategorySections[layout.key]
    const incoming = resolveIncomingCategorySection(content?.categorySections, layout.key)
    const legacy = legacySections[layout.key]
    const source = incoming ?? legacy
    const sourceImages = toUniqueImages(source?.images)
    const incomingCover = typeof incoming?.coverImage === 'string' ? incoming.coverImage.trim() : ''
    const sourceCover = typeof source?.coverImage === 'string' ? source.coverImage.trim() : ''
    const coverImage = layout.key === 'denim'
      ? categoryStripCovers.denim
      : pickPreferredCategoryCoverUrl(
        incomingCover || sourceCover,
        sourceImages,
        fallback.coverImage,
      )

    const updatedAt = typeof source?.updatedAt === 'string'
      ? source.updatedAt
      : source?.updatedAt && typeof source.updatedAt === 'object' && 'seconds' in source.updatedAt
        ? new Date(Number((source.updatedAt as { seconds: number }).seconds) * 1000).toISOString()
        : null

    const normalizedSection: HomepageCategorySection = {
      key: layout.key,
      label: source?.label?.trim() || fallback.label,
      href: source?.href?.trim() || fallback.href,
      enabled: source?.enabled ?? fallback.enabled,
      order: typeof source?.order === 'number' ? source.order : fallback.order,
      coverImage,
      images: sourceImages.length ? sourceImages : fallback.images,
      updatedAt,
    }

    return [layout.key, normalizedSection] as const
  })

  return Object.fromEntries(sectionEntries) as HomepageCategorySections
}

const defaultHomepage: HomepageContent = {
  navbarBrandPrimary: 'Shis',
  navbarBrandSecondary: 'Fashion',
  navbarSearchPlaceholder: 'Search products',
  heroEyebrow: 'SHIS FASHION',
  heroTitle: 'Style Meets Comfort.',
  heroSubtitle: 'Discover elevated staples designed for modern living, with premium materials and effortless lines.',
  heroCta: 'Shop collection',
  heroPrimaryLink: '/shop',
  heroSecondaryCta: 'New arrivals',
  heroSecondaryLink: '/shop/new-arrivals',
  heroImage: '/og-image.svg',
  heroImageTitle: 'Homepage hero image',
  heroImageDescription: 'Main hero visual used in the first fold of the homepage.',
  heroVideo: '',
  bannerImage: '/og-image.svg',
  bannerImageTitle: 'Brand promise banner image',
  bannerImageDescription: 'Editorial banner used beside the brand promise content.',
  categories: [
    { title: 'Winter', caption: 'Winter.', href: '/collections/winter', image: featuredCollectionCovers.winter },
    { title: 'Summer', caption: 'Summer.', href: '/collections/summer', image: featuredCollectionCovers.summer },
    { title: 'Everyday Wear', caption: 'Everyday wear.', href: '/collections/everyday-wear', image: featuredCollectionCovers['everyday-wear'] },
  ],
  featuredCollectionPages: [
    {
      slug: 'winter',
      title: 'Winter Collection',
      subtitle: 'Layer-ready staples',
      description: 'Cold-season essentials with premium texture and clean tailoring.',
      href: '/collections/winter',
      images: [featuredCollectionCovers.winter, '/og-image.svg', '/og-image.svg', '/og-image.svg'],
      relatedCategorySlugs: ['denim', 'mens-shirt', 'western-outfits'],
    },
    {
      slug: 'summer',
      title: 'Summer Collection',
      subtitle: 'Breathable premium edits',
      description: 'Lightweight silhouettes designed for warm days and evening plans.',
      href: '/collections/summer',
      images: [featuredCollectionCovers.summer, '/og-image.svg', '/og-image.svg', '/og-image.svg'],
      relatedCategorySlugs: ['unisex-tee', 'womens-dresses', 'oversized-tee'],
    },
    {
      slug: 'everyday-wear',
      title: 'Everyday Wear',
      subtitle: 'Daily go-to luxury',
      description: 'Reliable daily pieces balancing comfort, polish, and movement.',
      href: '/collections/everyday-wear',
      images: [featuredCollectionCovers['everyday-wear'], '/og-image.svg', '/og-image.svg', '/og-image.svg'],
      relatedCategorySlugs: ['oversized-tee', 'couples', 'kids'],
    },
  ],
  shopByCategories: homeCategoryItems.map((item) => ({
    title: item.name,
    href: item.href,
    image: item.image,
  })),
  categorySections: defaultCategorySections,
  featuredCollectionEyebrow: 'Featured collection',
  featuredCollectionTitle: 'Premium categories for every moment',
  featuredCollectionSubtitle: 'A calm, editorial approach to wardrobe essentials designed to feel as luxurious as they look.',
  newArrivalsEyebrow: 'New arrivals',
  newArrivalsTitle: 'Freshly composed for the season',
  newArrivalsSubtitle: 'Newly released pieces with an effortless, sculpted feel.',
  bestSellerEyebrow: 'Best seller',
  featuredTitle: 'The pieces clients return for',
  featuredSubtitle: 'Soft structure, refined texture, and everyday ease in every silhouette.',
  brandPromiseEyebrow: 'Brand promise',
  brandPromiseTitle: 'Luxury that feels personal.',
  brandPromiseDescription: 'SHIS Fashion is shaped by an obsession with texture, ease, and timeless silhouettes that make everyday dressing feel serene and elevated.',
  brandSignatureLabel: 'Signature',
  brandSignatureText: 'Quiet luxury, elevated comfort, and a wardrobe that moves effortlessly from morning to midnight.',
  footerBrandTitle: 'Style Meets Comfort',
  footerDescription: 'A refined digital presence for modern luxury, designed with comfort, clarity, and effortless elegance in mind.',
  footerContactEmail: 'shisfashion18@gmail.com',
  footerContactPhone: '+88 01887848304',
  footerContactAddress: 'Mirpur, Dhaka',
  footerBottomText: 'Crafted for premium, calm, and timeless browsing.',
  freeDeliveryThreshold: 3000,
  seo: defaultHomepageSeo,
  sections: [
    { key: 'hero', label: 'Hero', enabled: true, order: 0 },
    { key: 'featuredCollection', label: 'Featured collection', enabled: true, order: 1 },
    { key: 'newArrivals', label: 'New arrivals', enabled: true, order: 2 },
    { key: 'bestSellers', label: 'Best sellers', enabled: true, order: 3 },
    { key: 'brandPromise', label: 'Brand promise', enabled: true, order: 4 },
  ],
}

const defaultFounderProfile: FounderProfile = {
  name: 'SM Shahriar Walid',
  title: 'Founder and Vision Lead',
  image: '/brands/founder-walid.jpg',
  bio: 'Building connected premium brands across fashion, lifestyle products, and design-led development.',
  story: 'From product detail to customer experience, the focus is simple: create trusted brands with strong design identity and dependable service.',
  socials: {
    whatsapp: 'https://wa.me/8801887848304',
    facebook: 'https://facebook.com/',
    instagram: 'https://instagram.com/',
    email: 'mailto:shahriarshis@gmail.com',
  },
}

function normalizeProduct(product: AdminProduct): AdminProduct {
  const normalizedImages = compactManagedImages(product)
  const variants = normalizeVariants(product.variants)
  const slug = getProductSlug(product)

  return {
    ...product,
    slug,
    variants: variants.length ? variants : undefined,
    stock: getProductStockTotal({ stock: product.stock, variants }),
    images: normalizedImages.images,
    imageTitles: normalizedImages.imageTitles,
    imageDescriptions: normalizedImages.imageDescriptions,
    sizes: normalizeSizes(product.sizes),
  }
}

function normalizeHomepageContent(content: Partial<HomepageContent> | undefined): HomepageContent {
  const incomingFreeDeliveryThreshold = content?.freeDeliveryThreshold
  const normalizedFreeDeliveryThreshold =
    typeof incomingFreeDeliveryThreshold === 'number' && Number.isFinite(incomingFreeDeliveryThreshold) && incomingFreeDeliveryThreshold >= 0
      ? Math.round(incomingFreeDeliveryThreshold)
      : (defaultHomepage.freeDeliveryThreshold ?? 3000)

  const mergedCategories = (content?.categories && content.categories.length ? content.categories : defaultHomepage.categories).map((category, index) => {
    const fallback = defaultHomepage.categories[index] ?? defaultHomepage.categories[0]
    const legacyTitle = (category.title ?? '').trim().toLowerCase()
    const legacyCaption = (category.caption ?? '').trim().toLowerCase()
    const shouldMigrateLegacyLabel =
      legacyTitle === 'tailored layers' ||
      legacyTitle === 'everyday luxe' ||
      legacyTitle === 'evening edit' ||
      legacyCaption === 'soft authority' ||
      legacyCaption === 'refined comfort' ||
      legacyCaption === 'quiet glamour'

    return {
      ...fallback,
      ...category,
      title: shouldMigrateLegacyLabel ? fallback.title : (category.title || fallback.title),
      caption: shouldMigrateLegacyLabel ? fallback.caption : (category.caption || fallback.caption),
      href: category.href || fallback.href,
      image: category.image || fallback.image,
    }
  })

  const mergedFeaturedCollectionPages = (
    content?.featuredCollectionPages && content.featuredCollectionPages.length
      ? content.featuredCollectionPages
      : defaultHomepage.featuredCollectionPages
  ).map((page, index) => {
    const fallback = defaultHomepage.featuredCollectionPages[index] ?? defaultHomepage.featuredCollectionPages[0]
    const normalizedImages = Array.isArray(page.images)
      ? page.images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0)
      : []

    const paddedImages = Array.from({ length: 4 }, (_, imageIndex) => normalizedImages[imageIndex] || fallback.images[imageIndex] || '')

    return {
      ...fallback,
      ...page,
      slug: page.slug || fallback.slug,
      title: page.title || fallback.title,
      subtitle: page.subtitle || fallback.subtitle,
      description: page.description || fallback.description,
      href: page.href || fallback.href,
      images: paddedImages,
      relatedCategorySlugs: Array.isArray(page.relatedCategorySlugs) && page.relatedCategorySlugs.length
        ? page.relatedCategorySlugs.filter((slug): slug is string => typeof slug === 'string' && slug.trim().length > 0)
        : fallback.relatedCategorySlugs,
    }
  })

  const mergedShopByCategories = (content?.shopByCategories && content.shopByCategories.length
    ? content.shopByCategories
    : defaultHomepage.shopByCategories
  ).map((category, index) => ({
    title: category.title || defaultHomepage.shopByCategories[index]?.title || '',
    href: category.href || defaultHomepage.shopByCategories[index]?.href || '/shop',
    image: category.image || defaultHomepage.shopByCategories[index]?.image || '',
  }))

  const mergedCategorySections = normalizeHomepageCategorySections({
    ...(content ?? {}),
    shopByCategories: mergedShopByCategories,
  })

  const normalizeSeoEntry = (incoming: Partial<HomepageSeoEntry> | undefined, fallback: HomepageSeoEntry): HomepageSeoEntry => ({
    title: incoming?.title?.trim() || fallback.title,
    description: incoming?.description?.trim() || fallback.description,
    keywords: incoming?.keywords?.trim() || fallback.keywords,
    ogImage: incoming?.ogImage?.trim() || fallback.ogImage,
  })

  const mergedSeo: HomepageSeoConfig = {
    home: normalizeSeoEntry(content?.seo?.home, defaultHomepageSeo.home),
    shop: normalizeSeoEntry(content?.seo?.shop, defaultHomepageSeo.shop),
    oversized: normalizeSeoEntry(content?.seo?.oversized, defaultHomepageSeo.oversized),
  }

  const incoming = omitUndefinedDeep(content ?? {})

  return {
    ...defaultHomepage,
    ...incoming,
    heroEyebrow: content?.heroEyebrow ?? defaultHomepage.heroEyebrow,
    heroPrimaryLink: content?.heroPrimaryLink ?? defaultHomepage.heroPrimaryLink,
    heroSecondaryLink: content?.heroSecondaryLink ?? defaultHomepage.heroSecondaryLink,
    heroImageTitle: content?.heroImageTitle ?? defaultHomepage.heroImageTitle,
    heroImageDescription: content?.heroImageDescription ?? defaultHomepage.heroImageDescription,
    heroVideo: '',
    bannerImageTitle: content?.bannerImageTitle ?? defaultHomepage.bannerImageTitle,
    bannerImageDescription: content?.bannerImageDescription ?? defaultHomepage.bannerImageDescription,
    categories: mergedCategories,
    featuredCollectionPages: mergedFeaturedCollectionPages,
    shopByCategories: mergedShopByCategories,
    categorySections: mergedCategorySections,
    freeDeliveryThreshold: normalizedFreeDeliveryThreshold,
    seo: mergedSeo,
    sections: (content?.sections && content.sections.length ? content.sections : defaultHomepage.sections).map((section, index) => ({
      ...defaultHomepage.sections[index],
      ...section,
    })).sort((left, right) => left.order - right.order),
  }
}

function normalizeFounderProfile(content: Partial<FounderProfile> | undefined): FounderProfile {
  return {
    ...defaultFounderProfile,
    ...(content ?? {}),
    socials: {
      ...defaultFounderProfile.socials,
      ...(content?.socials ?? {}),
    },
  }
}

const defaultCategories: AdminCategory[] = [
  { id: 'cat-oversized-tee', name: 'Oversized Tee', slug: 'oversized-tee', createdAt: '2026-01-01' },
  { id: 'cat-unisex-tee', name: 'Unisex Tee', slug: 'unisex-tee', createdAt: '2026-01-01' },
  { id: 'cat-denim', name: 'Denim', slug: 'denim', createdAt: '2026-01-01' },
  { id: 'cat-saree', name: 'Saree', slug: 'saree', createdAt: '2026-01-01' },
]

function ensureSeedData() {
  if (typeof window === 'undefined') {
    return
  }

  if (!window.localStorage.getItem(PRODUCTS_KEY)) {
    writeStored(PRODUCTS_KEY, defaultProducts)
  }

  if (!window.localStorage.getItem(ORDERS_KEY)) {
    writeStored(ORDERS_KEY, defaultOrders)
  }

  if (!window.localStorage.getItem(HOMEPAGE_KEY)) {
    writeStored(HOMEPAGE_KEY, defaultHomepage)
  }

  if (!window.localStorage.getItem(FOUNDER_KEY)) {
    writeStored(FOUNDER_KEY, defaultFounderProfile)
  }

  if (!window.localStorage.getItem(CATEGORIES_KEY)) {
    writeStored(CATEGORIES_KEY, defaultCategories)
  }

  if (!window.localStorage.getItem(BRANDS_KEY)) {
    writeStored(BRANDS_KEY, defaultBrands)
  }

  const storedProducts = readStored<AdminProduct[]>(PRODUCTS_KEY, defaultProducts)
  const normalizedStoredProducts = storedProducts.map(normalizeProduct)

  if (JSON.stringify(storedProducts) !== JSON.stringify(normalizedStoredProducts)) {
    writeStored(PRODUCTS_KEY, normalizedStoredProducts)
  }

  const storedHomepage = readStored<HomepageContent>(HOMEPAGE_KEY, defaultHomepage)
  const needsCategoryImageBackfill = (storedHomepage.categories ?? []).some((category, index) => !category.image && defaultHomepage.categories[index]?.image)
  const needsCategorySectionsBackfill = HOMEPAGE_CATEGORY_SECTION_LAYOUT.some(({ key }) => {
    const section = storedHomepage.categorySections?.[key]
    if (!section) {
      return true
    }

    return !section.label || !section.href || !section.coverImage
  })
  const needsShopByBackfill =
    !storedHomepage.shopByCategories?.length ||
    storedHomepage.shopByCategories.some((category, index) => {
      const fallback = defaultHomepage.shopByCategories[index]
      if (!fallback) {
        return false
      }

      return !category.title || !category.href || !category.image
    })

  if (needsCategoryImageBackfill || needsShopByBackfill || needsCategorySectionsBackfill) {
    writeStored(HOMEPAGE_KEY, normalizeHomepageContent(storedHomepage))
  }
}

export function onAdminAuthChanged(callback: (user: AdminSessionUser | null) => void) {
  ensureSeedData()
  clearLegacyAdminBypassState()

  if (!firebaseAuth) {
    if (isLaunchModeEnabled()) {
      const launchUser = getLaunchModeUser()
      rememberAdminSession(launchUser)
      callback(launchUser)
      return () => undefined
    }

    rememberAdminSession(null)
    callback(null)
    return () => undefined
  }

  const auth = firebaseAuth

  let isActive = true
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    void (async () => {
      try {
        if (!isActive) {
          return
        }

        if (!user) {
          rememberAdminSession(null)
          callback(null)
          return
        }

        const access = await resolveFirebaseAdminAccess(user)
        if (!isActive) {
          return
        }

        if (access.status !== 'ok') {
          if (access.code === 'auth/forbidden-admin' || access.code === 'auth/admin-inactive') {
            markAccessDenied()
          }
          await signOut(auth)
          if (!isActive) {
            return
          }
          rememberAdminSession(null)
          callback(null)
          return
        }

        rememberAdminSession(access.session)
        callback(access.session)
      } catch {
        if (!isActive) {
          return
        }
        if (lastAdminSession) {
          callback(lastAdminSession)
          return
        }
        rememberAdminSession(null)
        callback(null)
      }
    })()
  })

  return () => {
    isActive = false
    unsubscribe()
  }
}

export function describeAdminSignInError(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code ?? '')
    : ''

  switch (code) {
    case 'auth/forbidden-admin':
      return 'Access denied. This account is not authorized for admin dashboard access.'
    case 'auth/admin-inactive':
      return 'Access denied. This admin account is marked inactive. Ask an owner to set active=true on the Firestore admins record.'
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
      return 'Invalid email or password.'
    case 'auth/user-not-found':
      return 'No Firebase Authentication user was found for this email.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please wait a few minutes and try again.'
    case 'auth/user-disabled':
      return 'This Firebase Authentication account is disabled.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Authentication. Add localhost and your live domain under Authentication → Settings → Authorized domains.'
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase. Check your connection and try again.'
    case 'auth/firebase-not-configured':
      return 'Admin authentication is not configured in this environment.'
    default:
      return 'Firebase sign-in failed. Check your connection and try again.'
  }
}

export async function signInAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()

  if (firebaseAuth) {
    clearLaunchModeUser()
    const result = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password)
    const access = await resolveFirebaseAdminAccess(result.user)

    if (access.status !== 'ok') {
      try {
        await signOut(firebaseAuth)
      } catch {
        // Ignore sign-out failures so we can surface a deterministic auth error to the UI.
      }

      const error = new Error(access.message)
      ;(error as Error & { code?: string; adminUid?: string; adminEmail?: string }).code = access.code
      ;(error as Error & { code?: string; adminUid?: string; adminEmail?: string }).adminUid = result.user.uid
      ;(error as Error & { code?: string; adminUid?: string; adminEmail?: string }).adminEmail = result.user.email ?? normalizedEmail
      throw error
    }

    rememberAdminSession(access.session)
    return access.session
  }

  if (isLaunchModeEnabled()) {
    if (configuredAdminEmails.size === 0 || configuredAdminEmails.has(normalizedEmail)) {
      setLaunchModeUser(normalizedEmail)
      const session = getLaunchModeUser() ?? {
        uid: `launch-mode-${normalizedEmail.replace(/[^a-z0-9]/gi, '')}`,
        email: normalizedEmail,
        role: 'owner' as const,
        canWrite: true,
        needsAdminDoc: false,
      }
      rememberAdminSession(session)
      return session
    }

    const error = new Error('This account is not authorized for admin dashboard access.')
    ;(error as Error & { code?: string }).code = 'auth/forbidden-admin'
    throw error
  }

  const error = new Error('Firebase authentication is not configured for this environment.')
  ;(error as Error & { code?: string }).code = 'auth/firebase-not-configured'
  throw error
}

export async function signOutAdmin() {
  clearLegacyAdminBypassState()
  clearLaunchModeUser()
  rememberAdminSession(null)

  if (!firebaseAuth) {
    return
  }

  await signOut(firebaseAuth)
}

const subscribeToAllProductsShared = createSharedListener<AdminProduct[]>((emit) => {
  ensureSeedData()
  const readAll = () => readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)

  if (!firebaseDb || isLocalFirstDataMode()) {
    emit(readAll())
    return subscribeToStored(PRODUCTS_KEY, defaultProducts, (products) => emit(products.map(normalizeProduct)))
  }

  const productsRef = query(collection(firebaseDb, 'products'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    productsRef,
    (snapshot) => {
      emit(snapshot.docs.map((entry) => normalizeProduct({ id: entry.id, ...(entry.data() as Omit<AdminProduct, 'id'>) })))
    },
    (error) => {
      if (shouldFallbackToLocal(error) && !requiresLiveBackend()) {
        emit(readAll())
        return
      }

      emit([])
    },
  )
})

export function subscribeToProducts(callback: (products: AdminProduct[]) => void) {
  return subscribeToAllProductsShared((products) => {
    callback(products.filter((product) => !product.archived))
  })
}

export function subscribeToArchivedProducts(callback: (products: AdminProduct[]) => void) {
  return subscribeToAllProductsShared((products) => {
    callback(products.filter((product) => product.archived))
  })
}

export async function createProduct(product: Omit<AdminProduct, 'id' | 'createdAt'>) {
  assertAdminCanWrite()
  const currentProducts = readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)
  const slug = allocateProductSlug(product.name, currentProducts.map((entry) => getProductSlug(entry)), product.slug)
  const normalizedProduct = normalizeProduct({ ...product, slug, id: 'draft-product' } as AdminProduct)
  const productPayload = {
    ...product,
    slug: normalizedProduct.slug,
    stock: normalizedProduct.stock,
    variants: normalizedProduct.variants ?? [],
    images: normalizedProduct.images,
    imageTitles: normalizedProduct.imageTitles,
    imageDescriptions: normalizedProduct.imageDescriptions,
  }
  const nextProduct = {
    ...normalizedProduct,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as AdminProduct
  writeStored(PRODUCTS_KEY, [nextProduct, ...currentProducts])

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('product.create', 'product', nextProduct.id, {
      name: nextProduct.name,
      category: nextProduct.category,
      stock: nextProduct.stock,
      mode: 'local',
    })
    return nextProduct
  }

  try {
    const payload = {
      ...productPayload,
      createdAt: serverTimestamp(),
    }

    const ref = await addDoc(collection(firebaseDb, 'products'), payload)
    await recordAdminAudit('product.create', 'product', ref.id, {
      name: productPayload.name,
      category: productPayload.category,
      stock: productPayload.stock,
      mode: 'live',
    })
    return { ...productPayload, id: ref.id }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('product.create', 'product', nextProduct.id, {
      name: nextProduct.name,
      category: nextProduct.category,
      stock: nextProduct.stock,
      mode: 'fallback-local',
    })
    return nextProduct
  }
}

export async function updateProduct(id: string, product: Partial<AdminProduct>) {
  assertAdminCanWrite()
  const currentProducts = readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)
  const existing = currentProducts.find((item) => item.id === id)
  const nextName = product.name ?? existing?.name ?? ''
  const slug = existing?.slug || allocateProductSlug(nextName, currentProducts.filter((item) => item.id !== id).map((item) => getProductSlug(item)))
  const mergedUpdate = { ...product, slug }
  const updatedProducts = currentProducts.map((item) => (item.id === id ? normalizeProduct({ ...item, ...mergedUpdate }) : item))
  writeStored(PRODUCTS_KEY, updatedProducts)

  const normalizedUpdate = existing
    ? normalizeProduct({ ...existing, ...mergedUpdate })
    : undefined

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('product.update', 'product', id, {
      fields: Object.keys(product),
      mode: 'local',
    })
    return updatedProducts.find((item) => item.id === id)
  }

  try {
    const ref = doc(firebaseDb, 'products', id)
    if (normalizedUpdate) {
      await updateDoc(ref, {
        ...product,
        slug: normalizedUpdate.slug,
        stock: normalizedUpdate.stock,
        variants: normalizedUpdate.variants ?? [],
        images: normalizedUpdate.images,
        imageTitles: normalizedUpdate.imageTitles,
        imageDescriptions: normalizedUpdate.imageDescriptions,
      })
    } else {
      await updateDoc(ref, product)
    }
    await recordAdminAudit('product.update', 'product', id, {
      fields: Object.keys(product),
      mode: 'live',
    })
    return normalizedUpdate ?? { id, ...product }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('product.update', 'product', id, {
      fields: Object.keys(product),
      mode: 'fallback-local',
    })
    return updatedProducts.find((item) => item.id === id)
  }
}

export async function deleteProduct(id: string) {
  assertAdminCanWrite()
  const currentProducts = readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)
  const updatedProducts = currentProducts.map((item) => (item.id === id
    ? { ...item, archived: true, archivedAt: new Date().toISOString() }
    : item))
  writeStored(PRODUCTS_KEY, updatedProducts)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('product.archive', 'product', id, { mode: 'local' })
    return
  }

  try {
    await updateDoc(doc(firebaseDb, 'products', id), {
      archived: true,
      archivedAt: serverTimestamp(),
    })
    await recordAdminAudit('product.archive', 'product', id, { mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('product.archive', 'product', id, { mode: 'fallback-local' })
    return
  }
}

export async function restoreProduct(id: string) {
  assertAdminCanWrite()
  const currentProducts = readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)
  const updatedProducts = currentProducts.map((item) => (item.id === id
    ? { ...item, archived: false, archivedAt: undefined }
    : item))
  writeStored(PRODUCTS_KEY, updatedProducts)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('product.restore', 'product', id, { mode: 'local' })
    return
  }

  try {
    await updateDoc(doc(firebaseDb, 'products', id), {
      archived: false,
      archivedAt: null,
    })
    await recordAdminAudit('product.restore', 'product', id, { mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('product.restore', 'product', id, { mode: 'fallback-local' })
  }
}

// Brand Management Functions
const BRANDS_KEY = 'admin_brands'
const defaultBrands: AdminBrand[] = brandEntries.map((entry, index) => ({
  id: `seed-${entry.id}`,
  slug: entry.id,
  name: entry.name,
  tag: entry.tag,
  summary: entry.summary,
  description: entry.details,
  website: entry.contacts.website,
  contactEmail: 'hello@shisfashion.com',
  contactPhone: '+8801887848304',
  logo: entry.logo,
  bannerImage: entry.logo,
  images: [entry.logo],
  createdAt: `2026-01-0${index + 1}`,
}))

function getBrandKey(brand: Pick<AdminBrand, 'id' | 'slug' | 'name'>) {
  return (brand.slug || brand.id || brand.name).trim().toLowerCase()
}

function mergeSeedBrands(brands: AdminBrand[]) {
  const nextBrands = [...brands]
  const existingKeys = new Set(nextBrands.map(getBrandKey))

  for (const seedBrand of defaultBrands) {
    const key = getBrandKey(seedBrand)
    const existingIndex = nextBrands.findIndex((brand) => getBrandKey(brand) === key)

    if (existingIndex >= 0) {
      nextBrands[existingIndex] = {
        ...seedBrand,
        ...nextBrands[existingIndex],
        archived: false,
        archivedAt: undefined,
      }
      existingKeys.add(key)
      continue
    }

    nextBrands.push(seedBrand)
    existingKeys.add(key)
  }

  return nextBrands
}

function readBrandStoreWithSeeds() {
  const storedBrands = readStored(BRANDS_KEY, defaultBrands)
  const mergedBrands = mergeSeedBrands(storedBrands)

  if (JSON.stringify(mergedBrands) !== JSON.stringify(storedBrands)) {
    writeStored(BRANDS_KEY, mergedBrands)
  }

  return mergedBrands
}

export function subscribeToAdminBrands(callback: (brands: AdminBrand[]) => void) {
  const localBrands = () => readBrandStoreWithSeeds().filter((brand) => !brand.archived)
  callback(localBrands())

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(BRANDS_KEY, defaultBrands, (brands) => callback(brands.filter((brand) => !brand.archived)))
  }

  const brandsRef = query(collection(firebaseDb, 'brands'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    brandsRef,
    (snapshot) => {
      const brands = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminBrand, 'id'>) }))
      const visibleBrands = mergeSeedBrands(brands).filter((brand) => !brand.archived)
      callback(visibleBrands.length ? visibleBrands : localBrands())
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(localBrands())
      }
    },
  )
}

export function subscribeToArchivedBrands(callback: (brands: AdminBrand[]) => void) {
  const archivedLocalBrands = () => readBrandStoreWithSeeds().filter((brand) => brand.archived)
  callback(archivedLocalBrands())

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(BRANDS_KEY, defaultBrands, (brands) => callback(brands.filter((brand) => brand.archived)))
  }

  const brandsRef = query(collection(firebaseDb, 'brands'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    brandsRef,
    (snapshot) => {
      const brands = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminBrand, 'id'>) }))
      callback(brands.filter((brand) => brand.archived))
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(archivedLocalBrands())
      }
    },
  )
}

export async function createBrand(brand: Omit<AdminBrand, 'id' | 'createdAt'>) {
  assertAdminCanWrite()
  const currentBrands = readBrandStoreWithSeeds()
  const nextBrand = {
    ...brand,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as AdminBrand
  writeStored(BRANDS_KEY, [nextBrand, ...currentBrands])

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('brand.create', 'brand', nextBrand.id, {
      name: nextBrand.name,
      slug: nextBrand.slug,
      mode: 'local',
    })
    return nextBrand
  }

  try {
    const payload = {
      ...brand,
      createdAt: serverTimestamp(),
    }

    const ref = await addDoc(collection(firebaseDb, 'brands'), payload)
    await recordAdminAudit('brand.create', 'brand', ref.id, {
      name: brand.name,
      slug: brand.slug,
      mode: 'live',
    })
    return { ...brand, id: ref.id }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('brand.create', 'brand', nextBrand.id, {
      name: nextBrand.name,
      slug: nextBrand.slug,
      mode: 'fallback-local',
    })
    return nextBrand
  }
}

export async function updateBrand(id: string, brand: Partial<AdminBrand>) {
  assertAdminCanWrite()
  const currentBrands = readBrandStoreWithSeeds()
  const updatedBrands = currentBrands.map((item) => (item.id === id ? { ...item, ...brand } : item))
  writeStored(BRANDS_KEY, updatedBrands)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('brand.update', 'brand', id, {
      fields: Object.keys(brand),
      mode: 'local',
    })
    return updatedBrands.find((item) => item.id === id)
  }

  try {
    const ref = doc(firebaseDb, 'brands', id)
    await updateDoc(ref, brand)
    await recordAdminAudit('brand.update', 'brand', id, {
      fields: Object.keys(brand),
      mode: 'live',
    })
    return { id, ...brand }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('brand.update', 'brand', id, {
      fields: Object.keys(brand),
      mode: 'fallback-local',
    })
    return updatedBrands.find((item) => item.id === id)
  }
}

export async function deleteBrand(id: string) {
  assertAdminCanWrite()
  const currentBrands = readBrandStoreWithSeeds()
  const updatedBrands = currentBrands.map((item) => (item.id === id
    ? { ...item, archived: true, archivedAt: new Date().toISOString() }
    : item))
  writeStored(BRANDS_KEY, updatedBrands)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('brand.archive', 'brand', id, { mode: 'local' })
    return
  }

  try {
    await updateDoc(doc(firebaseDb, 'brands', id), {
      archived: true,
      archivedAt: serverTimestamp(),
    })
    await recordAdminAudit('brand.archive', 'brand', id, { mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('brand.archive', 'brand', id, { mode: 'fallback-local' })
  }
}

export async function restoreBrand(id: string) {
  assertAdminCanWrite()
  const currentBrands = readBrandStoreWithSeeds()
  const updatedBrands = currentBrands.map((item) => (item.id === id
    ? { ...item, archived: false, archivedAt: undefined }
    : item))
  writeStored(BRANDS_KEY, updatedBrands)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('brand.restore', 'brand', id, { mode: 'local' })
    return
  }

  try {
    await updateDoc(doc(firebaseDb, 'brands', id), {
      archived: false,
      archivedAt: null,
    })
    await recordAdminAudit('brand.restore', 'brand', id, { mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('brand.restore', 'brand', id, { mode: 'fallback-local' })
  }
}

export function subscribeToOrders(callback: (orders: AdminOrder[]) => void) {
  ensureSeedData()
  callback(readStored(ORDERS_KEY, defaultOrders).filter((order) => !order.archived))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(ORDERS_KEY, defaultOrders, (orders) => callback(orders.filter((order) => !order.archived)))
  }

  const ordersRef = query(collection(firebaseDb, 'orders'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    ordersRef,
    (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminOrder, 'id'>) }))
      callback(orders.filter((order) => !order.archived))
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(readStored(ORDERS_KEY, defaultOrders).filter((order) => !order.archived))
      }
    },
  )
}

export function subscribeToArchivedOrders(callback: (orders: AdminOrder[]) => void) {
  ensureSeedData()
  callback(readStored(ORDERS_KEY, defaultOrders).filter((order) => order.archived))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(ORDERS_KEY, defaultOrders, (orders) => callback(orders.filter((order) => order.archived)))
  }

  const ordersRef = query(collection(firebaseDb, 'orders'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    ordersRef,
    (snapshot) => {
      const orders = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<AdminOrder, 'id'>) }))
      callback(orders.filter((order) => order.archived))
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(readStored(ORDERS_KEY, defaultOrders).filter((order) => order.archived))
      }
    },
  )
}

function throwInvalidStatusTransition(from: string, to: string): never {
  const error = new Error(`Invalid order transition: ${from} -> ${to}`)
  ;(error as Error & { code?: string }).code = 'order/invalid-status-transition'
  throw error
}

export async function updateOrderStatus(id: string, status: AdminOrder['status'], trackingNumber?: string) {
  assertAdminCanWrite()
  const currentOrders = readStored(ORDERS_KEY, defaultOrders)
  const currentOrder = currentOrders.find((order) => order.id === id)

  if (currentOrder && currentOrder.status !== status && !canTransitionOrderStatus(currentOrder.status, status)) {
    throwInvalidStatusTransition(currentOrder.status, status)
  }

  const nextTracking = trackingNumber ?? currentOrder?.trackingNumber ?? ''
  const restock = Boolean(
    currentOrder
    && currentOrder.status !== status
    && shouldRestockOnStatus(status)
    && currentOrder.stockCommitted
    && !currentOrder.stockRestored,
  )

  if (!firebaseDb || isLocalFirstDataMode()) {
    if (restock && currentOrder) {
      applyLocalStockRestore(currentOrder.items)
    }

    return updateOrderDetails(id, {
      status,
      trackingNumber: nextTracking,
      ...(restock ? { stockCommitted: false, stockRestored: true } : {}),
    })
  }

  const token = await getCurrentAdminIdToken()
  if (token) {
    try {
      const response = await fetch('/api/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: id, status, trackingNumber: nextTracking }),
      })

      if (response.ok) {
        const payload = await response.json() as {
          order?: Pick<AdminOrder, 'status' | 'trackingNumber' | 'stockCommitted' | 'stockRestored'>
        }
        const nextOrder = {
          ...(currentOrder ?? { id } as AdminOrder),
          status: payload.order?.status ?? status,
          trackingNumber: payload.order?.trackingNumber ?? nextTracking,
          stockCommitted: payload.order?.stockCommitted ?? (restock ? false : currentOrder?.stockCommitted),
          stockRestored: payload.order?.stockRestored ?? (restock ? true : currentOrder?.stockRestored),
        }
        writeStored(ORDERS_KEY, currentOrders.map((order) => (order.id === id ? { ...order, ...nextOrder } : order)))
        await recordAdminAudit('order.status', 'order', id, { status, mode: 'live-api' })
        return nextOrder
      }

      if (response.status === 409) {
        throwInvalidStatusTransition(currentOrder?.status ?? 'unknown', status)
      }

      if (response.status !== 503) {
        throw new Error(await readApiError(response))
      }
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : ''
      if (code === 'order/invalid-status-transition' || requiresLiveBackend()) {
        throw error
      }
    }
  }

  if (requiresLiveBackend()) {
    throw new Error('Unable to update order status. Live inventory service is unavailable.')
  }

  if (restock && currentOrder) {
    applyLocalStockRestore(currentOrder.items)
  }

  return updateOrderDetails(id, {
    status,
    trackingNumber: nextTracking,
    ...(restock ? { stockCommitted: false, stockRestored: true } : {}),
  })
}

export async function updateOrderDetails(
  id: string,
  updates: Partial<Pick<AdminOrder, 'customerName' | 'customerPhone' | 'customerEmail' | 'address' | 'deliveryAddress' | 'deliveryCharge' | 'notes' | 'status' | 'trackingNumber' | 'paymentStatus' | 'stockCommitted' | 'stockRestored'>>,
) {
  assertAdminCanWrite()
  const currentOrders = readStored(ORDERS_KEY, defaultOrders)
  const updatedOrders = currentOrders.map((order) => (order.id === id ? { ...order, ...updates } : order))
  writeStored(ORDERS_KEY, updatedOrders)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('order.update', 'order', id, {
      fields: Object.keys(updates),
      mode: 'local',
    })
    return updatedOrders.find((order) => order.id === id)
  }

  try {
    const ref = doc(firebaseDb, 'orders', id)
    await updateDoc(ref, updates)
    await recordAdminAudit('order.update', 'order', id, {
      fields: Object.keys(updates),
      mode: 'live',
    })
    return { id, ...updates }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('order.update', 'order', id, {
      fields: Object.keys(updates),
      mode: 'fallback-local',
    })
    return updatedOrders.find((order) => order.id === id)
  }
}

export async function confirmOrderPayment(id: string) {
  assertAdminCanWrite()
  const currentOrders = readStored(ORDERS_KEY, defaultOrders)
  const currentOrder = currentOrders.find((order) => order.id === id)
  const token = await getCurrentAdminIdToken()

  if (token && firebaseDb && !isLocalFirstDataMode()) {
    try {
      const response = await fetch('/api/confirm-order-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: id }),
      })

      if (response.ok) {
        const payload = await response.json() as { order?: { paymentStatus?: AdminOrder['paymentStatus']; status?: AdminOrder['status'] } }
        const nextPaymentStatus = payload.order?.paymentStatus ?? 'paid'
        const nextStatus = payload.order?.status ?? (currentOrder?.status === 'new' ? 'confirmed' : currentOrder?.status)
        const updatedOrders = currentOrders.map((order) => (
          order.id === id
            ? { ...order, paymentStatus: nextPaymentStatus, ...(nextStatus ? { status: nextStatus } : {}) }
            : order
        ))
        writeStored(ORDERS_KEY, updatedOrders)
        await recordAdminAudit('order.payment.confirm', 'order', id, { mode: 'live-api' })
        return updatedOrders.find((order) => order.id === id)
      }

      if (response.status !== 503) {
        throw new Error(await readApiError(response))
      }
    } catch (error) {
      if (requiresLiveBackend()) {
        throw error
      }
    }
  }

  const updates: Partial<Pick<AdminOrder, 'paymentStatus' | 'status'>> = { paymentStatus: 'paid' }
  if (currentOrder?.status === 'new') {
    updates.status = 'confirmed'
  }

  return updateOrderDetails(id, updates)
}

export async function deleteOrder(id: string) {
  assertAdminCanWrite()
  const currentOrders = readStored(ORDERS_KEY, defaultOrders)
  const updatedOrders = currentOrders.map((order) => (order.id === id
    ? { ...order, archived: true, archivedAt: new Date().toISOString() }
    : order))
  writeStored(ORDERS_KEY, updatedOrders)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('order.archive', 'order', id, { mode: 'local' })
    return
  }

  try {
    await updateDoc(doc(firebaseDb, 'orders', id), {
      archived: true,
      archivedAt: serverTimestamp(),
    })
    await recordAdminAudit('order.archive', 'order', id, { mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('order.archive', 'order', id, { mode: 'fallback-local' })
    return
  }
}

export async function restoreOrder(id: string) {
  assertAdminCanWrite()
  const currentOrders = readStored(ORDERS_KEY, defaultOrders)
  const updatedOrders = currentOrders.map((order) => (order.id === id
    ? { ...order, archived: false, archivedAt: undefined }
    : order))
  writeStored(ORDERS_KEY, updatedOrders)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('order.restore', 'order', id, { mode: 'local' })
    return
  }

  try {
    await updateDoc(doc(firebaseDb, 'orders', id), {
      archived: false,
      archivedAt: null,
    })
    await recordAdminAudit('order.restore', 'order', id, { mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('order.restore', 'order', id, { mode: 'fallback-local' })
  }
}

function applyLocalStockRestore(items: AdminOrder['items']) {
  const products = readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)
  const next = products.map((product) => {
    const matchingItems = items.filter((item) => (
      productMatchesSlug(product, item.slug ?? item.name)
      || product.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    ))

    if (!matchingItems.length) {
      return product
    }

    let variants = normalizeVariants(product.variants)
    let stock = product.stock

    matchingItems.forEach((item) => {
      const qty = Math.max(0, item.quantity)
      if (variants.length) {
        const incremented = incrementMatchingVariant(variants, item.size ?? '', item.color ?? '', qty)
        if (incremented) {
          variants = incremented
          stock = variants.reduce((sum, entry) => sum + entry.stock, 0)
          return
        }
      }

      stock += qty
    })

    return { ...product, stock, variants: variants.length ? variants : product.variants }
  })
  writeStored(PRODUCTS_KEY, next)
}

function applyLocalStockDecrement(items: AdminOrder['items']) {
  const products = readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)
  const next = products.map((product) => {
    const matchingItems = items.filter((item) => (
      productMatchesSlug(product, item.slug ?? item.name)
      || product.name.trim().toLowerCase() === item.name.trim().toLowerCase()
    ))

    if (!matchingItems.length) {
      return product
    }

    let variants = normalizeVariants(product.variants)
    let stock = product.stock

    matchingItems.forEach((item) => {
      const qty = Math.max(0, item.quantity)
      if (variants.length) {
        const decremented = decrementMatchingVariant(variants, item.size ?? '', item.color ?? '', qty)
        if (decremented) {
          variants = decremented
          stock = variants.reduce((sum, entry) => sum + entry.stock, 0)
          return
        }
      }

      stock = Math.max(0, stock - qty)
    })

    return { ...product, stock, variants: variants.length ? variants : product.variants }
  })
  writeStored(PRODUCTS_KEY, next)
}

export async function createOrder(order: Omit<AdminOrder, 'id' | 'createdAt'>, couponData?: { code: string; discountPercent: number; discountAmount: number; couponId?: string } | null): Promise<AdminOrder & { redirectUrl?: string }> {
  if (requiresLiveBackend() && !firebaseDb) {
    throw new Error('Live order backend is not configured. Add Firebase production credentials before accepting orders.')
  }

  const currentOrders = readStored(ORDERS_KEY, defaultOrders)
  const optimisticOrder = {
    ...order,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...(couponData ? {
      couponCode: couponData.code,
      couponDiscountPercent: couponData.discountPercent,
      couponDiscountAmount: couponData.discountAmount,
      couponId: couponData.couponId,
    } : {}),
  } as AdminOrder

  if (!firebaseDb || isLocalFirstDataMode()) {
    if (requiresLiveBackend()) {
      throw new Error('Live order backend is unavailable. Order was not submitted.')
    }

    writeStored(ORDERS_KEY, [optimisticOrder, ...currentOrders])

    if (couponData) {
      await markCouponUsed(couponData.couponId ?? couponData.code, optimisticOrder.id, couponData.discountAmount)
    }

    applyLocalStockDecrement(order.items)
    return optimisticOrder
  }

  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        address: order.address,
        notes: order.notes,
        items: order.items,
        couponCode: couponData?.code,
        deliveryAddress: order.deliveryAddress,
        paymentMethod: order.paymentMethod,
        paymentTransactionId: order.paymentTransactionId,
        attribution: order.attribution,
        purchaseEventId: order.purchaseEventId,
      }),
    })

    if (!response.ok) {
      throw new Error(await readApiError(response))
    }

    const payload = await response.json() as { order?: AdminOrder; redirectUrl?: string }
    if (!payload.order?.id) {
      throw new Error('Order service returned an incomplete response.')
    }

    writeStored(ORDERS_KEY, [payload.order, ...currentOrders])
    return { ...payload.order, redirectUrl: payload.redirectUrl }
  } catch (error) {
    const isApiPrepaid = isApiPrepaidPayment(order.paymentMethod ?? '')
    if (requiresLiveBackend() || isApiPrepaid) {
      throw error instanceof Error ? error : new Error('Order submission failed. Please try again.')
    }

    if (couponData) {
      await markCouponUsed(couponData.couponId ?? couponData.code, optimisticOrder.id, couponData.discountAmount)
    }

    applyLocalStockDecrement(order.items)
    writeStored(ORDERS_KEY, [optimisticOrder, ...currentOrders])
    return optimisticOrder
  }
}

const subscribeToHomepageShared = createSharedListener<{ content: HomepageContent; meta?: HomepageContentSnapshotMeta }>((emit) => {
  ensureSeedData()
  const liveFirestore = Boolean(firebaseDb) && !isLocalFirstDataMode()

  console.info('[homepage] subscribe:init', {
    hasFirebaseDb: Boolean(firebaseDb),
    localFirstMode: isLocalFirstDataMode(),
    projectId: firebaseProjectId || '(missing)',
    path: 'settings/homepage',
    liveFirestore,
  })

  if (!firebaseDb || isLocalFirstDataMode()) {
    const storedHomepage = normalizeHomepageContent(readStored(HOMEPAGE_KEY, defaultHomepage))
    emit({
      content: storedHomepage,
      meta: {
        source: 'local-seed',
        path: 'settings/homepage',
        receivedAt: new Date().toISOString(),
      },
    })

    return subscribeToStored(HOMEPAGE_KEY, defaultHomepage, (content) => emit({
      content: normalizeHomepageContent(content),
      meta: {
        source: 'local-storage-sync',
        path: 'settings/homepage',
        receivedAt: new Date().toISOString(),
      },
    }))
  }

  const homeRef = doc(firebaseDb, 'settings', 'homepage')
  return onSnapshot(
    homeRef,
    (snapshot) => {
      const rawSareeCover = snapshot.exists()
        ? readStoredCategoryCover(snapshot.data(), 'saree')
        : ''

      console.info('[homepage] subscribe:snapshot', {
        exists: snapshot.exists(),
        fromCache: snapshot.metadata.fromCache,
        path: 'settings/homepage',
        projectId: firebaseProjectId || '(missing)',
        sareeCoverImage: rawSareeCover || '(empty)',
      })

      if (!snapshot.exists()) {
        emit({
          content: defaultHomepage,
          meta: {
            source: 'firestore-missing-doc',
            path: 'settings/homepage',
            receivedAt: new Date().toISOString(),
          },
        })
        return
      }

      const rawData = snapshot.data() as Partial<HomepageContent>
      emit({
        content: applyIntendedCategoryCovers(normalizeHomepageContent(rawData), rawData),
        meta: {
          source: 'firestore',
          path: 'settings/homepage',
          receivedAt: new Date().toISOString(),
        },
      })
    },
    (error) => {
      const details = describeFirebaseError(error)
      console.error('[homepage] subscribe:error', {
        path: 'settings/homepage',
        projectId: firebaseProjectId || '(missing)',
        code: details.code,
        message: details.message,
      })

      if (!shouldFallbackToLocal(error)) {
        console.warn('[homepage] live subscription failed and will not silently fallback to local data')
      }
    },
  )
})

export function subscribeToHomepageContent(callback: (content: HomepageContent, meta?: HomepageContentSnapshotMeta) => void) {
  return subscribeToHomepageShared(({ content, meta }) => {
    callback(content, meta)
  })
}

export function subscribeToFounderProfile(callback: (profile: FounderProfile, meta?: { source: string; path: string; receivedAt: string }) => void) {
  ensureSeedData()
  const stored = normalizeFounderProfile(readStored(FOUNDER_KEY, defaultFounderProfile))
  callback(stored, { source: 'local-seed', path: 'settings/founder', receivedAt: new Date().toISOString() })

  if (import.meta.env.DEV) {
    console.info('[founder] subscribe:init', {
      hasFirebaseDb: Boolean(firebaseDb),
      localFirstMode: isLocalFirstDataMode(),
    })
  }

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(FOUNDER_KEY, defaultFounderProfile, (content) => callback(normalizeFounderProfile(content), {
      source: 'local-storage-sync',
      path: 'settings/founder',
      receivedAt: new Date().toISOString(),
    }))
  }

  const founderRef = doc(firebaseDb, 'settings', 'founder')
  return onSnapshot(
    founderRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(defaultFounderProfile, {
          source: 'firestore-missing-doc',
          path: 'settings/founder',
          receivedAt: new Date().toISOString(),
        })
        return
      }
      callback(normalizeFounderProfile(snapshot.data() as Partial<FounderProfile>), {
        source: 'firestore',
        path: 'settings/founder',
        receivedAt: new Date().toISOString(),
      })
    },
    (error) => {
      const details = describeFirebaseError(error)
      console.error('[founder] subscribe:error', {
        path: 'settings/founder',
        code: details.code,
        message: details.message,
      })
    },
  )
}

export function subscribeToCategories(callback: (categories: AdminCategory[]) => void) {
  ensureSeedData()
  callback(readStored(CATEGORIES_KEY, defaultCategories).filter((category) => !category.archived))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(CATEGORIES_KEY, defaultCategories, (categories) => callback(categories.filter((category) => !category.archived)))
  }

  const categoriesRef = query(collection(firebaseDb, 'categories'), orderBy('createdAt', 'asc'))
  return onSnapshot(
    categoriesRef,
    (snapshot) => {
      const categories = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AdminCategory, 'id'>) }))
      callback(categories.filter((category) => !category.archived))
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(readStored(CATEGORIES_KEY, defaultCategories).filter((category) => !category.archived))
      }
    },
  )
}

export function subscribeToArchivedCategories(callback: (categories: AdminCategory[]) => void) {
  ensureSeedData()
  callback(readStored(CATEGORIES_KEY, defaultCategories).filter((category) => category.archived))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(CATEGORIES_KEY, defaultCategories, (categories) => callback(categories.filter((category) => category.archived)))
  }

  const categoriesRef = query(collection(firebaseDb, 'categories'), orderBy('createdAt', 'asc'))
  return onSnapshot(
    categoriesRef,
    (snapshot) => {
      const categories = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AdminCategory, 'id'>) }))
      callback(categories.filter((category) => category.archived))
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(readStored(CATEGORIES_KEY, defaultCategories).filter((category) => category.archived))
      }
    },
  )
}

export async function createCategory(name: string) {
  assertAdminCanWrite()
  const normalizedName = name.trim()
  const slug = slugify(normalizedName)
  if (!normalizedName || !slug) {
    throw new Error('Category name is required.')
  }

  const current = readStored(CATEGORIES_KEY, defaultCategories)
  const nextCategory: AdminCategory = {
    id: `local-cat-${Date.now()}`,
    name: normalizedName,
    slug,
    createdAt: new Date().toISOString(),
  }
  writeStored(CATEGORIES_KEY, [...current, nextCategory])

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('category.create', 'category', nextCategory.id, {
      name: nextCategory.name,
      slug: nextCategory.slug,
      mode: 'local',
    })
    return nextCategory
  }

  try {
    const payload = {
      name: normalizedName,
      slug,
      createdAt: serverTimestamp(),
    }
    const ref = await addDoc(collection(firebaseDb, 'categories'), payload)
    await recordAdminAudit('category.create', 'category', ref.id, {
      name: normalizedName,
      slug,
      mode: 'live',
    })
    return { id: ref.id, ...payload }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }


    await recordAdminAudit('category.create', 'category', nextCategory.id, {
      name: nextCategory.name,
      slug: nextCategory.slug,
      mode: 'fallback-local',
    })
    return nextCategory
  }
}

export async function updateCategory(id: string, name: string) {
  assertAdminCanWrite()
  const normalizedName = name.trim()
  const slug = slugify(normalizedName)
  if (!normalizedName || !slug) {
    throw new Error('Category name is required.')
  }

  const current = readStored(CATEGORIES_KEY, defaultCategories)
  const updated = current.map((item) => (item.id === id ? { ...item, name: normalizedName, slug } : item))
  writeStored(CATEGORIES_KEY, updated)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('category.update', 'category', id, {
      name: normalizedName,
      slug,
      mode: 'local',
    })
    return updated.find((item) => item.id === id)
  }

  try {
    const ref = doc(firebaseDb, 'categories', id)
    await updateDoc(ref, { name: normalizedName, slug })
    await recordAdminAudit('category.update', 'category', id, {
      name: normalizedName,
      slug,
      mode: 'live',
    })
    return { id, name: normalizedName, slug }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }


    await recordAdminAudit('category.update', 'category', id, {
      name: normalizedName,
      slug,
      mode: 'fallback-local',
    })
    return updated.find((item) => item.id === id)
  }
}

export async function deleteCategory(id: string) {
  assertAdminCanWrite()
  const current = readStored(CATEGORIES_KEY, defaultCategories)
  const updated = current.map((item) => (item.id === id
    ? { ...item, archived: true, archivedAt: new Date().toISOString() }
    : item))
  writeStored(CATEGORIES_KEY, updated)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('category.archive', 'category', id, { mode: 'local' })
    return
  }

  try {
    await updateDoc(doc(firebaseDb, 'categories', id), {
      archived: true,
      archivedAt: serverTimestamp(),
    })
    await recordAdminAudit('category.archive', 'category', id, { mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('category.archive', 'category', id, { mode: 'fallback-local' })
    return
  }
}

export async function restoreCategory(id: string) {
  assertAdminCanWrite()
  const current = readStored(CATEGORIES_KEY, defaultCategories)
  const updated = current.map((item) => (item.id === id
    ? { ...item, archived: false, archivedAt: undefined }
    : item))
  writeStored(CATEGORIES_KEY, updated)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('category.restore', 'category', id, { mode: 'local' })
    return
  }

  try {
    await updateDoc(doc(firebaseDb, 'categories', id), {
      archived: false,
      archivedAt: null,
    })
    await recordAdminAudit('category.restore', 'category', id, { mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    await recordAdminAudit('category.restore', 'category', id, { mode: 'fallback-local' })
  }
}

export async function updateHomepageContent(content: HomepageContent): Promise<HomepageSaveResult> {
  assertAdminCanWrite()
  const savedAt = new Date().toISOString()
  const intendedSareeCover = readStoredCategoryCover(content, 'saree')
  const withSectionTimestamps: HomepageContent = {
    ...content,
    categorySections: content.categorySections
      ? Object.fromEntries(
        Object.entries(content.categorySections).map(([key, section]) => [
          key,
          { ...section, updatedAt: savedAt },
        ]),
      ) as HomepageCategorySections
      : content.categorySections,
  }
  const normalized = omitUndefinedDeep(
    applyIntendedCategoryCovers(normalizeHomepageContent(withSectionTimestamps), content),
  )
  const heroImage = normalized.heroImage ?? ''
  const sareeCoverImage = normalized.categorySections?.saree?.coverImage ?? ''
  const localFirstMode = isLocalFirstDataMode()
  const projectId = firebaseProjectId || '(missing)'

  if (intendedSareeCover && !isPersistableMediaUrl(intendedSareeCover)) {
    throw new Error('Cannot save the Saree image because it is not a permanent URL.')
  }

  console.info('[homepage] save:start', {
    hasFirebaseDb: Boolean(firebaseDb),
    localFirstMode,
    projectId,
    path: 'settings/homepage',
    field: 'categorySections.saree.coverImage',
    intendedSareeCoverImage: intendedSareeCover || '(empty)',
    sareeCoverImage: sareeCoverImage || '(empty)',
    heroImage,
  })

  if (!firebaseDb && !localFirstMode) {
    throw new Error('Firestore is not initialized. Homepage cannot be saved to live data.')
  }

  if (!firebaseDb || localFirstMode) {
    writeStored(HOMEPAGE_KEY, normalized)
    await recordAdminAudit('homepage.update', 'homepage', 'settings/homepage', {
      sections: normalized.sections.map((section) => ({ key: section.key, enabled: section.enabled, order: section.order })),
      mode: 'local',
    })

    console.info('[homepage] save:local-complete', {
      path: 'settings/homepage',
      projectId,
      sareeCoverImage: sareeCoverImage || '(empty)',
    })

    return {
      content: normalized,
      mode: 'local',
      path: 'settings/homepage',
      heroImage,
      sareeCoverImage,
      firebaseProjectId: projectId,
      verified: true,
      savedAt,
    }
  }

  try {
    const ref = doc(firebaseDb, 'settings', 'homepage')
    const payload = omitUndefinedDeep(normalized)
    const payloadSareeCover = readStoredCategoryCover(payload, 'saree')

    for (const layout of HOMEPAGE_CATEGORY_SECTION_LAYOUT) {
      const coverImage = readStoredCategoryCover(payload, layout.key)
      if (coverImage && !isPersistableMediaUrl(coverImage)) {
        throw new Error(`Cannot save ${layout.key} image because the upload did not return a persistable URL.`)
      }
    }

    if (intendedSareeCover && payloadSareeCover !== intendedSareeCover) {
      throw new Error(`Saree image was dropped before write. Intended ${intendedSareeCover} but payload has ${payloadSareeCover || '(empty)'}.`)
    }

    console.info('[homepage] save:before-setDoc', {
      projectId,
      path: 'settings/homepage',
      field: 'categorySections.saree.coverImage',
      merge: true,
      heroImage,
      sareeCoverImage: payloadSareeCover || '(empty)',
    })

    await setDoc(ref, payload, { merge: true })

    console.info('[homepage] save:after-setDoc', {
      projectId,
      path: 'settings/homepage',
      field: 'categorySections.saree.coverImage',
      sareeCoverImage: payloadSareeCover || '(empty)',
    })

    const verificationSnapshot = await getDocFromServer(ref)
    if (!verificationSnapshot.exists()) {
      throw new Error('Firestore write verification failed: settings/homepage does not exist after save.')
    }

    const rawData = verificationSnapshot.data()
    const rawSareeCover = readStoredCategoryCover(rawData, 'saree')
    const savedContent = applyIntendedCategoryCovers(
      normalizeHomepageContent(rawData as Partial<HomepageContent>),
      rawData as Partial<HomepageContent>,
    )
    const savedHeroImage = savedContent.heroImage ?? ''
    const savedSareeCover = savedContent.categorySections?.saree?.coverImage ?? ''

    console.info('[homepage] save:getDocFromServer', {
      projectId,
      path: 'settings/homepage',
      field: 'categorySections.saree.coverImage',
      rawSareeCoverImage: rawSareeCover || '(empty)',
      normalizedSareeCoverImage: savedSareeCover || '(empty)',
    })

    if ((intendedSareeCover || payloadSareeCover) && rawSareeCover !== (intendedSareeCover || payloadSareeCover)) {
      throw new Error(
        `Firestore write verification failed: expected categorySections.saree.coverImage=${intendedSareeCover || payloadSareeCover} but getDocFromServer returned ${rawSareeCover || '(empty)'}.`,
      )
    }

    writeStored(HOMEPAGE_KEY, savedContent)
    await recordAdminAudit('homepage.update', 'homepage', 'settings/homepage', {
      sections: savedContent.sections.map((section) => ({ key: section.key, enabled: section.enabled, order: section.order })),
      mode: 'live',
    })

    console.info('[homepage] save:verified', {
      projectId,
      path: 'settings/homepage',
      field: 'categorySections.saree.coverImage',
      heroImage: savedHeroImage,
      sareeCoverImage: rawSareeCover || '(empty)',
    })

    return {
      content: savedContent,
      mode: 'live',
      path: 'settings/homepage',
      heroImage: savedHeroImage,
      sareeCoverImage: rawSareeCover || savedSareeCover,
      firebaseProjectId: projectId,
      verified: true,
      savedAt,
    }
  } catch (error) {
    const details = describeFirebaseError(error)
    console.error('[homepage] save:error', {
      projectId,
      path: 'settings/homepage',
      field: 'categorySections.saree.coverImage',
      code: details.code,
      message: details.message,
      intendedSareeCoverImage: intendedSareeCover || '(empty)',
      heroImage,
    })

    throw new Error(`Homepage save failed (${details.code}): ${details.message}`, {
      cause: error,
    })
  }
}

export async function updateFounderProfile(profile: FounderProfile): Promise<{ mode: 'local' | 'live'; path: string }> {
  assertAdminCanWrite()
  const normalized = normalizeFounderProfile(profile)
  const localFirstMode = isLocalFirstDataMode()

  if (import.meta.env.DEV) {
    console.info('[founder] save:start', {
      hasFirebaseDb: Boolean(firebaseDb),
      localFirstMode,
      path: 'settings/founder',
      name: normalized.name,
    })
  }

  if (!firebaseDb && !localFirstMode) {
    throw new Error('Firestore is not initialized. Founder profile cannot be saved to live data.')
  }

  if (!firebaseDb || localFirstMode) {
    writeStored(FOUNDER_KEY, normalized)
    await recordAdminAudit('founder.update', 'homepage', 'settings/founder', { mode: 'local' })
    return { mode: 'local', path: 'settings/founder' }
  }

  try {
    const ref = doc(firebaseDb, 'settings', 'founder')
    await setDoc(ref, normalized)
    writeStored(FOUNDER_KEY, normalized)
    await recordAdminAudit('founder.update', 'homepage', 'settings/founder', { mode: 'live' })

    if (import.meta.env.DEV) {
      console.info('[founder] save:complete', { path: 'settings/founder', name: normalized.name })
    }

    return { mode: 'live', path: 'settings/founder' }
  } catch (error) {
    const details = describeFirebaseError(error)
    console.error('[founder] save:error', {
      path: 'settings/founder',
      code: details.code,
      message: details.message,
    })

    throw new Error(`Founder save failed (${details.code}): ${details.message}`, {
      cause: error,
    })
  }
}

interface UploadAssetsOptions {
  onProgress?: (progress: number) => void
  retries?: number
}

export async function uploadAssets(files: File[], folder: string, options: UploadAssetsOptions = {}) {
  if (typeof window === 'undefined') {
    return []
  }

  const authToken = await getCurrentAdminIdToken()

  return uploadMultipleAssets(files, {
    folder,
    onProgress: options.onProgress,
    retries: options.retries,
    authToken,
  })
}

export async function deleteAsset(url: string) {
  if (typeof window === 'undefined') {
    return
  }

  const authToken = await getCurrentAdminIdToken()
  await deleteCloudinaryAssetByUrl(url, authToken)
}

export interface NewsletterSubscriber {
  id: string
  email: string
  signupDate: string
  source: 'website_popup'
  couponUsed?: string
  couponId?: string
  popupStatus?: string
}

export interface Subscriber {
  id: string
  email: string
  createdDate: string
  lastVisit: string
  popupStatus: 'pending' | 'completed' | 'closed'
  couponId?: string
  couponStatus: 'pending' | 'active' | 'used' | 'expired' | 'disabled'
  couponUsed: boolean
  firstOrderCompleted: boolean
  marketingConsent: boolean
  deviceInfo?: string
}

export interface Coupon {
  id: string
  code?: string
  discountPercent: number
  discountType?: CouponDiscountType
  discountFixedBdt?: number
  minSpend?: number
  applicableCategories?: string[]
  audience?: CouponAudience
  customerEmail: string
  createdDate: string
  expiryDate: string
  status: 'active' | 'used' | 'disabled' | 'expired'
  usageCount: number
  maxUsage: number
  orderId?: string
  discountAmount?: number
  usedAt?: string
}

interface PublicNewsletterSignupResult {
  subscriberId: string
  couponCode: string
  couponId: string
  alreadySubscribed?: boolean
}

interface PublicCouponValidationResult {
  valid: boolean
  coupon?: {
    id: string
    code: string
    discountPercent: number
    discountType?: CouponDiscountType
    discountFixedBdt?: number
    minSpend?: number
    applicableCategories?: string[]
    expiryDate: string
    status: 'active' | 'used' | 'disabled' | 'expired'
    usageCount: number
    maxUsage: number
  }
  error?: string
}

interface PublicCouponRedemptionResult {
  redeemed: boolean
  couponCode?: string
  couponId?: string
  error?: string
}

const COUPON_PREFIX = 'SHIS-'
const COUPON_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const COUPON_CODE_LENGTH = 6
const COUPON_DEFAULT_PERCENT = 5
const COUPON_MAX_USAGE = 1
const COUPON_EXPIRY_DAYS = 30

function generateCouponCodeInternal(): string {
  let code = ''
  for (let i = 0; i < COUPON_CODE_LENGTH; i++) {
    code += COUPON_CODE_CHARS.charAt(Math.floor(Math.random() * COUPON_CODE_CHARS.length))
  }
  return `${COUPON_PREFIX}${code}`
}

function computeCouponExpiry(): string {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + COUPON_EXPIRY_DAYS)
  return expiry.toISOString()
}

function computeCouponDiscountPercent(): number {
  return COUPON_DEFAULT_PERCENT
}

function computeCouponMaxUsage(): number {
  return COUPON_MAX_USAGE
}

async function readApiError(response: Response) {
  try {
    const payload = await response.json() as { error?: string }
    return payload.error || 'Request failed.'
  } catch {
    return 'Request failed.'
  }
}

export async function subscribeNewsletter(email: string): Promise<PublicNewsletterSignupResult> {
  const trimmed = email.trim().toLowerCase()

  if (!trimmed) {
    throw new Error('Invalid email address.')
  }

  if (!firebaseDb || isLocalFirstDataMode()) {
    const currentSubscribers = readStored<NewsletterSubscriber[]>(SUBSCRIBERS_KEY, [])
    const existingSubscriber = currentSubscribers.find((subscriber) => subscriber.email === trimmed)
    const currentCoupons = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])

    if (existingSubscriber?.couponUsed && existingSubscriber.couponId) {
      return {
        subscriberId: existingSubscriber.id,
        couponCode: existingSubscriber.couponUsed,
        couponId: existingSubscriber.couponId,
        alreadySubscribed: true,
      }
    }

    const couponCode = generateCouponCodeInternal()
    const couponId = existingSubscriber?.couponId || `local-coupon-${Date.now()}`
    const newCoupon: Coupon = {
      id: couponId,
      code: couponCode,
      discountPercent: computeCouponDiscountPercent(),
      customerEmail: trimmed,
      createdDate: new Date().toISOString(),
      expiryDate: computeCouponExpiry(),
      status: 'active',
      usageCount: 0,
      maxUsage: computeCouponMaxUsage(),
    }

    writeStored(COUPON_PREFIX + 'coupons', [newCoupon, ...currentCoupons.filter((coupon) => coupon.id !== couponId)])

    const subscriberId = existingSubscriber?.id || `local-subscriber-${Date.now()}`
    const nextSubscriber: NewsletterSubscriber = {
      id: subscriberId,
      email: trimmed,
      signupDate: new Date().toISOString(),
      source: 'website_popup',
      couponUsed: couponCode,
      couponId,
      popupStatus: 'completed',
    }

    writeStored(
      SUBSCRIBERS_KEY,
      [nextSubscriber, ...currentSubscribers.filter((subscriber) => subscriber.id !== subscriberId)],
    )

    return {
      subscriberId,
      couponCode,
      couponId,
      alreadySubscribed: Boolean(existingSubscriber),
    }
  }

  const response = await fetch('/api/newsletter-signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: trimmed }),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<PublicNewsletterSignupResult>
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  if (!firebaseDb || isLocalFirstDataMode()) {
    return readStored<NewsletterSubscriber[]>(SUBSCRIBERS_KEY, [])
  }

  const q = query(collection(firebaseDb, 'newsletterSubscribers'), orderBy('signupDate', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<NewsletterSubscriber, 'id'>) }))
}

const POPUP_STATE_KEY = 'shis-popup-state'
const SUBSCRIBERS_KEY = 'shis-admin-subscribers'

export function getPopupState(): { completed: boolean; closed: boolean; email?: string } {
  if (typeof window === 'undefined') {
    return { completed: false, closed: false }
  }

  try {
    const stored = window.localStorage.getItem(POPUP_STATE_KEY)
    return stored ? (JSON.parse(stored) as { completed: boolean; closed: boolean; email?: string }) : { completed: false, closed: false }
  } catch {
    return { completed: false, closed: false }
  }
}

export function setPopupCompleted(email?: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const current = getPopupState()
  window.localStorage.setItem(POPUP_STATE_KEY, JSON.stringify({ ...current, completed: true, email }))
}

export function setPopupClosed(): void {
  if (typeof window === 'undefined') {
    return
  }

  const current = getPopupState()
  window.localStorage.setItem(POPUP_STATE_KEY, JSON.stringify({ ...current, closed: true }))
}

export function resetPopupState(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(POPUP_STATE_KEY)
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'createdDate' | 'usageCount'>): Promise<Coupon> {
  assertAdminCanWrite()
  if (requiresLiveBackend() && !firebaseDb) {
    throw new Error('Coupon service unavailable: database not configured.')
  }

  const code = (coupon.code || generateCouponCodeInternal()).toUpperCase().trim()
  if (!isValidCouponCode(code)) {
    throw new Error('Coupon code must look like SHIS-AB12CD or SALE-500.')
  }

  const discountType = resolveCouponDiscountType(coupon.discountType)
  const discountPercent = discountType === 'percent'
    ? Math.min(100, Math.max(0, coupon.discountPercent ?? computeCouponDiscountPercent()))
    : 0
  const discountFixedBdt = discountType === 'fixed'
    ? Math.max(0, Math.round(Number(coupon.discountFixedBdt ?? 0) || 0))
    : 0
  if (discountType === 'percent' && discountPercent <= 0) {
    throw new Error('Enter a percent discount between 1 and 100.')
  }
  if (discountType === 'fixed' && discountFixedBdt <= 0) {
    throw new Error('Enter a fixed discount in BDT.')
  }

  const maxUsage = Math.max(1, Math.min(10000, coupon.maxUsage ?? computeCouponMaxUsage()))
  const expiryDate = coupon.expiryDate || computeCouponExpiry()
  const customerEmail = (coupon.customerEmail ?? '').trim().toLowerCase()
  const audience = resolveCouponAudience(customerEmail, coupon.audience)
  if (audience === 'private' && !customerEmail) {
    throw new Error('Private coupons require a customer email.')
  }
  const applicableCategories = normalizeCouponCategories(coupon.applicableCategories)
  const minSpend = Math.max(0, Math.round(Number(coupon.minSpend ?? 0) || 0))

  const newCoupon: Coupon = {
    id: `local-coupon-${Date.now()}`,
    code,
    discountPercent,
    discountType,
    discountFixedBdt,
    minSpend,
    applicableCategories,
    audience,
    customerEmail: audience === 'private' ? customerEmail : '',
    createdDate: new Date().toISOString(),
    expiryDate,
    status: 'active',
    usageCount: 0,
    maxUsage,
    orderId: coupon.orderId,
    discountAmount: coupon.discountAmount,
    usedAt: coupon.usedAt,
  }

  const currentCoupons = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
  writeStored(COUPON_PREFIX + 'coupons', [newCoupon, ...currentCoupons])

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('coupon.create', 'coupon', newCoupon.id, {
      code: newCoupon.code,
      customerEmail: newCoupon.customerEmail,
      mode: 'local',
    })
    return newCoupon
  }

  try {
    const ref = await addDoc(collection(firebaseDb, 'coupons'), {
      code: newCoupon.code,
      discountPercent: newCoupon.discountPercent,
      discountType: newCoupon.discountType,
      discountFixedBdt: newCoupon.discountFixedBdt,
      minSpend: newCoupon.minSpend,
      applicableCategories: newCoupon.applicableCategories,
      audience: newCoupon.audience,
      customerEmail: newCoupon.customerEmail,
      createdDate: serverTimestamp(),
      expiryDate: newCoupon.expiryDate,
      status: newCoupon.status,
      usageCount: newCoupon.usageCount,
      maxUsage: newCoupon.maxUsage,
    })
    const syncedCoupon = { ...newCoupon, id: ref.id }
    const syncedCoupons = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', []).map((c) => (c.id === newCoupon.id ? syncedCoupon : c))
    writeStored(COUPON_PREFIX + 'coupons', syncedCoupons)
    await recordAdminAudit('coupon.create', 'coupon', ref.id, { code: syncedCoupon.code, mode: 'live' })
    return syncedCoupon
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }
    await recordAdminAudit('coupon.create', 'coupon', newCoupon.id, { mode: 'fallback-local' })
    return newCoupon
  }
}

export async function getCoupons(): Promise<Coupon[]> {
  if (!firebaseDb) {
    return readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
  }

  if (isLocalFirstDataMode()) {
    return readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
  }

  try {
    const q = query(collection(firebaseDb, 'coupons'), orderBy('createdDate', 'desc'))
    const snapshot = await getDocs(q)
    const coupons = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Coupon, 'id'>) }))
    writeStored(COUPON_PREFIX + 'coupons', coupons)
    return coupons
  } catch {
    return readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
  }
}

export async function getCouponByCode(code: string, customerEmail = '', cartItems: CouponQuoteItem[] = []): Promise<Coupon | null> {
  const trimmed = code.trim().toUpperCase()
  const trimmedEmail = customerEmail.trim().toLowerCase()

  if (!isValidCouponCode(trimmed)) {
    return null
  }

  const toCoupon = (entry: Coupon): Coupon => ({
    ...entry,
    discountType: resolveCouponDiscountType(entry.discountType),
    discountFixedBdt: Math.max(0, Number(entry.discountFixedBdt ?? 0) || 0),
    minSpend: Math.max(0, Number(entry.minSpend ?? 0) || 0),
    applicableCategories: normalizeCouponCategories(entry.applicableCategories),
    audience: resolveCouponAudience(entry.customerEmail, entry.audience),
    customerEmail: entry.customerEmail ?? '',
  })

  const assertEligible = (coupon: Coupon) => {
    if (!cartItems.length) {
      return
    }
    const quote = quoteCouponDiscount(coupon, cartItems)
    if (!quote.ok) {
      throw new Error(quote.error || 'This coupon does not apply to the current cart.')
    }
  }

  if (!firebaseDb || isLocalFirstDataMode()) {
    const coupons = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
    const coupon = coupons.find((c) => (c.code ?? '').toUpperCase() === trimmed && c.status === 'active') || null
    if (!coupon) {
      return null
    }

    if (isCouponExpired(coupon.expiryDate) || coupon.usageCount >= coupon.maxUsage) {
      return null
    }

    const boundEmail = (coupon.customerEmail ?? '').trim().toLowerCase()
    if (boundEmail && boundEmail !== trimmedEmail) {
      throw new Error(trimmedEmail ? 'This coupon is not valid for this email.' : 'Enter the email this coupon was issued to.')
    }

    const normalized = toCoupon(coupon)
    assertEligible(normalized)
    return normalized
  }

  try {
    const response = await fetch('/api/validate-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'validate',
        code: trimmed,
        email: trimmedEmail || undefined,
        items: cartItems,
      }),
    })

    const payload = await response.json() as PublicCouponValidationResult
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to validate coupon. Please try again.')
    }

    if (!payload.valid || !payload.coupon) {
      return null
    }

    const normalized = toCoupon({
      id: payload.coupon.id,
      code: payload.coupon.code,
      discountPercent: payload.coupon.discountPercent,
      discountType: payload.coupon.discountType,
      discountFixedBdt: payload.coupon.discountFixedBdt,
      minSpend: payload.coupon.minSpend,
      applicableCategories: payload.coupon.applicableCategories,
      customerEmail: '',
      createdDate: '',
      expiryDate: payload.coupon.expiryDate,
      status: payload.coupon.status,
      usageCount: payload.coupon.usageCount,
      maxUsage: payload.coupon.maxUsage,
    })
    assertEligible(normalized)
    return normalized
  } catch (error) {
    if (requiresLiveBackend()) {
      throw error instanceof Error ? error : new Error('Unable to validate coupon. Please try again.')
    }

    const coupons = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
    const fallback = coupons.find((c) => (c.code ?? '').toUpperCase() === trimmed && c.status === 'active') || null
    return fallback ? toCoupon(fallback) : null
  }
}

export async function updateCoupon(id: string, updates: Partial<Pick<Coupon, 'discountPercent' | 'expiryDate' | 'status' | 'maxUsage'>>): Promise<void> {
  assertAdminCanWrite()
  const current = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
  const updated = current.map((coupon) => (coupon.id === id ? { ...coupon, ...updates } : coupon))
  writeStored(COUPON_PREFIX + 'coupons', updated)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('coupon.update', 'coupon', id, { mode: 'local', updates })
    return
  }

  try {
    await updateDoc(doc(firebaseDb, 'coupons', id), updates)
    await recordAdminAudit('coupon.update', 'coupon', id, { mode: 'live', updates })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }
    await recordAdminAudit('coupon.update', 'coupon', id, { mode: 'fallback-local', updates })
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  assertAdminCanWrite()
  const current = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
  writeStored(COUPON_PREFIX + 'coupons', current.filter((c) => c.id !== id))

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('coupon.delete', 'coupon', id, { mode: 'local' })
    return
  }

  try {
    await deleteDoc(doc(firebaseDb, 'coupons', id))
    await recordAdminAudit('coupon.delete', 'coupon', id, { mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }
    await recordAdminAudit('coupon.delete', 'coupon', id, { mode: 'fallback-local' })
  }
}

export function getCouponStats(coupons?: Coupon[]) {
  const list = coupons ?? readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
  return {
    total: list.length,
    active: list.filter((c) => c.status === 'active').length,
    used: list.filter((c) => c.status === 'used').length,
    expired: list.filter((c) => c.status === 'expired' || isCouponExpired(c.expiryDate)).length,
    disabled: list.filter((c) => c.status === 'disabled').length,
  }
}

export async function linkCouponToSubscriber(subscriberEmail: string, couponCode: string, couponId: string): Promise<void> {
  if (!firebaseDb) {
    const subscribers = readStored<Subscriber[]>(SUBSCRIBERS_KEY, [])
    const updated = subscribers.map((s) =>
      s.email === subscriberEmail.toLowerCase()
        ? { ...s, couponId, couponStatus: 'active' as const, popupStatus: 'completed' as const }
        : s,
    )
    writeStored(SUBSCRIBERS_KEY, updated)
    return
  }

  try {
    const q = query(collection(firebaseDb, 'newsletterSubscribers'), where('email', '==', subscriberEmail.toLowerCase()), limit(1))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref
      await updateDoc(docRef, {
        popupStatus: 'completed',
        couponId,
        couponUsed: couponCode,
      })
    }
  } catch {
    // Best effort
  }
}

export async function markCouponUsed(couponId: string, orderId: string, discountAmount: number): Promise<void> {
  const current = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
  const updated = current.map((coupon) => {
    if (coupon.id !== couponId) {
      return coupon
    }

    const next = nextCouponUsage(coupon.usageCount, coupon.maxUsage)
    return {
      ...coupon,
      status: next.status,
      usageCount: next.usageCount,
      orderId,
      discountAmount,
      usedAt: new Date().toISOString(),
    }
  })
  writeStored(COUPON_PREFIX + 'coupons', updated)

  if (!firebaseDb || isLocalFirstDataMode()) {
    await recordAdminAudit('coupon.use', 'coupon', couponId, { orderId, mode: 'local' })
    return
  }

  try {
    const response = await fetch('/api/validate-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'redeem',
        couponId,
        orderId,
        discountAmount,
      }),
    })

    if (!response.ok) {
      throw new Error(await readApiError(response))
    }

    await response.json() as PublicCouponRedemptionResult
    await recordAdminAudit('coupon.use', 'coupon', couponId, { orderId, mode: 'live' })
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }
    await recordAdminAudit('coupon.use', 'coupon', couponId, { orderId, mode: 'fallback-local' })
  }
}

export async function getSubscriberByEmail(email: string): Promise<Subscriber | null> {
  const trimmed = email.trim().toLowerCase()

  if (!firebaseDb) {
    const subscribers = readStored<Subscriber[]>(SUBSCRIBERS_KEY, [])
    return subscribers.find((s) => s.email === trimmed) || null
  }

  try {
    const q = query(collection(firebaseDb, 'newsletterSubscribers'), where('email', '==', trimmed), limit(1))
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return null
    }
    const doc = snapshot.docs[0]
    const data = doc.data() as NewsletterSubscriber
    return {
      id: doc.id,
      email: data.email,
      createdDate: data.signupDate,
      lastVisit: new Date().toISOString(),
      popupStatus: 'completed',
      couponId: data.couponId,
      couponStatus: data.couponUsed ? 'used' : 'active',
      couponUsed: !!data.couponUsed,
      firstOrderCompleted: false,
      marketingConsent: true,
    }
  } catch {
    return null
  }
}

export async function validateCouponServer(code: string, customerEmail: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  const trimmedCode = code.trim().toUpperCase()
  const trimmedEmail = customerEmail.trim().toLowerCase()

  if (!isValidCouponCode(trimmedCode)) {
    return { valid: false, error: 'Invalid coupon code format.' }
  }

  try {
    const coupon = await getCouponByCode(trimmedCode, trimmedEmail)

    if (!coupon) {
      return { valid: false, error: 'Invalid or expired coupon code.' }
    }

    if (coupon.status !== 'active') {
      return { valid: false, error: 'This coupon is no longer active.' }
    }

    if (isCouponExpired(coupon.expiryDate)) {
      return { valid: false, error: 'This coupon has expired.' }
    }

    if (coupon.usageCount >= coupon.maxUsage) {
      return { valid: false, error: 'This coupon has already been used.' }
    }

    return { valid: true, coupon }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid or expired coupon code.' }
  }
}

const REVIEWS_KEY = 'shis-fashion-reviews'

function serializeReview(id: string, data: Partial<ProductReview>): ProductReview {
  const createdAt = data.createdAt
  const createdAtValue = typeof createdAt === 'string'
    ? createdAt
    : createdAt && typeof createdAt === 'object' && 'seconds' in createdAt
      ? new Date(createdAt.seconds * 1000).toISOString()
      : new Date().toISOString()

  return {
    id,
    productId: String(data.productId ?? ''),
    productSlug: data.productSlug,
    authorName: String(data.authorName ?? ''),
    rating: Math.min(5, Math.max(1, Math.round(Number(data.rating ?? 0)))),
    body: String(data.body ?? ''),
    status: data.status === 'approved' || data.status === 'rejected' ? data.status : 'pending',
    createdAt: createdAtValue,
  }
}

export function subscribeToApprovedProductReviews(productId: string, callback: (reviews: ProductReview[]) => void) {
  const emitApproved = (reviews: ProductReview[]) => {
    callback(reviews.filter((review) => review.status === 'approved' && review.productId === productId))
  }

  if (!firebaseDb || isLocalFirstDataMode()) {
    emitApproved(readStored(REVIEWS_KEY, [] as ProductReview[]))
    return subscribeToStored(REVIEWS_KEY, [] as ProductReview[], emitApproved)
  }

  const reviewsQuery = query(
    collection(firebaseDb, 'reviews'),
    where('productId', '==', productId),
    where('status', '==', 'approved'),
  )

  return onSnapshot(reviewsQuery, (snapshot) => {
    callback(snapshot.docs.map((entry) => serializeReview(entry.id, entry.data() as Partial<ProductReview>)))
  }, () => {
    emitApproved(readStored(REVIEWS_KEY, [] as ProductReview[]))
  })
}

export function subscribeToAdminReviews(callback: (reviews: ProductReview[]) => void) {
  if (!firebaseDb || isLocalFirstDataMode()) {
    callback(readStored(REVIEWS_KEY, [] as ProductReview[]))
    return subscribeToStored(REVIEWS_KEY, [] as ProductReview[], callback)
  }

  return onSnapshot(collection(firebaseDb, 'reviews'), (snapshot) => {
    callback(snapshot.docs.map((entry) => serializeReview(entry.id, entry.data() as Partial<ProductReview>)))
  }, () => {
    callback(readStored(REVIEWS_KEY, [] as ProductReview[]))
  })
}

export async function updateReviewStatus(id: string, status: ReviewStatus) {
  assertAdminCanWrite()
  const current = readStored(REVIEWS_KEY, [] as ProductReview[])
  writeStored(REVIEWS_KEY, current.map((review) => (review.id === id ? { ...review, status } : review)))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return
  }

  await updateDoc(doc(firebaseDb, 'reviews', id), { status })
}

export function subscribeToAdminAccounts(callback: (admins: AdminAccount[]) => void) {
  if (!firebaseDb || isLocalFirstDataMode()) {
    callback([])
    return () => undefined
  }

  return onSnapshot(collection(firebaseDb, 'admins'), (snapshot) => {
    callback(snapshot.docs.map((entry) => {
      const data = entry.data() as { email?: unknown; role?: unknown; roles?: unknown; active?: unknown }
      return {
        uid: entry.id,
        email: typeof data.email === 'string' ? data.email : '',
        role: resolveAdminAccessRole(data.role, data.roles),
        active: data.active !== false,
      }
    }))
  }, () => {
    callback([])
  })
}

export async function updateAdminAccountRole(uid: string, role: AdminAccessRole) {
  assertAdminCanWrite()
  if (!firebaseDb || isLocalFirstDataMode()) {
    throw new Error('Admin roles require live Firebase.')
  }

  await updateDoc(doc(firebaseDb, 'admins', uid), {
    role,
    roles: [role === 'owner' ? 'admin' : role],
  })
  await recordAdminAudit('admin.role', 'admin', uid, { role })
}

export async function requestOrderStatusNotify(orderId: string, channel: OrderNotifyChannel = 'order-shipped') {
  const token = await getCurrentAdminIdToken()
  if (!token) {
    return
  }

  try {
    await fetch('/api/notify-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId, channel }),
    })
  } catch {
    // Optional transactional notify must never block admin status updates.
  }
}

