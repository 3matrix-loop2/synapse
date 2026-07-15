import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut as fbSignOut, updateProfile, GoogleAuthProvider, signInWithPopup
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config.js'

const LOCAL_USERS_KEY = 'synapse:local-users'
const LOCAL_SESSION_KEY = 'synapse:local-session'

const AuthContext = createContext(null)

// ─────────────────────────────────────────────────────────────────────────
// Local-demo auth: used automatically until real Firebase credentials are
// added to src/firebase/config.js. It's a real, working login/signup flow —
// accounts and sessions persist in localStorage — but it is NOT secure
// (passwords aren't hashed) and is meant only to make the app fully
// functional out of the box. Set real Firebase config to replace it.
// ─────────────────────────────────────────────────────────────────────────
function readLocalUsers() {
  try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY)) || {} } catch { return {} }
}
function writeLocalUsers(users) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsub = onAuthStateChanged(auth, (fbUser) => {
        setUser(fbUser ? { uid: fbUser.uid, name: fbUser.displayName || fbUser.email.split('@')[0], email: fbUser.email } : null)
        setLoading(false)
      })
      return unsub
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_SESSION_KEY)
        setUser(raw ? JSON.parse(raw) : null)
      } catch { setUser(null) }
      setLoading(false)
    }
  }, [])

  const signUp = useCallback(async (name, email, password) => {
    setError('')
    if (isFirebaseConfigured && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      setUser({ uid: cred.user.uid, name, email })
      return
    }
    const users = readLocalUsers()
    if (users[email]) throw new Error('An account with this email already exists.')
    const uid = 'local_' + Date.now()
    users[email] = { uid, name, email, password }
    writeLocalUsers(users)
    const session = { uid, name, email }
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
    setUser(session)
  }, [])

  const signIn = useCallback(async (email, password) => {
    setError('')
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      setUser({ uid: cred.user.uid, name: cred.user.displayName || email.split('@')[0], email })
      return
    }
    const users = readLocalUsers()
    const found = users[email]
    if (!found || found.password !== password) throw new Error('Incorrect email or password.')
    const session = { uid: found.uid, name: found.name, email: found.email }
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session))
    setUser(session)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!(isFirebaseConfigured && auth)) {
      throw new Error('Google sign-in needs real Firebase credentials — add them in src/firebase/config.js.')
    }
    const cred = await signInWithPopup(auth, new GoogleAuthProvider())
    setUser({ uid: cred.user.uid, name: cred.user.displayName, email: cred.user.email })
  }, [])

  const signOutUser = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      await fbSignOut(auth)
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY)
    }
    setUser(null)
  }, [])

  const value = { user, loading, error, signUp, signIn, signInWithGoogle, signOut: signOutUser, isFirebaseConfigured }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
