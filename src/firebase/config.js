// ─────────────────────────────────────────────────────────────────────────
// Firebase configuration
// ─────────────────────────────────────────────────────────────────────────
// Synapse ships with the full Firebase Auth + Firestore + Storage
// integration wired in src/context/AppContext.jsx. To go live:
//
// 1. Create a project at https://console.firebase.google.com
// 2. Enable Authentication (Email/Password and/or Google provider)
// 3. Create a Firestore database (start in test mode, then lock down
//    with proper security rules before shipping)
// 4. Enable Storage (for file/resource uploads)
// 5. Copy your web app config below, replacing the placeholder values
// 6. In src/context/AppContext.jsx, set USE_FIREBASE = true
//
// Until you do this, Synapse runs fully functional on local persistence
// (localStorage), so every feature works immediately with no setup.
// ─────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBFVuFMVU2NZlFV8exWnXaOaA6S4S7IOVw",
  authDomain: "synapse-58714.firebaseapp.com",
  projectId: "synapse-58714",
  storageBucket: "synapse-58714.firebasestorage.app",
  messagingSenderId: "969770131654",
  appId: "1:969770131654:web:d984caabb823dd29a337c7",
  measurementId: "G-EE533NNBSQ"
};

let app, auth, db, storage

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY' && !!firebaseConfig.apiKey

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
} catch (e) {
  // Firebase will fail to initialize with placeholder keys — that's expected
  // until real config is added. The app gracefully falls back to local mode.
  console.info('Firebase not configured yet — Synapse is running in local mode.')
}

export { app, auth, db, storage }
