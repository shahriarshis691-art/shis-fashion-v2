export interface BlobUploadResult {
  url: string
  pathname: string
}

export async function uploadToBlob(files: File[], folder: string) {
  const formData = new FormData()
  formData.append('folder', folder)

  files.forEach((file) => formData.append('file', file))

  const response = await fetch('/api/blob', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed.' }))
    throw new Error(error.error || 'Upload failed.')
  }

  return (await response.json()) as BlobUploadResult[]
}

export async function deleteBlob(pathname: string) {
  const response = await fetch('/api/blob', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pathname }),
  })

  if (!response.ok) {
    throw new Error('Delete failed.')
  }
}
