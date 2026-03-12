'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { LeaderboardEntry } from '@/types'

type Tab = 'today' | 'alltime' | 'friends'

interface AlltimeEntry {
  username: string
  average_score: number
  total_games: number
  current_streak: number
  longest_streak: number
  rank: number
}

function MedalOrRank({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return <span className="text-sm font-bold text-gray-400">#{rank}</span>
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<Tab>('today')
  const [todayRows, setTodayRows] = useState<LeaderboardEntry[]>([])
  const [alltimeRows, setAlltimeRows] = useState<AlltimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchToday() {
      const supabase = getSupabaseClient()
      if (!supabase) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('leaderboard_today')
        .select('*')
        .order('rank', { ascending: true })
      setTodayRows((data as LeaderboardEntry[]) ?? [])
      setLoading(false)
    }
    fetchToday()
  }, [])

  useEffect(() => {
    if (tab !== 'alltime') return
    async function fetchAlltime() {
      setLoading(true)
      const supabase = getSupabaseClient()
      if (!supabase) { setLoading(false); return }
      const { data } = await supabase
        .from('leaderboard_alltime')
        .select('*')
        .order('rank', { ascending: true })
      setAlltimeRows((data as AlltimeEntry[]) ?? [])
      setLoading(false)
    }
    fetchAlltime()
  }, [tab])

  const isLoggedIn = !!user
  const myUsername = profile?.username ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ←
        </button>
        <h1 className="text-xl font-black text-gray-900">Leaderboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-4">
        {(['today', 'alltime', 'friends'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
              tab === t
                ? 'bg-sky-400 text-white shadow-md shadow-sky-200'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {t === 'today' ? 'Today' : t === 'alltime' ? 'All Time' : 'Friends'}
          </button>
        ))}
      </div>

      <div className="px-4 pb-10">
        {/* Friends tab — placeholder */}
        {tab === 'friends' && (
          <div className="bg-white rounded-2xl p-8 text-center space-y-3 border border-gray-100">
            <p className="text-4xl">👥</p>
            <p className="font-bold text-gray-700">Friends coming soon</p>
            <p className="text-sm text-gray-400">
              Invite friends and compete head-to-head on daily challenges.
            </p>
          </div>
        )}

        {/* Today tab */}
        {tab === 'today' && (
          <LeaderboardTable
            loading={loading}
            rows={todayRows}
            myUsername={myUsername}
            isLoggedIn={isLoggedIn}
            renderScore={(r) => r.total_score.toLocaleString()}
            renderSub={(r) => `🔥 ${r.current_streak}`}
          />
        )}

        {/* All time tab */}
        {tab === 'alltime' && (
          <LeaderboardTable
            loading={loading}
            rows={alltimeRows}
            myUsername={myUsername}
            isLoggedIn={isLoggedIn}
            renderScore={(r) => Math.round((r as AlltimeEntry).average_score).toLocaleString()}
            renderSub={(r) => `${(r as AlltimeEntry).total_games} games`}
          />
        )}
      </div>
    </div>
  )
}

interface TableProps<T extends { rank: number; username: string; current_streak?: number }> {
  loading: boolean
  rows: T[]
  myUsername: string
  isLoggedIn: boolean
  renderScore: (r: T) => string
  renderSub: (r: T) => string
}

function LeaderboardTable<T extends { rank: number; username: string; current_streak?: number }>({
  loading,
  rows,
  myUsername,
  isLoggedIn,
  renderScore,
  renderSub,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-14 animate-pulse" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
        <p className="text-gray-400 text-sm">No scores yet — be the first to play!</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        {rows.map((row, i) => {
          const isMe = row.username === myUsername
          const isBlurred = !isLoggedIn && i >= 3
          return (
            <div
              key={row.rank}
              className={`flex items-center px-4 py-3.5 border-b border-gray-50 last:border-0 transition-colors ${
                isMe ? 'bg-sky-50' : ''
              } ${isBlurred ? 'blur-[3px] select-none pointer-events-none' : ''}`}
            >
              <div className="w-10 flex items-center justify-center">
                <MedalOrRank rank={row.rank} />
              </div>
              <div className="flex-1 min-w-0 ml-2">
                <p className={`text-sm font-bold truncate ${isMe ? 'text-sky-600' : 'text-gray-800'}`}>
                  {row.username ?? 'Anonymous'}
                  {isMe && <span className="ml-1 text-xs font-normal text-sky-400">(you)</span>}
                </p>
                <p className="text-xs text-gray-400">{renderSub(row)}</p>
              </div>
              <p className={`text-sm font-black tabular-nums ${isMe ? 'text-sky-600' : 'text-gray-700'}`}>
                {renderScore(row)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Blur overlay for guests */}
      {!isLoggedIn && rows.length > 3 && (
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent rounded-b-2xl flex items-end justify-center pb-4">
          <div className="bg-sky-400 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg">
            Login to see full leaderboard
          </div>
        </div>
      )}
    </div>
  )
}
