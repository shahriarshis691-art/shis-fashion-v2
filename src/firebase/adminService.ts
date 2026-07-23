import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { deleteCloudinaryAssetByUrl, uploadMultipleAssets } from '../services/cloudinary'
import { homeCategoryItems } from '../data/homeCategories'
import { compactManagedImages } from '../utils/media'
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
  stock: number
  sizes: string[]
  colors: string[]
  description: string
  category: string
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
  items: Array<{ name: string; price: string; quantity: number }>
  total: number
  status: 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  trackingNumber?: string
  createdAt?: string | { seconds: number }
  archived?: boolean
  archivedAt?: string | { seconds: number }
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

export interface FeaturedCollectionPage {
  slug: string
  title: string
  subtitle: string
  description: string
  href: string
  images: string[]
  relatedCategorySlugs: string[]
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
const CATEGORIES_KEY = 'shis-admin-categories'
const DATA_MODE_KEY = 'shis-admin-data-mode'
const LEGACY_AUTH_KEY = 'shis-admin-auth'
const ACCESS_DENIED_KEY = 'shis-admin-access-denied'
const LAUNCH_MODE_USER_KEY = 'shis-launch-mode-user'
const AUDIT_LOGS_KEY = 'shis-admin-audit-logs'

type AdminAuditTarget = 'product' | 'order' | 'category' | 'homepage' | 'brand'

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

  let adminDocSnapshot: Awaited<ReturnType<typeof getDoc>> | null = null
  let adminsSettingsSnapshot: Awaited<ReturnType<typeof getDoc>> | null = null

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
    const adminDocData = adminDocSnapshot.data() as any
    const isActive = adminDocData.active !== false
    if (isActive && includesAdminRole(adminDocData.role, adminDocData.roles)) {
      return true
    }
  }

  if (adminsSettingsSnapshot.exists()) {
    const settingsData = adminsSettingsSnapshot.data() as any
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

const defaultProducts: AdminProduct[] = [
  {
    id: 'seed-atelier-oversized-tee',
    name: 'Atelier Oversized Tee',
    price: '৳ 9,800',
    stock: 12,
    sizes: ['S', 'M', 'L'],
    colors: ['Ivory', 'Black'],
    description: 'Relaxed fit with a premium ribbed finish.',
    category: 'oversized-tee',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1400&q=80',
    ],
    imageTitles: ['Front look', 'Detail look', 'Lifestyle look'],
    imageDescriptions: ['Primary product image for the atelier oversized tee.', 'A closer texture and trim view.', 'An editorial angle for styling inspiration.'],
    videos: [],
    featured: true,
    newArrival: true,
    hero: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'seed-signature-unisex-tee',
    name: 'Signature Unisex Tee',
    price: '৳ 10,500',
    stock: 18,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Stone'],
    description: 'Soft cotton jersey with a clean drape and elevated finish.',
    category: 'unisex-tee',
    images: [
      'https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1484516758160-69878111a911?auto=format&fit=crop&w=1400&q=80',
    ],
    imageTitles: ['Front look', 'Studio look', 'Close detail'],
    imageDescriptions: ['Primary product image for the signature unisex tee.', 'Full look styling shot.', 'Close-up view for finishing details.'],
    videos: [],
    featured: true,
    newArrival: false,
    hero: false,
    createdAt: '2026-01-02',
  },
  {
    id: 'seed-monarch-denim',
    name: 'Monarch Denim',
    price: '৳ 17,000',
    stock: 9,
    sizes: ['M', 'L', 'XL'],
    colors: ['Indigo'],
    description: 'Structured denim with a premium washed texture.',
    category: 'denim',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1400&q=80',
    ],
    imageTitles: ['Front look', 'Side look', 'Denim detail'],
    imageDescriptions: ['Primary product image for monarch denim.', 'A secondary side-angle shot.', 'A detail-first image for the wash and fit.'],
    videos: [],
    featured: true,
    newArrival: false,
    hero: false,
    createdAt: '2026-01-03',
  },
  {
    id: 'seed-studio-shirt',
    name: 'Studio Men Shirt',
    price: '৳ 15,000',
    stock: 14,
    sizes: ['M', 'L', 'XL'],
    colors: ['White', 'Navy'],
    description: 'Polished tailoring with soft structure and daily comfort.',
    category: 'mens-shirt',
    images: [
      'https://images.unsplash.com/photo-1603251578711-3290ca1a0187?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1400&q=80',
    ],
    imageTitles: ['Front look', 'Editorial look', 'Texture detail'],
    imageDescriptions: ['Primary product image for the studio men shirt.', 'An editorial product view.', 'Closer product detail on fabric and buttons.'],
    videos: [],
    featured: false,
    newArrival: true,
    hero: false,
    createdAt: '2026-01-04',
  },
  {
    id: 'seed-aurora-dress',
    name: 'Aurora Dress',
    price: '৳ 20,000',
    stock: 7,
    sizes: ['S', 'M', 'L'],
    colors: ['Ivory', 'Black'],
    description: 'Fluid silhouette designed for effortless evening transitions.',
    category: 'womens-dresses',
    images: [
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80',
    ],
    imageTitles: ['Front look', 'Movement look', 'Styling detail'],
    imageDescriptions: ['Primary product image for aurora dress.', 'A movement shot that highlights the silhouette.', 'A closer image showing the styling finish.'],
    videos: [],
    featured: true,
    newArrival: true,
    hero: false,
    createdAt: '2026-01-05',
  },
  {
    id: 'seed-desert-western',
    name: 'Desert Western Set',
    price: '৳ 18,500',
    stock: 11,
    sizes: ['M', 'L'],
    colors: ['Sand'],
    description: 'Modern western-inspired set with sharp, clean lines.',
    category: 'western-outfits',
    images: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1467632499275-7a693a761056?auto=format&fit=crop&w=1400&q=80',
    ],
    imageTitles: ['Front look', 'Lifestyle look', 'Detail look'],
    imageDescriptions: ['Primary product image for the desert western set.', 'A styled lifestyle product image.', 'A closer frame for shape and finishing.'],
    videos: [],
    featured: false,
    newArrival: false,
    hero: false,
    createdAt: '2026-01-06',
  },
  {
    id: 'seed-duo-couple',
    name: 'Duo Couple Set',
    price: '৳ 21,500',
    stock: 6,
    sizes: ['M', 'L', 'XL'],
    colors: ['Black', 'Cream'],
    description: 'Coordinated pair styling designed for premium comfort.',
    category: 'couples',
    images: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1400&q=80',
    ],
    imageTitles: ['Front look', 'Paired look', 'Detail look'],
    imageDescriptions: ['Primary product image for the duo couple set.', 'A coordinated full-look shot.', 'A closer image for styling details.'],
    videos: [],
    featured: false,
    newArrival: true,
    hero: false,
    createdAt: '2026-01-07',
  },
  {
    id: 'seed-mini-essentials',
    name: 'Mini Essentials',
    price: '৳ 10,500',
    stock: 20,
    sizes: ['XS', 'S', 'M'],
    colors: ['Sky', 'Stone'],
    description: 'Soft premium basics crafted for active little movers.',
    category: 'kids',
    images: [
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=1400&q=80',
    ],
    imageTitles: ['Front look', 'Play look', 'Detail look'],
    imageDescriptions: ['Primary product image for mini essentials.', 'An active styling image.', 'A closer view for fabric and finish.'],
    videos: [],
    featured: false,
    newArrival: false,
    hero: false,
    createdAt: '2026-01-08',
  },
]

const defaultOrders: AdminOrder[] = [
  {
    id: 'seed-order-1',
    customerName: 'Mina Lane',
    customerPhone: '+8801700000000',
    customerEmail: 'mina@example.com',
    address: '12 River Street, Dhaka, Dhaka',
    deliveryAddress: {
      division: 'Dhaka',
      district: 'Dhaka',
      streetAddress: '12 River Street',
      deliveryNote: '',
    },
    deliveryCharge: 80,
    notes: '',
    items: [{ name: 'Atelier Oversized Tee', price: '৳ 9,800', quantity: 1 }],
    total: 9800,
    status: 'new',
    trackingNumber: '',
    createdAt: '2026-01-02',
  },
]

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
  heroImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=80',
  heroImageTitle: 'Homepage hero image',
  heroImageDescription: 'Main hero visual used in the first fold of the homepage.',
  heroVideo: '',
  bannerImage: 'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1800&q=80',
  bannerImageTitle: 'Brand promise banner image',
  bannerImageDescription: 'Editorial banner used beside the brand promise content.',
  categories: [
    { title: 'Winter', caption: 'Winter.', href: '/collections/winter', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Summer', caption: 'Summer.', href: '/collections/summer', image: 'https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Everyday Wear', caption: 'Everyday wear.', href: '/collections/everyday-wear', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80' },
  ],
  featuredCollectionPages: [
    {
      slug: 'winter',
      title: 'Winter Collection',
      subtitle: 'Layer-ready staples',
      description: 'Cold-season essentials with premium texture and clean tailoring.',
      href: '/collections/winter',
      images: [
        'https://images.unsplash.com/photo-1516822003754-cca485356ecb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1200&q=80',
      ],
      relatedCategorySlugs: ['denim', 'mens-shirt', 'western-outfits'],
    },
    {
      slug: 'summer',
      title: 'Summer Collection',
      subtitle: 'Breathable premium edits',
      description: 'Lightweight silhouettes designed for warm days and evening plans.',
      href: '/collections/summer',
      images: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1503342452485-86ff0a5a2f6f?auto=format&fit=crop&w=1200&q=80',
      ],
      relatedCategorySlugs: ['unisex-tee', 'womens-dresses', 'oversized-tee'],
    },
    {
      slug: 'everyday-wear',
      title: 'Everyday Wear',
      subtitle: 'Daily go-to luxury',
      description: 'Reliable daily pieces balancing comfort, polish, and movement.',
      href: '/collections/everyday-wear',
      images: [
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
      ],
      relatedCategorySlugs: ['oversized-tee', 'couples', 'kids'],
    },
  ],
  shopByCategories: homeCategoryItems.map((item) => ({
    title: item.name,
    href: item.href,
    image: item.image,
  })),
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
  sections: [
    { key: 'hero', label: 'Hero', enabled: true, order: 0 },
    { key: 'featuredCollection', label: 'Featured collection', enabled: true, order: 1 },
    { key: 'newArrivals', label: 'New arrivals', enabled: true, order: 2 },
    { key: 'bestSellers', label: 'Best sellers', enabled: true, order: 3 },
    { key: 'brandPromise', label: 'Brand promise', enabled: true, order: 4 },
  ],
}

function normalizeProduct(product: AdminProduct): AdminProduct {
  const normalizedImages = compactManagedImages(product)

  return {
    ...product,
    images: normalizedImages.images,
    imageTitles: normalizedImages.imageTitles,
    imageDescriptions: normalizedImages.imageDescriptions,
  }
}

function normalizeHomepageContent(content: Partial<HomepageContent> | undefined): HomepageContent {
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
    sections: (content?.sections && content.sections.length ? content.sections : defaultHomepage.sections).map((section, index) => ({
      ...defaultHomepage.sections[index],
      ...section,
    })).sort((left, right) => left.order - right.order),
  }
}

const defaultCategories: AdminCategory[] = [
  { id: 'cat-oversized-tee', name: 'Oversized Tee', slug: 'oversized-tee', createdAt: '2026-01-01' },
  { id: 'cat-unisex-tee', name: 'Unisex Tee', slug: 'unisex-tee', createdAt: '2026-01-01' },
  { id: 'cat-denim', name: 'Denim', slug: 'denim', createdAt: '2026-01-01' },
]

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

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

  if (!window.localStorage.getItem(CATEGORIES_KEY)) {
    writeStored(CATEGORIES_KEY, defaultCategories)
  }

  const storedProducts = readStored<AdminProduct[]>(PRODUCTS_KEY, defaultProducts)
  const normalizedStoredProducts = storedProducts.map(normalizeProduct)
  const isLegacySingleSeed =
    normalizedStoredProducts.length === 1 &&
    normalizedStoredProducts[0]?.id === 'seed-atelier-oversized-tee' &&
    (normalizedStoredProducts[0].images?.length ?? 0) <= 1

  if (isLegacySingleSeed) {
    writeStored(PRODUCTS_KEY, defaultProducts)
  } else if (JSON.stringify(storedProducts) !== JSON.stringify(normalizedStoredProducts)) {
    writeStored(PRODUCTS_KEY, normalizedStoredProducts)
  }

  const storedHomepage = readStored<HomepageContent>(HOMEPAGE_KEY, defaultHomepage)
  const needsCategoryImageBackfill = (storedHomepage.categories ?? []).some((category, index) => !category.image && defaultHomepage.categories[index]?.image)
  const needsShopByBackfill =
    !storedHomepage.shopByCategories?.length ||
    storedHomepage.shopByCategories.some((category, index) => {
      const fallback = defaultHomepage.shopByCategories[index]
      if (!fallback) {
        return false
      }

      return !category.title || !category.href || !category.image
    })

  if (needsCategoryImageBackfill || needsShopByBackfill) {
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

export function subscribeToProducts(callback: (products: AdminProduct[]) => void) {
  ensureSeedData()
  const localProducts = () => readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct).filter((product) => !product.archived)
  callback(localProducts())

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(PRODUCTS_KEY, defaultProducts, (products) => callback(products.map(normalizeProduct).filter((product) => !product.archived)))
  }

  const productsRef = query(collection(firebaseDb, 'products'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    productsRef,
    (snapshot) => {
      const products = snapshot.docs.map((doc) => normalizeProduct({ id: doc.id, ...(doc.data() as Omit<AdminProduct, 'id'>) }))
      const visibleProducts = products.filter((product) => !product.archived)
      callback(visibleProducts.length ? visibleProducts : localProducts())
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(localProducts())
      }
    },
  )
}

export function subscribeToArchivedProducts(callback: (products: AdminProduct[]) => void) {
  ensureSeedData()
  callback(readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct).filter((product) => product.archived))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(PRODUCTS_KEY, defaultProducts, (products) => callback(products.map(normalizeProduct).filter((product) => product.archived)))
  }

  const productsRef = query(collection(firebaseDb, 'products'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    productsRef,
    (snapshot) => {
      const products = snapshot.docs.map((entry) => normalizeProduct({ id: entry.id, ...(entry.data() as Omit<AdminProduct, 'id'>) }))
      callback(products.filter((product) => product.archived))
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(readStored(PRODUCTS_KEY, defaultProducts).map(normalizeProduct).filter((product) => product.archived))
      }
    },
  )
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
const defaultBrands: AdminBrand[] = []

export function subscribeToAdminBrands(callback: (brands: AdminBrand[]) => void) {
  const localBrands = () => readStored(BRANDS_KEY, defaultBrands).filter((brand) => !brand.archived)
  callback(localBrands())

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(BRANDS_KEY, defaultBrands, (brands) => callback(brands.filter((brand) => !brand.archived)))
  }

  const brandsRef = query(collection(firebaseDb, 'brands'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    brandsRef,
    (snapshot) => {
      const brands = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminBrand, 'id'>) }))
      const visibleBrands = brands.filter((brand) => !brand.archived)
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
  const archivedLocalBrands = () => readStored(BRANDS_KEY, defaultBrands).filter((brand) => brand.archived)
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
  const currentBrands = readStored(BRANDS_KEY, defaultBrands)
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
  const currentBrands = readStored(BRANDS_KEY, defaultBrands)
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
  const currentBrands = readStored(BRANDS_KEY, defaultBrands)
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
  const currentBrands = readStored(BRANDS_KEY, defaultBrands)
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

export async function createOrder(order: Omit<AdminOrder, 'id' | 'createdAt'>) {
  if (requiresLiveBackend() && !firebaseDb) {
    throw new Error('Live order backend is not configured. Add Firebase production credentials before accepting orders.')
  }

  const currentOrders = readStored(ORDERS_KEY, defaultOrders)
  const optimisticOrder = {
    ...order,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as AdminOrder
  writeStored(ORDERS_KEY, [optimisticOrder, ...currentOrders])

  if (!firebaseDb || isLocalFirstDataMode()) {
    if (requiresLiveBackend()) {
      writeStored(ORDERS_KEY, currentOrders)
      throw new Error('Live order backend is unavailable. Order was not submitted.')
    }

    return optimisticOrder
  }

  try {
    const payload = {
      ...order,
      createdAt: serverTimestamp(),
    }

    const ref = await addDoc(collection(firebaseDb, 'orders'), payload)
    const syncedOrder: AdminOrder = { ...optimisticOrder, id: ref.id }
    const syncedOrders = readStored(ORDERS_KEY, defaultOrders).map((entry) => (entry.id === optimisticOrder.id ? syncedOrder : entry))
    writeStored(ORDERS_KEY, syncedOrders)
    return syncedOrder
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      writeStored(ORDERS_KEY, currentOrders)
      throw error
    }

    if (requiresLiveBackend()) {
      writeStored(ORDERS_KEY, currentOrders)
      throw new Error('Live order backend is unavailable. Order was not submitted.', {
        cause: error,
      })
    }

    return optimisticOrder
  }
}

export function subscribeToHomepageContent(callback: (content: HomepageContent, meta?: HomepageContentSnapshotMeta) => void) {
  ensureSeedData()
  const storedHomepage = normalizeHomepageContent(readStored(HOMEPAGE_KEY, defaultHomepage))
  callback(storedHomepage, {
    source: 'local-seed',
    path: 'settings/homepage',
    receivedAt: new Date().toISOString(),
  })

  if (import.meta.env.DEV) {
    console.info('[homepage] subscribe:init', {
      hasFirebaseDb: Boolean(firebaseDb),
      localFirstMode: isLocalFirstDataMode(),
      heroImage: storedHomepage.heroImage ?? '',
    })
  }

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(HOMEPAGE_KEY, defaultHomepage, (content) => callback(normalizeHomepageContent(content), {
      source: 'local-storage-sync',
      path: 'settings/homepage',
      receivedAt: new Date().toISOString(),
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
        callback(defaultHomepage, {
          source: 'firestore-missing-doc',
          path: 'settings/homepage',
          receivedAt: new Date().toISOString(),
        })
        return
      }
      callback(normalizeHomepageContent(snapshot.data() as Partial<HomepageContent>), {
        source: 'firestore',
        path: 'settings/homepage',
        receivedAt: new Date().toISOString(),
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
