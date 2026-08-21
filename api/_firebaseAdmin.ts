import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function readEnv(name: string) {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  return env[name] ?? ''
}

function normalizePrivateKey(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const unwrapped =
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed

  return unwrapped.replace(/\\n/g, '\n')
}

export function getFirebaseAdminDb() {
  const projectId = (readEnv('FIREBASE_ADMIN_PROJECT_ID') || readEnv('VITE_FIREBASE_PROJECT_ID')).trim()
  const clientEmail = readEnv('FIREBASE_ADMIN_CLIENT_EMAIL').trim()
  const privateKey = normalizePrivateKey(readEnv('FIREBASE_ADMIN_PRIVATE_KEY'))

  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    }

    return getFirestore()
  } catch {
    return null
  }
}