'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'

export default function UserAvatar() {
  const { user, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!user) return null

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : user.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-full bg-sky-400 flex items-center justify-center text-white text-xs font-bold"
        aria-label="Account menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-9 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-48 z-50">
          <p className="px-4 py-1 text-xs text-gray-400 truncate">
            {profile?.username ?? user.email}
          </p>
          <hr className="my-1 border-gray-100" />
          <button
            onClick={() => {
              signOut()
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
