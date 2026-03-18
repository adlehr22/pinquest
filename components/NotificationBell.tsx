'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

interface Notification {
  id: string
  type: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

function typeIcon(type: string) {
  if (type === 'new_follower') return '👋'
  if (type === 'friend_beat_score') return '🎯'
  if (type === 'top_three') return '🏆'
  return '🔔'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationBell() {
  const { user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
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

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    const notifs = (data as Notification[]) ?? []
    setNotifications(notifs)
    setUnreadCount(notifs.filter((n) => !n.read).length)
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAllRead = async () => {
    if (!user || notifications.every((n) => n.read)) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      const supabase = getSupabaseClient()
      if (supabase) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    }
    setOpen(false)
    if (notif.link) router.push(notif.link)
  }

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) fetchNotifications()
        }}
        className="relative flex items-center justify-center min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
        aria-label="Notifications"
      >
        <span className="text-[24px] leading-none">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 sm:-top-0.5 sm:-right-0.5 w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-16 z-[1000] sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:w-80 bg-white dark:bg-[#162130] rounded-2xl shadow-xl border border-gray-100 dark:border-[#1e3a4a] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#1e3a4a]">
            <span className="text-sm font-black text-gray-900 dark:text-slate-100">Notifications</span>
            {notifications.some((n) => !n.read) && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 dark:text-slate-500 py-8">
                No notifications yet
              </p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-[#1e3a4a] last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors min-h-[44px] ${
                    !notif.read
                      ? 'border-l-2 border-l-sky-400 bg-sky-50/40 dark:bg-sky-900/10'
                      : ''
                  }`}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {typeIcon(notif.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        !notif.read
                          ? 'font-semibold text-gray-800 dark:text-slate-200'
                          : 'text-gray-600 dark:text-slate-400'
                      }`}
                    >
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
