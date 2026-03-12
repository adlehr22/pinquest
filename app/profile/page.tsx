'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'
import { getStreakData } from '@/utils/streak'
import { getPersonalBest } from '@/utils/storage'
import { GameRecord } from '@/types'

function CalendarHeatmap({ games }: { games: GameRecord[] }) {
  const playedDates = new Set(games.map((g) => g.played_date))
  const days: { dateStr: string; label: string; played: boolean; isToday: boolean }[] = []
  const todayStr = new Date().toISOString().split('T')[0]

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
    days.push({ dateStr, label, played: playedDates.has(dateStr), isToday: dateStr === todayStr })
  }

  return (
    <div className="flex gap-2 justify-between">
      {days.map((d) => (
        <div key={d.dateStr} className="flex flex-col items-center gap-1.5">
          <div
            className={`w-9 h-9 rounded-xl transition-colors ${
              d.played
                ? 'bg-emerald-400'
                : 'bg-gray-100'
            } ${d.isToday ? 'ring-2 ring-sky-300' : ''}`}
          />
          <span className="text-xs text-gray-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [recentGames, setRecentGames] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)

  const streakData = getStreakData()
  const personalBest = getPersonalBest()

  useEffect(() => {
    async function fetchGames() {
      const supabase = getSupabaseClient()
      if (!supabase || !user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', user.id)
        .order('played_date', { ascending: false })
        .limit(7)
      setRecentGames((data as GameRecord[]) ?? [])
      setLoading(false)
    }
    fetchGames()
  }, [user])

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

  const displayName = profile?.username ?? user?.email ?? 'Guest'
  const avgScore = profile?.average_score ? Math.round(profile.average_score) : null
  const totalGames = profile?.total_games ?? 0

  const stats = [
    { icon: '🔥', label: 'Current Streak', value: `${streakData.current} days` },
    { icon: '🏆', label: 'Best Score', value: personalBest?.toLocaleString() ?? '—' },
    { icon: '📊', label: 'Avg Score', value: avgScore?.toLocaleString() ?? '—' },
    { icon: '🎮', label: 'Games Played', value: totalGames.toString() },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl font-black text-gray-900">Profile</h1>
        </div>
        {user && (
          <button
            onClick={async () => { await signOut(); router.push('/') }}
            className="text-sm text-red-400 font-semibold hover:text-red-600 transition-colors"
          >
            Sign out
          </button>
        )}
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Identity card */}
        <div className="bg-white rounded-2xl px-5 py-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-400 flex items-center justify-center text-white text-2xl font-black">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{displayName}</p>
            {joinedDate && (
              <p className="text-sm text-gray-400">Member since {joinedDate}</p>
            )}
            {!user && (
              <p className="text-sm text-amber-500 font-medium mt-0.5">
                Guest · scores saved locally
              </p>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Last 7 days heatmap */}
        <div className="bg-white rounded-2xl px-5 py-5 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Last 7 Days
          </p>
          {loading ? (
            <div className="h-12 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <CalendarHeatmap games={recentGames} />
          )}
        </div>

        {/* Recent games */}
        {recentGames.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="grid grid-cols-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase">Date</p>
              <p className="text-xs font-bold text-gray-400 uppercase text-center">Score</p>
              <p className="text-xs font-bold text-gray-400 uppercase text-right">Rounds</p>
            </div>
            {recentGames.map((game) => {
              const d = new Date(game.played_date + 'T12:00:00')
              const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const rounds = Array.isArray(game.round_results) ? game.round_results.length : 0
              return (
                <div key={game.id} className="grid grid-cols-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  <p className="text-sm font-medium text-gray-700">{dateLabel}</p>
                  <p className="text-sm font-black text-sky-600 text-center tabular-nums">
                    {game.total_score.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400 text-right">{rounds}/5</p>
                </div>
              )
            })}
          </div>
        )}

        {!user && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl px-5 py-4 text-center">
            <p className="text-sm font-semibold text-sky-700">
              Sign in to sync your scores and streak across devices.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-3 px-5 py-2 bg-sky-400 text-white text-sm font-bold rounded-xl"
            >
              Go to Home →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
