import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
import {
  createProduct,
  deleteAsset,
  deleteProduct,
  isFirebaseConfigured,
  signInAdmin,
  signOutAdmin,
  subscribeToHomepageContent,
  subscribeToOrders,
  subscribeToProducts,
  updateHomepageContent,
  updateOrderStatus,
  updateProduct,
  uploadAssets,
  type AdminOrder,
  type AdminProduct,
  type HomepageContent,
  onAdminAuthChanged,
} from '../firebase/adminService'

const emptyProductForm = {
  name: '',
  price: '$0',
  stock: 1,
  sizes: ['M'],
  colors: ['Ivory'],
  description: '',
  category: 'oversized-tee',
  images: [] as string[],
  videos: [] as string[],
  featured: false,
  newArrival: false,
  hero: false,
}

interface AdminPageProps {
  initialView?: 'login' | 'dashboard'
}

export default function AdminPage({ initialView = 'login' }: AdminPageProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'dashboard'>(initialView)
  const [loginForm, setLoginForm] = useState({ email: 'admin@shisfashion.com', password: 'luxury123' })
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const [form, setForm] = useState(emptyProductForm)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const unsubscribe = onAdminAuthChanged((nextUser) => {
      setUser(nextUser)

      if (nextUser) {
        setAuthMode('dashboard')
        if (initialView === 'login') {
          navigate('/shis-admin/dashboard', { replace: true })
        }
        return
      }

      setAuthMode('login')
      if (initialView === 'dashboard') {
        navigate('/shis-admin/login', { replace: true })
      }
    })

    return unsubscribe
  }, [initialView, navigate])

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts((nextProducts) => setProducts(nextProducts))
    const unsubscribeOrders = subscribeToOrders((nextOrders) => setOrders(nextOrders))
    const unsubscribeHomepage = subscribeToHomepageContent((nextContent) => setHomepageContent(nextContent))

    return () => {
      unsubscribeProducts()
      unsubscribeOrders()
      unsubscribeHomepage()
    }
  }, [])

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase()
    return orders.filter((order) => [order.customerName, order.customerEmail, order.address, order.status].some((value) => value.toLowerCase().includes(query)))
  }, [orders, search])

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
      navigate('/shis-admin/dashboard', { replace: true })
    } catch {
      setMessage('Sign-in failed. Try the demo credentials or confirm Firebase is configured.')
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

  const handleUpload = async (
    files: FileList | null,
    target: 'product-images' | 'product-videos' | 'hero-image' | 'hero-video' | 'banner-image' | 'category-image' | null = null,
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

    setUploading(true)
    try {
      const uploadedImages = imageFiles.length ? await uploadAssets(imageFiles, target === 'hero-image' || target === 'banner-image' || target === 'category-image' ? 'homepage' : 'products') : []
      const uploadedVideos = videoFiles.length ? await uploadAssets(videoFiles, target === 'hero-video' ? 'homepage' : 'products') : []

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
      } else {
        setForm((current) => ({ ...current, images: [...current.images, ...uploadedImages], videos: [...current.videos, ...uploadedVideos] }))
      }

      setMessage('Assets uploaded successfully.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>, target: 'product-images' | 'product-videos' | 'hero-image' | 'hero-video' | 'banner-image' | 'category-image' | null = null) => {
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
      if (isEditing) {
        await updateProduct(isEditing, {
          ...form,
          sizes: form.sizes,
          colors: form.colors,
        })
        setMessage('Product updated.')
      } else {
        await createProduct({
          ...form,
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
    setForm({
      name: product.name,
      price: product.price,
      stock: product.stock,
      sizes: product.sizes,
      colors: product.colors,
      description: product.description,
      category: product.category,
      images: product.images,
      videos: product.videos,
      featured: product.featured,
      newArrival: product.newArrival,
      hero: product.hero,
    })
    setIsEditing(product.id)
  }

  const handleDeleteProduct = async (productId: string) => {
    await deleteProduct(productId)
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

  if (authMode === 'login' && !user) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <SectionTitle eyebrow="Admin access" title="Secure control center" description="Fast sign-in for your premium operations dashboard." />
          <Card className="mt-8 rounded-[2rem] p-5 sm:p-7">
            <form className="space-y-4" onSubmit={handleLogin}>
              <input required value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Email" />
              <input required type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Password" />
              <Button type="submit" disabled={loading} className="w-full justify-center">{loading ? 'Signing in…' : 'Enter dashboard'}</Button>
            </form>
            <p className="mt-4 text-sm text-[var(--color-muted)]">{isFirebaseConfigured() ? 'Firebase is active.' : 'Using local-first admin storage for a fast demo experience.'}</p>
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

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card className="rounded-[1.6rem] p-4">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-accent)]">Products</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{products.length}</h2>
          </Card>
          <Card className="rounded-[1.6rem] p-4">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-accent)]">Orders</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{orders.length}</h2>
          </Card>
          <Card className="rounded-[1.6rem] p-4">
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--color-accent)]">Live status</p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{isFirebaseConfigured() ? 'Firebase' : 'Local'}</h2>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
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
              <div onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => handleDrop(event, null)} className={`rounded-[1.5rem] border border-dashed p-4 text-center text-sm ${dragActive ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>
                <label className="cursor-pointer">
                  <input type="file" multiple accept="image/*,video/*" onChange={(event) => handleUpload(event.target.files, null)} className="hidden" />
                  Drag and drop images or videos here, or tap to upload.
                </label>
                {uploading ? <p className="mt-2 text-[var(--color-accent)]">Uploading…</p> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {form.images.map((image) => (
                  <span key={image} className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]">
                    <span>Image ready</span>
                    <button type="button" onClick={() => handleRemoveMedia(image, 'image')} className="text-[var(--color-accent)]">×</button>
                  </span>
                ))}
                {form.videos.map((video) => (
                  <span key={video} className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]">
                    <span>Video ready</span>
                    <button type="button" onClick={() => handleRemoveMedia(video, 'video')} className="text-[var(--color-accent)]">×</button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-2 text-[var(--color-muted)]"><input type="checkbox" checked={form.featured} onChange={() => setForm({ ...form, featured: !form.featured })} /> Featured</label>
                <label className="flex items-center gap-2 text-[var(--color-muted)]"><input type="checkbox" checked={form.newArrival} onChange={() => setForm({ ...form, newArrival: !form.newArrival })} /> New arrival</label>
                <label className="flex items-center gap-2 text-[var(--color-muted)]"><input type="checkbox" checked={form.hero} onChange={() => setForm({ ...form, hero: !form.hero })} /> Hero spotlight</label>
              </div>
              <Button type="submit" disabled={loading} className="w-full justify-center">{isEditing ? 'Update product' : 'Create product'}</Button>
            </form>
          </Card>

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
                      <h3 className="text-base font-semibold text-[var(--color-text)]">{order.customerName}</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{order.customerEmail}</p>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{order.address}</p>
                    </div>
                    <div className="min-w-[180px]">
                      <select value={order.status} onChange={(event) => handleStatusChange(order.id, event.target.value as AdminOrder['status'])} className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none">
                        {['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <input value={order.trackingNumber ?? ''} onChange={() => undefined} className="mt-2 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none" placeholder="Tracking number" />
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-[var(--color-muted)]">
                    {order.items.map((item) => <p key={`${order.id}-${item.name}`}>{item.name} × {item.quantity}</p>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

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
                <input value={homepageContent.heroTitle} onChange={(event) => setHomepageContent({ ...homepageContent, heroTitle: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Hero title" />
                <textarea value={homepageContent.heroSubtitle} onChange={(event) => setHomepageContent({ ...homepageContent, heroSubtitle: event.target.value })} className="min-h-20 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Hero subtitle" />
                <input value={homepageContent.heroCta} onChange={(event) => setHomepageContent({ ...homepageContent, heroCta: event.target.value })} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" placeholder="Hero CTA" />
                <div onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => handleDrop(event, 'hero-image')} className={`rounded-[1.5rem] border border-dashed p-4 text-center text-sm ${dragActive ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={(event) => handleUpload(event.target.files, 'hero-image')} className="hidden" />
                    Drop hero image or tap to replace.
                  </label>
                </div>
                {homepageContent.heroImage ? <img src={homepageContent.heroImage} alt="Hero preview" className="h-40 w-full rounded-[1.25rem] object-cover" /> : null}
                <div onDragOver={(event) => { event.preventDefault(); setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={(event) => handleDrop(event, 'hero-video')} className={`rounded-[1.5rem] border border-dashed p-4 text-center text-sm ${dragActive ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>
                  <label className="cursor-pointer">
                    <input type="file" accept="video/*" onChange={(event) => handleUpload(event.target.files, 'hero-video')} className="hidden" />
                    Drop hero video or tap to replace.
                  </label>
                </div>
                {homepageContent.heroVideo ? <video src={homepageContent.heroVideo} controls className="h-40 w-full rounded-[1.25rem] object-cover" /> : null}
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
                      {category.image ? <img src={category.image} alt={`${category.title} preview`} className="mt-3 h-24 w-full rounded-[1rem] object-cover" /> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        </div>
      </Container>
    </section>
  )
}
