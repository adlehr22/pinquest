'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { LeaderboardEntry } from '@/types'
import ThemeToggle from '@/components/ThemeToggle'
import { getTodayDateString } from '@/utils/daily'
import { hasPlayedToday } from '@/utils/storage'

type Tab = 'today' | 'alltime' | 'friends'

interface AlltimeEntry {
  username: string
  average_score: number
  total_games: number
  current_streak: number
  longest_streak: number
  rank: number
}

const SCORE_BANDS = [
  { label: '4,001–5,000', min: 4001, max: 5000, color: 'bg-emerald-400 dark:bg-emerald-500' },
  { label: '3,001–4,000', min: 3001, max: 4000, color: 'bg-sky-400 dark:bg-sky-500' },
  { label: '2,001–3,000', min: 2001, max: 3000, color: 'bg-amber-400 dark:bg-amber-500' },
  { label: '1,001–2,000', min: 1001, max: 2000, color: 'bg-orange-400 dark:bg-orange-500' },
  { label: '0–1,000',     min: 0,    max: 1000,  color: 'bg-red-400 dark:bg-red-500' },
]

function MedalOrRank({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>
  if (rank === 2) return <span className="text-lg">🥈</span>
  if (rank === 3) return <span className="text-lg">🥉</span>
  return <span className="text-sm font-bold text-gray-400 dark:text-slate-500">#{rank}</span>
}

function ScoreDistribution({ rows }: { rows: LeaderboardEntry[] }) {
  if (rows.length === 0) return null
  const counts = SCORE_BANDS.map((b) => ({
    ...b,
    count: rows.filter((r) => r.total_score >= b.min && r.total_score <= b.max).length,
  }))
  const max = Math.max(...counts.map((c) => c.count), 1)

  return (
    <div className="bg-white dark:bg-[#162130] rounded-2xl border border-gray-100 dark:border-[#1e3a4a] px-4 py-4 mb-3">
      <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Score Distribution</p>
      <div className="space-y-2">
        {counts.map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-slate-500 w-24 flex-shrink-0">{b.label}</span>
            <div className="flex-1 bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${b.color}`}
                style={{ width: `${(b.count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400 w-5 text-right">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [tab, setTab] = useState<Tab>('today')
  const [todayRows, setTodayRows] = useState<LeaderboardEntry[]>([])
  const [alltimeRows, setAlltimeRows] = useState<AlltimeEntry[]>([])
  const [friendRows, setFriendRows] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [followingCount, setFollowingCount] = useState<number | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [playedToday, setPlayedToday] = useState(false)

  useEffect(() => {
    const ts = getTodayDateString()
    setPlayedToday(hasPlayedToday(ts))

    async function fetchToday() {
      const supabase = getSupabaseClient()
      if (!supabase) { setLoading(false); return }

      const today = new Date().toISOString().split('T')[0]
      console.log('Today date:', today)

      const { data, error } = await supabase
        .from('games')
        .select(`
          total_score,
          played_date,
          profiles (
            username,
            current_streak
          )
        `)
        .eq('played_date', today)
        .order('total_score', { ascending: false })
        .limit(100)

      console.log('Leaderboard data:', data)
      console.log('Leaderboard error:', error)

      type RawRow = {
        total_score: number
        played_date: string
        profiles: { username: string; current_streak: number }
          | { username: string; current_streak: number }[]
          | null
      }
      const rows: LeaderboardEntry[] = ((data as unknown as RawRow[]) ?? []).map((row, i) => {
        // profiles can be array or object depending on join type
        const profile = Array.isArray(row.profiles)
          ? row.profiles[0]
          : row.profiles
        return {
          username: profile?.username ?? 'Anonymous',
          total_score: row.total_score,
          played_date: row.played_date,
          current_streak: profile?.current_streak ?? 0,
          rank: i + 1,
        }
      })

      setTodayRows(rows)

      const myUsername = profile?.username ?? ''
      if (myUsername) {
        const mine = rows.find((r) => r.username === myUsername)
        if (mine) setMyRank(mine.rank)
      }
      setLoading(false)
    }
    fetchToday()
  }, [profile])

  useEffect(() => {
    if (tab !== 'friends') return
    if (!user) return
    async function fetchFriends() {
      setFriendsLoading(true)
      const supabase = getSupabaseClient()
      if (!supabase) { setFriendsLoading(false); return }

      const today = new Date().toISOString().split('T')[0]

      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user!.id)

      const followingIds = following?.map((f: { following_id: string }) => f.following_id) ?? []
      setFollowingCount(followingIds.length)

      // Include current user's own score too
      const allIds = [...followingIds, user!.id]

      const { data } = await supabase
        .from('games')
        .select(`
          total_score,
          played_date,
          profiles!inner (
            username,
            current_streak
          )
        `)
        .in('user_id', allIds)
        .eq('played_date', today)
        .order('total_score', { ascending: false })

      type RawRow = {
        total_score: number
        played_date: string
        profiles: { username: string; current_streak: number }
          | { username: string; current_streak: number }[]
      }
      const rows: LeaderboardEntry[] = ((data as unknown as RawRow[]) ?? []).map((row, i) => {
        const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
        return {
          username: p?.username ?? 'Anonymous',
          total_score: row.total_score,
          played_date: row.played_date,
          current_streak: p?.current_streak ?? 0,
          rank: i + 1,
        }
      })

      setFriendRows(rows)
      setFriendsLoading(false)
    }
    fetchFriends()
  }, [tab, user])

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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1923] transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-[#162130] border-b border-gray-100 dark:border-[#1e3a4a] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl font-black text-gray-900 dark:text-slate-100">Leaderboard</h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-4">
        {(['today', 'alltime', 'friends'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
              tab === t
                ? 'bg-sky-400 text-white shadow-md shadow-sky-200 dark:shadow-sky-900/50'
                : 'bg-white dark:bg-[#162130] text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-[#1e3a4a]'
            }`}
          >
            {t === 'today' ? 'Today' : t === 'alltime' ? 'All Time' : 'Friends'}
          </button>
        ))}
      </div>

      <div className="px-4 pb-10">
        {tab === 'today' && (
          <>
            <ScoreDistribution rows={todayRows} />
            <LeaderboardTable
              loading={loading}
              rows={todayRows}
              myUsername={myUsername}
              isLoggedIn={isLoggedIn}
              renderScore={(r) => r.total_score.toLocaleString()}
              renderSub={(r) => `🔥 ${r.current_streak}`}
            />
            {myRank !== null && myRank > 10 && playedToday && (
              <div className="mt-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800/40 rounded-2xl px-4 py-3 text-center">
                <p className="text-sm font-bold text-sky-600 dark:text-sky-400">
                  Your rank today: #{myRank} of {todayRows.length}
                </p>
              </div>
            )}
          </>
        )}

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

        {tab === 'friends' && (
          <div className="space-y-3">
            {!isLoggedIn ? (
              <div className="bg-white dark:bg-[#162130] rounded-2xl border border-gray-100 dark:border-[#1e3a4a] p-8 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">Sign in to see friends&apos; scores</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">Create an account to follow friends and compare scores.</p>
              </div>
            ) : friendsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#162130] rounded-xl h-14 animate-pulse" />
                ))}
              </div>
            ) : followingCount === 0 ? (
              <div className="bg-white dark:bg-[#162130] rounded-2xl border border-gray-100 dark:border-[#1e3a4a] p-8 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">You&apos;re not following anyone yet</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Add friends to see their scores here.</p>
                <button
                  onClick={() => router.push('/profile')}
                  className="text-xs font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  Find friends →
                </button>
              </div>
            ) : friendRows.length === 0 ? (
              <div className="bg-white dark:bg-[#162130] rounded-2xl border border-gray-100 dark:border-[#1e3a4a] p-8 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">None of your friends have played today yet</p>
                <button
                  onClick={() => {
                    const url = 'https://pinquest.app'
                    if (navigator.share) {
                      navigator.share({ title: 'PinQuest', url })
                    } else {
                      navigator.clipboard.writeText(url)
                    }
                  }}
                  className="mt-2 text-xs font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  Share PinQuest with friends →
                </button>
              </div>
            ) : (
              <LeaderboardTable
                loading={false}
                rows={friendRows}
                myUsername={myUsername}
                isLoggedIn={isLoggedIn}
                renderScore={(r) => r.total_score.toLocaleString()}
                renderSub={(r) => `🔥 ${r.current_streak}`}
              />
            )}
          </div>
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
          <div key={i} className="bg-white dark:bg-[#162130] rounded-xl h-14 animate-pulse" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white dark:bg-[#162130] rounded-2xl p-8 text-center border border-gray-100 dark:border-[#1e3a4a]">
        <p className="text-gray-400 dark:text-slate-500 text-sm">No scores yet today — be the first to play!</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="bg-white dark:bg-[#162130] rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1e3a4a]">
        {rows.map((row, i) => {
          const isMe = row.username === myUsername
          const isBlurred = !isLoggedIn && i >= 3
          return (
            <div
              key={row.rank}
              className={`flex items-center px-4 py-3.5 border-b border-gray-50 dark:border-[#1e3a4a] last:border-0 animate-row-in transition-colors ${
                isMe ? 'bg-sky-50 dark:bg-sky-900/20' : ''
              } ${isBlurred ? 'blur-[3px] select-none pointer-events-none' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="w-10 flex items-center justify-center">
                <MedalOrRank rank={row.rank} />
              </div>
              <div className="flex-1 min-w-0 ml-2">
                <p className={`text-sm font-bold truncate ${isMe ? 'text-sky-600 dark:text-sky-400' : 'text-gray-800 dark:text-slate-200'}`}>
                  {row.username ?? 'Anonymous'}
                  {isMe && <span className="ml-1 text-xs font-normal text-sky-400">(you)</span>}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">{renderSub(row)}</p>
              </div>
              <p className={`text-sm font-black tabular-nums ${isMe ? 'text-sky-600 dark:text-sky-400' : 'text-gray-700 dark:text-slate-200'}`}>
                {renderScore(row)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Blur overlay for guests */}
      {!isLoggedIn && rows.length > 3 && (
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-gray-50 dark:from-[#0f1923] to-transparent rounded-b-2xl flex items-end justify-center pb-4">
          <div className="bg-sky-400 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg">
            Login to see full leaderboard
          </div>
        </div>
      )}
    </div>
  )
}
