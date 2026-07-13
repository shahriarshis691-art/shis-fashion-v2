import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'

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
  customerEmail: string
  address: string
  items: Array<{ name: string; price: string; quantity: number }>
  total: number
  status: 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  trackingNumber?: string
  createdAt?: string | { seconds: number }
}

export interface HomepageContent {
  heroTitle: string
  heroSubtitle: string
  heroCta: string
  categories: Array<{ title: string; caption: string }>
  newArrivalsTitle: string
  newArrivalsSubtitle: string
  featuredTitle: string
  featuredSubtitle: string
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)

let firebaseAuth: ReturnType<typeof getAuth> | null = null
let firebaseDb: Firestore | null = null
let firebaseStorage: ReturnType<typeof getStorage> | null = null

if (hasFirebaseConfig) {
  const firebaseApp: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  firebaseAuth = getAuth(firebaseApp)
  firebaseDb = getFirestore(firebaseApp)
  firebaseStorage = getStorage(firebaseApp)
}

export function isFirebaseConfigured() {
  return Boolean(firebaseAuth && firebaseDb && firebaseStorage)
}

const PRODUCTS_KEY = 'shis-admin-products'
const ORDERS_KEY = 'shis-admin-orders'
const HOMEPAGE_KEY = 'shis-admin-homepage'
const AUTH_KEY = 'shis-admin-auth'

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

const defaultProducts: AdminProduct[] = [
  {
    id: 'seed-atelier-oversized-tee',
    name: 'Atelier Oversized Tee',
    price: '$98',
    stock: 12,
    sizes: ['S', 'M', 'L'],
    colors: ['Ivory', 'Black'],
    description: 'Relaxed fit with a premium ribbed finish.',
    category: 'oversized-tee',
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'],
    videos: [],
    featured: true,
    newArrival: true,
    hero: false,
    createdAt: '2026-01-01',
  },
]

const defaultOrders: AdminOrder[] = [
  {
    id: 'seed-order-1',
    customerName: 'Mina Lane',
    customerEmail: 'mina@example.com',
    address: '12 River Street',
    items: [{ name: 'Atelier Oversized Tee', price: '$98', quantity: 1 }],
    total: 98,
    status: 'new',
    trackingNumber: '',
    createdAt: '2026-01-02',
  },
]

const defaultHomepage: HomepageContent = {
  heroTitle: 'Style Meets Comfort.',
  heroSubtitle: 'Discover elevated staples designed for modern living, with premium materials and effortless lines.',
  heroCta: 'Shop collection',
  categories: [
    { title: 'Tailored Layers', caption: 'Soft authority' },
    { title: 'Everyday Luxe', caption: 'Refined comfort' },
    { title: 'Evening Edit', caption: 'Quiet glamour' },
  ],
  newArrivalsTitle: 'Freshly composed for the season',
  newArrivalsSubtitle: 'Newly released pieces with an effortless, sculpted feel.',
  featuredTitle: 'The pieces clients return for',
  featuredSubtitle: 'Soft structure, refined texture, and everyday ease in every silhouette.',
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
}

export function onAdminAuthChanged(callback: (user: { uid: string; email: string | null } | null) => void) {
  ensureSeedData()

  if (!firebaseAuth) {
    const current = window.localStorage.getItem(AUTH_KEY)
    callback(current ? { uid: 'local-admin', email: current } : null)
    return () => undefined
  }

  return onAuthStateChanged(firebaseAuth, (user) => {
    if (!user) {
      callback(null)
      return
    }

    callback({ uid: user.uid, email: user.email })
  })
}

export async function signInAdmin(email: string, password: string) {
  if (!firebaseAuth) {
    window.localStorage.setItem(AUTH_KEY, email)
    return { uid: 'local-admin', email }
  }

  const result = await signInWithEmailAndPassword(firebaseAuth, email, password)
  return { uid: result.user.uid, email: result.user.email }
}

export async function signOutAdmin() {
  if (!firebaseAuth) {
    window.localStorage.removeItem(AUTH_KEY)
    return
  }

  await signOut(firebaseAuth)
}

export function subscribeToProducts(callback: (products: AdminProduct[]) => void) {
  ensureSeedData()

  if (!firebaseDb) {
    callback(readStored(PRODUCTS_KEY, defaultProducts))
    return () => undefined
  }

  const productsRef = query(collection(firebaseDb, 'products'), orderBy('createdAt', 'desc'))
  return onSnapshot(productsRef, (snapshot) => {
    const products = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminProduct, 'id'>) }))
    callback(products)
  })
}

export async function createProduct(product: Omit<AdminProduct, 'id' | 'createdAt'>) {
  if (!firebaseDb) {
    const currentProducts = readStored(PRODUCTS_KEY, defaultProducts)
    const nextProduct = {
      ...product,
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
    } as AdminProduct
    writeStored(PRODUCTS_KEY, [nextProduct, ...currentProducts])
    return nextProduct
  }

  const payload = {
    ...product,
    createdAt: serverTimestamp(),
  }

  const ref = await addDoc(collection(firebaseDb, 'products'), payload)
  return { id: ref.id, ...product }
}

export async function updateProduct(id: string, product: Partial<AdminProduct>) {
  if (!firebaseDb) {
    const currentProducts = readStored(PRODUCTS_KEY, defaultProducts)
    const updatedProducts = currentProducts.map((item) => (item.id === id ? { ...item, ...product } : item))
    writeStored(PRODUCTS_KEY, updatedProducts)
    return updatedProducts.find((item) => item.id === id)
  }

  const ref = doc(firebaseDb, 'products', id)
  await updateDoc(ref, product)
  return { id, ...product }
}

export async function deleteProduct(id: string) {
  if (!firebaseDb) {
    const currentProducts = readStored(PRODUCTS_KEY, defaultProducts)
    writeStored(PRODUCTS_KEY, currentProducts.filter((item) => item.id !== id))
    return
  }

  await deleteDoc(doc(firebaseDb, 'products', id))
}

export function subscribeToOrders(callback: (orders: AdminOrder[]) => void) {
  ensureSeedData()

  if (!firebaseDb) {
    callback(readStored(ORDERS_KEY, defaultOrders))
    return () => undefined
  }

  const ordersRef = query(collection(firebaseDb, 'orders'), orderBy('createdAt', 'desc'))
  return onSnapshot(ordersRef, (snapshot) => {
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<AdminOrder, 'id'>) }))
    callback(orders)
  })
}

export async function updateOrderStatus(id: string, status: AdminOrder['status'], trackingNumber?: string) {
  if (!firebaseDb) {
    const currentOrders = readStored(ORDERS_KEY, defaultOrders)
    const updatedOrders = currentOrders.map((order) => (order.id === id ? { ...order, status, trackingNumber: trackingNumber ?? order.trackingNumber } : order))
    writeStored(ORDERS_KEY, updatedOrders)
    return updatedOrders.find((order) => order.id === id)
  }

  const ref = doc(firebaseDb, 'orders', id)
  await updateDoc(ref, { status, trackingNumber: trackingNumber ?? '' })
  return { id, status }
}

export function subscribeToHomepageContent(callback: (content: HomepageContent) => void) {
  ensureSeedData()

  if (!firebaseDb) {
    callback(readStored(HOMEPAGE_KEY, defaultHomepage))
    return () => undefined
  }

  const homeRef = doc(firebaseDb, 'settings', 'homepage')
  return onSnapshot(homeRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(defaultHomepage)
      return
    }
    callback(snapshot.data() as HomepageContent)
  })
}

export async function updateHomepageContent(content: HomepageContent) {
  if (!firebaseDb) {
    writeStored(HOMEPAGE_KEY, content)
    return content
  }

  const ref = doc(firebaseDb, 'settings', 'homepage')
  await setDoc(ref, content)
  return content
}

export async function uploadAssets(files: File[], folder: string) {
  if (!firebaseStorage) {
    const readers = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        }),
    )

    return Promise.all(readers)
  }

  const urls: string[] = []
  for (const file of files) {
    const storageRef = ref(firebaseStorage, `${folder}/${Date.now()}-${file.name}`)
    const result = await uploadBytes(storageRef, file)
    urls.push(await getDownloadURL(result.ref))
  }

  return urls
}
