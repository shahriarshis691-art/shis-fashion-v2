import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
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
  isLaunchModeEnabled,
  signInAdmin,
  signOutAdmin,
  subscribeToHomepageContent,
  subscribeToCategories,
  subscribeToOrders,
  subscribeToProducts,
  updateCategory,
  updateHomepageContent,
  updateOrderDetails,
  updateOrderStatus,
  updateProduct,
  uploadAssets,
  type AdminOrder,
  type AdminProduct,
  type AdminCategory,
  type HomepageContent,
  type HomepageSectionConfig,
  onAdminAuthChanged,
} from '../firebase/adminService'

const emptyProductForm = {
  name: '',
  price: '৳ 0',
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
    const unsubscribeHomepage = subscribeToHomepageContent((nextContent) => setHomepageContent(nextContent))
    const unsubscribeCategories = subscribeToCategories((nextCategories) => setCategories(nextCategories))

    return () => {
      unsubscribeProducts()
      unsubscribeOrders()
      unsubscribeHomepage()
      unsubscribeCategories()
    }
  }, [authMode, user])

  const customers = useMemo(() => {
    const byIdentity = new Map<string, { identity: string; name: string; phone: string; email: string; totalOrders: number; orderIds: string[] }>()
    for (const order of orders) {
      const identity = (order.customerPhone || order.customerEmail || order.customerName).toLowerCase()
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
    }
  }, [customers.length, orders, products])

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

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await signInAdmin(loginForm.email, loginForm.password)
      setAuthMode('dashboard')
      setMessage('Welcome back. Your dashboard is ready.')
      navigate('/admin', { replace: true })
    } catch (error) {
      const errorCode = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : ''
      const errorMessage = error instanceof Error ? error.message : String(error ?? '')
      const debugError = `Error code: ${errorCode || 'unknown'} | Message: ${errorMessage || 'No error message'}`

      if (errorCode === 'auth/forbidden-admin') {
        window.alert(debugError)
        setMessage(debugError)
        navigate('/', { replace: true })
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/invalid-login-credentials' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        setMessage(debugError)
      } else if (errorCode === 'auth/firebase-not-configured') {
        setMessage(debugError)
      } else {
        setMessage(debugError)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOutAdmin()
    setAuthMode('login')
    setUser(null)
    navigate('/shis-admin/login', { replace: true })
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
    target: 'product-images' | 'product-videos' | 'hero-image' | 'hero-video' | 'banner-image' | 'category-image' | 'shop-category-image' | null = null,
    categoryIndex?: number,
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
        ? await uploadAssets(imageFiles, target === 'hero-image' || target === 'banner-image' || target === 'category-image' || target === 'shop-category-image' ? 'homepage' : 'products', {
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

  const handleDrop = async (event: DragEvent<HTMLDivElement>, target: 'product-images' | 'product-videos' | 'hero-image' | 'hero-video' | 'banner-image' | 'category-image' | 'shop-category-image' | null = null) => {
    event.preventDefault()
    setDragActive(false)
    await handleUpload(event.dataTransfer.files, target)
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

  const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      const normalizedMedia = compactManagedImages({
        images: form.images.slice(0, 3),
        imageTitles: form.imageTitles.slice(0, 3),
        imageDescriptions: form.imageDescriptions.slice(0, 3),
      })
      if (isEditing) {
        await updateProduct(isEditing, {
          ...form,
          ...normalizedMedia,
          sizes: form.sizes,
          colors: form.colors,
        })
        setMessage('Product updated.')
      } else {
        await createProduct({
          ...form,
          ...normalizedMedia,
          sizes: form.sizes,
          colors: form.colors,
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
    await deleteProduct(productId)
    if (isEditing === productId) {
      resetForm()
    }
    setMessage('Product removed.')
  }

  const handleHomepageSave = async () => {
    if (!homepageContent) {
      return
    }

    setLoading(true)
    try {
      await updateHomepageContent(homepageContent)
      setMessage('Homepage content saved.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId: string, status: AdminOrder['status']) => {
    await updateOrderStatus(orderId, status)
    setMessage('Order status updated.')
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
    await deleteOrder(orderId)
    setMessage('Order deleted.')
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

  const handleSummaryCardClick = (target: 'orders' | 'products' | 'homepage' | 'categories' | 'customers', filter?: 'all' | AdminOrder['status']) => {
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
    }
  }

  const homepageSections = useMemo(() => {
    const defaultSections = homepageContent?.sections ?? []
    return [...defaultSections].sort((left, right) => left.order - right.order)
  }, [homepageContent?.sections])

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

  const handleEditCategory = (category: AdminCategory) => {
    setEditingCategoryId(category.id)
    setCategoryName(category.name)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    await deleteCategory(categoryId)
    if (editingCategoryId === categoryId) {
      setEditingCategoryId(null)
      setCategoryName('')
    }
    setMessage('Category removed.')
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
          </Card>
        </Container>
      </section>
    )
  }

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
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
              { label: 'Live Mode', value: firebaseReady ? 'Firebase' : launchModeEnabled ? 'Launch Mode' : 'Unavailable', target: () => handleSummaryCardClick('homepage') },
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
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Category" />
                <textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Description" />
                <input value={form.sizes.join(',')} onChange={(event) => setForm({ ...form, sizes: event.target.value.split(',').map((entry) => entry.trim()).filter(Boolean) })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Sizes (comma separated)" />
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
                          <img src={form.images[index]} alt={label} className="h-28 w-full rounded-[1rem] object-cover" />
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
                      <input value={orderEdits[order.id]?.trackingNumber ?? order.trackingNumber ?? ''} onChange={(event) => setOrderEdits((current) => ({ ...current, [order.id]: { ...current[order.id], trackingNumber: event.target.value } }))} className="mt-2 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Tracking number" />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleStatusChange(order.id, 'confirmed')} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">Confirm Order</button>
                        <button type="button" onClick={() => handleStatusChange(order.id, 'cancelled')} className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)]">Cancel Order</button>
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
                              {item.name} × {item.quantity} • {item.price}
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
              <Button onClick={handleHomepageSave} variant="secondary">Save content</Button>
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
                <div onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => handleDrop(event, 'hero-image')} className={`rounded-[1.5rem] border border-dashed p-4 text-center text-sm ${dragActive ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files, 'hero-image')} className="hidden" />
                    Drop hero image or tap to replace.
                  </label>
                </div>
                {homepageContent.heroImage ? (
                  <div className="relative">
                    <img src={homepageContent.heroImage} alt="Hero preview" className="h-40 w-full rounded-[1.25rem] object-cover" />
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
                    <video src={homepageContent.heroVideo} controls className="h-40 w-full rounded-[1.25rem] object-cover" />
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
                    <img src={homepageContent.bannerImage} alt="Banner preview" className="h-40 w-full rounded-[1.25rem] object-cover" />
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
                    <div className="sm:col-span-2">
                      <label className="cursor-pointer text-sm text-[var(--color-muted)]">
                        <input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files, 'category-image', index)} className="hidden" />
                        Set category image
                      </label>
                      {category.image ? (
                        <div className="relative">
                          <img src={category.image} alt={`${category.title} preview`} className="mt-3 h-24 w-full rounded-[1rem] object-cover" />
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

                <div className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3 sm:flex sm:items-center sm:justify-between">
                  <p className="text-xs text-[var(--color-muted)]">After uploading category images, click save to publish these changes.</p>
                  <Button onClick={handleHomepageSave} variant="secondary" className="mt-3 sm:mt-0">Save content</Button>
                </div>

                <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Shop by category cards</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">Edit homepage category cards (title, link, image) for mens, womens, couples, kids, western, and denim.</p>
                  <div className="mt-4 space-y-4">
                    {(homepageContent.shopByCategories ?? []).map((item, index) => (
                      <div key={`${item.title}-${index}`} className="rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            value={item.title}
                            onChange={(event) => {
                              const nextShopByCategories = [...(homepageContent.shopByCategories ?? [])]
                              nextShopByCategories[index] = { ...nextShopByCategories[index], title: event.target.value }
                              setHomepageContent({ ...homepageContent, shopByCategories: nextShopByCategories })
                            }}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Card title"
                          />
                          <input
                            value={item.href}
                            onChange={(event) => {
                              const nextShopByCategories = [...(homepageContent.shopByCategories ?? [])]
                              nextShopByCategories[index] = { ...nextShopByCategories[index], href: event.target.value }
                              setHomepageContent({ ...homepageContent, shopByCategories: nextShopByCategories })
                            }}
                            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                            placeholder="Card link (example: /shop/denim)"
                          />
                        </div>
                        <div className="mt-3">
                          <label className="cursor-pointer text-sm text-[var(--color-muted)]">
                            <input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files, 'shop-category-image', index)} className="hidden" />
                            Set shop category image
                          </label>
                          {item.image ? (
                            <div className="relative">
                              <img src={item.image} alt={`${item.title || 'Shop category'} card preview`} className="mt-3 h-24 w-full rounded-[1rem] object-cover" />
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await deleteAsset(item.image!)
                                    const nextShopByCategories = [...(homepageContent.shopByCategories ?? [])]
                                    nextShopByCategories[index] = { ...nextShopByCategories[index], image: '' }
                                    setHomepageContent({ ...homepageContent, shopByCategories: nextShopByCategories })
                                    setMessage('Shop category image removed.')
                                  } catch {
                                    setMessage('Unable to remove shop category image.')
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
                  <p className="text-xs text-[var(--color-muted)]">Save shop-by-category title, link, and image changes from here.</p>
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
                <h2 className="mt-2 text-xl font-semibold text-[var(--color-text)]">Add, edit, and delete categories</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex gap-2">
                <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Category name" />
                <Button onClick={handleSaveCategory} variant="secondary">{editingCategoryId ? 'Update' : 'Add'}</Button>
              </div>
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
      </Container>
    </section>
  )
}
