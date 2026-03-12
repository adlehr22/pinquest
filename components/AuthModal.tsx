'use client'

import { useState, FormEvent } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

interface AuthModalProps {
  onClose: () => void
  onSuccess?: () => void
}

type AuthMode = 'signin' | 'signup'

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isSupabaseConfigured()) {
    return (
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10 animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
          <p className="text-center text-gray-500 text-sm">
            Accounts not available — Supabase is not configured.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, username)

    setLoading(false)

    if (error) {
      setError(error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1000)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {success ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-4xl">🎉</p>
            <p className="font-bold text-gray-800 text-lg">
              {mode === 'signup' ? 'Account created!' : 'Welcome back!'}
            </p>
            <p className="text-sm text-gray-400">Your score has been saved.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-5">
              <h2 className="text-xl font-black text-gray-900">
                {mode === 'signin' ? 'Sign In' : 'Save Your Score'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {mode === 'signin'
                  ? 'Sign in to sync your streak and scores'
                  : 'Create a free account to track your streak'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />

              {error && (
                <p className="text-xs text-red-500 font-medium px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-sky-400 text-white font-bold rounded-2xl hover:bg-sky-500 transition-colors disabled:opacity-60"
              >
                {loading
                  ? 'Please wait…'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>

            {/* Toggle mode */}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
              className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>

            {/* Guest continue */}
            <button
              onClick={onClose}
              className="w-full py-3 mt-1 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors border-t border-gray-100 pt-4"
            >
              Continue as Guest (scores saved locally)
            </button>
          </>
        )}
      </div>
    </div>
  )
}
