import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const REQUIRED_CONFIG = ['apiKey', 'authDomain', 'projectId', 'appId']

function getFirebaseAuth() {
  const missing = REQUIRED_CONFIG.filter((key) => !firebaseConfig[key])
  if (missing.length > 0) {
    throw new Error(`Thiếu cấu hình Firebase Web: ${missing.join(', ')}`)
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
  return getAuth(app)
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  const result = await signInWithPopup(auth, new GoogleAuthProvider())
  return result.user.getIdToken()
}
