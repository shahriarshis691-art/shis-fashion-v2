import { useRef, useState } from 'react'
import type { AdminProduct } from '../../firebase/adminService'
import { createProduct, updateProduct } from '../../firebase/adminService'
import Button from '../ui/Button'
import { downloadCsv } from '../../utils/adminCsv'
import {
  parseProductCsv,
  planProductCsvImport,
  productsToCsvRows,
  PRODUCT_CSV_HEADERS,
  PRODUCT_CSV_MAX_ROWS,
  type ProductCsvIssue,
  type ProductCsvRecord,
} from '../../utils/productCsv'

interface ProductCsvPanelProps {
  products: AdminProduct[]
  canWrite: boolean
  onMessage: (message: string) => void
}

export default function ProductCsvPanel({ products, canWrite, onMessage }: ProductCsvPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<ProductCsvIssue[]>([])
  const [preview, setPreview] = useState<Array<{ action: 'create' | 'update'; id?: string; record: ProductCsvRecord }>>([])
  const [importing, setImporting] = useState(false)

  const exportCatalog = () => {
    if (!products.length) {
      onMessage('No products to export.')
      return
    }

    downloadCsv(
      `products-${new Date().toISOString().slice(0, 10)}.csv`,
      [...PRODUCT_CSV_HEADERS],
      productsToCsvRows(products),
    )
    onMessage(`${products.length} products exported.`)
  }

  const handleFile = async (file: File) => {
    const text = await file.text()
    const parsed = parseProductCsv(text)
    setErrors(parsed.errors)
    const planned = planProductCsvImport(parsed.records, products)
    setPreview(planned)
    if (!parsed.records.length) {
      onMessage(parsed.errors[0]?.message || 'No valid product rows found.')
      return
    }

    onMessage(`${planned.length} valid row${planned.length === 1 ? '' : 's'} ready. ${parsed.errors.length} row${parsed.errors.length === 1 ? '' : 's'} skipped.`)
  }

  const applyImport = async () => {
    if (!canWrite || !preview.length || importing) {
      return
    }

    setImporting(true)
    let created = 0
    let updated = 0
    try {
      for (const entry of preview) {
        const payload = {
          name: entry.record.name,
          slug: entry.record.slug,
          price: entry.record.price,
          comparePrice: entry.record.comparePrice,
          brand: entry.record.brand,
          category: entry.record.category,
          stock: entry.record.stock,
          sizes: entry.record.sizes,
          colors: entry.record.colors,
          description: entry.record.description,
          featured: entry.record.featured,
          newArrival: entry.record.newArrival,
          hero: entry.record.hero,
          featuredImage: entry.record.featuredImage,
          images: entry.record.images,
          variants: entry.record.variants,
          videos: [] as string[],
        }

        if (entry.action === 'update' && entry.id) {
          await updateProduct(entry.id, payload)
          updated += 1
        } else {
          await createProduct(payload)
          created += 1
        }
      }

      setPreview([])
      setErrors([])
      if (fileRef.current) {
        fileRef.current.value = ''
      }
      onMessage(`Import complete. Created ${created}, updated ${updated}.`)
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'Import failed. Check the last product and try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="mt-4 rounded-[1.2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">Catalog CSV</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Export the live catalog or import up to {PRODUCT_CSV_MAX_ROWS} products. Variants use <span className="font-mono">size:color:stock</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={exportCatalog}>Export catalog</Button>
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={!canWrite}>
            Choose CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void handleFile(file)
              }
            }}
          />
        </div>
      </div>

      {preview.length ? (
        <div className="mt-3">
          <p className="text-xs text-[var(--color-muted)]">
            {preview.filter((entry) => entry.action === 'create').length} new · {preview.filter((entry) => entry.action === 'update').length} updates
          </p>
          <div className="mt-2 max-h-40 overflow-auto text-xs">
            {preview.slice(0, 12).map((entry) => (
              <p key={entry.record.slug} className="truncate text-[var(--color-text)]">
                {entry.action === 'create' ? 'Create' : 'Update'} {entry.record.name} ({entry.record.slug})
              </p>
            ))}
            {preview.length > 12 ? <p className="text-[var(--color-muted)]">+{preview.length - 12} more</p> : null}
          </div>
          <Button type="button" className="mt-3" onClick={() => { void applyImport() }} disabled={!canWrite || importing}>
            {importing ? 'Importing…' : `Import ${preview.length} product${preview.length === 1 ? '' : 's'}`}
          </Button>
        </div>
      ) : null}

      {errors.length ? (
        <div className="mt-3 max-h-32 overflow-auto text-xs text-rose-700">
          {errors.slice(0, 8).map((error) => (
            <p key={`${error.line}-${error.message}`}>Line {error.line}: {error.message}</p>
          ))}
          {errors.length > 8 ? <p>+{errors.length - 8} more validation errors</p> : null}
        </div>
      ) : null}
    </div>
  )
}
