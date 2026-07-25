import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
import BrandManagement from '../components/admin/BrandManagement'
import { compactManagedImages, getManagedImageEntries } from '../utils/media'
import { formatBDT } from '../utils/currency'
import {
  consumeAdminAccessDeniedFlag,
  createCategory,
  createProduct,
  deleteCategory,
  deleteOrder,
  deleteAsset,
  deleteProduct,
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
  updateFounderProfile,
  updateHomepageContent,
  updateOrderDetails,
  updateOrderStatus,
  updateProduct,
  uploadAssets,
  type AdminBrand,
  type AdminOrder,
  type AdminProduct,
  type AdminCategory,
  type FounderProfile,
  type HomepageContent,
  type HomepageCategorySection,
  type HomepageCategorySectionKey,
  type HomepageContentSnapshotMeta,
  type HomepageSaveResult,
  type HomepageSectionConfig,
  onAdminAuthChanged,
} from '../firebase/adminService'
import {
  getAllTaxonomyCategoryOptions,
  resolveCanonicalSubcategorySlug,
} from '../data/categoryTaxonomy'
import { normalizeSizes } from '../utils/sizes'

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
}

const galleryLabels = ['Main image', 'Detail image', 'Close-up image']

const ORDER_LIFECYCLE: AdminOrder['status'][] = ['new', 'confirmed', 'processing', 'shipped', 'delivered']

const ORDER_STATUS_TRANSITIONS: Record<AdminOrder['status'], AdminOrder['status'][]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const ORDER_STATUS_LABELS: Record<AdminOrder['status'], string> = {
  new: 'New',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const SECTION_ROUTE_VALIDATORS: Record<HomepageCategorySectionKey, (href: string) => boolean> = {
  women: (href) => /^\/women(?:\?sub=[a-z0-9-]+)?$/i.test(href),
  men: (href) => /^\/men(?:\?sub=[a-z0-9-]+)?$/i.test(href),
  kids: (href) => /^\/kids(?:\?sub=[a-z0-9-]+)?$/i.test(href),
  western: (href) => /^\/women\?sub=tunic$/i.test(href),
  sale: (href) => /^\/sale$/i.test(href),
  'new-arrivals': (href) => /^\/(?:shop\/new-arrivals|new-arrivals)$/i.test(href),
}

const SECTION_ROUTE_HINTS: Record<HomepageCategorySectionKey, string> = {
  women: 'Allowed: /women or /women?sub=tunic',
  men: 'Allowed: /men or /men?sub=shirts',
  kids: 'Allowed: /kids or /kids?sub=kids',
  western: 'Allowed: /women?sub=tunic',
  sale: 'Allowed: /sale',
  'new-arrivals': 'Allowed: /shop/new-arrivals or /new-arrivals',
}

interface AdminPageProps {
  initialView?: 'login' | 'dashboard'
}

export default function AdminPage({ initialView = 'login' }: AdminPageProps) {
  const navigate = useNavigate()
  const firebaseReady = isFirebaseConfigured()
  const launchModeEnabled = isLaunchModeEnabled()
  const canSignIn = firebaseReady || launchModeEnabled
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'dashboard'>(initialView)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
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
  const [form, setForm] = useState(emptyProductForm)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [orderEdits, setOrderEdits] = useState<Record<string, Partial<Pick<AdminOrder, 'customerName' | 'customerPhone' | 'customerEmail' | 'address' | 'notes' | 'trackingNumber'>>>>({})
  const [customerEdits, setCustomerEdits] = useState<Record<string, { name: string; phone: string; email: string }>>({})
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | AdminOrder['status']>('all')
  const [showBrandManagement, setShowBrandManagement] = useState(false)
  const [blockedAdminUid, setBlockedAdminUid] = useState<string | null>(null)
  const [homepageSaveDebug, setHomepageSaveDebug] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
    mode: 'local' | 'live' | 'unknown'
    path: string
    heroImage: string
    savedAt?: string
  }>({
    status: 'idle',
    message: 'No homepage save attempt yet.',
    mode: 'unknown',
    path: 'settings/homepage',
    heroImage: '',
  })
  const [homepageSnapshotDebug, setHomepageSnapshotDebug] = useState<HomepageContentSnapshotMeta | null>(null)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [founderProfile, setFounderProfile] = useState<FounderProfile | null>(null)
  const [founderForm, setFounderForm] = useState<FounderProfile | null>(null)
  const [founderSaving, setFounderSaving] = useState(false)
  const [founderMessage, setFounderMessage] = useState('')

  useEffect(() => {
    const unsubscribe = onAdminAuthChanged((nextUser) => {
      setUser(nextUser)

      if (nextUser) {
        setAuthMode('dashboard')
        if (initialView === 'login') {
          navigate('/admin', { replace: true })
        }
        return
      }

      setAuthMode('login')
      if (initialView === 'dashboard') {
        if (consumeAdminAccessDeniedFlag()) {
          window.alert('Access Denied')
          navigate('/', { replace: true })
          return
        }
        navigate('/shis-admin/login', { replace: true })
      }
    })

    return unsubscribe
  }, [initialView, navigate])

  useEffect(() => {
    if (!user || authMode !== 'dashboard') {
      return () => undefined
    }

    const unsubscribeProducts = subscribeToProducts((nextProducts) => setProducts(nextProducts))
    const unsubscribeOrders = subscribeToOrders((nextOrders) => setOrders(nextOrders))
    const unsubscribeHomepage = subscribeToHomepageContent((nextContent, meta) => {
      setHomepageContent(nextContent)
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
    }
  }, [authMode, user])

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

    const revenue = orders.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (Number.isFinite(order.total) ? order.total : 0), 0)
    const outOfStockProducts = products.filter((product) => product.stock <= 0).length

    return {
      todayOrders: todayOrders.length,
      pendingOrders: orders.filter((order) => order.status === 'new').length,
      confirmedOrders: orders.filter((order) => order.status === 'confirmed').length,
      processingOrders: orders.filter((order) => order.status === 'processing').length,
      deliveredOrders: orders.filter((order) => order.status === 'delivered').length,
      cancelledOrders: orders.filter((order) => order.status === 'cancelled').length,
      totalRevenue: revenue,
      todayRevenue,
      totalProducts: products.length,
      outOfStockProducts,
      totalCustomers: customers.length,
      totalBrands: brands.length,
      archivedBrandsCount: archivedBrands.length,
    }
  }, [archivedBrands.length, brands.length, customers.length, orders, products])

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase()
    return orders.filter((order) => [
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
    ].some((value) => (value ?? '').toLowerCase().includes(query)) && (orderStatusFilter === 'all' || order.status === orderStatusFilter))
  }, [orders, orderStatusFilter, search])

  const formatOrderDateTime = (createdAt?: string | { seconds: number }) => {
    if (!createdAt) {
      return '-'
    }

    const date = typeof createdAt === 'string'
      ? new Date(createdAt)
      : new Date(createdAt.seconds * 1000)

    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase()
    return products.filter((product) => [product.name, product.category, product.description].some((value) => value.toLowerCase().includes(query)))
  }, [products, search])

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
      const errorCode = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : ''
      const adminUidFromError = typeof error === 'object' && error !== null && 'adminUid' in error
        ? String((error as { adminUid?: unknown }).adminUid ?? '')
        : ''
      if (errorCode === 'auth/forbidden-admin') {
        setMessage('Access denied. This account is not authorized for admin dashboard access.')
        setBlockedAdminUid(null)
        navigate('/', { replace: true })
      } else if (errorCode === 'auth/admin-firestore-permission-required') {
        setBlockedAdminUid(adminUidFromError || null)
        const uidHint = adminUidFromError || '<uid>'
        setMessage(`Login blocked: this account is allow-listed but does not have Firestore admin permission. Add admins/${uidHint} with role="admin" and active=true, then sign in again.`)
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/invalid-login-credentials' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        setMessage('Invalid email or password. Please try again.')
        setBlockedAdminUid(null)
      } else if (errorCode === 'auth/firebase-not-configured') {
        setMessage('Admin authentication is not configured in this environment.')
        setBlockedAdminUid(null)
      } else {
        setMessage('Sign in failed. Please try again in a moment.')
        setBlockedAdminUid(null)
      }

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
    if (!blockedAdminUid) {
      return
    }

    const path = `admins/${blockedAdminUid}`
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
        setMessage(`${galleryLabels[slotIndex]} uploaded.`)
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

  const handleRemoveGalleryImage = (slotIndex: number) => {
    setForm((current) => {
      const nextImages = [...current.images]
      const nextImageTitles = [...current.imageTitles]
      const nextImageDescriptions = [...current.imageDescriptions]
      nextImages[slotIndex] = ''
      nextImageTitles[slotIndex] = ''
      nextImageDescriptions[slotIndex] = ''
      return { ...current, images: nextImages, imageTitles: nextImageTitles, imageDescriptions: nextImageDescriptions }
    })
    setMessage(`${galleryLabels[slotIndex]} removed.`)
  }

  const handleUpload = async (
    files: FileList | null,
    target: 'product-images' | 'product-videos' | 'hero-image' | 'hero-video' | 'banner-image' | 'category-image' | 'shop-category-image' | 'category-section-image' | 'featured-page-image' | null = null,
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

      const uploadedImages = imageFiles.length
        ? await uploadAssets(imageFiles, target === 'hero-image' || target === 'banner-image' || target === 'category-image' || target === 'shop-category-image' || target === 'category-section-image' || target === 'featured-page-image' ? 'homepage' : 'products', {
          retries: 2,
          onProgress: (progress) => setUploadProgress(progress),
        })
        : []
      const uploadedVideos = videoFiles.length
        ? await uploadAssets(videoFiles, target === 'hero-video' ? 'homepage' : 'products', {
          retries: 2,
          onProgress: (progress) => setUploadProgress(progress),
        })
        : []

      if (target === 'hero-image') {
        setHomepageContent((current) => (current ? { ...current, heroImage: uploadedImages[0] ?? current.heroImage } : current))
      } else if (target === 'hero-video') {
        setHomepageContent((current) => (current ? { ...current, heroVideo: uploadedVideos[0] ?? current.heroVideo } : current))
      } else if (target === 'banner-image') {
        setHomepageContent((current) => (current ? { ...current, bannerImage: uploadedImages[0] ?? current.bannerImage } : current))
      } else if (target === 'category-image') {
        setHomepageContent((current) => {
          if (!current) {
            return current
          }
          const nextCategories = [...current.categories]
          const safeIndex = typeof categoryIndex === 'number' ? Math.min(categoryIndex, nextCategories.length - 1) : 0
          nextCategories[safeIndex] = { ...nextCategories[safeIndex], image: uploadedImages[0] ?? nextCategories[safeIndex].image }
          return { ...current, categories: nextCategories }
        })
      } else if (target === 'shop-category-image') {
        setHomepageContent((current) => {
          if (!current) {
            return current
          }

          const nextShopByCategories = [...(current.shopByCategories ?? [])]
          if (!nextShopByCategories.length) {
            return current
          }

          const safeIndex = typeof categoryIndex === 'number' ? Math.min(categoryIndex, nextShopByCategories.length - 1) : 0
          nextShopByCategories[safeIndex] = {
            ...nextShopByCategories[safeIndex],
            image: uploadedImages[0] ?? nextShopByCategories[safeIndex].image,
          }

          return { ...current, shopByCategories: nextShopByCategories }
        })
      } else if (target === 'category-section-image') {
        setHomepageContent((current) => {
          if (!current || !current.categorySections || !sectionKey) {
            return current
          }

          const section = current.categorySections[sectionKey]
          if (!section) {
            return current
          }

          const nextSection: HomepageCategorySection = {
            ...section,
            coverImage: uploadedImages[0] ?? section.coverImage,
            images: Array.from(new Set([...(section.images ?? []), ...uploadedImages])).filter(Boolean),
          }

          return {
            ...current,
            categorySections: {
              ...current.categorySections,
              [sectionKey]: nextSection,
            },
          }
        })
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
        setForm((current) => ({ ...current, images: [...current.images, ...uploadedImages], videos: [...current.videos, ...uploadedVideos] }))
      }

      setMessage('Assets uploaded successfully.')
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Asset upload failed. Please retry.'
      setUploadError(reason)
      setMessage(reason)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>, target: 'product-images' | 'product-videos' | 'hero-image' | 'hero-video' | 'banner-image' | 'category-image' | 'shop-category-image' | 'category-section-image' | 'featured-page-image' | null = null) => {
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
      setHomepageContent({ ...homepageContent, featuredCollectionPages: nextPages })
      setMessage('Collection image removed.')
    } catch {
      setMessage('Unable to remove collection image.')
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
      const normalizedMedia = compactManagedImages({
        images: normalizedForm.images.slice(0, 3),
        imageTitles: normalizedForm.imageTitles.slice(0, 3),
        imageDescriptions: normalizedForm.imageDescriptions.slice(0, 3),
      })
      if (isEditing) {
        await updateProduct(isEditing, {
          ...normalizedForm,
          ...normalizedMedia,
          sizes: normalizedForm.sizes,
          colors: normalizedForm.colors,
        })
        setMessage('Product updated.')
      } else {
        await createProduct({
          ...normalizedForm,
          ...normalizedMedia,
          sizes: normalizedForm.sizes,
          colors: normalizedForm.colors,
        })
        setMessage('Product created.')
      }
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const handleEditProduct = (product: AdminProduct) => {
    const imageEntries = getManagedImageEntries(product, 3)
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
    })
    setIsEditing(product.id)
  }

  const handleDeleteProduct = async (productId: string) => {
    const shouldDelete = window.confirm('Archive this product? It will be hidden from storefront and dashboard lists.')
    if (!shouldDelete) {
      return
    }

    await deleteProduct(productId)
    if (isEditing === productId) {
      resetForm()
    }
    setMessage('Product archived.')
  }

  const handleHomepageSave = async () => {
    if (!homepageContent) {
      return
    }

    const sectionEntries = Object.values(homepageContent.categorySections ?? {})
    const invalidSection = sectionEntries.find((section) => {
      const href = section.href.trim()
      const isHrefValid = SECTION_ROUTE_VALIDATORS[section.key](href)
      if (!isHrefValid) {
        return true
      }

      if (section.enabled && !section.coverImage.trim()) {
        return true
      }

      return false
    })

    if (invalidSection) {
      const href = invalidSection.href.trim()
      const isHrefValid = SECTION_ROUTE_VALIDATORS[invalidSection.key](href)
      const reason = !isHrefValid
        ? `Invalid route for ${invalidSection.key.toUpperCase()}.`
        : `Cover image is required for enabled section ${invalidSection.key.toUpperCase()}.`

      setMessage(reason)
      setToast({ kind: 'error', message: reason })
      return
    }

    setLoading(true)
    try {
      const result: HomepageSaveResult = await updateHomepageContent(homepageContent)
      setMessage('Homepage content saved.')
      setToast({ kind: 'success', message: 'Homepage saved and verified in Firestore.' })
      setHomepageSaveDebug({
        status: 'success',
        message: `Saved and verified in Firestore (${result.mode} mode).`,
        mode: result.mode,
        path: result.path,
        heroImage: result.heroImage,
        savedAt: result.savedAt,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error'
      const normalizedReason = reason.toLowerCase()
      if (normalizedReason.includes('permission-denied') || normalizedReason.includes('missing or insufficient permissions')) {
        const uidHint = user?.uid ? `admins/${user.uid}` : 'admins/<your-uid>'
        const permissionHelp = `Homepage save blocked by Firestore rules. Add admin access for this account (${user?.email ?? 'unknown email'}). Create document ${uidHint} with { role: "admin", active: true } or set custom claim admin=true, then sign out/in.`
        setMessage(permissionHelp)
        setToast({ kind: 'error', message: permissionHelp })
      } else {
        setMessage(`Homepage save failed: ${reason}`)
        setToast({ kind: 'error', message: `Homepage save failed: ${reason}` })
      }
      setHomepageSaveDebug({
        status: 'error',
        message: reason,
        mode: 'unknown',
        path: 'settings/homepage',
        heroImage: homepageContent.heroImage ?? '',
        savedAt: new Date().toISOString(),
      })
      if (import.meta.env.DEV) {
        console.error('[admin] homepage save failed', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleHomepageWriteTest = async () => {
    if (!homepageContent) {
      return
    }

    setLoading(true)
    try {
      const result = await updateHomepageContent(homepageContent)
      setHomepageSaveDebug({
        status: 'success',
        message: `Firestore write test passed (${result.mode} mode).`,
        mode: result.mode,
        path: result.path,
        heroImage: result.heroImage,
        savedAt: result.savedAt,
      })
      setToast({ kind: 'success', message: 'Firestore write test passed.' })
      setMessage('Firestore write test passed.')
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error'
      const normalizedReason = reason.toLowerCase()
      const permissionHelp = (normalizedReason.includes('permission-denied') || normalizedReason.includes('missing or insufficient permissions'))
        ? `Firestore write blocked for ${user?.email ?? 'unknown email'}. Add admins/${user?.uid ?? '<your-uid>'} with role=admin and active=true, or custom claim admin=true.`
        : reason
      setHomepageSaveDebug({
        status: 'error',
        message: permissionHelp,
        mode: 'unknown',
        path: 'settings/homepage',
        heroImage: homepageContent.heroImage ?? '',
        savedAt: new Date().toISOString(),
      })
      setToast({ kind: 'error', message: `Firestore write test failed: ${permissionHelp}` })
      setMessage(`Firestore write test failed: ${permissionHelp}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyHomepageDebug = async () => {
    const payload = {
      save: homepageSaveDebug,
      snapshot: homepageSnapshotDebug,
      localFirstMode: isHomepageLocalFirstMode(),
      firebaseConfigured: firebaseReady,
      firebaseProjectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '(missing)',
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

  const handleStatusChange = async (orderId: string, status: AdminOrder['status']) => {
    try {
      await updateOrderStatus(orderId, status)
      setMessage('Order status updated.')
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : ''

      if (code === 'order/invalid-status-transition') {
        setMessage('Invalid status flow. Use forward lifecycle actions only.')
      } else {
        setMessage('Unable to update order status right now.')
      }
    }
  }

  const handleSaveOrder = async (orderId: string) => {
    const nextEdits = orderEdits[orderId] ?? {}
    await updateOrderDetails(orderId, nextEdits)
    setOrderEdits((current) => {
      const copy = { ...current }
      delete copy[orderId]
      return copy
    })
    setMessage('Order saved.')
  }

  const handleDeleteOrder = async (orderId: string) => {
    const shouldDelete = window.confirm('Archive this order? It will be removed from active management lists.')
    if (!shouldDelete) {
      return
    }

    await deleteOrder(orderId)
    setMessage('Order archived.')
  }

  const handleSaveCustomer = async (identity: string, orderIds: string[], fallback: { name: string; phone: string; email: string }) => {
    const edit = customerEdits[identity] ?? fallback
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
  }

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      setMessage('Category name is required.')
      return
    }

    if (editingCategoryId) {
      await updateCategory(editingCategoryId, categoryName)
      setMessage('Category updated.')
    } else {
      await createCategory(categoryName)
      setMessage('Category added.')
    }

    setCategoryName('')
    setEditingCategoryId(null)
  }

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSummaryCardClick = (target: 'orders' | 'products' | 'homepage' | 'categories' | 'customers' | 'founder', filter?: 'all' | AdminOrder['status']) => {
    if (typeof filter !== 'undefined') {
      setOrderStatusFilter(filter)
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
    if (!homepageContent?.categorySections) {
      return
    }

    const target = homepageContent.categorySections[key]
    if (!target) {
      return
    }

    const nextCategorySection: HomepageCategorySection = {
      ...target,
      ...updates,
      key,
    }

    setHomepageContent({
      ...homepageContent,
      categorySections: {
        ...homepageContent.categorySections,
        [key]: nextCategorySection,
      },
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

    await deleteCategory(categoryId)
    if (editingCategoryId === categoryId) {
      setEditingCategoryId(null)
      setCategoryName('')
    }
    setMessage('Category archived.')
  }

  const handleRestoreProduct = async (productId: string) => {
    await restoreProduct(productId)
    setMessage('Product restored from archive.')
  }

  const handleRestoreOrder = async (orderId: string) => {
    await restoreOrder(orderId)
    setMessage('Order restored from archive.')
  }

  const handleRestoreCategory = async (categoryId: string) => {
    await restoreCategory(categoryId)
    setMessage('Category restored from archive.')
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

  if (authMode === 'login' && !user) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <SectionTitle eyebrow="Admin access" title="Secure control center" description="Fast sign-in for your premium operations dashboard." />
          <Card className="mt-8 rounded-[2rem] p-5 sm:p-7">
            <form className="space-y-4" onSubmit={handleLogin}>
              <input required value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Email" />
              <input required type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Password" />
              <Button type="submit" disabled={loading || !canSignIn} className="w-full justify-center">{loading ? 'Signing in…' : 'Enter dashboard'}</Button>
            </form>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              {firebaseReady
                ? 'Firebase is active.'
                : launchModeEnabled
                  ? 'Launch mode is active. Admin access is limited to configured admin emails.'
                  : 'Admin login requires Firebase authentication configuration or Launch Mode.'}
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
      <Container>
        <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Admin dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">Luxury operations at a glance</h1>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">Keep products, orders, and homepage content moving with calm precision.</p>
          </div>
          <div className="flex gap-3">
            <Button to="/" variant="secondary">View store</Button>
            <Button onClick={handleLogout} variant="secondary">Logout</Button>
          </div>
        </div>

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
              <Button variant="secondary" onClick={() => { setForm(emptyProductForm); setIsEditing(null); scrollToSection('products-management') }}>Add New Product</Button>
              <Button variant="secondary" onClick={() => scrollToSection('homepage-management')}>Upload Hero Image</Button>
              <Button variant="secondary" onClick={() => scrollToSection('homepage-management')}>Upload Hero Video</Button>
              <Button variant="secondary" onClick={() => scrollToSection('homepage-management')}>Edit Homepage</Button>
              <Button variant="secondary" onClick={() => handleSummaryCardClick('orders', 'new')}>View New Orders</Button>
              <Button variant="secondary" onClick={() => scrollToSection('categories-management')}>Manage Categories</Button>
              <Button variant="secondary" onClick={() => { setShowBrandManagement(!showBrandManagement); scrollToSection('brands-management') }}>Manage Brands</Button>
            </div>
          </div>

          <div className="mt-5 rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Daily operator flow</p>
            <div className="mt-2 grid gap-2 text-xs text-[var(--color-muted)] sm:grid-cols-2">
              <p>1. Check <span className="font-semibold text-[var(--color-text)]">New Orders</span> and move to Confirmed.</p>
              <p>2. Update stock when creating or editing products.</p>
              <p>3. Keep category list clean before uploading new products.</p>
              <p>4. Toggle homepage sections and click <span className="font-semibold text-[var(--color-text)]">Save content</span>.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Today's Orders", value: dashboardSummary.todayOrders, target: () => handleSummaryCardClick('orders') },
              { label: 'Pending Orders', value: dashboardSummary.pendingOrders, target: () => handleSummaryCardClick('orders', 'new' as const) },
              { label: 'Confirmed Orders', value: dashboardSummary.confirmedOrders, target: () => handleSummaryCardClick('orders', 'confirmed') },
              { label: 'Processing Orders', value: dashboardSummary.processingOrders, target: () => handleSummaryCardClick('orders', 'processing') },
              { label: 'Delivered Orders', value: dashboardSummary.deliveredOrders, target: () => handleSummaryCardClick('orders', 'delivered') },
              { label: 'Cancelled Orders', value: dashboardSummary.cancelledOrders, target: () => handleSummaryCardClick('orders', 'cancelled') },
              { label: 'Total Revenue', value: formatBDT(dashboardSummary.totalRevenue), target: () => handleSummaryCardClick('orders') },
              { label: "Today's Revenue", value: formatBDT(dashboardSummary.todayRevenue), target: () => handleSummaryCardClick('orders') },
              { label: 'Total Products', value: dashboardSummary.totalProducts, target: () => handleSummaryCardClick('products') },
              { label: 'Out of Stock Products', value: dashboardSummary.outOfStockProducts, target: () => handleSummaryCardClick('products') },
              { label: 'Total Customers', value: dashboardSummary.totalCustomers, target: () => handleSummaryCardClick('customers') },
              { label: 'Total Brands', value: dashboardSummary.totalBrands, target: () => { setShowBrandManagement(true); scrollToSection('brands-management') } },
              { label: 'Archived Brands', value: dashboardSummary.archivedBrandsCount, target: () => { setShowBrandManagement(true); scrollToSection('brands-management') } },
              { label: 'Live Mode', value: firebaseReady ? 'Firebase' : launchModeEnabled ? 'Launch Mode' : 'Unavailable', target: () => handleSummaryCardClick('homepage') },
              { label: 'Founder Profile', value: founderProfile?.name ?? '-', target: () => handleSummaryCardClick('founder') },
            ].map((card) => (
              <button key={card.label} type="button" onClick={card.target} className="text-left transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
                <Card className="h-full rounded-[1.6rem] p-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-accent)]">{card.label}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{card.value}</h2>
                </Card>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div id="products-management">
            <Card className="rounded-[2rem] p-5 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Product CRUD</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Add or refine your catalog</h2>
                </div>
                <Button onClick={resetForm} variant="secondary">Reset</Button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSaveProduct}>
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Product name" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Price" />
                  <input required type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Stock" />
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
                <input value={form.sizes.join(',')} onChange={(event) => setForm({ ...form, sizes: normalizeSizes(event.target.value) })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Sizes (comma or space separated)" />
                <input value={form.colors.join(',')} onChange={(event) => setForm({ ...form, colors: event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean) })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Colors (comma separated)" />
                <div className="space-y-3">
                  {galleryLabels.map((label, index) => (
                    <div key={label} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
                          <p className="mt-1 text-xs text-[var(--color-muted)]">Upload, replace, or remove this image.</p>
                        </div>
                        {form.images[index] ? (
                          <button type="button" onClick={() => handleRemoveGalleryImage(index)} className="text-sm font-semibold text-[var(--color-accent)]">
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <label className="mt-3 flex cursor-pointer items-center justify-center overflow-hidden rounded-[1.2rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/80 p-2">
                        <input type="file" accept="image/*" onChange={(event) => handleGalleryUpload(event.target.files, index)} className="hidden" />
                        {form.images[index] ? (
                          <img src={form.images[index]} alt={label} className="h-28 w-full rounded-[1rem] object-cover object-center" />
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
                  ))}
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
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-32 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none sm:w-44" placeholder="Search" />
            </div>
            <div className="mt-5 space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                     <div>
                      <h3 className="text-base font-semibold text-[var(--color-text)]">{product.name}</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{product.category} • {product.stock} in stock</p>
                      {product.comparePrice ? (
                        <p className="mt-1 text-xs text-black/50 line-through">{product.comparePrice}</p>
                      ) : null}
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
          <div id="orders-management">
            <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Orders</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Manage the full order lifecycle</h2>
              </div>
              <button
                type="button"
                onClick={() => setOrderStatusFilter('all')}
                className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]"
              >
                Show all
              </button>
            </div>
            <div className="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Status pipeline</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                {ORDER_LIFECYCLE.map((status, index) => (
                  <div key={status} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter(status)}
                      className={`rounded-full border px-3 py-1.5 font-semibold ${orderStatusFilter === status ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text)]'}`}
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
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {filteredOrders.map((order) => (
                <div key={order.id} className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
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
                        {['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">Current: {ORDER_STATUS_LABELS[order.status]}</p>
                      <input value={orderEdits[order.id]?.trackingNumber ?? order.trackingNumber ?? ''} onChange={(event) => setOrderEdits((current) => ({ ...current, [order.id]: { ...current[order.id], trackingNumber: event.target.value } }))} className="mt-2 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Tracking number" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(ORDER_STATUS_TRANSITIONS[order.status] ?? []).map((nextStatus) => (
                          <button
                            key={`${order.id}-${nextStatus}`}
                            type="button"
                            onClick={() => handleStatusChange(order.id, nextStatus)}
                            className={`rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold ${nextStatus === 'cancelled' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)]'}`}
                          >
                            Mark {ORDER_STATUS_LABELS[nextStatus]}
                          </button>
                        ))}
                        <button type="button" onClick={() => handleSaveOrder(order.id)} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">Save</button>
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

          <div id="homepage-management">
            <Card className="rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Homepage</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Tune the storefront instantly</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleHomepageWriteTest} variant="secondary" disabled={loading}>Test Firestore write</Button>
                <Button onClick={handleHomepageSave} variant="secondary" disabled={loading}>Save content</Button>
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
                <p><span className="font-semibold text-[var(--color-text)]">Firebase project:</span> {(import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '(missing)'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Auth email:</span> {user?.email ?? '(not signed in)'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Auth uid:</span> {user?.uid ?? '(not signed in)'}</p>
                <p><span className="font-semibold text-[var(--color-text)]">Hero URL snapshot:</span> {homepageSaveDebug.heroImage || '(empty)'}</p>
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
                        await deleteAsset(homepageContent.heroImage!)
                        setHomepageContent((current) => current ? { ...current, heroImage: '' } : current)
                        setMessage('Hero image removed.')
                      } catch {
                        setMessage('Unable to remove hero image.')
                      }
                    }} className="absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">Remove</button>
                  </div>
                ) : null}
                <div onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => handleDrop(event, 'hero-video')} className={`rounded-[1.5rem] border border-dashed p-4 text-center text-sm ${dragActive ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>
                  <label className="cursor-pointer">
                    <input type="file" accept="video/*" onChange={(event) => handleUpload(event.target.files, 'hero-video')} className="hidden" />
                    Drop hero video or tap to replace.
                  </label>
                </div>
                {homepageContent.heroVideo ? (
                  <div className="relative">
                    <video src={homepageContent.heroVideo} controls className="h-40 w-full rounded-[1.25rem] object-cover object-center" />
                    <button type="button" onClick={async () => {
                      try {
                        await deleteAsset(homepageContent.heroVideo!)
                        setHomepageContent((current) => current ? { ...current, heroVideo: '' } : current)
                        setMessage('Hero video removed.')
                      } catch {
                        setMessage('Unable to remove hero video.')
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
                        await deleteAsset(homepageContent.bannerImage!)
                        setHomepageContent((current) => current ? { ...current, bannerImage: '' } : current)
                        setMessage('Banner image removed.')
                      } catch {
                        setMessage('Unable to remove banner image.')
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
                              setHomepageContent({ ...homepageContent, categories: nextCategories })
                              setMessage('Category image removed.')
                            } catch {
                              setMessage('Unable to remove category image.')
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
                  <Button onClick={handleHomepageSave} variant="secondary" className="mt-3 sm:mt-0">Save content</Button>
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
                            placeholder="Section route (example: /women?sub=tunic)"
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
                          <label className="cursor-pointer text-sm text-[var(--color-muted)]">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) => handleUpload(event.target.files, 'category-section-image', undefined, undefined, section.key)}
                              className="hidden"
                            />
                            Add image for this section
                          </label>

                          {section.coverImage ? (
                            <div className="relative mt-3">
                              <img src={section.coverImage} alt={`${section.label} section preview`} className="h-24 w-full rounded-[1rem] object-cover object-center" />
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deleteAsset(section.coverImage)
                                    updateHomepageCategorySection(section.key, { coverImage: '', images: section.images.filter((image) => image !== section.coverImage) })
                                    setMessage('Section image removed.')
                                  } catch {
                                    setMessage('Unable to remove section image.')
                                  }
                                }}
                                className="absolute right-3 top-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]"
                              >
                                Remove
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3 sm:flex sm:items-center sm:justify-between">
                  <p className="text-xs text-[var(--color-muted)]">Save section-wise edits to publish exact label, route, and image mapping.</p>
                  <Button onClick={handleHomepageSave} variant="secondary" className="mt-3 sm:mt-0">Save content</Button>
                </div>
              </div>
            ) : null}
            </Card>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div id="categories-management">
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

          <div id="customers-management">
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

        <div id="founder-management" className="mt-8">
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
              <input
                value={founderForm?.socials.whatsapp ?? founderProfile?.socials.whatsapp ?? ''}
                onChange={(event) => founderForm && setFounderForm({ ...founderForm, socials: { ...founderForm.socials, whatsapp: event.target.value } })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="WhatsApp URL"
                disabled={!founderForm}
              />
              <input
                value={founderForm?.socials.facebook ?? founderProfile?.socials.facebook ?? ''}
                onChange={(event) => founderForm && setFounderForm({ ...founderForm, socials: { ...founderForm.socials, facebook: event.target.value } })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="Facebook URL"
                disabled={!founderForm}
              />
              <input
                value={founderForm?.socials.instagram ?? founderProfile?.socials.instagram ?? ''}
                onChange={(event) => founderForm && setFounderForm({ ...founderForm, socials: { ...founderForm.socials, instagram: event.target.value } })}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                placeholder="Instagram URL"
                disabled={!founderForm}
              />
              <input
                value={founderForm?.socials.email ?? founderProfile?.socials.email ?? ''}
                onChange={(event) => founderForm && setFounderForm({ ...founderForm, socials: { ...founderForm.socials, email: event.target.value } })}
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

        {showBrandManagement && <BrandManagement onDone={() => setShowBrandManagement(false)} />}
      </Container>
    </section>
  )
}
