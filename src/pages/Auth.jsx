import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Input, Button } from '../components/ui.jsx'
import deskImage from '../assets/synapse-desk.png'

export default function Auth() {
  const { user, signIn, signUp, signInWithGoogle, isFirebaseConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Once a session exists (fresh sign-in, or already logged in), leave the login screen.
  useEffect(() => {
    if (user) {
      const dest = location.state?.from || '/'
      navigate(dest, { replace: true })
    }
  }, [user, navigate, location.state])

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signin') await signIn(email.trim(), password)
      else await signUp(name.trim() || email.split('@')[0], email.trim(), password)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function google() {
    setError('')
    try { await signInWithGoogle() } catch (err) { setError(err.message) }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(180deg, rgb(11 10 8 / 0.7) 0%, rgb(11 10 8 / 0.9) 100%), url(${deskImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center 30%'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm glass-panel rounded-xl2 shadow-panel p-7"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ember-400 to-ember-600 flex items-center justify-center shadow-glow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2 14 10 22 12 14 14 12 22 10 14 2 12 10 10Z" /></svg>
          </div>
          <div>
            <p className="font-display text-lg leading-none">Synapse</p>
            <p className="text-[11px] text-ink-300 leading-none mt-1">Your space. Your flow.</p>
          </div>
        </div>

        <h1 className="font-display text-xl text-ink-50 mb-1">{mode === 'signin' ? 'Welcome back' : 'Create your workspace'}</h1>
        <p className="text-sm text-ink-300 mb-5">{mode === 'signin' ? 'Sign in to pick up where you left off.' : 'Set up your account in a few seconds.'}</p>

        {!isFirebaseConfigured && (
          <p className="text-[11px] text-ember-300 bg-ember-500/10 border border-ember-500/20 rounded-lg px-3 py-2 mb-4">
            Running in local demo auth (no Firebase connected yet). Your account stays on this device only.
          </p>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === 'signup' && <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />}
          <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          {error && <p className="text-xs text-red-300">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" /><span className="text-[11px] text-ink-300">or</span><div className="flex-1 h-px bg-white/10" />
        </div>

        <Button variant="ghost" className="w-full" onClick={google}>Continue with Google</Button>

        <p className="text-xs text-ink-300 text-center mt-5">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')} className="text-ember-300 hover:text-ember-200 font-medium">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
