import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'
import {
  createBrand,
  deleteBrand,
  restoreBrand,
  subscribeToAdminBrands,
  subscribeToArchivedBrands,
  updateBrand,
  uploadAssets,
  type AdminBrand,
} from '../../firebase/adminService'

interface BrandManagementProps {
  onDone?: () => void
}

const emptyBrandForm = {
  name: '',
  slug: '',
  tag: '',
  summary: '',
  description: '',
  website: '',
  contactEmail: '',
  contactPhone: '',
  logo: '',
  bannerImage: '',
  images: [] as string[],
}

export default function BrandManagement({ onDone }: BrandManagementProps) {
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [archivedBrands, setArchivedBrands] = useState<AdminBrand[]>([])
  const [form, setForm] = useState(emptyBrandForm)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const unsubscribeBrands = subscribeToAdminBrands((nextBrands) => setBrands(nextBrands))
    const unsubscribeArchived = subscribeToArchivedBrands((nextArchived) => setArchivedBrands(nextArchived))

    return () => {
      unsubscribeBrands?.()
      unsubscribeArchived?.()
    }
  }, [])

  const handleSaveBrand = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isEditing) {
        await updateBrand(isEditing, form)
        setMessage(`${form.name} updated successfully.`)
      } else {
        await createBrand({ ...form, images: form.images || [] })
        setMessage(`${form.name} created successfully.`)
      }

      setForm(emptyBrandForm)
      setIsEditing(null)
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Save failed.'
      setMessage(`Error: ${reason}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditBrand = (brand: AdminBrand) => {
    setIsEditing(brand.id)
    setForm({
      name: brand.name,
      slug: brand.slug,
      tag: brand.tag,
      summary: brand.summary,
      description: brand.description,
      website: brand.website,
      contactEmail: brand.contactEmail,
      contactPhone: brand.contactPhone,
      logo: brand.logo,
      bannerImage: brand.bannerImage ?? '',
      images: brand.images ?? [],
    })
  }

  const handleDeleteBrand = async (brandId: string) => {
    const shouldArchive = window.confirm('Archive this brand?')
    if (!shouldArchive) return

    setLoading(true)
    try {
      await deleteBrand(brandId)
      setMessage('Brand archived successfully.')
      if (isEditing === brandId) {
        setForm(emptyBrandForm)
        setIsEditing(null)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Delete failed.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreBrand = async (brandId: string) => {
    setLoading(true)
    try {
      await restoreBrand(brandId)
      setMessage('Brand restored successfully.')
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Restore failed.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBrandAssetUpload = async (
    files: FileList | null,
    target: 'logo' | 'banner' | 'gallery',
  ) => {
    if (!files?.length) {
      return
    }

    const selectedFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    if (!selectedFiles.length) {
      setMessage('Please select image files only.')
      return
    }

    try {
      setUploading(true)
      setMessage('')

      const uploaded = await uploadAssets(selectedFiles, 'brands', { retries: 2 })
      if (!uploaded.length) {
        return
      }

      if (target === 'logo') {
        setForm((current) => ({ ...current, logo: uploaded[0] }))
      } else if (target === 'banner') {
        setForm((current) => ({ ...current, bannerImage: uploaded[0] }))
      } else {
        setForm((current) => ({
          ...current,
          images: Array.from(new Set([...(current.images ?? []), ...uploaded])).filter(Boolean),
        }))
      }

      setMessage('Image uploaded. Save brand to publish.')
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Upload failed.'
      setMessage(`Error: ${reason}`)
    } finally {
      setUploading(false)
    }
  }

  const displayBrands = showArchived ? archivedBrands : brands

  return (
    <div id="brands-management" className="mt-6">
      <SectionTitle eyebrow="Brand management" title="Manage premium brands" description="Add, edit, or archive brand partners and showcase." />

      {message && <p className="mt-4 text-sm text-[var(--color-accent)]">{message}</p>}
      {uploading ? <p className="mt-2 text-sm text-[var(--color-muted)]">Uploading image...</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_350px]">
        <Card className="rounded-[2rem] p-5 sm:p-7">
          <form className="space-y-4" onSubmit={handleSaveBrand}>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Brand name (e.g., XEROXII)"
            />
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Slug (e.g., xeroxii)"
            />
            <input
              required
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Category tag (e.g., Luxury Watch Brand)"
            />
            <textarea
              required
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Brief summary (1-2 lines)"
              rows={2}
            />
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Full description"
              rows={3}
            />
            <input
              required
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Website URL"
            />
            <input
              required
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Contact email"
            />
            <input
              required
              type="tel"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Contact phone"
            />
            <input
              value={form.logo}
              onChange={(e) => setForm({ ...form, logo: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Logo URL"
            />
            <label className="block cursor-pointer rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)]">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleBrandAssetUpload(event.target.files, 'logo')}
                className="hidden"
              />
              Upload logo image
            </label>
            <input
              value={form.bannerImage}
              onChange={(e) => setForm({ ...form, bannerImage: e.target.value })}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Banner image URL"
            />
            <label className="block cursor-pointer rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)]">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleBrandAssetUpload(event.target.files, 'banner')}
                className="hidden"
              />
              Upload banner image
            </label>
            <textarea
              value={form.images.join('\n')}
              onChange={(e) => {
                const nextImages = e.target.value
                  .split(/[\n,]/)
                  .map((item) => item.trim())
                  .filter(Boolean)
                setForm({ ...form, images: Array.from(new Set(nextImages)) })
              }}
              className="min-h-24 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              placeholder="Gallery image URLs (comma or new line separated)"
            />
            <label className="block cursor-pointer rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-muted)]">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleBrandAssetUpload(event.target.files, 'gallery')}
                className="hidden"
              />
              Upload gallery images
            </label>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1 justify-center">
                {loading ? 'Saving…' : isEditing ? 'Update Brand' : 'Create Brand'}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setForm(emptyBrandForm)
                    setIsEditing(null)
                  }}
                  className="flex-1 justify-center"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[2rem] p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--color-text)]">{showArchived ? 'Archived' : 'Active'} Brands</p>
              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs text-[var(--color-accent)] hover:underline"
              >
                {showArchived ? 'Show active' : 'Show archived'}
              </button>
            </div>
            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
              {displayBrands.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">No brands yet.</p>
              ) : (
                displayBrands.map((brand) => (
                  <div key={brand.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
                    <p className="text-xs font-semibold text-[var(--color-text)]">{brand.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{brand.tag}</p>
                    <div className="mt-2 flex gap-1">
                      {showArchived ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleRestoreBrand(brand.id)}
                          disabled={loading}
                          className="flex-1 justify-center text-xs py-1"
                        >
                          Restore
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleEditBrand(brand)}
                            disabled={loading}
                            className="flex-1 justify-center text-xs py-1"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleDeleteBrand(brand.id)}
                            disabled={loading}
                            className="flex-1 justify-center text-xs py-1"
                          >
                            Archive
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {onDone && (
            <Button type="button" variant="secondary" onClick={onDone} className="w-full justify-center text-sm">
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
