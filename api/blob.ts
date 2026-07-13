import { del, put } from '@vercel/blob'

export const runtime = 'nodejs'

function toDataUrl(file: File, bytes: Uint8Array) {
  return `data:${file.type || 'application/octet-stream'};base64,${Buffer.from(bytes).toString('base64')}`
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const folder = formData.get('folder')?.toString() ?? 'uploads'
  const files = formData.getAll('file')

  if (!files.length) {
    return Response.json({ error: 'No files provided.' }, { status: 400 })
  }

  const uploaded: Array<{ url: string; pathname: string }> = []

  for (const entry of files) {
    if (typeof entry === 'string' || !entry.name) {
      continue
    }

    const file = entry as File
    const bytes = new Uint8Array(await file.arrayBuffer())

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      uploaded.push({ url: toDataUrl(file, bytes), pathname: `${folder}/${file.name}` })
      continue
    }

    const result = await put(`${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`, bytes, {
      access: 'public',
      contentType: file.type || 'application/octet-stream',
      addRandomSuffix: false,
    })

    uploaded.push({ url: result.url, pathname: result.pathname })
  }

  return Response.json(uploaded)
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null)
  const pathname = body?.pathname ?? body?.url

  if (!pathname) {
    return Response.json({ error: 'No blob path provided.' }, { status: 400 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ ok: true })
  }

  await del(pathname)
  return Response.json({ ok: true })
}
