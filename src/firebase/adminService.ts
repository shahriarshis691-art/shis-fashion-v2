import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { uploadMultipleAssets } from '../services/cloudinary'
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
  videos: string[]
  featured: boolean
  newArrival: boolean
  hero: boolean
  createdAt?: string | { seconds: number }
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
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  createdAt?: string | { seconds: number }
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
  heroVideo?: string
  bannerImage?: string
  categories: Array<{ title: string; caption: string; image?: string }>
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

export function isFirebaseConfigured() {
  return Boolean(firebaseAuth && firebaseDb)
}

const PRODUCTS_KEY = 'shis-admin-products'
const ORDERS_KEY = 'shis-admin-orders'
const HOMEPAGE_KEY = 'shis-admin-homepage'
const CATEGORIES_KEY = 'shis-admin-categories'
const DATA_MODE_KEY = 'shis-admin-data-mode'
const LEGACY_AUTH_KEY = 'shis-admin-auth'
const ACCESS_DENIED_KEY = 'shis-admin-access-denied'

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

  return window.localStorage.getItem(DATA_MODE_KEY) === 'local-first'
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

  if (configuredAdminEmails.size > 0) {
    return normalizedEmail ? configuredAdminEmails.has(normalizedEmail) : false
  }

  const tokenResult = await user.getIdTokenResult()
  const claims = tokenResult.claims as Record<string, unknown>
  if (claims.admin === true || includesAdminRole(claims.role, claims.roles)) {
    return true
  }

  if (!firebaseDb) {
    return false
  }

  const [adminDocSnapshot, adminsSettingsSnapshot] = await Promise.all([
    getDoc(doc(firebaseDb, 'admins', user.uid)),
    getDoc(doc(firebaseDb, 'settings', 'admins')),
  ])

  if (adminDocSnapshot.exists()) {
    const adminDocData = adminDocSnapshot.data()
    const isActive = adminDocData.active !== false
    if (isActive && includesAdminRole(adminDocData.role, adminDocData.roles)) {
      return true
    }
  }

  if (adminsSettingsSnapshot.exists()) {
    const settingsData = adminsSettingsSnapshot.data()
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

  return [
    'permission-denied',
    'missing or insufficient permissions',
    'unavailable',
    'network-request-failed',
    'deadline-exceeded',
    'failed-precondition',
    'could not reach cloud firestore backend',
    'operation could not be completed',
  ].some((needle) => message.includes(needle) || code.includes(needle))
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
  heroVideo: '',
  bannerImage: 'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1800&q=80',
  categories: [
    { title: 'Tailored Layers', caption: 'Soft authority', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Everyday Luxe', caption: 'Refined comfort', image: 'https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=1200&q=80' },
    { title: 'Evening Edit', caption: 'Quiet glamour', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80' },
  ],
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
  footerContactEmail: 'hello@shisfashion.com',
  footerContactPhone: '+234 800 000 0000',
  footerContactAddress: 'Abuja, Nigeria',
  footerBottomText: 'Crafted for premium, calm, and timeless browsing.',
  sections: [
    { key: 'hero', label: 'Hero', enabled: true, order: 0 },
    { key: 'featuredCollection', label: 'Featured collection', enabled: true, order: 1 },
    { key: 'newArrivals', label: 'New arrivals', enabled: true, order: 2 },
    { key: 'bestSellers', label: 'Best sellers', enabled: true, order: 3 },
    { key: 'brandPromise', label: 'Brand promise', enabled: true, order: 4 },
  ],
}

function normalizeHomepageContent(content: Partial<HomepageContent> | undefined): HomepageContent {
  const mergedCategories = (content?.categories && content.categories.length ? content.categories : defaultHomepage.categories).map((category, index) => ({
    ...defaultHomepage.categories[index],
    ...category,
    image: category.image || defaultHomepage.categories[index]?.image,
  }))

  return {
    ...defaultHomepage,
    ...(content ?? {}),
    heroEyebrow: content?.heroEyebrow ?? defaultHomepage.heroEyebrow,
    heroPrimaryLink: content?.heroPrimaryLink ?? defaultHomepage.heroPrimaryLink,
    heroSecondaryLink: content?.heroSecondaryLink ?? defaultHomepage.heroSecondaryLink,
    categories: mergedCategories,
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
  const isLegacySingleSeed =
    storedProducts.length === 1 &&
    storedProducts[0]?.id === 'seed-atelier-oversized-tee' &&
    (storedProducts[0].images?.length ?? 0) <= 1

  if (isLegacySingleSeed) {
    writeStored(PRODUCTS_KEY, defaultProducts)
  }

  const storedHomepage = readStored<HomepageContent>(HOMEPAGE_KEY, defaultHomepage)
  const needsCategoryImageBackfill = (storedHomepage.categories ?? []).some((category, index) => !category.image && defaultHomepage.categories[index]?.image)
  if (needsCategoryImageBackfill) {
    writeStored(HOMEPAGE_KEY, normalizeHomepageContent(storedHomepage))
  }
}

export function onAdminAuthChanged(callback: (user: { uid: string; email: string | null } | null) => void) {
  ensureSeedData()
  clearLegacyAdminBypassState()

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

  if (!firebaseAuth) {
    const error = new Error('Firebase authentication is not configured for this environment.')
    ;(error as Error & { code?: string }).code = 'auth/firebase-not-configured'
    throw error
  }

  const result = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password)
  const hasAdminAccess = await isAdminUser(result.user)

  if (!hasAdminAccess) {
    markAccessDenied()
    await signOut(firebaseAuth)
    const error = new Error('Access Denied')
    ;(error as Error & { code?: string }).code = 'auth/forbidden-admin'
    throw error
  }

  return { uid: result.user.uid, email: result.user.email }
}

export async function signOutAdmin() {
  clearLegacyAdminBypassState()

  if (!firebaseAuth) {
    return
  }

  await signOut(firebaseAuth)
}

export function subscribeToProducts(callback: (products: AdminProduct[]) => void) {
  ensureSeedData()
  callback(readStored(PRODUCTS_KEY, defaultProducts))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(PRODUCTS_KEY, defaultProducts, callback)
  }

  const productsRef = query(collection(firebaseDb, 'products'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    productsRef,
    (snapshot) => {
      const products = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminProduct, 'id'>) }))
      callback(products)
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(readStored(PRODUCTS_KEY, defaultProducts))
      }
    },
  )
}

export async function createProduct(product: Omit<AdminProduct, 'id' | 'createdAt'>) {
  const currentProducts = readStored(PRODUCTS_KEY, defaultProducts)
  const nextProduct = {
    ...product,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as AdminProduct
  writeStored(PRODUCTS_KEY, [nextProduct, ...currentProducts])

  if (!firebaseDb || isLocalFirstDataMode()) {
    return nextProduct
  }

  try {
    const payload = {
      ...product,
      createdAt: serverTimestamp(),
    }

    const ref = await addDoc(collection(firebaseDb, 'products'), payload)
    return { id: ref.id, ...product }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    return nextProduct
  }
}

export async function updateProduct(id: string, product: Partial<AdminProduct>) {
  const currentProducts = readStored(PRODUCTS_KEY, defaultProducts)
  const updatedProducts = currentProducts.map((item) => (item.id === id ? { ...item, ...product } : item))
  writeStored(PRODUCTS_KEY, updatedProducts)

  if (!firebaseDb || isLocalFirstDataMode()) {
    return updatedProducts.find((item) => item.id === id)
  }

  try {
    const ref = doc(firebaseDb, 'products', id)
    await updateDoc(ref, product)
    return { id, ...product }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    return updatedProducts.find((item) => item.id === id)
  }
}

export async function deleteProduct(id: string) {
  const currentProducts = readStored(PRODUCTS_KEY, defaultProducts)
  writeStored(PRODUCTS_KEY, currentProducts.filter((item) => item.id !== id))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return
  }

  try {
    await deleteDoc(doc(firebaseDb, 'products', id))
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    return
  }
}

export function subscribeToOrders(callback: (orders: AdminOrder[]) => void) {
  ensureSeedData()
  callback(readStored(ORDERS_KEY, defaultOrders))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(ORDERS_KEY, defaultOrders, callback)
  }

  const ordersRef = query(collection(firebaseDb, 'orders'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    ordersRef,
    (snapshot) => {
      const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminOrder, 'id'>) }))
      callback(orders)
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(readStored(ORDERS_KEY, defaultOrders))
      }
    },
  )
}

export async function updateOrderStatus(id: string, status: AdminOrder['status'], trackingNumber?: string) {
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
    return updatedOrders.find((order) => order.id === id)
  }

  try {
    const ref = doc(firebaseDb, 'orders', id)
    await updateDoc(ref, updates)
    return { id, ...updates }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    return updatedOrders.find((order) => order.id === id)
  }
}

export async function deleteOrder(id: string) {
  const currentOrders = readStored(ORDERS_KEY, defaultOrders)
  writeStored(ORDERS_KEY, currentOrders.filter((order) => order.id !== id))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return
  }

  try {
    await deleteDoc(doc(firebaseDb, 'orders', id))
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    return
  }
}

export async function createOrder(order: Omit<AdminOrder, 'id' | 'createdAt'>) {
  const currentOrders = readStored(ORDERS_KEY, defaultOrders)
  const optimisticOrder = {
    ...order,
    id: `local-${Date.now()}`,
    createdAt: new Date().toISOString(),
  } as AdminOrder
  writeStored(ORDERS_KEY, [optimisticOrder, ...currentOrders])

  if (!firebaseDb || isLocalFirstDataMode()) {
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
      throw error
    }

    return optimisticOrder
  }
}

export function subscribeToHomepageContent(callback: (content: HomepageContent) => void) {
  ensureSeedData()
  callback(normalizeHomepageContent(readStored(HOMEPAGE_KEY, defaultHomepage)))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(HOMEPAGE_KEY, defaultHomepage, (content) => callback(normalizeHomepageContent(content)))
  }

  const homeRef = doc(firebaseDb, 'settings', 'homepage')
  return onSnapshot(
    homeRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(defaultHomepage)
        return
      }
      callback(normalizeHomepageContent(snapshot.data() as Partial<HomepageContent>))
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(normalizeHomepageContent(readStored(HOMEPAGE_KEY, defaultHomepage)))
      }
    },
  )
}

export function subscribeToCategories(callback: (categories: AdminCategory[]) => void) {
  ensureSeedData()
  callback(readStored(CATEGORIES_KEY, defaultCategories))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return subscribeToStored(CATEGORIES_KEY, defaultCategories, callback)
  }

  const categoriesRef = query(collection(firebaseDb, 'categories'), orderBy('createdAt', 'asc'))
  return onSnapshot(
    categoriesRef,
    (snapshot) => {
      const categories = snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AdminCategory, 'id'>) }))
      callback(categories)
    },
    (error) => {
      if (shouldFallbackToLocal(error)) {
        callback(readStored(CATEGORIES_KEY, defaultCategories))
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
    return nextCategory
  }

  try {
    const payload = {
      name: normalizedName,
      slug,
      createdAt: serverTimestamp(),
    }
    const ref = await addDoc(collection(firebaseDb, 'categories'), payload)
    return { id: ref.id, ...payload }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }


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
    return updated.find((item) => item.id === id)
  }

  try {
    const ref = doc(firebaseDb, 'categories', id)
    await updateDoc(ref, { name: normalizedName, slug })
    return { id, name: normalizedName, slug }
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }


    return updated.find((item) => item.id === id)
  }
}

export async function deleteCategory(id: string) {
  const current = readStored(CATEGORIES_KEY, defaultCategories)
  writeStored(CATEGORIES_KEY, current.filter((item) => item.id !== id))

  if (!firebaseDb || isLocalFirstDataMode()) {
    return
  }

  try {
    await deleteDoc(doc(firebaseDb, 'categories', id))
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    return
  }
}

export async function updateHomepageContent(content: HomepageContent) {
  const normalized = normalizeHomepageContent(content)
  writeStored(HOMEPAGE_KEY, normalized)

  if (!firebaseDb || isLocalFirstDataMode()) {
    return normalized
  }

  try {
    const ref = doc(firebaseDb, 'settings', 'homepage')
    await setDoc(ref, normalized)
    return normalized
  } catch (error) {
    if (!shouldFallbackToLocal(error)) {
      throw error
    }

    return normalized
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

  return uploadMultipleAssets(files, {
    folder,
    onProgress: options.onProgress,
    retries: options.retries,
  })
}

export async function deleteAsset(url: string) {
  if (typeof window === 'undefined') {
    return
  }

  const parsed = (() => {
    try {
      return new URL(url)
    } catch {
      return null
    }
  })()

  if (!parsed || !parsed.hostname.includes('res.cloudinary.com')) {
    return
  }

  // Unsigned browser uploads cannot securely delete Cloudinary assets.
  // We remove URLs from Firestore/local state immediately and treat remote delete as a no-op.
}
