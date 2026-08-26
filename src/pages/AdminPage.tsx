import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import Loading from '../components/ui/Loading'
import SectionTitle from '../components/ui/SectionTitle'
import BrandManagement from '../components/admin/BrandManagement'
import ProductCsvPanel from '../components/admin/ProductCsvPanel'
import { compactManagedImages, getManagedImageEntries, isPersistableMediaUrl } from '../utils/media'
import { formatBDT } from '../utils/currency'
import { getAdminCustomerNotifyHref } from '../utils/orderComms'
import { buildOpsReport, defaultOpsReportRange, LOW_STOCK_THRESHOLD, shiftDayKey, toDayKey } from '../utils/opsReports'
import {
  formatCouponDiscountLabel,
  generateCouponCode,
  type CouponAudience,
  type CouponDiscountType,
} from '../utils/coupon'
import {
  ORDER_LIFECYCLE,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUSES,
  isBillableOrderStatus,
  notifyChannelForStatus,
  orderMatchesStatusFilter,
} from '../utils/orderStatus'
import {
  consumeAdminAccessDeniedFlag,
  confirmOrderPayment,
  createCategory,
  createCoupon,
  createProduct,
  deleteCategory,
  deleteCoupon,
  deleteOrder,
  deleteAsset,
  deleteProduct,
  describeAdminSignInError,
  describeAdminWriteError,
  getCouponStats,
  getCoupons,
  getNewsletterSubscribers,
  isFirebaseConfigured,
  isHomepageLocalFirstMode,
  isLaunchModeEnabled,
  restoreCategory,
  restoreOrder,
  restoreProduct,
  signInAdmin,
  signOutAdmin,
  subscribeToAdminBrands,
  subscribeToArchivedBrands,
  subscribeToArchivedCategories,
  subscribeToArchivedOrders,
  subscribeToArchivedProducts,
  subscribeToFounderProfile,
  subscribeToHomepageContent,
  subscribeToCategories,
  subscribeToOrders,
  subscribeToProducts,
  updateCategory,
  updateCoupon,
  updateFounderProfile,
  updateHomepageContent,
  updateOrderDetails,
  updateOrderStatus,
  updateProduct,
  uploadAssets,
  subscribeToAdminReviews,
  subscribeToAdminAccounts,
  updateReviewStatus,
  updateAdminAccountRole,
  requestOrderStatusNotify,
  type AdminAccount,
  type AdminBrand,
  type AdminOrder,
  type AdminProduct,
  type AdminCategory,
  type Coupon,
  type FounderProfile,
  type HomepageContent,
  type HomepageCategorySection,
  type HomepageCategorySectionKey,
  type HomepageContentSnapshotMeta,
  type HomepageSaveResult,
  type HomepageSectionConfig,
  type NewsletterSubscriber,
  type ProductReview,
  type AdminSessionUser,
  onAdminAuthChanged,
} from '../firebase/adminService'
import {
  getAllTaxonomyCategoryOptions,
  resolveCanonicalSubcategorySlug,
} from '../data/categoryTaxonomy'
import { normalizeSizes } from '../utils/sizes'
import { downloadCsv } from '../utils/adminCsv'
import { ADMIN_ACCESS_ROLE_OPTIONS, canAccessAdminSection, type AdminAccessRole } from '../utils/adminAccess'
import { rebuildVariantMatrix, variantsForSave, type ProductVariantStock } from '../utils/variantStock'

const emptyProductForm = {
  name: '',
  price: '৳ 0',
  comparePrice: '',
  stock: 1,
  sizes: ['M'],
  colors: ['Ivory'],
  description: '',
  category: 'oversized-tee',
  images: ['', '', ''] as string[],
  imageTitles: ['', '', ''] as string[],
  imageDescriptions: ['', '', ''] as string[],
  videos: [] as string[],
  featured: false,
  newArrival: false,
  hero: false,
  variants: [] as ProductVariantStock[],
}

const DEFAULT_ADMIN_LOGIN_EMAIL = 'admin@shisfashion.com'
const MAX_PRODUCT_IMAGES = 6

function galleryLabel(index: number) {
  if (index === 0) {
    return 'Main image'
  }
  if (index === 1) {
    return 'Detail image'
  }
  if (index === 2) {
    return 'Close-up image'
  }
  return `Image ${index + 1}`
}

type OrderPaymentFilter = 'all' | 'pending_verification' | 'paid' | 'unpaid'

const PAYMENT_STATUS_LABELS: Record<NonNullable<AdminOrder['paymentStatus']>, string> = {
  unpaid: 'Unpaid (COD)',
  pending: 'Payment pending',
  pending_verification: 'Verify payment',
  paid: 'Paid',
  failed: 'Payment failed',
}

function paymentStatusBadgeClass(status?: AdminOrder['paymentStatus']) {
  switch (status) {
    case 'pending_verification':
      return 'border-amber-500/50 bg-amber-500/10 text-amber-950'
    case 'paid':
      return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-950'
    case 'failed':
      return 'border-red-500/50 bg-red-500/10 text-red-950'
    case 'pending':
      return 'border-sky-500/50 bg-sky-500/10 text-sky-950'
    default:
      return 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
  }
}

function getOrderWhatsAppHref(
  order: AdminOrder,
  edits?: Partial<Pick<AdminOrder, 'customerName' | 'customerPhone' | 'trackingNumber'>>,
) {
  return getAdminCustomerNotifyHref({
    phone: edits?.customerPhone ?? order.customerPhone,
    customerName: edits?.customerName ?? order.customerName,
    orderId: order.id,
    status: order.status,
    trackingNumber: edits?.trackingNumber ?? order.trackingNumber,
  })
}

function isInternalAppHref(href: string) {
  const value = href.trim()
  if (!value.startsWith('/') || value.startsWith('//') || /:\/\//.test(value)) {
    return false
  }

  return /^\/[A-Za-z0-9/_?=&%.,-]*$/.test(value)
}

const SECTION_ROUTE_VALIDATORS: Record<HomepageCategorySectionKey, (href: string) => boolean> = {
  women: isInternalAppHref,
  saree: isInternalAppHref,
  men: isInternalAppHref,
  denim: isInternalAppHref,
  kids: isInternalAppHref,
  western: isInternalAppHref,
  sale: isInternalAppHref,
  'new-arrivals': isInternalAppHref,
}

const SECTION_ROUTE_HINTS: Record<HomepageCategorySectionKey, string> = {
  women: 'Allowed: /women or /women?sub=womens-baggy',
  saree: 'Allowed: /sarees or /women?sub=saree',
  men: 'Allowed: /men or /men?sub=shirts',
  denim: 'Allowed: /men?sub=denim',
  kids: 'Allowed: /kids or /kids?sub=kids',
  western: 'Allowed: /collections/womens-baggy or /women?sub=womens-baggy',
  sale: 'Allowed: /men/half-shirts or /men?sub=half-shirts',
  'new-arrivals': 'Allowed: /collections/oversized-tee or /oversized-tee',
}

function resolveCategorySectionEntry(
  sections: HomepageContent['categorySections'],
  key: HomepageCategorySectionKey,
): { storageKey: string; section: HomepageCategorySection } | null {
  if (!sections) {
    return null
  }

  const direct = sections[key]
  if (direct) {
    return { storageKey: key, section: direct }
  }

  const match = Object.entries(sections).find(([, section]) => section?.key === key)
  if (!match?.[1]) {
    return null
  }

  return { storageKey: match[0], section: match[1] }
}

interface AdminPageProps {
  initialView?: 'login' | 'dashboard'
}

export default function AdminPage({ initialView = 'login' }: AdminPageProps) {
  const navigate = useNavigate()
  const firebaseReady = isFirebaseConfigured()
  const launchModeEnabled = isLaunchModeEnabled()
  const canSignIn = firebaseReady || launchModeEnabled
  const [user, setUser] = useState<AdminSessionUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'dashboard'>(initialView)
  const [loginForm, setLoginForm] = useState({ email: DEFAULT_ADMIN_LOGIN_EMAIL, password: '' })
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [archivedProducts, setArchivedProducts] = useState<AdminProduct[]>([])
  const [archivedOrders, setArchivedOrders] = useState<AdminOrder[]>([])
  const [archivedCategories, setArchivedCategories] = useState<AdminCategory[]>([])
  const [archivedBrands, setArchivedBrands] = useState<AdminBrand[]>([])
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const homepageSavingRef = useRef(false)
  const homepageDirtyRef = useRef(false)
  const homepageContentRef = useRef<HomepageContent | null>(null)
  const [homepageSaving, setHomepageSaving] = useState(false)
  const [form, setForm] = useState(emptyProductForm)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderDateFrom, setOrderDateFrom] = useState('')
  const [orderDateTo, setOrderDateTo] = useState('')
  const [reportRange, setReportRange] = useState(() => defaultOpsReportRange())
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [bulkStock, setBulkStock] = useState('')
  const [bulkPrice, setBulkPrice] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [orderEdits, setOrderEdits] = useState<Record<string, Partial<Pick<AdminOrder, 'customerName' | 'customerPhone' | 'customerEmail' | 'address' | 'notes' | 'trackingNumber'>>>>({})
  const [customerEdits, setCustomerEdits] = useState<Record<string, { name: string; phone: string; email: string }>>({})
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | AdminOrder['status']>('all')
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<OrderPaymentFilter>('all')
  const [showBrandManagement, setShowBrandManagement] = useState(false)
  const [blockedAdminUid, setBlockedAdminUid] = useState<string | null>(null)
  const [homepageSaveDebug, setHomepageSaveDebug] = useState<{
    status: 'idle' | 'saving' | 'success' | 'error'
    message: string
    mode: 'local' | 'live' | 'unknown'
    path: string
    heroImage: string
    sareeCoverImage: string
    firebaseProjectId: string
    savedAt?: string
    lastClickAt?: string
  }>({
    status: 'idle',
    message: 'No homepage save attempt yet.',
    mode: 'unknown',
    path: 'settings/homepage',
    heroImage: '',
    sareeCoverImage: '',
    firebaseProjectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '(missing)',
  })
  const [homepageSnapshotDebug, setHomepageSnapshotDebug] = useState<HomepageContentSnapshotMeta | null>(null)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null)
  const [founderForm, setFounderForm] = useState<FounderProfile | null>(null)
  const [founderSaving, setFounderSaving] = useState(false)
  const [founderMessage, setFounderMessage] = useState('')
   const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([])
   const [newsletterLoading, setNewsletterLoading] = useState(false)
   const [coupons, setCoupons] = useState<Coupon[]>([])
   const [couponLoading, setCouponLoading] = useState(false)
   const [couponSearch, setCouponSearch] = useState('')
   const [couponStats, setCouponStats] = useState({ total: 0, active: 0, used: 0, expired: 0, disabled: 0 })
   const [reviews, setReviews] = useState<ProductReview[]>([])
   const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([])
   const [showCouponForm, setShowCouponForm] = useState(false)
   const [newCouponForm, setNewCouponForm] = useState({
     code: '',
     audience: 'public' as CouponAudience,
     discountType: 'percent' as CouponDiscountType,
     discountPercent: 10,
     discountFixedBdt: 500,
     minSpend: 0,
     applicableCategories: [] as string[],
     customerEmail: '',
     expiryDays: 30,
     maxUsage: 100,
   })

  useEffect(() => {
    const unsubscribe = onAdminAuthChanged((nextUser) => {
      setUser(nextUser)
      setAuthReady(true)

      if (nextUser) {
        setAuthMode('dashboard')
        if (nextUser.needsAdminDoc) {
          setBlockedAdminUid(nextUser.uid)
          setMessage(`Dashboard is view-only until Firestore document admins/${nextUser.uid} exists with role="admin" and active=true.`)
        }
        if (initialView === 'login') {
          navigate('/admin', { replace: true })
        }
        return
      }

      setAuthMode('login')
      if (initialView === 'login' && consumeAdminAccessDeniedFlag()) {
        setMessage('Access denied. This account is not authorized for admin access, or it is marked inactive.')
      }
      if (initialView === 'dashboard') {
        navigate('/shis-admin/login', { replace: true })
      }
    })

    return unsubscribe
  }, [initialView, navigate])

  useEffect(() => {
    homepageContentRef.current = homepageContent
  }, [homepageContent])

  useEffect(() => {
    if (!user || authMode !== 'dashboard') {
      return () => undefined
    }

    const unsubscribeProducts = subscribeToProducts((nextProducts) => setProducts(nextProducts))
    const unsubscribeOrders = subscribeToOrders((nextOrders) => setOrders(nextOrders))
    const unsubscribeHomepage = subscribeToHomepageContent((nextContent, meta) => {
      setHomepageContent((current) => {
        if (homepageSavingRef.current || homepageDirtyRef.current) {
          console.info('[homepage] snapshot skipped; preserving local edits', {
            dirty: homepageDirtyRef.current,
            saving: homepageSavingRef.current,
            source: meta?.source,
            incomingSareeCoverImage: nextContent.categorySections?.saree?.coverImage || '(empty)',
            currentSareeCoverImage: current?.categorySections?.saree?.coverImage || '(empty)',
          })
          return current
        }

        homepageContentRef.current = nextContent
        return nextContent
      })
      if (meta) {
        setHomepageSnapshotDebug(meta)
      }
    })
    const unsubscribeCategories = subscribeToCategories((nextCategories) => setCategories(nextCategories))
    const unsubscribeBrands = subscribeToAdminBrands((nextBrands) => setBrands(nextBrands))
    const unsubscribeFounder = subscribeToFounderProfile((nextFounder) => setFounderProfile(nextFounder))
    const unsubscribeArchivedProducts = subscribeToArchivedProducts((nextProducts) => setArchivedProducts(nextProducts))
    const unsubscribeArchivedOrders = subscribeToArchivedOrders((nextOrders) => setArchivedOrders(nextOrders))
    const unsubscribeArchivedCategories = subscribeToArchivedCategories((nextCategories) => setArchivedCategories(nextCategories))
    const unsubscribeArchivedBrands = subscribeToArchivedBrands((nextArchivedBrands) => setArchivedBrands(nextArchivedBrands))
    const unsubscribeReviews = subscribeToAdminReviews(setReviews)
    const unsubscribeAdmins = subscribeToAdminAccounts(setAdminAccounts)

    return () => {
      unsubscribeProducts()
      unsubscribeOrders()
      unsubscribeHomepage()
      unsubscribeCategories()
      unsubscribeBrands()
      unsubscribeFounder?.()
      unsubscribeArchivedProducts()
      unsubscribeArchivedOrders()
      unsubscribeArchivedCategories()
      unsubscribeArchivedBrands()
      unsubscribeReviews()
      unsubscribeAdmins()
    }
  }, [authMode, user])

  useEffect(() => {
    if (!user || authMode !== 'dashboard') {
      return () => undefined
    }

    const loadNewsletterSubscribers = async () => {
      setNewsletterLoading(true)
      try {
        const subscribers = await getNewsletterSubscribers()
        setNewsletterSubscribers(subscribers)
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unable to load newsletter subscribers.'
        setMessage(reason)
        setToast({ kind: 'error', message: reason })
      } finally {
        setNewsletterLoading(false)
      }
    }

    loadNewsletterSubscribers()
  }, [authMode, user])

  useEffect(() => {
    if (!user || authMode !== 'dashboard') {
      return () => undefined
    }

    const loadCoupons = async () => {
      setCouponLoading(true)
      try {
        const allCoupons = await getCoupons()
        setCoupons(allCoupons)
        setCouponStats(getCouponStats(allCoupons))
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unable to load coupons.'
        setMessage(reason)
        setToast({ kind: 'error', message: reason })
      } finally {
        setCouponLoading(false)
      }
    }

    loadCoupons()
  }, [authMode, user])

   const exportNewsletterSubscribers = () => {
     if (!newsletterSubscribers.length) {
       setMessage('No subscribers to export.')
       return
     }

     downloadCsv(
       `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`,
       ['Email', 'Signup Date', 'Source', 'Coupon Used'],
       newsletterSubscribers.map((subscriber) => [
         subscriber.email,
         subscriber.signupDate ? new Date(subscriber.signupDate).toISOString() : '',
         subscriber.source,
         subscriber.couponUsed || '',
       ]),
     )
     setMessage('Newsletter subscribers exported.')
   }

   const exportCouponsCSV = () => {
     if (!coupons.length) {
       setMessage('No coupons to export.')
       return
     }

     downloadCsv(
       `coupons-${new Date().toISOString().slice(0, 10)}.csv`,
       ['Code', 'Audience', 'Customer', 'Discount', 'Min spend', 'Categories', 'Status', 'Usage', 'Expiry', 'Created'],
       coupons.map((coupon) => [
         coupon.code ?? '',
         coupon.audience ?? (coupon.customerEmail ? 'private' : 'public'),
         coupon.customerEmail ?? '',
         formatCouponDiscountLabel(coupon),
         coupon.minSpend ?? 0,
         (coupon.applicableCategories ?? []).join('|'),
         coupon.status,
         `${coupon.usageCount}/${coupon.maxUsage}`,
         coupon.expiryDate ? new Date(coupon.expiryDate).toISOString() : '',
         coupon.createdDate ?? '',
       ]),
     )
     setMessage('Coupons exported.')
   }

  const customers = useMemo(() => {
    const byIdentity = new Map<string, { identity: string; name: string; phone: string; email: string; totalOrders: number; orderIds: string[] }>()
    for (const order of orders) {
      const identity = (order.customerPhone || order.customerEmail || order.customerName || order.id).toLowerCase()
      const current = byIdentity.get(identity)
      if (!current) {
        byIdentity.set(identity, {
          identity,
          name: order.customerName,
          phone: order.customerPhone ?? '-',
          email: order.customerEmail || '-',
          totalOrders: 1,
          orderIds: [order.id],
        })
      } else {
        byIdentity.set(identity, { ...current, totalOrders: current.totalOrders + 1, orderIds: [...current.orderIds, order.id] })
      }
    }
    return Array.from(byIdentity.values())
  }, [orders])

  const getOrderDate = (createdAt?: string | { seconds: number }) => {
    if (!createdAt) {
      return null
    }

    const parsed = typeof createdAt === 'string' ? new Date(createdAt) : new Date(createdAt.seconds * 1000)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const isSameLocalDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()

  const dashboardSummary = useMemo(() => {
    const today = new Date()
    const todayOrders = orders.filter((order) => {
      const orderDate = getOrderDate(order.createdAt)
      return orderDate ? isSameLocalDay(orderDate, today) : false
    })

    const billableOrders = orders.filter((order) => isBillableOrderStatus(order.status))
    const billableTodayOrders = todayOrders.filter((order) => isBillableOrderStatus(order.status))
    const revenue = billableOrders.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)
    const todayRevenue = billableTodayOrders.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)
    const outOfStockProducts = products.filter((product) => product.stock <= 0).length
    const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD).length

    return {
      todayOrders: todayOrders.length,
      pendingOrders: orders.filter((order) => order.status === 'new').length,
      pendingPaymentVerifications: orders.filter((order) => order.paymentStatus === 'pending_verification').length,
      confirmedOrders: orders.filter((order) => order.status === 'confirmed').length,
      processingOrders: orders.filter((order) => order.status === 'processing').length,
      inCourierOrders: orders.filter((order) => order.status === 'in_courier' || order.status === 'shipped').length,
      deliveredOrders: orders.filter((order) => order.status === 'delivered').length,
      returnedOrders: orders.filter((order) => order.status === 'returned').length,
      cancelledOrders: orders.filter((order) => order.status === 'cancelled').length,
      totalRevenue: revenue,
      todayRevenue,
      totalProducts: products.length,
      outOfStockProducts,
      lowStockProducts,
      totalCustomers: customers.length,
      totalBrands: brands.length,
      archivedBrandsCount: archivedBrands.length,
    }
  }, [archivedBrands.length, brands.length, customers.length, orders, products])

  const opsReport = useMemo(
    () => buildOpsReport(orders, { range: reportRange }),
    [orders, reportRange],
  )

  const filteredOrders = useMemo(() => {
    const query = orderSearch.toLowerCase()
    const matched = orders.filter((order) => {
      const textMatch = [
        order.customerName,
        order.customerPhone,
        order.customerEmail,
        order.address,
        order.deliveryAddress?.division,
        order.deliveryAddress?.district,
        order.deliveryAddress?.streetAddress,
        order.deliveryAddress?.deliveryNote,
        order.notes,
        order.status,
        order.id,
        order.paymentMethod,
        order.paymentStatus,
        order.paymentTransactionId,
      ].some((value) => (value ?? '').toLowerCase().includes(query))
      if (!textMatch || (orderStatusFilter !== 'all' && !orderMatchesStatusFilter(order.status, orderStatusFilter))) {
        return false
      }

      if (orderPaymentFilter === 'pending_verification' && order.paymentStatus !== 'pending_verification') {
        return false
      }
      if (orderPaymentFilter === 'paid' && order.paymentStatus !== 'paid') {
        return false
      }
      if (orderPaymentFilter === 'unpaid' && order.paymentStatus !== 'unpaid') {
        return false
      }

      const orderDate = getOrderDate(order.createdAt)
      if (!orderDate) {
        return !orderDateFrom && !orderDateTo
      }

      const dayKey = toDayKey(orderDate)
      if (orderDateFrom && dayKey < orderDateFrom) {
        return false
      }
      if (orderDateTo && dayKey > orderDateTo) {
        return false
      }

      return true
    })

    return matched.sort((left, right) => {
      if (orderPaymentFilter === 'pending_verification' || orderPaymentFilter === 'all') {
        const leftNeedsVerify = left.paymentStatus === 'pending_verification'
        const rightNeedsVerify = right.paymentStatus === 'pending_verification'
        if (leftNeedsVerify && !rightNeedsVerify) {
          return -1
        }
        if (rightNeedsVerify && !leftNeedsVerify) {
          return 1
        }
      }

      if (left.status === 'new' && right.status !== 'new') {
        return -1
      }
      if (right.status === 'new' && left.status !== 'new') {
        return 1
      }
      const leftTime = getOrderDate(left.createdAt)?.getTime() ?? 0
      const rightTime = getOrderDate(right.createdAt)?.getTime() ?? 0
      return rightTime - leftTime
    })
  }, [orderDateFrom, orderDateTo, orderPaymentFilter, orderSearch, orderStatusFilter, orders])

  const pendingQueueOrders = useMemo(
    () => filteredOrders.filter((order) => order.status === 'new'),
    [filteredOrders],
  )

  const pendingPaymentOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === 'pending_verification'),
    [orders],
  )

  const formatOrderDateTime = (createdAt?: string | { seconds: number }) => {
    if (!createdAt) {
      return '-'
    }

    const date = typeof createdAt === 'string'
      ? new Date(createdAt)
      : new Date(createdAt.seconds * 1000)

    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const exportOrdersCSV = () => {
    if (!filteredOrders.length) {
      setMessage('No orders to export for the current filters.')
      return
    }

    downloadCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Order ID', 'Date', 'Status', 'Payment', 'Customer', 'Phone', 'Email', 'Address', 'Items', 'Delivery', 'Total', 'Tracking'],
      filteredOrders.map((order) => [
        order.id,
        formatOrderDateTime(order.createdAt),
        order.status,
        order.paymentMethod ?? 'Cash on Delivery',
        order.customerName,
        order.customerPhone ?? '',
        order.customerEmail ?? '',
        order.deliveryAddress?.streetAddress ?? order.address ?? '',
        order.items.map((item) => `${item.name} x${item.quantity}`).join('; '),
        String(order.deliveryCharge ?? 0),
        String(order.total),
        order.trackingNumber ?? '',
      ]),
    )
    setMessage(`${filteredOrders.length} order${filteredOrders.length === 1 ? '' : 's'} exported.`)
  }

  const exportOpsReport = () => {
    downloadCsv(
      `ops-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Type', 'Name', 'Quantity', 'Amount'],
      [
        ['KPI', 'Orders in range', opsReport.scopedOrders, ''],
        ['KPI', 'Billable orders', opsReport.billableOrders, ''],
        ['KPI', 'Revenue', '', opsReport.revenue],
        ['KPI', 'Average order value', '', opsReport.aov],
        ['KPI', 'Last 7 days orders', opsReport.last7Orders, ''],
        ['KPI', 'Last 7 days revenue', '', opsReport.last7Revenue],
        ['KPI', 'Pending COD value', '', opsReport.pendingValue],
        ['KPI', 'Cancel rate %', opsReport.cancelledRate, ''],
        ...opsReport.daily.map((point) => ['Daily', point.date, point.orders, Math.round(point.revenue)] as Array<string | number>),
        ...opsReport.productSales.map((item) => ['Product sales', item.name, item.quantity, Math.round(item.revenue)] as Array<string | number>),
      ],
    )
    setMessage('Operations report exported.')
  }

  const filteredProducts = useMemo(() => {
    const query = productSearch.toLowerCase()
    return products.filter((product) => [product.name, product.category, product.description].some((value) => value.toLowerCase().includes(query)))
  }, [products, productSearch])

  const lowStockCatalog = useMemo(
    () => products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).sort((left, right) => left.stock - right.stock),
    [products],
  )

  const availableCategoryNames = useMemo(() => {
    const names = categories.map((category) => category.name).filter(Boolean)
    return Array.from(new Set(names)).sort((left, right) => left.localeCompare(right))
  }, [categories])

  const taxonomyCategoryOptions = useMemo(() => getAllTaxonomyCategoryOptions(), [])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setBlockedAdminUid(null)
    const email = loginForm.email.trim()
    const password = loginForm.password.trim()
    try {
      await signInAdmin(email, password)
      setAuthMode('dashboard')
      setMessage('Welcome back. Your dashboard is ready.')
      setBlockedAdminUid(null)
      navigate('/admin', { replace: true })
    } catch (error) {
      setMessage(describeAdminSignInError(error))
      const adminUid = typeof error === 'object' && error !== null && 'adminUid' in error
        ? String((error as { adminUid?: unknown }).adminUid ?? '')
        : ''
      setBlockedAdminUid(adminUid || null)

      if (import.meta.env.DEV) {
        console.error('Admin login failed', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOutAdmin()
    setAuthMode('login')
    setUser(null)
    setBlockedAdminUid(null)
    navigate('/shis-admin/login', { replace: true })
  }

  const handleCopyAdminDocPath = async () => {
    const uid = blockedAdminUid || user?.uid
    if (!uid) {
      return
    }

    const path = `admins/${uid}`
    try {
      await navigator.clipboard.writeText(path)
      setMessage(`Copied Firestore document path: ${path}`)
    } catch {
      setMessage('Unable to copy admin document path. Please copy it manually.')
    }
  }

  const resetForm = () => {
    setForm(emptyProductForm)
    setIsEditing(null)
  }

  const handleGalleryUpload = async (files: FileList | null, slotIndex: number) => {
    if (!files?.length) {
      return
    }

    try {
      setUploading(true)
      setUploadError('')
      setUploadProgress(0)
      const uploadedImages = await uploadAssets([files[0]], 'products', {
        retries: 2,
        onProgress: (progress) => setUploadProgress(progress),
      })
      if (uploadedImages[0]) {
        setForm((current) => {
          const nextImages = [...current.images]
          const nextImageTitles = [...current.imageTitles]
          nextImages[slotIndex] = uploadedImages[0]
          if (!nextImageTitles[slotIndex]?.trim()) {
            const baseName = current.name.trim() || 'Product'
            nextImageTitles[slotIndex] = `${baseName} ${labelForImage(slotIndex)}`
          }
          return { ...current, images: nextImages, imageTitles: nextImageTitles }
        })
        setMessage(`${galleryLabel(slotIndex)} uploaded.`)
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Image upload failed. Please retry.'
      setUploadError(reason)
      setMessage(reason)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveGalleryImage = async (slotIndex: number) => {
    const url = form.images[slotIndex]?.trim() ?? ''
    try {
      if (url) {
        await deleteAsset(url)
      }
      setForm((current) => {
        const nextImages = [...current.images]
        const nextImageTitles = [...current.imageTitles]
        const nextImageDescriptions = [...current.imageDescriptions]
        nextImages[slotIndex] = ''
        nextImageTitles[slotIndex] = ''
        nextImageDescriptions[slotIndex] = ''
        return { ...current, images: nextImages, imageTitles: nextImageTitles, imageDescriptions: nextImageDescriptions }
      })
      setMessage(`${galleryLabel(slotIndex)} removed.`)
      setToast({ kind: 'success', message: `${galleryLabel(slotIndex)} removed from CDN and form.` })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unable to remove gallery image.'
      setMessage(reason)
      setToast({ kind: 'error', message: reason })
    }
  }

  const handleUpload = async (
    files: FileList | null,
    target: 'product-images' | 'product-videos' | 'hero-image' | 'banner-image' | 'category-image' | 'shop-category-image' | 'category-section-image' | 'featured-page-image' | null = null,
    categoryIndex?: number,
    slotIndex?: number,
    sectionKey?: HomepageCategorySectionKey,
  ) => {
    if (!files?.length) {
      return
    }

    const selectedFiles = Array.from(files)
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'))
    const videoFiles = selectedFiles.filter((file) => file.type.startsWith('video/'))

    if (!imageFiles.length && !videoFiles.length) {
      setMessage('Upload image or video files only.')
      return
    }

    try {
      setUploading(true)
      setUploadError('')
      setUploadProgress(0)

      if (target === 'category-section-image') {
        console.info('[saree] image selected', {
          sectionKey: sectionKey ?? '(missing)',
          fileCount: imageFiles.length,
          fileName: imageFiles[0]?.name ?? '(none)',
        })
        console.info('[saree] upload started', { sectionKey: sectionKey ?? '(missing)' })
      }

      const uploadedImages = imageFiles.length
        ? await uploadAssets(imageFiles, target === 'hero-image' || target === 'banner-image' || target === 'category-image' || target === 'shop-category-image' || target === 'category-section-image' || target === 'featured-page-image' ? 'homepage' : 'products', {
          retries: 2,
          onProgress: (progress) => setUploadProgress(progress),
        })
        : []
      const uploadedVideos = videoFiles.length
        ? await uploadAssets(videoFiles, 'products', {
          retries: 2,
          onProgress: (progress) => setUploadProgress(progress),
        })
        : []

      if (target === 'hero-image') {
        const previousHero = homepageContent?.heroImage?.trim() ?? ''
        const nextHero = uploadedImages[0] ?? homepageContent?.heroImage
        const nextContent = homepageContent ? { ...homepageContent, heroImage: nextHero } : homepageContent
        if (nextContent) {
          setHomepageContent(nextContent)
          homepageDirtyRef.current = true
          try {
            homepageSavingRef.current = true
            await updateHomepageContent(nextContent)
            homepageDirtyRef.current = false
            if (previousHero && previousHero !== nextHero) {
              try {
                await deleteAsset(previousHero)
              } catch {
                // Old asset cleanup is best-effort after successful replace.
              }
            }
            setToast({ kind: 'success', message: 'Hero image uploaded and saved.' })
          } catch (error) {
            const reason = error instanceof Error ? error.message : 'Hero upload saved locally but Firestore save failed.'
            setMessage(reason)
            setToast({ kind: 'error', message: reason })
          } finally {
            homepageSavingRef.current = false
          }
        }
      } else if (target === 'banner-image') {
        const previousBanner = homepageContent?.bannerImage?.trim() ?? ''
        const nextBanner = uploadedImages[0] ?? homepageContent?.bannerImage
        const nextContent = homepageContent ? { ...homepageContent, bannerImage: nextBanner } : homepageContent
        if (nextContent) {
          setHomepageContent(nextContent)
          homepageDirtyRef.current = true
          try {
            homepageSavingRef.current = true
            await updateHomepageContent(nextContent)
            homepageDirtyRef.current = false
            if (previousBanner && previousBanner !== nextBanner) {
              try {
                await deleteAsset(previousBanner)
              } catch {
                // Old asset cleanup is best-effort after successful replace.
              }
            }
            setToast({ kind: 'success', message: 'Banner image uploaded and saved.' })
          } catch (error) {
            const reason = error instanceof Error ? error.message : 'Banner upload saved locally but Firestore save failed.'
            setMessage(reason)
            setToast({ kind: 'error', message: reason })
          } finally {
            homepageSavingRef.current = false
          }
        }
      } else if (target === 'category-image') {
        const current = homepageContent
        if (!current) {
          console.error('[category-image] upload completed but homepageContent state is missing')
          return
        }

        const nextCategories = [...current.categories]
        const safeIndex = typeof categoryIndex === 'number' ? Math.min(categoryIndex, nextCategories.length - 1) : 0
        const uploadedUrl = uploadedImages[0] ?? nextCategories[safeIndex].image
        nextCategories[safeIndex] = { ...nextCategories[safeIndex], image: uploadedUrl }
        const nextContent = { ...current, categories: nextCategories }

        setHomepageContent(nextContent)

        try {
          await updateHomepageContent(nextContent)
          console.info('[category-image] Firestore save succeeded', { categoryIndex: safeIndex, image: uploadedUrl })
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Category image saved locally but failed to sync to Firestore.'
          console.error('[category-image] Firestore save failed', { error, categoryIndex: safeIndex, image: uploadedUrl, reason })
          setUploadError(reason)
          setMessage(reason)
        }
      } else if (target === 'shop-category-image') {
        const current = homepageContent
        if (!current) {
          console.error('[shop-category-image] upload completed but homepageContent state is missing')
          return
        }

        const nextShopByCategories = [...(current.shopByCategories ?? [])]
        if (!nextShopByCategories.length) {
          console.warn('[shop-category-image] no shopByCategories entries to update')
          return
        }

        const safeIndex = typeof categoryIndex === 'number' ? Math.min(categoryIndex, nextShopByCategories.length - 1) : 0
        const uploadedUrl = uploadedImages[0] ?? nextShopByCategories[safeIndex].image
        nextShopByCategories[safeIndex] = {
          ...nextShopByCategories[safeIndex],
          image: uploadedUrl,
        }

        const nextContent = { ...current, shopByCategories: nextShopByCategories }
        setHomepageContent(nextContent)

        try {
          await updateHomepageContent(nextContent)
          console.info('[shop-category-image] Firestore save succeeded', { categoryIndex: safeIndex, image: uploadedUrl })
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Shop category image saved locally but failed to sync to Firestore.'
          console.error('[shop-category-image] Firestore save failed', { error, categoryIndex: safeIndex, image: uploadedUrl, reason })
          setUploadError(reason)
          setMessage(reason)
        }
      } else if (target === 'category-section-image') {
        const persistableUrl = uploadedImages[0]?.trim() ?? ''
        console.info('[category-section-image] upload completed', {
          sectionKey: sectionKey ?? '(missing)',
          uploadedURL: persistableUrl || '(empty)',
        })
        if (!isPersistableMediaUrl(persistableUrl)) {
          throw new Error('Image upload did not return a persistable URL. Please retry the upload.')
        }

        if (!sectionKey) {
          throw new Error('Image upload succeeded but the category section key was missing. Please retry from the category section.')
        }

        console.info(`[category-section-image] uploaded URL: ${persistableUrl}`)

        homepageDirtyRef.current = true
        const current = homepageContentRef.current
        if (!current) {
          throw new Error('Uploaded image but homepage content is not loaded yet. Refresh and retry.')
        }

        const resolved = resolveCategorySectionEntry(current.categorySections, sectionKey)
        if (!resolved) {
          console.error('[category-section-image] state not updated: section missing from homepageContent.categorySections', {
            sectionKey,
            availableKeys: Object.keys(current.categorySections ?? {}),
          })
          throw new Error(`Uploaded ${sectionKey} image but homepage state did not contain that section. Refresh and retry.`)
        }

        const nextSection: HomepageCategorySection = {
          ...resolved.section,
          key: sectionKey,
          coverImage: persistableUrl,
          images: Array.from(new Set([persistableUrl, ...(resolved.section.images ?? [])])).filter(Boolean),
        }

        const nextContent: HomepageContent = {
          ...current,
          categorySections: {
            ...(current.categorySections ?? {}),
            [resolved.storageKey]: nextSection,
            [sectionKey]: nextSection,
          } as HomepageContent['categorySections'],
          shopByCategories: (current.shopByCategories ?? []).map((item) => {
            if (sectionKey !== 'saree') {
              return item
            }

            const href = (item.href ?? '').toLowerCase()
            const title = (item.title ?? '').toLowerCase()
            if (!href.includes('saree') && title !== 'saree') {
              return item
            }

            return { ...item, image: persistableUrl }
          }),
        }

        homepageContentRef.current = nextContent
        setHomepageContent(nextContent)

        try {
          await updateHomepageContent(nextContent)
          console.info(`[category-section-image] Firestore save succeeded: ${nextContent.categorySections?.[sectionKey]?.coverImage || persistableUrl}`)
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Category section image saved locally but failed to sync to Firestore.'
          console.error('[category-section-image] Firestore save failed', {
            error,
            sectionKey,
            image: persistableUrl,
            reason,
          })
          setUploadError(reason)
          setMessage(reason)
        }
      } else if (target === 'featured-page-image') {
        setHomepageContent((current) => {
          if (!current || !current.featuredCollectionPages.length) {
            return current
          }

          const nextPages = [...current.featuredCollectionPages]
          const safePageIndex = typeof categoryIndex === 'number' ? Math.min(categoryIndex, nextPages.length - 1) : 0
          const currentImages = [...(nextPages[safePageIndex].images ?? [])]
          const safeSlotIndex = typeof slotIndex === 'number' ? Math.max(0, Math.min(slotIndex, 3)) : currentImages.findIndex((image) => !image)
          const targetSlot = safeSlotIndex === -1 ? 0 : safeSlotIndex
          currentImages[targetSlot] = uploadedImages[0] ?? currentImages[targetSlot] ?? ''
          nextPages[safePageIndex] = {
            ...nextPages[safePageIndex],
            images: currentImages,
          }
          return { ...current, featuredCollectionPages: nextPages }
        })
      } else {
        setForm((current) => ({
          ...current,
          images: [...current.images, ...uploadedImages].slice(0, MAX_PRODUCT_IMAGES),
          imageTitles: current.imageTitles,
          videos: [...current.videos, ...uploadedVideos],
        }))
      }

      setMessage('Assets uploaded successfully.')
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Asset upload failed. Please retry.'
      setUploadError(reason)
      setMessage(reason)
      setToast({ kind: 'error', message: reason })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>, target: 'product-images' | 'product-videos' | 'hero-image' | 'banner-image' | 'category-image' | 'shop-category-image' | 'category-section-image' | 'featured-page-image' | null = null) => {
    event.preventDefault()
    setDragActive(false)
    await handleUpload(event.dataTransfer.files, target)
  }

  const updateFeaturedCollectionPageField = (
    pageIndex: number,
    field: 'title' | 'subtitle' | 'description' | 'href' | 'slug' | 'relatedCategorySlugs',
    value: string,
  ) => {
    if (!homepageContent) {
      return
    }

    const nextPages = [...homepageContent.featuredCollectionPages]
    if (!nextPages[pageIndex]) {
      return
    }

    if (field === 'relatedCategorySlugs') {
      nextPages[pageIndex] = {
        ...nextPages[pageIndex],
        relatedCategorySlugs: value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      }
    } else {
      nextPages[pageIndex] = {
        ...nextPages[pageIndex],
        [field]: value,
      }
    }

    setHomepageContent({ ...homepageContent, featuredCollectionPages: nextPages })
  }

  const handleRemoveFeaturedCollectionImage = async (pageIndex: number, imageIndex: number) => {
    if (!homepageContent?.featuredCollectionPages[pageIndex]) {
      return
    }

    const imageToRemove = homepageContent.featuredCollectionPages[pageIndex].images?.[imageIndex]
    if (!imageToRemove) {
      return
    }

    try {
      await deleteAsset(imageToRemove)
      const nextPages = [...homepageContent.featuredCollectionPages]
      const nextImages = [...(nextPages[pageIndex].images ?? [])]
      nextImages[imageIndex] = ''
      nextPages[pageIndex] = { ...nextPages[pageIndex], images: nextImages }
      const nextContent = { ...homepageContent, featuredCollectionPages: nextPages }
      setHomepageContent(nextContent)
      homepageDirtyRef.current = true
      homepageSavingRef.current = true
      try {
        await updateHomepageContent(nextContent)
        homepageDirtyRef.current = false
        setMessage('Collection image removed and saved.')
        setToast({ kind: 'success', message: 'Collection image removed.' })
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Image removed from CDN but homepage save failed.'
        setMessage(reason)
        setToast({ kind: 'error', message: reason })
      } finally {
        homepageSavingRef.current = false
      }
    } catch {
      setMessage('Unable to remove collection image.')
      setToast({ kind: 'error', message: 'Unable to remove collection image.' })
    }
  }

  const handleRemoveMedia = async (value: string, kind: 'image' | 'video') => {
    try {
      await deleteAsset(value)
      if (kind === 'image') {
        setForm((current) => ({ ...current, images: current.images.filter((entry) => entry !== value) }))
      } else {
        setForm((current) => ({ ...current, videos: current.videos.filter((entry) => entry !== value) }))
      }
      setMessage('Media removed.')
    } catch {
      setMessage('Unable to remove media right now.')
    }
  }

  const normalizeProductForm = (productForm: typeof form) => ({
    ...productForm,
    name: productForm.name.trim(),
    price: productForm.price.trim(),
    comparePrice: productForm.comparePrice.trim(),
    description: productForm.description.trim(),
    category: resolveCanonicalSubcategorySlug(productForm.category),
    sizes: productForm.sizes.map((size) => size.trim()).filter(Boolean),
    colors: productForm.colors.map((color) => color.trim()).filter(Boolean),
  })

  const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      const normalizedForm = normalizeProductForm(form)
      const variantPayload = variantsForSave(normalizedForm.sizes, normalizedForm.colors, normalizedForm.variants, normalizedForm.stock)
      const normalizedMedia = compactManagedImages({
        images: normalizedForm.images.slice(0, MAX_PRODUCT_IMAGES),
        imageTitles: normalizedForm.imageTitles.slice(0, MAX_PRODUCT_IMAGES),
        imageDescriptions: normalizedForm.imageDescriptions.slice(0, MAX_PRODUCT_IMAGES),
      })
      if (isEditing) {
        await updateProduct(isEditing, {
          ...normalizedForm,
          ...normalizedMedia,
          ...variantPayload,
          sizes: normalizedForm.sizes,
          colors: normalizedForm.colors,
        })
        setMessage('Product updated.')
      } else {
        await createProduct({
          ...normalizedForm,
          ...normalizedMedia,
          ...variantPayload,
          sizes: normalizedForm.sizes,
          colors: normalizedForm.colors,
        })
        setMessage('Product created.')
      }
      resetForm()
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = (product: AdminProduct) => {
    const imageEntries = getManagedImageEntries(product, 3).slice(0, MAX_PRODUCT_IMAGES)
    setForm({
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice || '',
      stock: product.stock,
      sizes: product.sizes,
      colors: product.colors,
      description: product.description,
      category: product.category,
      images: imageEntries.map((entry) => entry.url),
      imageTitles: imageEntries.map((entry) => entry.title),
      imageDescriptions: imageEntries.map((entry) => entry.description),
      videos: product.videos,
      featured: product.featured,
      newArrival: product.newArrival,
      hero: product.hero,
      variants: rebuildVariantMatrix(product.sizes, product.colors, product.variants),
    })
    setIsEditing(product.id)
  }

  const handleDeleteProduct = async (productId: string) => {
    const shouldDelete = window.confirm('Archive this product? It will be hidden from storefront and dashboard lists.')
    if (!shouldDelete) {
      return
    }

    try {
      await deleteProduct(productId)
      if (isEditing === productId) {
        resetForm()
      }
      setMessage('Product archived.')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    )
  }

  const handleBulkProductUpdate = async () => {
    if (!selectedProductIds.length) {
      setMessage('Select products to update.')
      return
    }

    const stockValue = bulkStock.trim()
    const priceValue = bulkPrice.trim()
    if (!stockValue && !priceValue) {
      setMessage('Enter a stock count and/or price to apply.')
      return
    }

    const stockNumber = stockValue === '' ? undefined : Number(stockValue)
    if (stockNumber !== undefined && (!Number.isFinite(stockNumber) || stockNumber < 0)) {
      setMessage('Stock must be a number 0 or greater.')
      return
    }

    setLoading(true)
    try {
      await Promise.all(selectedProductIds.map((id) => updateProduct(id, {
        ...(stockNumber !== undefined ? { stock: stockNumber } : {}),
        ...(priceValue ? { price: priceValue } : {}),
      })))
      setMessage(`Updated ${selectedProductIds.length} product${selectedProductIds.length === 1 ? '' : 's'}.`)
      setSelectedProductIds([])
      setBulkStock('')
      setBulkPrice('')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    } finally {
      setLoading(false)
    }
  }

  const handleHomepageSave = async (event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault()
    event?.stopPropagation()
    console.info('[homepage] save button clicked')

    const clickedAt = new Date().toISOString()
    const contentToSave = homepageContentRef.current ?? homepageContent
    const currentSareeCover = contentToSave?.categorySections?.saree?.coverImage ?? ''
    const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '(missing)'

    setHomepageSaveDebug({
      status: 'saving',
      message: 'Saving...',
      mode: 'unknown',
      path: 'settings/homepage',
      heroImage: contentToSave?.heroImage ?? '',
      sareeCoverImage: currentSareeCover,
      firebaseProjectId: projectId,
      lastClickAt: clickedAt,
    })

    if (homepageSavingRef.current) {
      const reason = 'Failed to save content: a save is already in progress.'
      setMessage(reason)
      setToast({ kind: 'error', message: reason })
      setHomepageSaveDebug((current) => ({ ...current, status: 'error', message: reason }))
      return
    }

    if (!contentToSave) {
      const reason = 'Failed to save content: Homepage content is not loaded yet.'
      setMessage(reason)
      setToast({ kind: 'error', message: reason })
      setHomepageSaveDebug((current) => ({ ...current, status: 'error', message: reason }))
      return
    }

    const sectionEntries = Object.values(contentToSave.categorySections ?? {})
    const invalidSection = sectionEntries.find((section) => {
      const href = (section.href ?? '').trim()
      if (!href) {
        return section.enabled
      }

      const validator = SECTION_ROUTE_VALIDATORS[section.key]
      const isHrefValid = validator ? validator(href) : isInternalAppHref(href)
      return !isHrefValid
    })

    if (invalidSection) {
      const reason = `Failed to save content: Invalid route for ${invalidSection.key.toUpperCase()}. ${SECTION_ROUTE_HINTS[invalidSection.key] ?? 'Route must start with /.'}`
      setMessage(reason)
      setToast({ kind: 'error', message: reason })
      setHomepageSaveDebug((current) => ({ ...current, status: 'error', message: reason }))
      return
    }

    homepageSavingRef.current = true
    setHomepageSaving(true)
    try {
      const sareeCoverImage = contentToSave.categorySections?.saree?.coverImage?.trim() ?? ''
      if (sareeCoverImage && !isPersistableMediaUrl(sareeCoverImage)) {
        throw new Error('Saree image is not a permanent URL. Re-upload the image before saving.')
      }

      console.info('[homepage] save handler running', {
        projectId,
        path: 'settings/homepage',
        field: 'categorySections.saree.coverImage',
        sareeCoverImage: sareeCoverImage || '(empty)',
        canWrite: user?.canWrite ?? false,
        uid: user?.uid ?? '(missing)',
      })

      const result: HomepageSaveResult = await updateHomepageContent(contentToSave)
      homepageDirtyRef.current = false
      homepageContentRef.current = result.content
      setHomepageContent(result.content)
      setMessage('Content saved successfully.')
      setToast({ kind: 'success', message: 'Content saved successfully.' })
      setHomepageSaveDebug({
        status: 'success',
        message: `Content saved successfully (${result.mode} mode). Fresh getDoc confirmed categorySections.saree.coverImage.`,
        mode: result.mode,
        path: result.path,
        heroImage: result.heroImage,
        sareeCoverImage: result.sareeCoverImage,
        firebaseProjectId: result.firebaseProjectId,
        savedAt: result.savedAt,
        lastClickAt: clickedAt,
      })
      console.info('[homepage] save success', {
        projectId: result.firebaseProjectId,
        path: result.path,
        mode: result.mode,
        verified: result.verified,
        field: 'categorySections.saree.coverImage',
        sareeCoverImage: result.sareeCoverImage || '(empty)',
      })
    } catch (error) {
      const reason = `Failed to save content: ${describeAdminWriteError(error, user?.uid)}`
      setMessage(reason)
      setToast({ kind: 'error', message: reason })
      if (user?.uid) {
        setBlockedAdminUid(user.uid)
      }
      setHomepageSaveDebug({
        status: 'error',
        message: reason,
        mode: 'unknown',
        path: 'settings/homepage',
        heroImage: contentToSave.heroImage ?? '',
        sareeCoverImage: contentToSave.categorySections?.saree?.coverImage ?? '',
        firebaseProjectId: projectId,
        savedAt: new Date().toISOString(),
        lastClickAt: clickedAt,
      })
      console.error('[homepage] save failed', error)
    } finally {
      homepageSavingRef.current = false
      setHomepageSaving(false)
    }
  }

  const handleHomepageWriteTest = async (event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault()
    event?.stopPropagation()
    console.info('[homepage] test firestore write clicked')

    const contentToTest = homepageContentRef.current ?? homepageContent
    const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '(missing)'
    const clickedAt = new Date().toISOString()

    setHomepageSaveDebug({
      status: 'saving',
      message: 'Testing Firestore write to settings/homepage...',
      mode: 'unknown',
      path: 'settings/homepage',
      heroImage: contentToTest?.heroImage ?? '',
      sareeCoverImage: contentToTest?.categorySections?.saree?.coverImage ?? '',
      firebaseProjectId: projectId,
      lastClickAt: clickedAt,
    })

    if (!contentToTest) {
      const reason = 'ERROR: Homepage content is not loaded yet, so the Firestore write test cannot run.'
      setHomepageSaveDebug((current) => ({ ...current, status: 'error', message: reason }))
      setToast({ kind: 'error', message: reason })
      setMessage(reason)
      return
    }

    try {
      const result = await updateHomepageContent(contentToTest)
      setHomepageSaveDebug({
        status: 'success',
        message: `SUCCESS: Firestore write test passed (${result.mode} mode). Fresh getDoc categorySections.saree.coverImage=${result.sareeCoverImage || '(empty)'}`,
        mode: result.mode,
        path: result.path,
        heroImage: result.heroImage,
        sareeCoverImage: result.sareeCoverImage,
        firebaseProjectId: result.firebaseProjectId,
        savedAt: result.savedAt,
        lastClickAt: clickedAt,
      })
      setToast({ kind: 'success', message: 'SUCCESS: Firestore write test passed.' })
      setMessage('SUCCESS: Firestore write test passed.')
    } catch (error) {
      const reason = `ERROR: ${describeAdminWriteError(error, user?.uid)}`
      setHomepageSaveDebug({
        status: 'error',
        message: reason,
        mode: 'unknown',
        path: 'settings/homepage',
        heroImage: contentToTest.heroImage ?? '',
        sareeCoverImage: contentToTest.categorySections?.saree?.coverImage ?? '',
        firebaseProjectId: projectId,
        savedAt: new Date().toISOString(),
        lastClickAt: clickedAt,
      })
      setToast({ kind: 'error', message: `Firestore write test failed: ${reason}` })
      setMessage(`Firestore write test failed: ${reason}`)
      if (user?.uid) {
        setBlockedAdminUid(user.uid)
      }
    }
  }

  const handleCopyHomepageDebug = async () => {
    const payload = {
      save: homepageSaveDebug,
      snapshot: homepageSnapshotDebug,
      localFirstMode: isHomepageLocalFirstMode(),
      firebaseConfigured: firebaseReady,
      firebaseProjectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '(missing)',
      canWrite: user?.canWrite ?? false,
      needsAdminDoc: user?.needsAdminDoc ?? false,
      authEmail: user?.email ?? null,
      authUid: user?.uid ?? null,
      currentSareeCoverImage: homepageContent?.categorySections?.saree?.coverImage ?? '',
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setToast({ kind: 'success', message: 'Homepage debug details copied.' })
    } catch {
      setToast({ kind: 'error', message: 'Unable to copy debug details.' })
    }
  }

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const handleConfirmPayment = async (orderId: string) => {
    try {
      const updated = await confirmOrderPayment(orderId)
      const movedToConfirmed = updated?.status === 'confirmed'
      setMessage(movedToConfirmed ? 'Payment confirmed. Order moved to Confirmed.' : 'Payment marked as confirmed.')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const handleStatusChange = async (orderId: string, status: AdminOrder['status']) => {
    try {
      await updateOrderStatus(orderId, status)
      setMessage(status === 'returned' ? 'Order marked returned. Stock restocked.' : 'Order status updated.')
      setToast({ kind: 'success', message: status === 'returned' ? 'Order marked returned. Stock restocked.' : 'Order status updated.' })
      const channel = notifyChannelForStatus(status)
      if (channel) {
        const notifyResult = await requestOrderStatusNotify(orderId, channel)
        if (!notifyResult.notified && notifyResult.reason) {
          setToast({ kind: 'error', message: `Status saved, but customer notify skipped: ${notifyResult.reason}` })
        }
      }
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : ''

      if (code === 'order/invalid-status-transition') {
        setMessage('Invalid status flow. Use forward lifecycle actions only.')
        setToast({ kind: 'error', message: 'Invalid status flow. Use forward lifecycle actions only.' })
      } else {
        const reason = describeAdminWriteError(error, user?.uid)
        setMessage(reason)
        setToast({ kind: 'error', message: reason })
        setBlockedAdminUid(user?.uid ?? null)
      }
    }
  }

  const handleSaveOrder = async (orderId: string) => {
    const nextEdits = orderEdits[orderId] ?? {}
    try {
      await updateOrderDetails(orderId, nextEdits)
      setOrderEdits((current) => {
        const copy = { ...current }
        delete copy[orderId]
        return copy
      })
      setMessage('Order saved.')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    const shouldDelete = window.confirm('Archive this order? It will be removed from active management lists.')
    if (!shouldDelete) {
      return
    }

    try {
      await deleteOrder(orderId)
      setMessage('Order archived.')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const handleSaveCustomer = async (identity: string, orderIds: string[], fallback: { name: string; phone: string; email: string }) => {
    const edit = customerEdits[identity] ?? fallback
    try {
      await Promise.all(orderIds.map((orderId) =>
        updateOrderDetails(orderId, {
          customerName: edit.name,
          customerPhone: edit.phone,
          customerEmail: edit.email,
        }),
      ))
      setCustomerEdits((current) => {
        const copy = { ...current }
        delete copy[identity]
        return copy
      })
      setMessage('Customer profile updated.')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      setMessage('Category name is required.')
      return
    }

    try {
      if (editingCategoryId) {
        await updateCategory(editingCategoryId, categoryName)
        setMessage('Category updated.')
      } else {
        await createCategory(categoryName)
        setMessage('Category added.')
      }

      setCategoryName('')
      setEditingCategoryId(null)
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSummaryCardClick = (
    target: 'orders' | 'products' | 'homepage' | 'categories' | 'customers' | 'founder',
    filter?: 'all' | AdminOrder['status'],
    paymentFilter?: OrderPaymentFilter,
  ) => {
    if (typeof filter !== 'undefined') {
      setOrderStatusFilter(filter)
    }
    if (typeof paymentFilter !== 'undefined') {
      setOrderPaymentFilter(paymentFilter)
    }

    if (target === 'orders') {
      scrollToSection('orders-management')
    } else if (target === 'products') {
      scrollToSection('products-management')
    } else if (target === 'homepage') {
      scrollToSection('homepage-management')
    } else if (target === 'categories') {
      scrollToSection('categories-management')
    } else if (target === 'customers') {
      scrollToSection('customers-management')
    } else if (target === 'founder') {
      scrollToSection('founder-management')
    }
  }

  const handleEditFounder = () => {
    if (founderProfile) {
      setFounderForm({ ...founderProfile })
    }
  }

  const handleFounderImageUpload = async (files: FileList | null) => {
    if (!files?.length) {
      return
    }

    try {
      setUploading(true)
      setUploadError('')
      setUploadProgress(0)

      const uploadedImages = await uploadAssets([files[0]], 'homepage', {
        retries: 2,
        onProgress: (progress) => setUploadProgress(progress),
      })

      if (!uploadedImages[0]) {
        return
      }

      const nextFounder = founderForm ?? founderProfile
      if (!nextFounder) {
        return
      }

      setFounderForm({ ...nextFounder, image: uploadedImages[0] })
      setFounderMessage('Founder image uploaded. Click Save to publish changes.')
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Founder image upload failed. Please retry.'
      setUploadError(reason)
      setFounderMessage(reason)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSaveFounder = async () => {
    if (!founderForm) return
    setFounderSaving(true)
    setFounderMessage('')
    try {
      await updateFounderProfile(founderForm)
      setFounderMessage('Founder profile saved.')
    } catch (error) {
      setFounderMessage(`Error: ${error instanceof Error ? error.message : 'Save failed.'}`)
    } finally {
      setFounderSaving(false)
    }
  }

  const handleCancelFounder = () => {
    setFounderForm(null)
    setFounderMessage('')
  }

  const homepageSections = useMemo(() => {
    const defaultSections = homepageContent?.sections ?? []
    return [...defaultSections].sort((left, right) => left.order - right.order)
  }, [homepageContent?.sections])

  const homepageCategorySections = useMemo(() => {
    const categorySections = homepageContent?.categorySections
    if (!categorySections) {
      return [] as HomepageCategorySection[]
    }

    return Object.values(categorySections).sort((left, right) => left.order - right.order)
  }, [homepageContent?.categorySections])

  const updateHomepageSection = (key: HomepageSectionConfig['key'], updates: Partial<HomepageSectionConfig>) => {
    if (!homepageContent) {
      return
    }

    const nextSections = homepageContent.sections.map((section) => (section.key === key ? { ...section, ...updates } : section))
    setHomepageContent({ ...homepageContent, sections: nextSections })
  }

  const reorderHomepageSection = (key: HomepageSectionConfig['key'], direction: -1 | 1) => {
    if (!homepageContent) {
      return
    }

    const nextSections = [...homepageContent.sections].sort((left, right) => left.order - right.order)
    const currentIndex = nextSections.findIndex((section) => section.key === key)
    const targetIndex = currentIndex + direction

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= nextSections.length) {
      return
    }

    const currentOrder = nextSections[currentIndex].order
    nextSections[currentIndex].order = nextSections[targetIndex].order
    nextSections[targetIndex].order = currentOrder
    setHomepageContent({ ...homepageContent, sections: nextSections })
  }

  const updateHomepageCategorySection = (
    key: HomepageCategorySectionKey,
    updates: Partial<HomepageCategorySection>,
  ) => {
    homepageDirtyRef.current = true
    setHomepageContent((current) => {
      if (!current?.categorySections) {
        return current
      }

      const target = current.categorySections[key]
      if (!target) {
        return current
      }

      const nextContent = {
        ...current,
        categorySections: {
          ...current.categorySections,
          [key]: {
            ...target,
            ...updates,
            key,
          },
        },
      }
      homepageContentRef.current = nextContent
      return nextContent
    })
  }

  const handlePreviewSectionRoute = (href: string) => {
    const normalizedHref = href.trim()
    if (!normalizedHref.startsWith('/')) {
      setMessage('Section route must start with /.')
      setToast({ kind: 'error', message: 'Section route must start with / for preview.' })
      return
    }

    try {
      const targetUrl = new URL(normalizedHref, window.location.origin)
      window.open(targetUrl.toString(), '_blank', 'noopener,noreferrer')
    } catch {
      setMessage('Unable to preview this section route.')
      setToast({ kind: 'error', message: 'Unable to preview section route.' })
    }
  }

  const handleEditCategory = (category: AdminCategory) => {
    setEditingCategoryId(category.id)
    setCategoryName(category.name)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const shouldDelete = window.confirm('Archive this category? Existing products remain unchanged.')
    if (!shouldDelete) {
      return
    }

    try {
      await deleteCategory(categoryId)
      if (editingCategoryId === categoryId) {
        setEditingCategoryId(null)
        setCategoryName('')
      }
      setMessage('Category archived.')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const handleRestoreProduct = async (productId: string) => {
    try {
      await restoreProduct(productId)
      setMessage('Product restored from archive.')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const handleRestoreOrder = async (orderId: string) => {
    try {
      await restoreOrder(orderId)
      setMessage('Order restored from archive.')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const handleRestoreCategory = async (categoryId: string) => {
    try {
      await restoreCategory(categoryId)
      setMessage('Category restored from archive.')
    } catch (error) {
      const reason = describeAdminWriteError(error, user?.uid)
      setMessage(reason)
      setBlockedAdminUid(user?.uid ?? null)
    }
  }

  const labelForImage = (slotIndex: number) => {
    if (slotIndex === 0) {
      return 'front image'
    }
    if (slotIndex === 1) {
      return 'detail image'
    }
    return 'extra image'
  }

  const accessRole: AdminAccessRole = user?.role ?? 'owner'
  const canSee = (section: Parameters<typeof canAccessAdminSection>[1]) => canAccessAdminSection(accessRole, section)

  if (!authReady) {
    return <Loading />
  }

  if (authMode === 'login' && !user) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <SectionTitle eyebrow="Admin access" title="Secure control center" description="Fast sign-in for your premium operations dashboard." />
          <Card className="mt-8 rounded-[2rem] p-5 sm:p-7">
            <form className="space-y-4" onSubmit={handleLogin}>
              <input required type="email" autoComplete="username" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Email" />
              <input required type="password" autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Password" />
              <Button type="submit" disabled={loading || !canSignIn} className="w-full justify-center">{loading ? 'Signing in…' : 'Enter dashboard'}</Button>
            </form>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              {firebaseReady
                ? 'Firebase Authentication is active. Sign in with the password set for this email in Firebase Console → Authentication → Users.'
                : launchModeEnabled
                  ? 'Launch mode is active. Admin access is limited to configured admin emails.'
                  : 'Admin login requires Firebase authentication on this domain.'}
            </p>
            {message ? <p className="mt-3 text-sm text-[var(--color-accent)]">{message}</p> : null}
            {blockedAdminUid ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAdminDocPath}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]"
                >
                  Copy admins/{blockedAdminUid}
                </button>
                <p className="text-xs text-[var(--color-muted)]">Create this Firestore document with role="admin" and active=true.</p>
              </div>
            ) : null}
          </Card>
        </Container>
      </section>
    )
  }

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 max-w-md">
          <div className={`rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.kind === 'success' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900'}`}>
            {toast.message}
          </div>
        </div>
      ) : null}
      <div className={`fixed bottom-5 right-4 z-40 ${canSee('founder') ? '' : 'hidden'}`}>
        <button
          type="button"
          onClick={() => handleSummaryCardClick('founder')}
          className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] shadow-[0_10px_28px_rgba(0,0,0,0.12)] backdrop-blur"
        >
          Founder
        </button>
      </div>
      <Container>
        <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">Luxury operations at a glance</h1>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              Signed in as {user?.email ?? 'admin'} · {accessRole}
              {user?.needsAdminDoc ? ' · view only' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button to="/" variant="secondary">View store</Button>
            <Button onClick={handleLogout} variant="secondary">Logout</Button>
          </div>
        </div>

        {user?.needsAdminDoc ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm leading-6 text-[var(--color-text)]">
            <p>
              This Firebase account can view the dashboard, but product and order changes are blocked until
              Firestore document <code className="font-semibold">admins/{user.uid}</code> exists with
              {' '}<code className="font-semibold">role: &quot;admin&quot;</code> and <code className="font-semibold">active: true</code>.
            </p>
            <button
              type="button"
              onClick={handleCopyAdminDocPath}
              className="mt-2 text-sm font-semibold text-[var(--color-accent)] underline"
            >
              Copy admins/{user.uid}
            </button>
          </div>
        ) : null}

        {message ? <p className="mt-4 text-sm text-[var(--color-accent)]">{message}</p> : null}
        {uploading ? <p className="mt-2 text-sm text-[var(--color-muted)]">Uploading media... {uploadProgress}%</p> : null}
        {uploadError ? <p className="mt-2 text-sm text-[var(--color-accent)]">{uploadError}</p> : null}

        <div className="mt-6 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle
              eyebrow="Dashboard summary"
              title="Operations at a glance"
              description="Tap a card to jump directly to the matching management area."
            />
            <div className="flex flex-wrap gap-3">
              {canSee('products') ? <Button variant="secondary" onClick={() => { setForm(emptyProductForm); setIsEditing(null); scrollToSection('products-management') }}>Add New Product</Button> : null}
              {canSee('homepage') ? <Button variant="secondary" onClick={() => scrollToSection('homepage-management')}>Edit Homepage</Button> : null}
              {canSee('orders') ? <Button variant="secondary" onClick={() => handleSummaryCardClick('orders', 'new')}>View New Orders</Button> : null}
              {canSee('categories') ? <Button variant="secondary" onClick={() => scrollToSection('categories-management')}>Manage Categories</Button> : null}
              {canSee('founder') ? <Button variant="secondary" onClick={() => handleSummaryCardClick('founder')}>Edit Founder</Button> : null}
              {canSee('brands') ? <Button variant="secondary" onClick={() => { setShowBrandManagement(!showBrandManagement); scrollToSection('brands-management') }}>Manage Brands</Button> : null}
            </div>
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Daily operator flow</p>
            <div className="mt-2 grid gap-2 text-xs text-[var(--color-muted)] sm:grid-cols-2">
              <p>1. Check <span className="font-semibold text-[var(--color-text)]">New Orders</span> and wallet <span className="font-semibold text-[var(--color-text)]">Verify payment</span> queue.</p>
              <p>2. Update stock when creating or editing products.</p>
              <p>3. Keep category list clean before uploading new products.</p>
              <p>4. Toggle homepage sections and click <span className="font-semibold text-[var(--color-text)]">Save content</span>.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Today's Orders", value: dashboardSummary.todayOrders, target: () => handleSummaryCardClick('orders'), section: 'orders' as const },
              { label: 'Pending Orders', value: dashboardSummary.pendingOrders, target: () => handleSummaryCardClick('orders', 'new' as const), section: 'orders' as const },
              { label: 'Verify Payment', value: dashboardSummary.pendingPaymentVerifications, target: () => handleSummaryCardClick('orders', 'all', 'pending_verification'), section: 'orders' as const },
              { label: 'Confirmed Orders', value: dashboardSummary.confirmedOrders, target: () => handleSummaryCardClick('orders', 'confirmed'), section: 'orders' as const },
              { label: 'Processing Orders', value: dashboardSummary.processingOrders, target: () => handleSummaryCardClick('orders', 'processing'), section: 'orders' as const },
              { label: 'In Courier', value: dashboardSummary.inCourierOrders, target: () => handleSummaryCardClick('orders', 'in_courier'), section: 'orders' as const },
              { label: 'Delivered Orders', value: dashboardSummary.deliveredOrders, target: () => handleSummaryCardClick('orders', 'delivered'), section: 'orders' as const },
              { label: 'Returned Orders', value: dashboardSummary.returnedOrders, target: () => handleSummaryCardClick('orders', 'returned'), section: 'orders' as const },
              { label: 'Cancelled Orders', value: dashboardSummary.cancelledOrders, target: () => handleSummaryCardClick('orders', 'cancelled'), section: 'orders' as const },
              { label: 'Total Revenue', value: formatBDT(dashboardSummary.totalRevenue), target: () => handleSummaryCardClick('orders'), section: 'orders' as const },
              { label: "Today's Revenue", value: formatBDT(dashboardSummary.todayRevenue), target: () => handleSummaryCardClick('orders'), section: 'orders' as const },
              { label: 'Average Order Value', value: formatBDT(opsReport.aov), target: () => handleSummaryCardClick('orders'), section: 'dashboard' as const },
              { label: '7-Day Revenue', value: formatBDT(opsReport.last7Revenue), target: () => handleSummaryCardClick('orders'), section: 'dashboard' as const },
              { label: 'Pending COD Value', value: formatBDT(opsReport.pendingValue), target: () => handleSummaryCardClick('orders', 'new' as const), section: 'orders' as const },
              { label: 'Total Products', value: dashboardSummary.totalProducts, target: () => handleSummaryCardClick('products'), section: 'products' as const },
              { label: 'Out of Stock Products', value: dashboardSummary.outOfStockProducts, target: () => handleSummaryCardClick('products'), section: 'products' as const },
              { label: 'Low Stock Products', value: dashboardSummary.lowStockProducts, target: () => handleSummaryCardClick('products'), section: 'products' as const },
              { label: 'Total Customers', value: dashboardSummary.totalCustomers, target: () => handleSummaryCardClick('customers'), section: 'customers' as const },
              { label: 'Total Brands', value: dashboardSummary.totalBrands, target: () => { setShowBrandManagement(true); scrollToSection('brands-management') }, section: 'brands' as const },
              { label: 'Archived Brands', value: dashboardSummary.archivedBrandsCount, target: () => { setShowBrandManagement(true); scrollToSection('brands-management') }, section: 'brands' as const },
              { label: 'Live Mode', value: firebaseReady ? 'Firebase' : launchModeEnabled ? 'Launch Mode' : 'Unavailable', target: () => handleSummaryCardClick('homepage'), section: 'homepage' as const },
              { label: 'Founder Profile', value: founderProfile?.name ?? '-', target: () => handleSummaryCardClick('founder'), section: 'founder' as const },
            ].filter((card) => canSee(card.section)).map((card) => (
              <button key={card.label} type="button" onClick={card.target} className="text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
                <Card className="h-full rounded-[1.6rem] p-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-accent)]">{card.label}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{card.value}</h2>
                </Card>
              </button>
            ))}
          </div>

          <div className={`mt-6 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4 ${canSee('dashboard') ? '' : 'hidden'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Operations report</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {opsReport.billableOrders} billable orders · {formatBDT(opsReport.revenue)} revenue · AOV {formatBDT(opsReport.aov)} · cancel rate {opsReport.cancelledRate}%
                </p>
              </div>
              <button
                type="button"
                onClick={exportOpsReport}
                className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]"
              >
                Export report
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                ['7d', () => setReportRange(defaultOpsReportRange())],
                ['30d', () => setReportRange({ from: shiftDayKey(toDayKey(new Date()), -29), to: toDayKey(new Date()) })],
                ['Today', () => setReportRange({ from: toDayKey(new Date()), to: toDayKey(new Date()) })],
                ['All', () => setReportRange({ from: '', to: '' })],
              ] as const).map(([label, onClick]) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClick}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]"
                >
                  {label}
                </button>
              ))}
              <input
                type="date"
                value={reportRange.from ?? ''}
                onChange={(event) => setReportRange((current) => ({ ...current, from: event.target.value }))}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                aria-label="Report from date"
              />
              <input
                type="date"
                value={reportRange.to ?? ''}
                onChange={(event) => setReportRange((current) => ({ ...current, to: event.target.value }))}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)] outline-none"
                aria-label="Report to date"
              />
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-[var(--color-muted)]">
              {opsReport.bestSellers.length ? opsReport.bestSellers.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <span className="truncate text-[var(--color-text)]">{item.name}</span>
                  <span className="shrink-0">{item.quantity} sold · {formatBDT(item.revenue)}</span>
                </div>
              )) : (
                <p>Product sales appear after billable orders in this date range.</p>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr] ${canSee('products') ? '' : 'hidden'}`}>
          <div id="products-management">
            <Card className="rounded-[2rem] p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Product CRUD</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Add or refine your catalog</h2>
                </div>
                <Button onClick={resetForm} variant="secondary">Reset</Button>
              </div>
              <ProductCsvPanel products={products} canWrite={Boolean(user?.canWrite)} onMessage={setMessage} />

              <form className="mt-6 space-y-4" onSubmit={handleSaveProduct}>
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Product name" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Price" />
                  <input required type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Total stock" />
                </div>
                <input value={form.comparePrice} onChange={(event) => setForm({ ...form, comparePrice: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Compare at price (optional)" />
                  <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Category slug (example: shirts, polos, kurti)" />
                  {taxonomyCategoryOptions.length ? (
                    <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Recommended category map</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {taxonomyCategoryOptions.map((option) => (
                          <button
                            key={`${option.segment}-${option.slug}`}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, category: option.slug }))}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${form.category === option.slug ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {availableCategoryNames.length ? (
                    <div className="flex flex-wrap gap-2">
                      {availableCategoryNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, category: name }))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${form.category === name ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Description" />
                <input value={form.sizes.join(',')} onChange={(event) => {
                  const sizes = normalizeSizes(event.target.value)
                  setForm((current) => ({ ...current, sizes, variants: rebuildVariantMatrix(sizes, current.colors, current.variants) }))
                }} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Sizes (comma or space separated)" />
                <input value={form.colors.join(',')} onChange={(event) => {
                  const colors = event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean)
                  setForm((current) => ({ ...current, colors, variants: rebuildVariantMatrix(current.sizes, colors, current.variants) }))
                }} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Colors (comma separated)" />
                {form.sizes.length && form.colors.length ? (
                  <div className="overflow-x-auto rounded-[1.2rem] border border-[var(--color-border)] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Size × color stock</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">Leave at 0 to keep a single product-level stock count.</p>
                    <table className="mt-3 min-w-full text-left text-xs">
                      <thead>
                        <tr>
                          <th className="pb-2 pr-2 font-semibold text-[var(--color-muted)]">Size</th>
                          {form.colors.map((color) => (
                            <th key={color} className="pb-2 pr-2 font-semibold text-[var(--color-muted)]">{color}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {form.sizes.map((size) => (
                          <tr key={size}>
                            <td className="py-1 pr-2 font-semibold text-[var(--color-text)]">{size}</td>
                            {form.colors.map((color) => {
                              const current = form.variants.find((entry) => entry.size === size && entry.color === color)?.stock ?? 0
                              return (
                                <td key={`${size}-${color}`} className="py-1 pr-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={current}
                                    onChange={(event) => {
                                      const stock = Math.max(0, Number(event.target.value) || 0)
                                      setForm((formState) => {
                                        const variants = rebuildVariantMatrix(formState.sizes, formState.colors, formState.variants).map((entry) => (
                                          entry.size === size && entry.color === color ? { ...entry, stock } : entry
                                        ))
                                        const total = variants.reduce((sum, entry) => sum + entry.stock, 0)
                                        return { ...formState, variants, stock: total > 0 ? total : formState.stock }
                                      })
                                    }}
                                    className="w-16 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[var(--color-text)] outline-none"
                                    aria-label={`${size} ${color} stock`}
                                  />
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                <div className="space-y-3">
                  {form.images.map((image, index) => {
                    const label = galleryLabel(index)
                    return (
                    <div key={`gallery-slot-${index}`} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
                          <p className="mt-1 text-xs text-[var(--color-muted)]">Upload, replace, or remove this image.</p>
                        </div>
                        {image ? (
                          <button type="button" onClick={() => handleRemoveGalleryImage(index)} className="text-sm font-semibold text-[var(--color-accent)]">
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <label className="mt-3 flex cursor-pointer items-center justify-center overflow-hidden rounded-[1.2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/80 p-2">
                        <input type="file" accept="image/*" onChange={(event) => handleGalleryUpload(event.target.files, index)} className="hidden" />
                        {image ? (
                          <img src={image} alt={label} className="h-28 w-full rounded-[1rem] object-cover object-center" />
                        ) : (
                          <span className="py-8 text-sm text-[var(--color-muted)]">Tap to upload {label.toLowerCase()}</span>
                        )}
                      </label>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input value={form.imageTitles[index] ?? ''} onChange={(event) => setForm((current) => {
                          const nextImageTitles = [...current.imageTitles]
                          nextImageTitles[index] = event.target.value
                          return { ...current, imageTitles: nextImageTitles }
                        })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Image title" />
                        <textarea value={form.imageDescriptions[index] ?? ''} onChange={(event) => setForm((current) => {
                          const nextImageDescriptions = [...current.imageDescriptions]
                          nextImageDescriptions[index] = event.target.value
                          return { ...current, imageDescriptions: nextImageDescriptions }
                        })} className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none sm:col-span-2" placeholder="Image description" />
                      </div>
                    </div>
                    )
                  })}
                  {form.images.length < MAX_PRODUCT_IMAGES ? (
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({
                        ...current,
                        images: [...current.images, ''],
                        imageTitles: [...current.imageTitles, ''],
                        imageDescriptions: [...current.imageDescriptions, ''],
                      }))}
                      className="rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text)]"
                    >
                      Add image slot
                    </button>
                  ) : null}
                </div>
                <div className="space-y-3 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">Videos</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">Upload clips for product stories or trims.</p>
                    </div>
                    <label className="cursor-pointer rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text)]">
                      <input type="file" accept="video/*" multiple onChange={(event) => handleUpload(event.target.files, 'product-videos')} className="hidden" />
                      Add video
                    </label>
                  </div>
                  {form.videos.length ? (
                    <div className="space-y-2">
                      {form.videos.map((video) => (
                        <div key={video} className="flex items-center justify-between rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-muted)]">
                          <span className="truncate">{video}</span>
                          <button type="button" onClick={() => handleRemoveMedia(video, 'video')} className="ml-3 font-semibold text-[var(--color-accent)]">Remove</button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-[var(--color-muted)]">No product videos yet.</p>}
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <label className="flex items-center gap-2 text-[var(--color-muted)]"><input type="checkbox" checked={form.featured} onChange={() => setForm({ ...form, featured: !form.featured })} /> Featured</label>
                  <label className="flex items-center gap-2 text-[var(--color-muted)]"><input type="checkbox" checked={form.newArrival} onChange={() => setForm({ ...form, newArrival: !form.newArrival })} /> New arrival</label>
                  <label className="flex items-center gap-2 text-[var(--color-muted)]"><input type="checkbox" checked={form.hero} onChange={() => setForm({ ...form, hero: !form.hero })} /> Hero spotlight</label>
                </div>
                <Button type="submit" disabled={loading} className="w-full justify-center">{isEditing ? 'Update product' : 'Create product'}</Button>
              </form>
            </Card>
          </div>

          <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Catalog</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Fast inventory control</h2>
              </div>
              <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} className="w-32 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none sm:w-44" placeholder="Search products" />
            </div>
            {lowStockCatalog.length ? (
              <div className="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Low stock</p>
                <div className="mt-2 space-y-1.5">
                  {lowStockCatalog.map((product) => (
                    <button
                      key={`low-stock-${product.id}`}
                      type="button"
                      onClick={() => handleEditProduct(product)}
                      className="flex w-full items-center justify-between gap-2 text-left text-sm text-[var(--color-text)]"
                    >
                      <span className="truncate">{product.name}</span>
                      <span className="shrink-0 font-semibold">{product.stock <= 0 ? 'Out' : product.stock}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Bulk stock / price</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input value={bulkStock} onChange={(event) => setBulkStock(event.target.value)} type="number" min="0" className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Stock" />
                <input value={bulkPrice} onChange={(event) => setBulkPrice(event.target.value)} className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Price" />
                <button type="button" onClick={() => { void handleBulkProductUpdate() }} disabled={loading || !selectedProductIds.length} className="rounded-full border border-black bg-black px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-black/35">
                  Apply ({selectedProductIds.length})
                </button>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                     <div className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="mt-1"
                        aria-label={`Select ${product.name}`}
                      />
                      <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[var(--color-text)]">{product.name}</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{product.category} • {product.stock} in stock</p>
                      {product.comparePrice ? (
                        <p className="mt-1 text-xs text-black/50 line-through">{product.comparePrice}</p>
                      ) : null}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-accent)]">{product.price}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEditProduct(product)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">Edit</button>
                    <button type="button" onClick={() => handleDeleteProduct(product.id)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)]">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div id="orders-management" className={canSee('orders') ? '' : 'hidden'}>
            <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Orders</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Manage the full order lifecycle</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderStatusFilter('all')
                    setOrderPaymentFilter('all')
                  }}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]"
                >
                  Show all
                </button>
                <button
                  type="button"
                  onClick={exportOrdersCSV}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]"
                >
                  Export CSV
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Search orders" />
              <input type="date" value={orderDateFrom} onChange={(event) => setOrderDateFrom(event.target.value)} className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" aria-label="Orders from date" />
              <input type="date" value={orderDateTo} onChange={(event) => setOrderDateTo(event.target.value)} className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" aria-label="Orders to date" />
            </div>
            <div className="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Status pipeline</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                {ORDER_LIFECYCLE.map((status, index) => (
                  <div key={status} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter(status)}
                      className={`rounded-full border px-3 py-1.5 font-semibold ${orderStatusFilter === status || (status === 'in_courier' && orderStatusFilter === 'shipped') ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}
                    >
                      {ORDER_STATUS_LABELS[status]}
                    </button>
                    {index < ORDER_LIFECYCLE.length - 1 ? <span aria-hidden="true">→</span> : null}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('cancelled')}
                  className={`rounded-full border px-3 py-1.5 font-semibold ${orderStatusFilter === 'cancelled' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}
                >
                  Cancelled
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatusFilter('returned')}
                  className={`rounded-full border px-3 py-1.5 font-semibold ${orderStatusFilter === 'returned' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}
                >
                  Returned
                </button>
              </div>
            </div>
            <div className="mt-3 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Payment queue</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {([
                  ['all', 'All payments'],
                  ['pending_verification', 'Verify payment'],
                  ['paid', 'Paid online'],
                  ['unpaid', 'Unpaid COD'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOrderPaymentFilter(value)}
                    className={`rounded-full border px-3 py-1.5 font-semibold ${orderPaymentFilter === value ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {pendingPaymentOrders.length && (orderPaymentFilter === 'all' || orderPaymentFilter === 'pending_verification') ? (
              <div className="mt-4 rounded-[1.2rem] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950">
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Wallet verification queue</p>
                <p className="mt-1">{pendingPaymentOrders.length} order{pendingPaymentOrders.length === 1 ? '' : 's'} waiting for TrxID verification. Confirm payment after checking bKash/Nagad app.</p>
              </div>
            ) : null}
            {pendingQueueOrders.length && (orderStatusFilter === 'all' || orderStatusFilter === 'new') ? (
              <div className="mt-4 rounded-[1.2rem] border border-black bg-black px-4 py-3 text-sm text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Pending queue</p>
                <p className="mt-1">{pendingQueueOrders.length} new order{pendingQueueOrders.length === 1 ? '' : 's'} waiting to be confirmed.</p>
              </div>
            ) : null}
            <div className="mt-5 space-y-3">
              {filteredOrders.map((order) => (
                <div key={order.id} className={`rounded-[1.4rem] border bg-[var(--color-bg)]/70 p-4 ${order.status === 'new' || order.paymentStatus === 'pending_verification' ? 'border-black' : 'border-[var(--color-border)]'}`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {order.status === 'new' ? (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black">Pending order</p>
                    ) : null}
                    {order.paymentStatus ? (
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${paymentStatusBadgeClass(order.paymentStatus)}`}>
                        {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                      </span>
                    ) : null}
                    {order.paymentMethod ? (
                      <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                        {order.paymentMethod}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <input value={orderEdits[order.id]?.customerName ?? order.customerName} onChange={(event) => setOrderEdits((current) => ({ ...current, [order.id]: { ...current[order.id], customerName: event.target.value } }))} className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] outline-none" placeholder="Customer name" />
                      <input value={orderEdits[order.id]?.customerPhone ?? order.customerPhone ?? ''} onChange={(event) => setOrderEdits((current) => ({ ...current, [order.id]: { ...current[order.id], customerPhone: event.target.value } }))} className="mt-2 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Phone" />
                      <input value={orderEdits[order.id]?.customerEmail ?? order.customerEmail ?? ''} onChange={(event) => setOrderEdits((current) => ({ ...current, [order.id]: { ...current[order.id], customerEmail: event.target.value } }))} className="mt-2 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Email" />
                      <textarea value={orderEdits[order.id]?.address ?? order.address} onChange={(event) => setOrderEdits((current) => ({ ...current, [order.id]: { ...current[order.id], address: event.target.value } }))} className="mt-2 min-h-20 w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Address" />
                      <textarea value={orderEdits[order.id]?.notes ?? order.notes ?? ''} onChange={(event) => setOrderEdits((current) => ({ ...current, [order.id]: { ...current[order.id], notes: event.target.value } }))} className="mt-2 min-h-16 w-full rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Notes" />
                    </div>
                    <div className="min-w-[180px]">
                      <select value={order.status} onChange={(event) => handleStatusChange(order.id, event.target.value as AdminOrder['status'])} className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none">
                        {ORDER_STATUSES.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABELS[status]}</option>)}
                      </select>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">Current: {ORDER_STATUS_LABELS[order.status]}</p>
                      <input value={orderEdits[order.id]?.trackingNumber ?? order.trackingNumber ?? ''} onChange={(event) => setOrderEdits((current) => ({ ...current, [order.id]: { ...current[order.id], trackingNumber: event.target.value } }))} className="mt-2 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Tracking number" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(ORDER_STATUS_TRANSITIONS[order.status] ?? []).map((nextStatus) => (
                          <button
                            key={`${order.id}-${nextStatus}`}
                            type="button"
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                            className={`rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold ${nextStatus === 'cancelled' || nextStatus === 'returned' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}
                          >
                            Mark {ORDER_STATUS_LABELS[nextStatus]}
                          </button>
                        ))}
                        <button type="button" onClick={() => handleSaveOrder(order.id)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">Save</button>
                        {getOrderWhatsAppHref(order, orderEdits[order.id]) ? (
                          <a
                            href={getOrderWhatsAppHref(order, orderEdits[order.id])}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]"
                          >
                            WhatsApp customer
                          </a>
                        ) : null}
                        <button type="button" onClick={() => handleDeleteOrder(order.id)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)]">Delete</button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-4 text-sm text-[var(--color-muted)] sm:grid-cols-2">
                    <div className="space-y-2">
                      <p><span className="font-semibold text-[var(--color-text)]">Division:</span> {order.deliveryAddress?.division ?? '-'}</p>
                      <p><span className="font-semibold text-[var(--color-text)]">District / Zilla:</span> {order.deliveryAddress?.district ?? '-'}</p>
                      <p><span className="font-semibold text-[var(--color-text)]">Street Address:</span> {order.deliveryAddress?.streetAddress ?? order.address ?? '-'}</p>
                      <p><span className="font-semibold text-[var(--color-text)]">Delivery Note:</span> {order.deliveryAddress?.deliveryNote || order.notes || '-'}</p>
                      <p><span className="font-semibold text-[var(--color-text)]">Order Date & Time:</span> {formatOrderDateTime(order.createdAt)}</p>
                    </div>
                    <div className="space-y-2">
                      <p><span className="font-semibold text-[var(--color-text)]">Delivery Charge:</span> {formatBDT(order.deliveryCharge ?? 0)}</p>
                      <p><span className="font-semibold text-[var(--color-text)]">Payment:</span> {order.paymentMethod ?? 'Cash on Delivery'}</p>
                      {order.paymentStatus ? (
                        <p><span className="font-semibold text-[var(--color-text)]">Payment status:</span> {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}</p>
                      ) : null}
                      {order.paymentTransactionId ? (
                        <p><span className="font-semibold text-[var(--color-text)]">TrxID:</span> <span className="font-mono tracking-[0.08em]">{order.paymentTransactionId}</span></p>
                      ) : null}
                      {order.paymentStatus === 'pending_verification' ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmPayment(order.id)}
                          className="mt-2 rounded-full border border-[var(--color-border)] bg-[var(--color-text)] px-3 py-1.5 text-xs font-semibold text-[var(--color-surface)]"
                        >
                          Confirm payment
                        </button>
                      ) : null}
                      <p><span className="font-semibold text-[var(--color-text)]">Grand Total:</span> {formatBDT(order.total)}</p>
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">Ordered Products</p>
                        <div className="mt-1 space-y-1">
                           {order.items.map((item) => (
                             <p key={`${order.id}-${item.name}`}>
                               {item.name} × {item.quantity}{item.size ? ` • ${item.size}` : ''} • {item.price}
                             </p>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </Card>
          </div>

          <div id="homepage-management" className={canSee('homepage') ? '' : 'hidden'}>
            <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Homepage</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Tune the storefront instantly</h2>
              </div>
              <div className="relative z-10 flex flex-wrap items-center gap-2">
                <Button type="button" onClick={handleHomepageWriteTest} variant="secondary" disabled={homepageSaving}>Test Firestore write</Button>
                <Button type="button" onClick={handleHomepageSave} variant="secondary" disabled={homepageSaving}>{homepageSaving ? 'Saving...' : 'Save content'}</Button>
              </div>
            </div>
            <div className="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 text-xs text-[var(--color-muted)]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Homepage Save Diagnostics</p>
                <button
                  type="button"
                  onClick={handleCopyHomepageDebug}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 text-[11px] font-semibold text-[var(--color-text)]"
                >
                  Copy debug
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <p><span className="font-semibold text-[var(--color-text)]">Status:</span> {homepageSaveDebug.status}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Message:</span> {homepageSaveDebug.message}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Target document:</span> {homepageSaveDebug.path}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Last mode:</span> {homepageSaveDebug.mode}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Last snapshot source:</span> {homepageSnapshotDebug?.source ?? '-'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Snapshot path:</span> {homepageSnapshotDebug?.path ?? '-'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Snapshot time:</span> {homepageSnapshotDebug?.receivedAt ? new Date(homepageSnapshotDebug.receivedAt).toLocaleString('en-BD') : '-'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Local-first mode:</span> {isHomepageLocalFirstMode() ? 'enabled' : 'disabled'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Firebase configured:</span> {firebaseReady ? 'yes' : 'no'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Firebase project:</span> {homepageSaveDebug.firebaseProjectId || (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '(missing)'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Auth email:</span> {user?.email ?? '(not signed in)'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Auth uid:</span> {user?.uid ?? '(not signed in)'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Can write:</span> {user?.canWrite ? 'yes' : 'no'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Needs admin doc:</span> {user?.needsAdminDoc ? `yes (admins/${user?.uid ?? 'uid'})` : 'no'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Hero URL snapshot:</span> {homepageSaveDebug.heroImage || '(empty)'}</p>
                <p className="sm:col-span-2 break-all"><span className="font-semibold text-[var(--color-text)]">Current Saree coverImage (save state):</span> {homepageContent?.categorySections?.saree?.coverImage || '(empty)'}</p>
                <p className="sm:col-span-2 break-all"><span className="font-semibold text-[var(--color-text)]">Last verified Saree coverImage:</span> {homepageSaveDebug.sareeCoverImage || '(none yet)'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Last click time:</span> {homepageSaveDebug.lastClickAt ? new Date(homepageSaveDebug.lastClickAt).toLocaleString('en-BD') : '-'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Last save time:</span> {homepageSaveDebug.savedAt ? new Date(homepageSaveDebug.savedAt).toLocaleString('en-BD') : '-'}</p>
              </div>
            </div>
            {homepageContent ? (
              <div className="mt-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.navbarBrandPrimary ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, navbarBrandPrimary: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Navbar brand line 1" />
                  <input value={homepageContent.navbarBrandSecondary ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, navbarBrandSecondary: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Navbar brand line 2" />
                </div>
                <input value={homepageContent.navbarSearchPlaceholder ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, navbarSearchPlaceholder: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Navbar search placeholder" />
                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">SEO quick controls</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">Update title, description, and keywords for Home, Shop, and Oversized listing pages.</p>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Home page SEO</p>
                      <div className="mt-3 grid gap-3">
                        <input
                          value={homepageContent.seo?.home?.title ?? ''}
                          onChange={(event) => setHomepageContent({
                            ...homepageContent,
                            seo: {
                              ...(homepageContent.seo ?? {}),
                              home: {
                                ...(homepageContent.seo?.home ?? { title: '', description: '', keywords: '', ogImage: '' }),
                                title: event.target.value,
                              },
                            },
                          })}
                          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Home meta title"
                        />
                        <textarea
                          value={homepageContent.seo?.home?.description ?? ''}
                          onChange={(event) => setHomepageContent({
                            ...homepageContent,
                            seo: {
                              ...(homepageContent.seo ?? {}),
                              home: {
                                ...(homepageContent.seo?.home ?? { title: '', description: '', keywords: '', ogImage: '' }),
                                description: event.target.value,
                              },
                            },
                          })}
                          className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Home meta description"
                        />
                        <input
                          value={homepageContent.seo?.home?.keywords ?? ''}
                          onChange={(event) => setHomepageContent({
                            ...homepageContent,
                            seo: {
                              ...(homepageContent.seo ?? {}),
                              home: {
                                ...(homepageContent.seo?.home ?? { title: '', description: '', keywords: '', ogImage: '' }),
                                keywords: event.target.value,
                              },
                            },
                          })}
                          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Home keywords (comma separated)"
                        />
                      </div>
                    </div>

                    <div className="rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Shop page SEO (/shop)</p>
                      <div className="mt-3 grid gap-3">
                        <input
                          value={homepageContent.seo?.shop?.title ?? ''}
                          onChange={(event) => setHomepageContent({
                            ...homepageContent,
                            seo: {
                              ...(homepageContent.seo ?? {}),
                              shop: {
                                ...(homepageContent.seo?.shop ?? { title: '', description: '', keywords: '', ogImage: '' }),
                                title: event.target.value,
                              },
                            },
                          })}
                          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Shop meta title"
                        />
                        <textarea
                          value={homepageContent.seo?.shop?.description ?? ''}
                          onChange={(event) => setHomepageContent({
                            ...homepageContent,
                            seo: {
                              ...(homepageContent.seo ?? {}),
                              shop: {
                                ...(homepageContent.seo?.shop ?? { title: '', description: '', keywords: '', ogImage: '' }),
                                description: event.target.value,
                              },
                            },
                          })}
                          className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Shop meta description"
                        />
                        <input
                          value={homepageContent.seo?.shop?.keywords ?? ''}
                          onChange={(event) => setHomepageContent({
                            ...homepageContent,
                            seo: {
                              ...(homepageContent.seo ?? {}),
                              shop: {
                                ...(homepageContent.seo?.shop ?? { title: '', description: '', keywords: '', ogImage: '' }),
                                keywords: event.target.value,
                              },
                            },
                          })}
                          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Shop keywords (comma separated)"
                        />
                      </div>
                    </div>

                    <div className="rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">Oversized listing SEO (/collections/oversized-tee)</p>
                      <div className="mt-3 grid gap-3">
                        <input
                          value={homepageContent.seo?.oversized?.title ?? ''}
                          onChange={(event) => setHomepageContent({
                            ...homepageContent,
                            seo: {
                              ...(homepageContent.seo ?? {}),
                              oversized: {
                                ...(homepageContent.seo?.oversized ?? { title: '', description: '', keywords: '', ogImage: '' }),
                                title: event.target.value,
                              },
                            },
                          })}
                          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Oversized meta title"
                        />
                        <textarea
                          value={homepageContent.seo?.oversized?.description ?? ''}
                          onChange={(event) => setHomepageContent({
                            ...homepageContent,
                            seo: {
                              ...(homepageContent.seo ?? {}),
                              oversized: {
                                ...(homepageContent.seo?.oversized ?? { title: '', description: '', keywords: '', ogImage: '' }),
                                description: event.target.value,
                              },
                            },
                          })}
                          className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Oversized meta description"
                        />
                        <input
                          value={homepageContent.seo?.oversized?.keywords ?? ''}
                          onChange={(event) => setHomepageContent({
                            ...homepageContent,
                            seo: {
                              ...(homepageContent.seo ?? {}),
                              oversized: {
                                ...(homepageContent.seo?.oversized ?? { title: '', description: '', keywords: '', ogImage: '' }),
                                keywords: event.target.value,
                              },
                            },
                          })}
                          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Oversized keywords (comma separated)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">Homepage structure</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">Show or hide sections and change the live website order.</p>
                    </div>
                    <p className="text-xs font-semibold text-[var(--color-accent)]">
                      {(homepageSections.filter((section) => section.enabled).length)} live / {homepageSections.length} total
                    </p>
                  </div>
                  <div className="mt-4 space-y-3">
                    {homepageSections.map((section) => (
                      <div key={section.key} className="flex flex-col gap-3 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text)]">{section.label}</p>
                          <p className="text-xs text-[var(--color-muted)]">Order {section.order}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => updateHomepageSection(section.key, { enabled: !section.enabled })} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${section.enabled ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}>
                            {section.enabled ? 'Visible' : 'Hidden'}
                          </button>
                          <button type="button" onClick={() => reorderHomepageSection(section.key, -1)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">Up</button>
                          <button type="button" onClick={() => reorderHomepageSection(section.key, 1)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">Down</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.heroEyebrow ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, heroEyebrow: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Hero small heading" />
                  <input value={homepageContent.heroTitle} onChange={(event) => setHomepageContent({ ...homepageContent, heroTitle: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Hero main heading" />
                </div>
                <textarea value={homepageContent.heroSubtitle} onChange={(event) => setHomepageContent({ ...homepageContent, heroSubtitle: event.target.value })} className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Hero description" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.heroImageTitle ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, heroImageTitle: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Hero image title" />
                  <textarea value={homepageContent.heroImageDescription ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, heroImageDescription: event.target.value })} className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none sm:col-span-2" placeholder="Hero image description" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.heroCta} onChange={(event) => setHomepageContent({ ...homepageContent, heroCta: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Primary button text" />
                  <input value={homepageContent.heroPrimaryLink ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, heroPrimaryLink: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Primary button link" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.heroSecondaryCta ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, heroSecondaryCta: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Secondary button text" />
                  <input value={homepageContent.heroSecondaryLink ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, heroSecondaryLink: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Secondary button link" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.featuredCollectionEyebrow ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, featuredCollectionEyebrow: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Featured collection eyebrow" />
                  <input value={homepageContent.featuredCollectionTitle ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, featuredCollectionTitle: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Featured collection title" />
                </div>
                <textarea value={homepageContent.featuredCollectionSubtitle ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, featuredCollectionSubtitle: event.target.value })} className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Featured collection subtitle" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.newArrivalsEyebrow ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, newArrivalsEyebrow: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="New arrivals eyebrow" />
                  <input value={homepageContent.newArrivalsTitle} onChange={(event) => setHomepageContent({ ...homepageContent, newArrivalsTitle: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="New arrivals title" />
                </div>
                <textarea value={homepageContent.newArrivalsSubtitle} onChange={(event) => setHomepageContent({ ...homepageContent, newArrivalsSubtitle: event.target.value })} className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="New arrivals subtitle" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.bestSellerEyebrow ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, bestSellerEyebrow: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Best seller eyebrow" />
                  <input value={homepageContent.featuredTitle} onChange={(event) => setHomepageContent({ ...homepageContent, featuredTitle: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Best seller title" />
                </div>
                <textarea value={homepageContent.featuredSubtitle} onChange={(event) => setHomepageContent({ ...homepageContent, featuredSubtitle: event.target.value })} className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Best seller subtitle" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.brandPromiseEyebrow ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, brandPromiseEyebrow: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Brand promise eyebrow" />
                  <input value={homepageContent.brandPromiseTitle ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, brandPromiseTitle: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Brand promise title" />
                </div>
                <textarea value={homepageContent.brandPromiseDescription ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, brandPromiseDescription: event.target.value })} className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Brand promise description" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.brandSignatureLabel ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, brandSignatureLabel: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Signature label" />
                  <input value={homepageContent.brandSignatureText ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, brandSignatureText: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Signature text" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.footerBrandTitle ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, footerBrandTitle: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Footer brand title" />
                  <input value={homepageContent.footerDescription ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, footerDescription: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Footer description" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.footerContactEmail ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, footerContactEmail: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Footer contact email" />
                  <input value={homepageContent.footerContactPhone ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, footerContactPhone: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Footer contact phone" />
                </div>
                <input value={homepageContent.footerContactAddress ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, footerContactAddress: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Footer contact address" />
                <input value={homepageContent.footerBottomText ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, footerBottomText: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Footer bottom text" />
                <div className="grid gap-2">
                  <label htmlFor="free-delivery-threshold" className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Free delivery threshold (BDT)
                  </label>
                  <input
                    id="free-delivery-threshold"
                    type="number"
                    min="0"
                    value={String(homepageContent.freeDeliveryThreshold ?? 3000)}
                    onChange={(event) => {
                      const parsed = Number(event.target.value)
                      setHomepageContent({
                        ...homepageContent,
                        freeDeliveryThreshold: Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0,
                      })
                    }}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                    placeholder="3000"
                  />
                  <p className="text-xs text-[var(--color-muted)]">Mini cart confirmation uses this amount to show free-delivery progress.</p>
                </div>
                <div onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => handleDrop(event, 'hero-image')} className={`rounded-[1.5rem] border border-dashed p-4 text-center text-sm ${dragActive ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files, 'hero-image')} className="hidden" />
                    Drop hero image or tap to replace.
                  </label>
                </div>
                {homepageContent.heroImage ? (
                  <div className="relative">
                    <img src={homepageContent.heroImage} alt="Hero preview" className="h-40 w-full rounded-[1.25rem] object-cover object-center" />
                    <button type="button" onClick={async () => {
                      try {
                        const imageUrl = homepageContent.heroImage!
                        await deleteAsset(imageUrl)
                        const nextContent = { ...homepageContent, heroImage: '' }
                        setHomepageContent(nextContent)
                        homepageDirtyRef.current = true
                        homepageSavingRef.current = true
                        try {
                          await updateHomepageContent(nextContent)
                          homepageDirtyRef.current = false
                          setMessage('Hero image removed and saved.')
                          setToast({ kind: 'success', message: 'Hero image removed.' })
                        } catch (error) {
                          const reason = error instanceof Error ? error.message : 'Hero cleared locally but Firestore save failed.'
                          setMessage(reason)
                          setToast({ kind: 'error', message: reason })
                        } finally {
                          homepageSavingRef.current = false
                        }
                      } catch {
                        setMessage('Unable to remove hero image.')
                        setToast({ kind: 'error', message: 'Unable to remove hero image.' })
                      }
                    }} className="absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">Remove</button>
                  </div>
                ) : null}
                <div onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => handleDrop(event, 'banner-image')} className={`rounded-[1.5rem] border border-dashed p-4 text-center text-sm ${dragActive ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files, 'banner-image')} className="hidden" />
                    Drop banner image or tap to replace.
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={homepageContent.bannerImageTitle ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, bannerImageTitle: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Banner image title" />
                  <textarea value={homepageContent.bannerImageDescription ?? ''} onChange={(event) => setHomepageContent({ ...homepageContent, bannerImageDescription: event.target.value })} className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none sm:col-span-2" placeholder="Banner image description" />
                </div>
                {homepageContent.bannerImage ? (
                  <div className="relative">
                    <img src={homepageContent.bannerImage} alt="Banner preview" className="h-40 w-full rounded-[1.25rem] object-cover object-center" />
                    <button type="button" onClick={async () => {
                      try {
                        const imageUrl = homepageContent.bannerImage!
                        await deleteAsset(imageUrl)
                        const nextContent = { ...homepageContent, bannerImage: '' }
                        setHomepageContent(nextContent)
                        homepageDirtyRef.current = true
                        homepageSavingRef.current = true
                        try {
                          await updateHomepageContent(nextContent)
                          homepageDirtyRef.current = false
                          setMessage('Banner image removed and saved.')
                          setToast({ kind: 'success', message: 'Banner image removed.' })
                        } catch (error) {
                          const reason = error instanceof Error ? error.message : 'Banner cleared locally but Firestore save failed.'
                          setMessage(reason)
                          setToast({ kind: 'error', message: reason })
                        } finally {
                          homepageSavingRef.current = false
                        }
                      } catch {
                        setMessage('Unable to remove banner image.')
                        setToast({ kind: 'error', message: 'Unable to remove banner image.' })
                      }
                    }} className="absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">Remove</button>
                  </div>
                ) : null}
                {homepageContent.categories.map((category, index) => (
                  <div key={`${category.title}-${index}`} className="grid gap-3 sm:grid-cols-2">
                    <input value={category.title} onChange={(event) => {
                      const nextCategories = [...homepageContent.categories]
                      nextCategories[index] = { ...nextCategories[index], title: event.target.value }
                      setHomepageContent({ ...homepageContent, categories: nextCategories })
                    }} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Category title" />
                    <input value={category.caption} onChange={(event) => {
                      const nextCategories = [...homepageContent.categories]
                      nextCategories[index] = { ...nextCategories[index], caption: event.target.value }
                      setHomepageContent({ ...homepageContent, categories: nextCategories })
                    }} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Category caption" />
                    <input value={category.href ?? ''} onChange={(event) => {
                      const nextCategories = [...homepageContent.categories]
                      nextCategories[index] = { ...nextCategories[index], href: event.target.value }
                      setHomepageContent({ ...homepageContent, categories: nextCategories })
                    }} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none sm:col-span-2" placeholder="Category link (example: /collections/winter)" />
                    <div className="sm:col-span-2">
                      <label className="cursor-pointer text-sm text-[var(--color-muted)]">
                        <input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files, 'category-image', index)} className="hidden" />
                        Set category image
                      </label>
                      {category.image ? (
                        <div className="relative">
                          <img src={category.image} alt={`${category.title} preview`} className="mt-3 h-24 w-full rounded-[1rem] object-cover object-center" />
                          <button type="button" onClick={async () => {
                            try {
                              await deleteAsset(category.image!)
                              const nextCategories = [...homepageContent.categories]
                              nextCategories[index] = { ...nextCategories[index], image: '' }
                              const nextContent = { ...homepageContent, categories: nextCategories }
                              setHomepageContent(nextContent)
                              homepageDirtyRef.current = true
                              homepageSavingRef.current = true
                              try {
                                await updateHomepageContent(nextContent)
                                homepageDirtyRef.current = false
                                setMessage('Category image removed and saved.')
                                setToast({ kind: 'success', message: 'Category image removed.' })
                              } catch (error) {
                                const reason = error instanceof Error ? error.message : 'Image removed from CDN but save failed.'
                                setMessage(reason)
                                setToast({ kind: 'error', message: reason })
                              } finally {
                                homepageSavingRef.current = false
                              }
                            } catch {
                              setMessage('Unable to remove category image.')
                              setToast({ kind: 'error', message: 'Unable to remove category image.' })
                            }
                          }} className="absolute right-3 top-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">Remove</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Featured listing pages</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Manage Winter, Summer, and Everyday wear listing pages with dedicated images and route slugs.</p>

                  <div className="mt-4 space-y-4">
                    {homepageContent.featuredCollectionPages.map((page, pageIndex) => (
                      <div key={page.slug} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            value={page.title}
                            onChange={(event) => updateFeaturedCollectionPageField(pageIndex, 'title', event.target.value)}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Listing page title"
                          />
                          <input
                            value={page.subtitle}
                            onChange={(event) => updateFeaturedCollectionPageField(pageIndex, 'subtitle', event.target.value)}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Listing page subtitle"
                          />
                          <input
                            value={page.slug}
                            onChange={(event) => updateFeaturedCollectionPageField(pageIndex, 'slug', event.target.value)}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Route slug (example: winter)"
                          />
                          <input
                            value={page.href}
                            onChange={(event) => updateFeaturedCollectionPageField(pageIndex, 'href', event.target.value)}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Route path (example: /collections/winter)"
                          />
                        </div>
                        <textarea
                          value={page.description}
                          onChange={(event) => updateFeaturedCollectionPageField(pageIndex, 'description', event.target.value)}
                          className="mt-3 min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Listing page description"
                        />
                        <input
                          value={page.relatedCategorySlugs.join(', ')}
                          onChange={(event) => updateFeaturedCollectionPageField(pageIndex, 'relatedCategorySlugs', event.target.value)}
                          className="mt-3 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          placeholder="Related product categories (comma separated slugs)"
                        />

                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {Array.from({ length: 4 }).map((_, imageIndex) => {
                            const image = page.images?.[imageIndex] ?? ''
                            return (
                              <div key={`${page.slug}-image-${imageIndex}`} className="rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
                                {image ? (
                                  <img src={image} alt={`${page.title} ${imageIndex + 1}`} className="h-20 w-full rounded-[0.75rem] object-cover object-center" />
                                ) : (
                                  <div className="flex h-20 items-center justify-center rounded-[0.75rem] border border-dashed border-[var(--color-border)] text-[11px] text-[var(--color-muted)]">Image {imageIndex + 1}</div>
                                )}
                                <label className="mt-2 block cursor-pointer text-[11px] font-semibold text-[var(--color-text)]">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => handleUpload(event.target.files, 'featured-page-image', pageIndex, imageIndex)}
                                    className="hidden"
                                  />
                                  {image ? 'Replace' : 'Upload'}
                                </label>
                                {image ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFeaturedCollectionImage(pageIndex, imageIndex)}
                                    className="mt-1 text-[11px] font-semibold text-[var(--color-accent)]"
                                  >
                                    Remove
                                  </button>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3 sm:flex sm:items-center sm:justify-between">
                  <p className="text-xs text-[var(--color-muted)]">After uploading category images, click save to publish these changes.</p>
                  <Button type="button" onClick={handleHomepageSave} variant="secondary" disabled={homepageSaving} className="relative z-10 mt-3 sm:mt-0">{homepageSaving ? 'Saving...' : 'Save content'}</Button>
                </div>

                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Category sections manager</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Edit each storefront section independently. Click Save after updating Men, Women, Kids, Western, Sale, or New Arrivals.</p>
                  <div className="mt-4 space-y-4">
                    {homepageCategorySections.map((section) => (
                      <div key={section.key} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--color-text)]">{section.key.toUpperCase()}</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePreviewSectionRoute(section.href)}
                              className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text)]"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => updateHomepageCategorySection(section.key, { enabled: !section.enabled })}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${section.enabled ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}
                            >
                              {section.enabled ? 'Visible' : 'Hidden'}
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <input
                            value={section.label}
                            onChange={(event) => updateHomepageCategorySection(section.key, { label: event.target.value })}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Section label"
                          />
                          <input
                            value={section.href}
                            onChange={(event) => updateHomepageCategorySection(section.key, { href: event.target.value })}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Section route (example: /women?sub=western-outfits)"
                          />
                          <p className="sm:col-span-2 -mt-1 text-[11px] text-[var(--color-muted)]">
                            {SECTION_ROUTE_HINTS[section.key]}
                          </p>
                          <input
                            value={String(section.order)}
                            onChange={(event) => {
                              const nextOrder = Number(event.target.value)
                              if (Number.isNaN(nextOrder)) {
                                return
                              }
                              updateHomepageCategorySection(section.key, { order: nextOrder })
                            }}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Display order"
                          />
                          <input
                            value={section.coverImage}
                            onChange={(event) => updateHomepageCategorySection(section.key, { coverImage: event.target.value })}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Cover image URL"
                          />
                        </div>

                        <div className="mt-3">
                          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)]">
                            <input
                              id={`category-section-image-${section.key}`}
                              type="file"
                              accept="image/*"
                              onChange={(event) => {
                                const files = event.target.files
                                void handleUpload(files, 'category-section-image', undefined, undefined, section.key)
                                event.target.value = ''
                              }}
                              className="hidden"
                            />
                            {section.key === 'saree' ? 'Replace Saree image' : `Replace ${section.label} image`}
                          </label>

                          {section.coverImage ? (
                            <div className="relative mt-3">
                              <img src={section.coverImage} alt={`${section.label} section preview`} className="h-24 w-full rounded-[1rem] object-cover object-center" />
                              <button
                                type="button"
                                onClick={async (event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  const current = homepageContentRef.current ?? homepageContent
                                  if (!current?.categorySections?.[section.key]) {
                                    return
                                  }

                                  try {
                                    await deleteAsset(section.coverImage)
                                    const nextContent = {
                                      ...current,
                                      categorySections: {
                                        ...current.categorySections,
                                        [section.key]: {
                                          ...current.categorySections[section.key],
                                          coverImage: '',
                                          images: current.categorySections[section.key].images.filter((image) => image !== section.coverImage),
                                        },
                                      },
                                    }
                                    homepageDirtyRef.current = true
                                    homepageContentRef.current = nextContent
                                    setHomepageContent(nextContent)
                                    homepageSavingRef.current = true
                                    try {
                                      await updateHomepageContent(nextContent)
                                      homepageDirtyRef.current = false
                                      setMessage('Section image removed and saved.')
                                      setToast({ kind: 'success', message: 'Section image removed.' })
                                    } catch (error) {
                                      const reason = error instanceof Error ? error.message : 'Image removed from CDN but save failed.'
                                      setMessage(reason)
                                      setToast({ kind: 'error', message: reason })
                                    } finally {
                                      homepageSavingRef.current = false
                                    }
                                  } catch {
                                    setMessage('Unable to remove section image.')
                                    setToast({ kind: 'error', message: 'Unable to remove section image.' })
                                  }
                                }}
                                className="absolute right-3 top-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]"
                              >
                                Remove
                              </button>
                            </div>
                          ) : null}
                          <p className="mt-2 break-all text-[11px] text-[var(--color-muted)]">{section.coverImage || '(no image URL in save state yet)'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3 sm:flex sm:items-center sm:justify-between">
                  <p className="text-xs text-[var(--color-muted)]">Save section-wise edits to publish exact label, route, and image mapping.</p>
                  <Button type="button" onClick={handleHomepageSave} variant="secondary" disabled={homepageSaving} className="relative z-10 mt-3 sm:mt-0">{homepageSaving ? 'Saving...' : 'Save content'}</Button>
                </div>
              </div>
            ) : null}
            </Card>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div id="categories-management" className={canSee('categories') ? '' : 'hidden'}>
            <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Categories</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Add, edit, and archive categories</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex gap-2">
                <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Category name" />
                <Button onClick={handleSaveCategory} variant="secondary">{editingCategoryId ? 'Update' : 'Add'}</Button>
              </div>
              <p className="text-xs text-[var(--color-muted)]">Tip: Add category first, then pick it in product form for faster catalog entry.</p>
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{category.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{category.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleEditCategory(category)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">Edit</button>
                    <button type="button" onClick={() => handleDeleteCategory(category.id)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)]">Delete</button>
                  </div>
                </div>
              ))}

              <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Archive center</p>
                <div className="mt-3 grid gap-4 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">Products</p>
                    <div className="mt-2 space-y-2">
                      {archivedProducts.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center justify-between rounded-full border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]">
                          <span className="truncate pr-2">{product.name}</span>
                          <button type="button" onClick={() => handleRestoreProduct(product.id)} className="font-semibold text-[var(--color-accent)]">Restore</button>
                        </div>
                      ))}
                      {!archivedProducts.length ? <p className="text-xs text-[var(--color-muted)]">No archived products.</p> : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">Orders</p>
                    <div className="mt-2 space-y-2">
                      {archivedOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between rounded-full border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]">
                          <span className="truncate pr-2">{order.customerName} • {order.status}</span>
                          <button type="button" onClick={() => handleRestoreOrder(order.id)} className="font-semibold text-[var(--color-accent)]">Restore</button>
                        </div>
                      ))}
                      {!archivedOrders.length ? <p className="text-xs text-[var(--color-muted)]">No archived orders.</p> : null}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">Categories</p>
                    <div className="mt-2 space-y-2">
                      {archivedCategories.slice(0, 5).map((category) => (
                        <div key={category.id} className="flex items-center justify-between rounded-full border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]">
                          <span className="truncate pr-2">{category.name}</span>
                          <button type="button" onClick={() => handleRestoreCategory(category.id)} className="font-semibold text-[var(--color-accent)]">Restore</button>
                        </div>
                      ))}
                      {!archivedCategories.length ? <p className="text-xs text-[var(--color-muted)]">No archived categories.</p> : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </Card>
          </div>

          <div id="customers-management" className={canSee('customers') ? '' : 'hidden'}>
            <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Customers</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Customer information</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {customers.map((customer) => (
                <div key={customer.identity} className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
                  <input value={customerEdits[customer.identity]?.name ?? customer.name} onChange={(event) => setCustomerEdits((current) => ({ ...current, [customer.identity]: { name: event.target.value, phone: current[customer.identity]?.phone ?? customer.phone, email: current[customer.identity]?.email ?? customer.email } }))} className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] outline-none" placeholder="Customer name" />
                  <input value={customerEdits[customer.identity]?.phone ?? customer.phone} onChange={(event) => setCustomerEdits((current) => ({ ...current, [customer.identity]: { name: current[customer.identity]?.name ?? customer.name, phone: event.target.value, email: current[customer.identity]?.email ?? customer.email } }))} className="mt-2 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Phone" />
                  <input value={customerEdits[customer.identity]?.email ?? customer.email} onChange={(event) => setCustomerEdits((current) => ({ ...current, [customer.identity]: { name: current[customer.identity]?.name ?? customer.name, phone: current[customer.identity]?.phone ?? customer.phone, email: event.target.value } }))} className="mt-2 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Email" />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Orders: {customer.totalOrders}</p>
                    <button type="button" onClick={() => handleSaveCustomer(customer.identity, customer.orderIds, { name: customer.name, phone: customer.phone, email: customer.email })} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">Save</button>
                  </div>
                </div>
              ))}
              {!customers.length ? <p className="text-sm text-[var(--color-muted)]">Customer list will appear after checkout orders are placed.</p> : null}
            </div>
            </Card>
          </div>
        </div>

        <div id="founder-management" className={`mt-8 ${canSee('founder') ? '' : 'hidden'}`}>
          <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Founder</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Edit founder profile</h2>
              </div>
              <div className="flex gap-2">
                {founderForm ? (
                  <>
                    <Button onClick={handleSaveFounder} disabled={founderSaving}>{founderSaving ? 'Saving…' : 'Save'}</Button>
                    <Button variant="secondary" onClick={handleCancelFounder}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={handleEditFounder}>Edit</Button>
                )}
              </div>
            </div>

            {founderMessage ? <p className="mt-3 text-sm text-[var(--color-accent)]">{founderMessage}</p> : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                value={founderForm?.name ?? founderProfile?.name ?? ''}
                onChange={(event) => founderForm && setFounderForm({ ...founderForm, name: event.target.value })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="Founder name"
                disabled={!founderForm}
              />
              <input
                value={founderForm?.title ?? founderProfile?.title ?? ''}
                onChange={(event) => founderForm && setFounderForm({ ...founderForm, title: event.target.value })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="Title"
                disabled={!founderForm}
              />
              <input
                value={founderForm?.image ?? founderProfile?.image ?? ''}
                onChange={(event) => founderForm && setFounderForm({ ...founderForm, image: event.target.value })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="Image URL"
                disabled={!founderForm}
              />
              <label className={`flex items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm ${founderForm ? 'cursor-pointer text-[var(--color-text)]' : 'cursor-not-allowed text-[var(--color-muted)]'}`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFounderImageUpload(event.target.files)}
                  className="hidden"
                  disabled={!founderForm}
                />
                Upload founder image
              </label>
              <input
                value={founderForm?.socials?.whatsapp ?? founderProfile?.socials?.whatsapp ?? ''}
                onChange={(event) => founderForm && setFounderForm({
                  ...founderForm,
                  socials: {
                    ...(founderForm.socials ?? { whatsapp: '', facebook: '', instagram: '', email: '' }),
                    whatsapp: event.target.value,
                  },
                })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="WhatsApp URL"
                disabled={!founderForm}
              />
              <input
                value={founderForm?.socials?.facebook ?? founderProfile?.socials?.facebook ?? ''}
                onChange={(event) => founderForm && setFounderForm({
                  ...founderForm,
                  socials: {
                    ...(founderForm.socials ?? { whatsapp: '', facebook: '', instagram: '', email: '' }),
                    facebook: event.target.value,
                  },
                })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="Facebook URL"
                disabled={!founderForm}
              />
              <input
                value={founderForm?.socials?.instagram ?? founderProfile?.socials?.instagram ?? ''}
                onChange={(event) => founderForm && setFounderForm({
                  ...founderForm,
                  socials: {
                    ...(founderForm.socials ?? { whatsapp: '', facebook: '', instagram: '', email: '' }),
                    instagram: event.target.value,
                  },
                })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="Instagram URL"
                disabled={!founderForm}
              />
              <input
                value={founderForm?.socials?.email ?? founderProfile?.socials?.email ?? ''}
                onChange={(event) => founderForm && setFounderForm({
                  ...founderForm,
                  socials: {
                    ...(founderForm.socials ?? { whatsapp: '', facebook: '', instagram: '', email: '' }),
                    email: event.target.value,
                  },
                })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="Email URL"
                disabled={!founderForm}
              />
            </div>
            <textarea
              value={founderForm?.bio ?? founderProfile?.bio ?? ''}
              onChange={(event) => founderForm && setFounderForm({ ...founderForm, bio: event.target.value })}
              className="mt-4 min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Bio"
              disabled={!founderForm}
            />
            <textarea
              value={founderForm?.story ?? founderProfile?.story ?? ''}
              onChange={(event) => founderForm && setFounderForm({ ...founderForm, story: event.target.value })}
              className="mt-4 min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Story"
              disabled={!founderForm}
            />
         </Card>
         </div>

        {canSee('brands') && showBrandManagement ? <div id="brands-management">{<BrandManagement onDone={() => setShowBrandManagement(false)} />}</div> : null}

        <div id="coupon-management" className={`mt-8 ${canSee('coupons') ? '' : 'hidden'}`}>
          <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Coupons</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Coupon Management</h2>
              </div>
              <Button variant="secondary" onClick={() => setShowCouponForm(!showCouponForm)}>
                {showCouponForm ? 'Close Form' : '+ Generate Coupon'}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 text-center">
                <p className="text-2xl font-semibold text-black">{couponStats.total}</p>
                <p className="text-xs text-black/60">Total</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 text-center">
                <p className="text-2xl font-semibold text-emerald-600">{couponStats.active}</p>
                <p className="text-xs text-black/60">Active</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 text-center">
                <p className="text-2xl font-semibold text-black">{couponStats.used}</p>
                <p className="text-xs text-black/60">Used</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 text-center">
                <p className="text-2xl font-semibold text-rose-600">{couponStats.expired}</p>
                <p className="text-xs text-black/60">Expired</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-black/[0.02] p-3 text-center">
                <p className="text-2xl font-semibold text-black">{couponStats.disabled}</p>
                <p className="text-xs text-black/60">Disabled</p>
              </div>
            </div>

            {showCouponForm ? (
              <div className="mt-6 rounded-xl border border-black/10 bg-black/[0.02] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-black">Create coupon</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-black/60">Code</label>
                    <input
                      value={newCouponForm.code}
                      onChange={(event) => setNewCouponForm({ ...newCouponForm, code: event.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                      placeholder="EID-500 or leave blank to generate"
                      maxLength={24}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-black/60">Audience</label>
                    <select
                      value={newCouponForm.audience}
                      onChange={(event) => {
                        const audience = event.target.value as CouponAudience
                        setNewCouponForm({
                          ...newCouponForm,
                          audience,
                          maxUsage: audience === 'public' ? Math.max(newCouponForm.maxUsage, 100) : 1,
                        })
                      }}
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                    >
                      <option value="public">Public campaign</option>
                      <option value="private">Private / email-bound</option>
                    </select>
                  </div>
                  {newCouponForm.audience === 'private' ? (
                    <div>
                      <label className="text-xs font-medium text-black/60">Customer Email</label>
                      <input
                        type="email"
                        value={newCouponForm.customerEmail}
                        onChange={(event) => setNewCouponForm({ ...newCouponForm, customerEmail: event.target.value })}
                        className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                        placeholder="customer@email.com"
                      />
                    </div>
                  ) : null}
                  <div>
                    <label className="text-xs font-medium text-black/60">Discount type</label>
                    <select
                      value={newCouponForm.discountType}
                      onChange={(event) => setNewCouponForm({ ...newCouponForm, discountType: event.target.value as CouponDiscountType })}
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                    >
                      <option value="percent">Percent off</option>
                      <option value="fixed">Fixed BDT off</option>
                    </select>
                  </div>
                  {newCouponForm.discountType === 'percent' ? (
                    <div>
                      <label className="text-xs font-medium text-black/60">Discount (%)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newCouponForm.discountPercent}
                        onChange={(event) => setNewCouponForm({ ...newCouponForm, discountPercent: Number(event.target.value) })}
                        className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-medium text-black/60">Fixed amount (BDT)</label>
                      <input
                        type="number"
                        min="1"
                        max="100000"
                        value={newCouponForm.discountFixedBdt}
                        onChange={(event) => setNewCouponForm({ ...newCouponForm, discountFixedBdt: Number(event.target.value) })}
                        className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-black/60">Minimum spend (BDT)</label>
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      value={newCouponForm.minSpend}
                      onChange={(event) => setNewCouponForm({ ...newCouponForm, minSpend: Number(event.target.value) })}
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-black/60">Expiry (days)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={newCouponForm.expiryDays}
                      onChange={(event) => setNewCouponForm({ ...newCouponForm, expiryDays: Number(event.target.value) })}
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-black/60">Max usage</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={newCouponForm.maxUsage}
                      onChange={(event) => setNewCouponForm({ ...newCouponForm, maxUsage: Number(event.target.value) })}
                      className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium text-black/60">Category targeting (optional)</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {taxonomyCategoryOptions.map((option) => {
                      const selected = newCouponForm.applicableCategories.includes(option.slug)
                      return (
                        <button
                          key={`${option.segment}-${option.slug}`}
                          type="button"
                          onClick={() => setNewCouponForm((current) => ({
                            ...current,
                            applicableCategories: selected
                              ? current.applicableCategories.filter((entry) => entry !== option.slug)
                              : [...current.applicableCategories, option.slug],
                          }))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selected ? 'border-black text-black' : 'border-black/15 text-black/60'}`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={async () => {
                      if (newCouponForm.audience === 'private' && !newCouponForm.customerEmail.trim()) {
                        setToast({ kind: 'error', message: 'Private coupons need a customer email.' })
                        return
                      }
                      try {
                        await createCoupon({
                          code: (newCouponForm.code || generateCouponCode()).toUpperCase(),
                          discountPercent: newCouponForm.discountPercent,
                          discountType: newCouponForm.discountType,
                          discountFixedBdt: newCouponForm.discountFixedBdt,
                          minSpend: newCouponForm.minSpend,
                          applicableCategories: newCouponForm.applicableCategories,
                          audience: newCouponForm.audience,
                          customerEmail: newCouponForm.audience === 'private' ? newCouponForm.customerEmail.trim() : '',
                          expiryDate: new Date(Date.now() + newCouponForm.expiryDays * 86400000).toISOString(),
                          maxUsage: newCouponForm.maxUsage,
                          status: 'active',
                        })
                        setNewCouponForm({
                          code: '',
                          audience: 'public',
                          discountType: 'percent',
                          discountPercent: 10,
                          discountFixedBdt: 500,
                          minSpend: 0,
                          applicableCategories: [],
                          customerEmail: '',
                          expiryDays: 30,
                          maxUsage: 100,
                        })
                        setShowCouponForm(false)
                        const allCoupons = await getCoupons()
                        setCoupons(allCoupons)
                        setCouponStats(getCouponStats(allCoupons))
                        setToast({ kind: 'success', message: 'Coupon created.' })
                      } catch (error) {
                        setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to create coupon.' })
                      }
                    }}
                  >
                    Create coupon
                  </Button>
                  <Button variant="secondary" onClick={() => setShowCouponForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-3">
              <input
                type="text"
                value={couponSearch}
                onChange={(event) => setCouponSearch(event.target.value)}
                placeholder="Search coupons or customers..."
                className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
              />
              <Button variant="secondary" onClick={exportCouponsCSV}>
                Export CSV
              </Button>
            </div>

            {couponLoading ? (
              <p className="mt-4 text-sm text-[var(--color-muted)]">Loading coupons...</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Code</th>
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Customer</th>
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Discount</th>
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Status</th>
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Usage</th>
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Expiry</th>
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons
                      .filter((coupon) => {
                        const q = couponSearch.toLowerCase()
                        return (coupon.code || '').toLowerCase().includes(q) || (coupon.customerEmail ?? '').toLowerCase().includes(q)
                      })
                      .map((coupon) => (
                        <tr key={coupon.id} className="border-b border-black/5">
                          <td className="py-2 font-mono text-[var(--color-text)]">{coupon.code}</td>
                          <td className="py-2 text-[var(--color-muted)]">{coupon.customerEmail || 'Public'}</td>
                          <td className="py-2 text-[var(--color-text)]">{formatCouponDiscountLabel(coupon)}{coupon.minSpend ? ` · min ৳ ${coupon.minSpend}` : ''}</td>
                          <td className="py-2">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                              coupon.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              coupon.status === 'used' ? 'bg-black/10 text-black/60' :
                              coupon.status === 'expired' ? 'bg-rose-100 text-rose-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{coupon.status}</span>
                          </td>
                          <td className="py-2 text-[var(--color-muted)]">{coupon.usageCount} / {coupon.maxUsage}</td>
                          <td className="py-2 text-[var(--color-muted)]">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              {coupon.status === 'active' ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await updateCoupon(coupon.id, { status: 'disabled' })
                                      const allCoupons = await getCoupons()
                                      setCoupons(allCoupons)
                                      setCouponStats(getCouponStats(allCoupons))
                                      setToast({ kind: 'success', message: `Coupon ${coupon.code} disabled.` })
                                    } catch (error) {
                                      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to disable coupon.' })
                                    }
                                  }}
                                  className="text-xs text-rose-600 hover:underline"
                                >
                                  Disable
                                </button>
                              ) : coupon.status === 'disabled' ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await updateCoupon(coupon.id, { status: 'active' })
                                      const allCoupons = await getCoupons()
                                      setCoupons(allCoupons)
                                      setCouponStats(getCouponStats(allCoupons))
                                      setToast({ kind: 'success', message: `Coupon ${coupon.code} enabled.` })
                                    } catch (error) {
                                      setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to enable coupon.' })
                                    }
                                  }}
                                  className="text-xs text-emerald-600 hover:underline"
                                >
                                  Enable
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deleteCoupon(coupon.id)
                                    const allCoupons = await getCoupons()
                                    setCoupons(allCoupons)
                                    setCouponStats(getCouponStats(allCoupons))
                                    setToast({ kind: 'success', message: `Coupon ${coupon.code} deleted.` })
                                  } catch (error) {
                                    setToast({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to delete coupon.' })
                                  }
                                }}
                                className="text-xs text-rose-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {!coupons.length ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-[var(--color-muted)]">No coupons yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div id="newsletter-management" className={`mt-8 ${canSee('newsletter') ? '' : 'hidden'}`}>
          <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Newsletter</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Welcome discount subscribers</h2>
              </div>
              <Button variant="secondary" onClick={exportNewsletterSubscribers} disabled={newsletterLoading || !newsletterSubscribers.length}>
                Export CSV
              </Button>
            </div>

            {newsletterLoading ? (
              <p className="mt-4 text-sm text-[var(--color-muted)]">Loading subscribers...</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Email</th>
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Signup Date</th>
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Source</th>
                      <th className="pb-2 font-semibold text-[var(--color-muted)]">Coupon Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsletterSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b border-black/5">
                        <td className="py-2 text-[var(--color-text)]">{subscriber.email}</td>
                        <td className="py-2 text-[var(--color-muted)]">{subscriber.signupDate ? new Date(subscriber.signupDate).toLocaleString() : '-'}</td>
                        <td className="py-2 text-[var(--color-muted)]">{subscriber.source}</td>
                        <td className="py-2 text-[var(--color-muted)]">{subscriber.couponUsed || '-'}</td>
                      </tr>
                    ))}
                    {!newsletterSubscribers.length ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-[var(--color-muted)]">No subscribers yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div id="reviews-management" className={`mt-8 ${canSee('reviews') ? '' : 'hidden'}`}>
          <Card className="rounded-[2rem] p-5 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Reviews</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Moderate customer reviews</h2>
            <div className="mt-5 space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{review.authorName} · {review.rating}/5 · {review.status}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{review.productSlug || review.productId}</p>
                  <p className="mt-2 text-sm text-[var(--color-text)]">{review.body}</p>
                  {review.status === 'pending' ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateReviewStatus(review.id, 'approved')
                            setToast({ kind: 'success', message: 'Review approved.' })
                          } catch (error) {
                            setToast({ kind: 'error', message: describeAdminWriteError(error, user?.uid) })
                          }
                        }}
                        className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateReviewStatus(review.id, 'rejected')
                            setToast({ kind: 'success', message: 'Review rejected.' })
                          } catch (error) {
                            setToast({ kind: 'error', message: describeAdminWriteError(error, user?.uid) })
                          }
                        }}
                        className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)]"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {!reviews.length ? <p className="text-sm text-[var(--color-muted)]">No reviews yet.</p> : null}
            </div>
          </Card>
        </div>

        <div id="roles-management" className={`mt-8 ${canSee('roles') ? '' : 'hidden'}`}>
          <Card className="rounded-[2rem] p-5 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Team access</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Admin roles</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Existing `admins` documents. Owner sees everything; packer sees orders; merchandiser sees catalog; ops sees orders and customers.</p>
            <div className="mt-5 space-y-3">
              {adminAccounts.map((account) => (
                <div key={account.uid} className="flex flex-col gap-2 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{account.email || account.uid}</p>
                    <p className="text-xs text-[var(--color-muted)]">{account.active ? 'Active' : 'Inactive'}</p>
                  </div>
                  <select
                    value={account.role}
                    onChange={async (event) => {
                      const nextRole = event.target.value as AdminAccessRole
                      try {
                        await updateAdminAccountRole(account.uid, nextRole)
                        setToast({ kind: 'success', message: `Role updated to ${nextRole}.` })
                      } catch (error) {
                        setToast({ kind: 'error', message: describeAdminWriteError(error, user?.uid) })
                      }
                    }}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none"
                  >
                    {ADMIN_ACCESS_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              ))}
              {!adminAccounts.length ? <p className="text-sm text-[var(--color-muted)]">No admin documents found. Create admins/UID with role and active=true.</p> : null}
            </div>
          </Card>
        </div>
      </Container>
    </section>
  )
}
