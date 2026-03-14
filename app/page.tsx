'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getPersonalBest } from '@/utils/storage'
import { getStreakData, isStreakAtRisk } from '@/utils/streak'
import { getTodayDateString, getDailyLocations } from '@/utils/daily'
import { hasPlayedToday, getTodayResult } from '@/utils/storage'
import { getSupabaseClient } from '@/lib/supabase'
import AuthModal from '@/components/AuthModal'
import ThemeToggle from '@/components/ThemeToggle'
import WorldMapBg from '@/components/WorldMapBg'

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#162130] rounded-t-3xl w-full max-w-md p-6 pb-10 space-y-4 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mb-2" />
        <h2 className="text-xl font-black text-gray-900 dark:text-slate-100">How to Play</h2>
        <div className="space-y-3">
          {[
            { icon: '🌍', title: 'Daily Challenge', desc: 'Everyone gets the same 5 locations each day.' },
            { icon: '📍', title: 'Drop Your Pin', desc: 'Tap anywhere on the world map where you think the location is.' },
            { icon: '🔒', title: 'Lock It In', desc: 'Once happy with your pin, tap "Lock It In" to submit.' },
            { icon: '📏', title: 'Score by Distance', desc: 'Closer guesses earn more points — up to 1,000 pts per round.' },
            { icon: '💡', title: 'Use a Hint', desc: 'Stuck? Hint zooms to the right region — costs 500 pts.' },
            { icon: '🔥', title: 'Build a Streak', desc: 'Play every day to build your streak. Miss a day and it resets!' },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 items-start">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-slate-200 text-sm">{item.title}</p>
                <p className="text-gray-500 dark:text-slate-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-3 bg-sky-400 text-white font-bold rounded-2xl mt-4">
          Got It!
        </button>
      </div>
    </div>
  )
}

function DifficultyPills({ easy, medium, hard }: { easy: number; medium: number; hard: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">Today:</span>
      {easy > 0 && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
          {easy} Easy
        </span>
      )}
      {medium > 0 && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
          {medium} Medium
        </span>
      )}
      {hard > 0 && (
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
          {hard} Hard
        </span>
      )}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [personalBest, setPersonalBestState] = useState<number | null>(null)
  const [showHowTo, setShowHowTo] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [today, setToday] = useState('')
  const [todayStr, setTodayStr] = useState('')
  const [playedToday, setPlayedToday] = useState(false)
  const [streakData, setStreakData] = useState({ current: 0, longest: 0, lastPlayedDate: null as string | null })
  const [atRisk, setAtRisk] = useState(false)
  const [todayScore, setTodayScore] = useState<number | null>(null)
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [difficultyCount, setDifficultyCount] = useState({ easy: 0, medium: 0, hard: 0 })
  const [afterSixPm, setAfterSixPm] = useState(false)

  useEffect(() => {
    const ts = getTodayDateString()
    setTodayStr(ts)
    setPlayedToday(hasPlayedToday(ts))
    setPersonalBestState(getPersonalBest())
    const sd = getStreakData()
    setStreakData(sd)
    setAtRisk(isStreakAtRisk(sd.lastPlayedDate, ts))

    const result = getTodayResult()
    if (result?.dateStr === ts) setTodayScore(result.totalScore)

    const now = new Date()
    setAfterSixPm(now.getHours() >= 18)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    setToday(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`)

    // Count today's difficulty mix
    const locs = getDailyLocations(ts)
    setDifficultyCount({
      easy:   locs.filter((l) => l.difficulty === 'easy').length,
      medium: locs.filter((l) => l.difficulty === 'medium').length,
      hard:   locs.filter((l) => l.difficulty === 'hard').length,
    })

    // Fetch player count from leaderboard_today (public read)
    const supabase = getSupabaseClient()
    if (supabase) {
      supabase
        .from('leaderboard_today')
        .select('rank', { count: 'exact', head: true })
        .then(({ count }) => {
          if (count && count > 0) setPlayerCount(count)
        }, () => {})
    }
  }, [])

  const handlePlay = () => router.push('/game')
  const handleViewResults = () => router.push('/game')

  // Streak urgency: amber after 6pm if streak is at risk, blue before
  const urgencyStyle = afterSixPm
    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400'
    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400'

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-[#0f1923] dark:to-[#0f1923] flex flex-col items-center justify-center px-6 py-8 transition-colors duration-200 overflow-hidden">
      <WorldMapBg />

      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <div className="relative w-full max-w-sm space-y-6 text-center">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/leaderboard')}
            className="text-xs font-bold text-gray-400 dark:text-slate-500 hover:text-sky-500 transition-colors flex items-center gap-1"
          >
            🏆 Leaderboard
          </button>
          <ThemeToggle />
          <button
            onClick={() => router.push('/profile')}
            className="text-xs font-bold text-gray-400 dark:text-slate-500 hover:text-sky-500 transition-colors flex items-center gap-1"
          >
            {user ? `👤 ${profile?.username ?? 'Profile'}` : '👤 Profile'}
          </button>
        </div>

        {/* App icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-sky-400 rounded-[28px] flex items-center justify-center shadow-2xl shadow-sky-200 dark:shadow-sky-900">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="40" height="60" className="drop-shadow-sm">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24S24 20.25 24 12C24 5.373 18.627 0 12 0z" fill="white" />
              <circle cx="12" cy="12" r="5" fill="#38BDF8" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-gray-900 dark:text-slate-100 tracking-tight">PinQuest</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">Daily Geography Challenge</p>
          <p className="text-gray-400 dark:text-slate-500 text-sm">{today}</p>
          {/* Difficulty preview */}
          {(difficultyCount.easy + difficultyCount.medium + difficultyCount.hard) > 0 && (
            <DifficultyPills easy={difficultyCount.easy} medium={difficultyCount.medium} hard={difficultyCount.hard} />
          )}
          {/* Player count */}
          {playerCount !== null && playerCount > 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500">
              🌍 {playerCount} {playerCount === 1 ? 'player has' : 'players have'} played today
            </p>
          )}
        </div>

        {/* Streak urgency banner (not played, streak > 0, at risk) */}
        {atRisk && streakData.current > 0 && !playedToday && (
          <div className={`border rounded-2xl px-4 py-3 text-sm font-semibold ${urgencyStyle}`}>
            {afterSixPm ? '⚠️' : '⏰'} {afterSixPm ? 'Almost midnight!' : 'Streak at risk!'} Play to keep your 🔥 {streakData.current} day streak.
          </div>
        )}

        {/* Played today state */}
        {playedToday && todayScore !== null ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl px-5 py-4 space-y-1">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Today&apos;s Score</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {todayScore.toLocaleString()}
              <span className="text-base font-semibold text-emerald-400 dark:text-emerald-600"> / 5,000</span>
            </p>
            {streakData.current > 0 && (
              <p className="text-sm text-emerald-500 font-semibold">🔥 {streakData.current} day streak</p>
            )}
          </div>
        ) : (
          <>
            {user && streakData.current > 0 && !atRisk && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3">
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  🔥 {streakData.current} day streak — keep it going!
                </p>
              </div>
            )}

            {personalBest !== null && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-5 py-4">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Personal Best</p>
                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  {personalBest.toLocaleString()}
                  <span className="text-base font-semibold text-amber-400 dark:text-amber-600"> / 5,000</span>
                </p>
              </div>
            )}
          </>
        )}

        {/* Scoring guide */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl border border-gray-100 dark:border-[#1e3a4a] shadow-sm px-5 py-4 text-left space-y-2">
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center mb-3">Scoring</p>
          {[
            { label: 'PERFECT', pts: '1,000 pts', color: 'text-emerald-500', dist: '< 6 mi' },
            { label: 'GREAT', pts: '700–900 pts', color: 'text-sky-500', dist: '6–125 mi' },
            { label: 'GOOD', pts: '300–500 pts', color: 'text-amber-500', dist: '125–620 mi' },
            { label: 'BAD', pts: '0–160 pts', color: 'text-red-400', dist: '> 620 mi' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className={`text-sm font-bold ${row.color}`}>{row.label}</span>
              <span className="text-xs text-gray-400 dark:text-slate-500">{row.dist}</span>
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{row.pts}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3 w-full">
          {playedToday ? (
            <>
              <button
                onClick={handleViewResults}
                className="w-full py-4 bg-sky-400 text-white text-lg font-black rounded-full shadow-xl shadow-sky-200 dark:shadow-sky-900/50 hover:bg-sky-500 active:scale-[0.98] transition-all"
              >
                View Today&apos;s Results →
              </button>
              <p className="text-xs text-gray-400 dark:text-slate-500">New challenge available at midnight</p>
            </>
          ) : (
            <button
              onClick={handlePlay}
              className="w-full py-4 bg-sky-400 text-white text-lg font-black rounded-full shadow-xl shadow-sky-200 dark:shadow-sky-900/50 hover:bg-sky-500 active:scale-[0.98] transition-all"
            >
              Drop Today&apos;s Pins →
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowHowTo(true)}
              className="flex-1 py-3.5 bg-white dark:bg-[#162130] border-2 border-gray-200 dark:border-[#1e3a4a] text-gray-600 dark:text-slate-300 text-sm font-bold rounded-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              How to Play
            </button>
            <button
              onClick={() => router.push('/practice')}
              className="flex-1 py-3.5 bg-white dark:bg-[#162130] border-2 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 text-sm font-bold rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              🎯 Practice
            </button>
          </div>
        </div>

        {/* Guest nudge */}
        {!user && (
          <button
            onClick={() => setShowAuth(true)}
            className="text-xs text-gray-400 dark:text-slate-500 hover:text-sky-500 transition-colors"
          >
            Login to save your streak across devices →
          </button>
        )}

        <p className="text-xs text-gray-300 dark:text-slate-600">5 rounds · 5,000 points possible · Free forever</p>
      </div>
    </div>
  )
}
