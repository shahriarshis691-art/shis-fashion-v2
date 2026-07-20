interface CloudinaryUploadOptions {
  folder?: string
  retries?: number
  onProgress?: (progress: number) => void
}

interface CloudinaryResponse {
  secure_url?: string
  error?: { message?: string }
}

interface SignedUploadResponse {
  timestamp: number
  signature: string
  apiKey: string
  folder?: string
}

interface DeleteAssetResponse {
  ok: boolean
}

function isSignedUploadEnabled() {
  return (import.meta.env.VITE_CLOUDINARY_SIGNED_UPLOAD ?? 'false') === 'true'
}

function getCloudinaryConfig() {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME.')
  }

  if (isSignedUploadEnabled()) {
    return { cloudName, uploadPreset: '' }
  }

  if (!uploadPreset) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.')
  }

  return { cloudName, uploadPreset }
}

async function getSignedUploadPayload(folder?: string) {
  const query = folder ? `?folder=${encodeURIComponent(folder)}` : ''
  const response = await fetch(`/api/cloudinary-signature${query}`)

  if (!response.ok) {
    throw new Error('Unable to create signed upload session.')
  }

  return response.json() as Promise<SignedUploadResponse>
}

async function uploadWithProgress(file: File, options: CloudinaryUploadOptions = {}) {
  const { cloudName, uploadPreset } = getCloudinaryConfig()
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
  const signedUpload = isSignedUploadEnabled() ? await getSignedUploadPayload(options.folder) : null

  return new Promise<string>((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    if (signedUpload) {
      formData.append('api_key', signedUpload.apiKey)
      formData.append('timestamp', String(signedUpload.timestamp))
      formData.append('signature', signedUpload.signature)

      if (signedUpload.folder) {
        formData.append('folder', signedUpload.folder)
      } else if (options.folder) {
        formData.append('folder', options.folder)
      }
    } else {
      formData.append('upload_preset', uploadPreset)

      if (options.folder) {
        formData.append('folder', options.folder)
      }
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return
      }
      const progress = Math.round((event.loaded / event.total) * 100)
      options.onProgress?.(progress)
    }

    xhr.onerror = () => {
      reject(new Error(`Upload failed for ${file.name}. Please check your connection and try again.`))
    }

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        const response = JSON.parse(xhr.responseText || '{}') as CloudinaryResponse
        const reason = response.error?.message || `Upload failed with status ${xhr.status}.`
        reject(new Error(reason))
        return
      }

      const response = JSON.parse(xhr.responseText || '{}') as CloudinaryResponse
      if (!response.secure_url) {
        reject(new Error('Cloudinary upload succeeded but no secure URL was returned.'))
        return
      }

      resolve(response.secure_url)
    }

    xhr.send(formData)
  })
}

async function uploadWithRetry(file: File, options: CloudinaryUploadOptions = {}) {
  const retries = Math.max(0, options.retries ?? 1)
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await uploadWithProgress(file, options)
    } catch (error) {
      lastError = error
      if (attempt === retries) {
        break
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Upload failed after retry attempts.')
}

export async function uploadSingleImage(file: File, options: CloudinaryUploadOptions = {}) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are supported for uploadSingleImage().')
  }

  return uploadWithRetry(file, options)
}

export async function uploadMultipleImages(files: File[], options: CloudinaryUploadOptions = {}) {
  if (!files.length) {
    return []
  }

  if (files.some((file) => !file.type.startsWith('image/'))) {
    throw new Error('Only image files are supported for uploadMultipleImages().')
  }

  const totalBytes = files.reduce((sum, file) => sum + Math.max(file.size, 1), 0)
  const loadedByFile = new Map<number, number>()

  const urls: string[] = []
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const url = await uploadWithRetry(file, {
      ...options,
      onProgress: (fileProgress) => {
        loadedByFile.set(index, Math.round((fileProgress / 100) * Math.max(file.size, 1)))
        const uploadedBytes = Array.from(loadedByFile.values()).reduce((sum, value) => sum + value, 0)
        const totalProgress = Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))
        options.onProgress?.(totalProgress)
      },
    })
    urls.push(url)
  }

  options.onProgress?.(100)
  return urls
}

export async function uploadMultipleAssets(files: File[], options: CloudinaryUploadOptions = {}) {
  if (!files.length) {
    return []
  }

  const totalBytes = files.reduce((sum, file) => sum + Math.max(file.size, 1), 0)
  const loadedByFile = new Map<number, number>()

  const urls: string[] = []
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const url = await uploadWithRetry(file, {
      ...options,
      onProgress: (fileProgress) => {
        loadedByFile.set(index, Math.round((fileProgress / 100) * Math.max(file.size, 1)))
        const uploadedBytes = Array.from(loadedByFile.values()).reduce((sum, value) => sum + value, 0)
        const totalProgress = Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))
        options.onProgress?.(totalProgress)
      },
    })
    urls.push(url)
  }

  options.onProgress?.(100)
  return urls
}

export async function deleteCloudinaryAssetByUrl(url: string) {
  let parsed: URL

  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (!parsed.hostname.includes('res.cloudinary.com')) {
    return false
  }

  const response = await fetch('/api/cloudinary-destroy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    return false
  }

  const payload = await response.json() as DeleteAssetResponse
  return payload.ok
}