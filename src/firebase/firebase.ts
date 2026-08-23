import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
}

const hasFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every(Boolean)

export const app: FirebaseApp | undefined = hasFirebaseConfig
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : undefined

export const auth = app ? getAuth(app) : undefined
export const db = app ? getFirestore(app) : undefined

if (auth) {
  void setPersistence(auth, browserLocalPersistence).catch((error: unknown) => {
    if (import.meta.env.DEV) {
      console.warn('[firebase] failed to set auth persistence', error)
    }
  })
}

if (import.meta.env.DEV) {
  console.info('[firebase] init', {
    hasFirebaseConfig,
    projectId: firebaseConfig.projectId || '(missing)',
    appInitialized: Boolean(app),
    authInitialized: Boolean(auth),
    firestoreInitialized: Boolean(db),
  })
}

if (import.meta.env.PROD && !hasFirebaseConfig) {
  console.error('[firebase] Missing Firebase configuration in production. Set VITE_FIREBASE_* env vars in Vercel.')
}
