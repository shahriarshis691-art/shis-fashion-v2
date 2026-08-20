import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import { shopCategories } from '../data/shopData'
import { brandEntries } from '../data/brandShowcase'
import { compactManagedImages } from '../utils/media'
import { slugify } from '../utils/slugify'
import { normalizeSizes } from '../utils/sizes'
import { isValidCouponCode, isCouponExpired } from '../utils/coupon'
import { auth as firebaseAuth, db as firebaseDb } from './firebase'
import type { DeliveryAddress } from '../utils/bangladeshAddress'

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
  price: string
  comparePrice?: string
  brand?: string
  stock: number
  sizes: string[]
  colors: string[]
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
  status: 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  trackingNumber?: string
  createdAt?: string | { seconds: number }
  archived?: boolean
  archivedAt?: string | { seconds: number }
  couponCode?: string
  couponDiscountPercent?: number
  couponDiscountAmount?: number
  couponId?: string
  stockCommitted?: boolean
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

const ORDER_STATUS_TRANSITIONS: Record<AdminOrder['status'], AdminOrder['status'][]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
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

type AdminAuditTarget = 'product' | 'order' | 'category' | 'homepage' | 'brand' | 'coupon'

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
  return (import.meta.env.VITE_ALLOW_LOCAL_FALLBACK ?? (isProductionBuild() ? 'false' : 'true')) !== 'true'
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

function getLaunchModeUser(): { uid: string; email: string } | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.sessionStorage.getItem(LAUNCH_MODE_USER_KEY)
    return stored ? (JSON.parse(stored) as { uid: string; email: string }) : null
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
  const user = { uid: pseudoUid, email }
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
      email: launchUser.email.trim().toLowerCase(),
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

function normalizeRoleValues(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[]
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.toLowerCase())
}

function includesAdminRole(role: unknown, roles: unknown) {
  if (typeof role === 'string' && role.toLowerCase() === 'admin') {
    return true
  }

  return normalizeRoleValues(roles).includes('admin')
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

async function isAdminUser(user: User) {
  const normalizedEmail = user.email?.trim().toLowerCase() ?? ''
  const isEmailAllowListed = configuredAdminEmails.size > 0
    ? Boolean(normalizedEmail && configuredAdminEmails.has(normalizedEmail))
    : null

  if (configuredAdminEmails.size > 0 && !isEmailAllowListed) {
    return false
  }

  const tokenResult = await user.getIdTokenResult()
  const claims = tokenResult.claims as Record<string, unknown>
  const hasAdminClaim = claims.admin === true || includesAdminRole(claims.role, claims.roles)

  if (!firebaseDb) {
    return isEmailAllowListed === true ? true : hasAdminClaim
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

    // Continue with claims-only fallback. This prevents generic login failures and
    // allows signInAdmin() to surface a specific admin-permission-required message.
    return hasAdminClaim
  }

  if (adminDocSnapshot.exists()) {
    const adminDocData = adminDocSnapshot.data() as Record<string, unknown>
    const isActive = adminDocData.active !== false
    if (isActive && includesAdminRole(adminDocData.role, adminDocData.roles)) {
      return true
    }
  }

  if (adminsSettingsSnapshot.exists()) {
    const settingsData = adminsSettingsSnapshot.data() as Record<string, unknown>
    if (listIncludesIdentifier(settingsData.emails, normalizedEmail)) {
      return true
    }
    if (listIncludesIdentifier(settingsData.uids, user.uid.toLowerCase())) {
      return true
    }
    if (listIncludesIdentifier(settingsData.admins, normalizedEmail) || listIncludesIdentifier(settingsData.admins, user.uid.toLowerCase())) {
      return true
    }
  }

  if (hasAdminClaim) {
    return true
  }

  // If an allow-list is configured, require Firestore-recognized admin authority
  // so dashboard access reflects actual write permissions.
  if (isEmailAllowListed === true) {
    return false
  }

  return false
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
  { key: 'kids', label: 'Kids', href: '/kids', order: 30, legacyImageKey: 'kids' },
  { key: 'western', label: 'Western', href: '/women?sub=tunic', order: 40, legacyImageKey: 'western' },
  { key: 'sale', label: 'Half Shirt', href: '/men?sub=shirts', order: 50, legacyImageKey: 'oversized-tee' },
  { key: 'new-arrivals', label: 'New Arrivals', href: '/shop/new-arrivals', order: 60, legacyImageKey: 'couples' },
]

function getLegacyCategoryImage(legacyImageKey: string) {
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
    const incoming = content?.categorySections?.[layout.key]
    const legacy = legacySections[layout.key]
    const source = incoming ?? legacy
    const sourceImages = toUniqueImages(source?.images)
    const coverImage = source?.coverImage?.trim() || sourceImages[0] || fallback.coverImage

    const normalizedSection = {
      ...fallback,
      ...source,
      key: layout.key,
      label: source?.label?.trim() || fallback.label,
      href: source?.href?.trim() || fallback.href,
      enabled: source?.enabled ?? fallback.enabled,
      order: typeof source?.order === 'number' ? source.order : fallback.order,
      coverImage,
      images: sourceImages.length ? sourceImages : fallback.images,
    }

    if (layout.key === 'sale') {
      return [
        layout.key,
        {
          ...normalizedSection,
          label: 'Half Shirt',
          href: '/men?sub=shirts',
          coverImage: normalizedSection.coverImage || getLegacyCategoryImage('oversized-tee'),
        },
      ] as const
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
    { title: 'Winter', caption: 'Winter.', href: '/collections/winter', image: '/og-image.svg' },
    { title: 'Summer', caption: 'Summer.', href: '/collections/summer', image: '/og-image.svg' },
    { title: 'Everyday Wear', caption: 'Everyday wear.', href: '/collections/everyday-wear', image: '/og-image.svg' },
  ],
  featuredCollectionPages: [
    {
      slug: 'winter',
      title: 'Winter Collection',
      subtitle: 'Layer-ready staples',
      description: 'Cold-season essentials with premium texture and clean tailoring.',
      href: '/collections/winter',
      images: ['/og-image.svg', '/og-image.svg', '/og-image.svg', '/og-image.svg'],
      relatedCategorySlugs: ['denim', 'mens-shirt', 'western-outfits'],
    },
    {
      slug: 'summer',
      title: 'Summer Collection',
      subtitle: 'Breathable premium edits',
      description: 'Lightweight silhouettes designed for warm days and evening plans.',
      href: '/collections/summer',
      images: ['/og-image.svg', '/og-image.svg', '/og-image.svg', '/og-image.svg'],
      relatedCategorySlugs: ['unisex-tee', 'womens-dresses', 'oversized-tee'],
    },
    {
      slug: 'everyday-wear',
      title: 'Everyday Wear',
      subtitle: 'Daily go-to luxury',
      description: 'Reliable daily pieces balancing comfort, polish, and movement.',
      href: '/collections/everyday-wear',
      images: ['/og-image.svg', '/og-image.svg', '/og-image.svg', '/og-image.svg'],
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

  return {
    ...product,
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
    ...defaultHomepage.shopByCategories[index],
    ...category,
    title: category.title || defaultHomepage.shopByCategories[index]?.title || '',
    href: category.href || defaultHomepage.shopByCategories[index]?.href || '/shop',
    image: category.image || defaultHomepage.shopByCategories[index]?.image,
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

  return {
    ...defaultHomepage,
    ...(content ?? {}),
    heroEyebrow: content?.heroEyebrow ?? defaultHomepage.heroEyebrow,
    heroPrimaryLink: content?.heroPrimaryLink ?? defaultHomepage.heroPrimaryLink,
    heroSecondaryLink: content?.heroSecondaryLink ?? defaultHomepage.heroSecondaryLink,
    heroImageTitle: content?.heroImageTitle ?? defaultHomepage.heroImageTitle,
    heroImageDescription: content?.heroImageDescription ?? defaultHomepage.heroImageDescription,
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

export function onAdminAuthChanged(callback: (user: { uid: string; email: string | null } | null) => void) {
  ensureSeedData()
  clearLegacyAdminBypassState()

  // TEMPORARY LAUNCH MODE - Check for Launch Mode auth first
  if (isLaunchModeEnabled()) {
    const launchUser = getLaunchModeUser()
    if (launchUser) {
      callback(launchUser)
      // Still return a cleanup function for compatibility
      return () => undefined
    }
    // If no Launch Mode user, fall through to callback(null)
    callback(null)
    return () => undefined
  }

  if (!firebaseAuth) {
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
          callback(null)
          return
        }

        const hasAdminAccess = await isAdminUser(user)
        if (!isActive) {
          return
        }

        if (!hasAdminAccess) {
          markAccessDenied()
          await signOut(auth)
          if (!isActive) {
            return
          }
          callback(null)
          return
        }

        callback({ uid: user.uid, email: user.email })
      } catch {
        if (!isActive) {
          return
        }
        callback(null)
      }
    })()
  })

  return () => {
    isActive = false
    unsubscribe()
  }
}

export async function signInAdmin(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()

  // TEMPORARY LAUNCH MODE - Bypass Firebase if configured
  if (isLaunchModeEnabled()) {
    if (configuredAdminEmails.has(normalizedEmail)) {
      setLaunchModeUser(normalizedEmail)
      return { uid: `launch-mode-${normalizedEmail.replace(/[^a-z0-9]/gi, '')}`, email: normalizedEmail }
    } else {
      markAccessDenied()
      const error = new Error('Access Denied')
      ;(error as Error & { code?: string }).code = 'auth/forbidden-admin'
      throw error
    }
  }

  // Standard Firebase authentication path
  if (!firebaseAuth) {
    const error = new Error('Firebase authentication is not configured for this environment.')
    ;(error as Error & { code?: string }).code = 'auth/firebase-not-configured'
    throw error
  }

  const result = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password)
  const hasAdminAccess = await isAdminUser(result.user)
  const emailIsAllowListed = configuredAdminEmails.size > 0
    ? configuredAdminEmails.has(normalizedEmail)
    : false

  if (!hasAdminAccess) {
    markAccessDenied()
    try {
      await signOut(firebaseAuth)
    } catch {
      // Ignore sign-out failures so we can surface a deterministic auth error to the UI.
    }
    const error = new Error(emailIsAllowListed
      ? 'Access denied. This account is allow-listed but missing Firestore admin permissions.'
      : 'Access Denied')
    ;(error as Error & { code?: string; adminUid?: string; adminEmail?: string }).code = emailIsAllowListed ? 'auth/admin-firestore-permission-required' : 'auth/forbidden-admin'
    ;(error as Error & { code?: string; adminUid?: string; adminEmail?: string }).adminUid = result.user.uid
    ;(error as Error & { code?: string; adminUid?: string; adminEmail?: string }).adminEmail = result.user.email ?? normalizedEmail
    throw error
  }

  return { uid: result.user.uid, email: result.user.email }
}

export async function signOutAdmin() {
  clearLegacyAdminBypassState()
  // TEMPORARY LAUNCH MODE - Clear launch mode session
  clearLaunchModeUser()

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
  const currentProducts = readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)
  const normalizedProduct = normalizeProduct({ ...product, id: 'draft-product' } as AdminProduct)
  const productPayload = {
    ...product,
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
  const currentProducts = readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)
  const updatedProducts = currentProducts.map((item) => (item.id === id ? normalizeProduct({ ...item, ...product }) : item))
  writeStored(PRODUCTS_KEY, updatedProducts)

  const normalizedUpdate = currentProducts.find((item) => item.id === id)
    ? normalizeProduct({ ...currentProducts.find((item) => item.id === id)!, ...product })
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

export async function updateOrderStatus(id: string, status: AdminOrder['status'], trackingNumber?: string) {
  const currentOrder = readStored(ORDERS_KEY, defaultOrders).find((order) => order.id === id)

  if (currentOrder && currentOrder.status !== status) {
    const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[currentOrder.status] ?? []
    if (!allowedNextStatuses.includes(status)) {
      const error = new Error(`Invalid order transition: ${currentOrder.status} -> ${status}`)
      ;(error as Error & { code?: string }).code = 'order/invalid-status-transition'
      throw error
    }
  }

  return updateOrderDetails(id, { status, trackingNumber: trackingNumber ?? '' })
}

export async function updateOrderDetails(
  id: string,
  updates: Partial<Pick<AdminOrder, 'customerName' | 'customerPhone' | 'customerEmail' | 'address' | 'deliveryAddress' | 'deliveryCharge' | 'notes' | 'status' | 'trackingNumber'>>,
) {
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

export async function deleteOrder(id: string) {
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

function applyLocalStockDecrement(items: AdminOrder['items']) {
  const products = readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct)
  const next = products.map((product) => {
    const used = items.reduce((sum, item) => {
      const itemSlug = slugify(item.slug ?? item.name)
      if (slugify(product.name) === itemSlug || product.name.trim().toLowerCase() === item.name.trim().toLowerCase()) {
        return sum + Math.max(0, item.quantity)
      }
      return sum
    }, 0)

    if (!used) {
      return product
    }

    return { ...product, stock: Math.max(0, product.stock - used) }
  })
  writeStored(PRODUCTS_KEY, next)
}

export async function createOrder(order: Omit<AdminOrder, 'id' | 'createdAt'>, couponData?: { code: string; discountPercent: number; discountAmount: number; couponId?: string } | null) {
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
      }),
    })

    if (!response.ok) {
      throw new Error(await readApiError(response))
    }

    const payload = await response.json() as { order?: AdminOrder }
    if (!payload.order?.id) {
      throw new Error('Order service returned an incomplete response.')
    }

    writeStored(ORDERS_KEY, [payload.order, ...currentOrders])
    return payload.order
  } catch (error) {
    if (requiresLiveBackend()) {
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
  const storedHomepage = normalizeHomepageContent(readStored(HOMEPAGE_KEY, defaultHomepage))
  emit({
    content: storedHomepage,
    meta: {
      source: 'local-seed',
      path: 'settings/homepage',
      receivedAt: new Date().toISOString(),
    },
  })

  if (import.meta.env.DEV) {
    console.info('[homepage] subscribe:init', {
      hasFirebaseDb: Boolean(firebaseDb),
      localFirstMode: isLocalFirstDataMode(),
      heroImage: storedHomepage.heroImage ?? '',
    })
  }

  if (!firebaseDb || isLocalFirstDataMode()) {
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
      if (import.meta.env.DEV) {
        console.info('[homepage] subscribe:snapshot', {
          exists: snapshot.exists(),
          path: 'settings/homepage',
        })
      }

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

      emit({
        content: normalizeHomepageContent(snapshot.data() as Partial<HomepageContent>),
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
        code: details.code,
        message: details.message,
      })

      if (!shouldFallbackToLocal(error) && import.meta.env.DEV) {
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
  const normalized = normalizeHomepageContent(content)
  const heroImage = normalized.heroImage ?? ''
  const localFirstMode = isLocalFirstDataMode()

  if (import.meta.env.DEV) {
    console.info('[homepage] save:start', {
      hasFirebaseDb: Boolean(firebaseDb),
      localFirstMode,
      path: 'settings/homepage',
      heroImage,
      sections: normalized.sections.map((section) => ({ key: section.key, enabled: section.enabled, order: section.order })),
    })
  }

  if (!firebaseDb && !localFirstMode) {
    throw new Error('Firestore is not initialized. Homepage cannot be saved to live data.')
  }

  if (!firebaseDb || localFirstMode) {
    writeStored(HOMEPAGE_KEY, normalized)
    await recordAdminAudit('homepage.update', 'homepage', 'settings/homepage', {
      sections: normalized.sections.map((section) => ({ key: section.key, enabled: section.enabled, order: section.order })),
      mode: 'local',
    })

    if (import.meta.env.DEV) {
      console.info('[homepage] save:local-complete', {
        path: 'settings/homepage',
        heroImage,
      })
    }

    return {
      content: normalized,
      mode: 'local',
      path: 'settings/homepage',
      heroImage,
      verified: true,
      savedAt: new Date().toISOString(),
    }
  }

  try {
    const ref = doc(firebaseDb, 'settings', 'homepage')

    console.info('[homepage] save:before-setDoc', {
      path: 'settings/homepage',
      heroImage,
    })

    await setDoc(ref, normalized)

    console.info('[homepage] save:after-setDoc', {
      path: 'settings/homepage',
      heroImage,
    })

    const verificationSnapshot = await getDoc(ref)
    if (!verificationSnapshot.exists()) {
      throw new Error('Firestore write verification failed: settings/homepage does not exist after save.')
    }

    const savedContent = verificationSnapshot.data() as Partial<HomepageContent>
    const savedHeroImage = typeof savedContent.heroImage === 'string' ? savedContent.heroImage : ''
    if ((normalized.heroImage ?? '') !== savedHeroImage) {
      throw new Error('Firestore write verification failed: heroImage mismatch after save.')
    }

    console.info('[homepage] save:verified', {
      path: 'settings/homepage',
      heroImage: savedHeroImage,
    })

    writeStored(HOMEPAGE_KEY, normalized)
    await recordAdminAudit('homepage.update', 'homepage', 'settings/homepage', {
      sections: normalized.sections.map((section) => ({ key: section.key, enabled: section.enabled, order: section.order })),
      mode: 'live',
    })

    if (import.meta.env.DEV) {
      console.info('[homepage] save:complete', {
        path: 'settings/homepage',
        heroImage: savedHeroImage,
      })
    }

    return {
      content: normalized,
      mode: 'live',
      path: 'settings/homepage',
      heroImage: savedHeroImage,
      verified: true,
      savedAt: new Date().toISOString(),
    }
  } catch (error) {
    const details = describeFirebaseError(error)
    console.error('[homepage] save:error', {
      path: 'settings/homepage',
      code: details.code,
      message: details.message,
      heroImage,
    })

    throw new Error(`Homepage save failed (${details.code}): ${details.message}`, {
      cause: error,
    })
  }
}

export async function updateFounderProfile(profile: FounderProfile): Promise<{ mode: 'local' | 'live'; path: string }> {
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
  if (requiresLiveBackend() && !firebaseDb) {
    throw new Error('Coupon service unavailable: database not configured.')
  }

  const code = coupon.code || generateCouponCodeInternal()
  const discountPercent = coupon.discountPercent ?? computeCouponDiscountPercent()
  const maxUsage = coupon.maxUsage ?? computeCouponMaxUsage()
  const expiryDate = coupon.expiryDate || computeCouponExpiry()

  const newCoupon: Coupon = {
    id: `local-coupon-${Date.now()}`,
    code: code.toUpperCase().trim(),
    discountPercent,
    customerEmail: coupon.customerEmail.trim().toLowerCase(),
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

export async function getCouponByCode(code: string, customerEmail = ''): Promise<Coupon | null> {
  const trimmed = code.trim().toUpperCase()
  const trimmedEmail = customerEmail.trim().toLowerCase()

  if (!isValidCouponCode(trimmed)) {
    return null
  }

  if (!firebaseDb || isLocalFirstDataMode()) {
    const coupons = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
    const coupon = coupons.find((c) => c.code!.toUpperCase() === trimmed && c.status === 'active') || null
    if (!coupon) {
      return null
    }

    if (isCouponExpired(coupon.expiryDate) || coupon.usageCount >= coupon.maxUsage) {
      return null
    }

    const boundEmail = coupon.customerEmail.trim().toLowerCase()
    if (boundEmail && boundEmail !== trimmedEmail) {
      throw new Error(trimmedEmail ? 'This coupon is not valid for this email.' : 'Enter the email this coupon was issued to.')
    }

    return coupon
  }

  try {
    const response = await fetch('/api/validate-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'validate', code: trimmed, email: trimmedEmail || undefined }),
    })

    const payload = await response.json() as PublicCouponValidationResult
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to validate coupon. Please try again.')
    }

    if (!payload.valid || !payload.coupon) {
      return null
    }

    return {
      id: payload.coupon.id,
      code: payload.coupon.code,
      discountPercent: payload.coupon.discountPercent,
      customerEmail: '',
      createdDate: '',
      expiryDate: payload.coupon.expiryDate,
      status: payload.coupon.status,
      usageCount: payload.coupon.usageCount,
      maxUsage: payload.coupon.maxUsage,
    }
  } catch (error) {
    if (requiresLiveBackend()) {
      throw error instanceof Error ? error : new Error('Unable to validate coupon. Please try again.')
    }

    const coupons = readStored<Coupon[]>(COUPON_PREFIX + 'coupons', [])
    return coupons.find((c) => c.code!.toUpperCase() === trimmed && c.status === 'active') || null
  }
}

export async function updateCoupon(id: string, updates: Partial<Pick<Coupon, 'discountPercent' | 'expiryDate' | 'status' | 'maxUsage'>>): Promise<void> {
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
  const updated = current.map((coupon) =>
    coupon.id === couponId
      ? { ...coupon, status: 'used' as const, usageCount: 1, orderId, discountAmount, usedAt: new Date().toISOString() }
      : coupon,
  )
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
