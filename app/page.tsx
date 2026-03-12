'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getPersonalBest } from '@/utils/storage'
import { getStreakData, isStreakAtRisk } from '@/utils/streak'
import { getTodayDateString } from '@/utils/daily'
import { hasPlayedToday, getTodayResult } from '@/utils/storage'
import AuthModal from '@/components/AuthModal'

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10 space-y-4 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
        <h2 className="text-xl font-black text-gray-900">How to Play</h2>
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
                <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                <p className="text-gray-500 text-sm">{item.desc}</p>
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
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    setToday(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`)
  }, [])

  const handlePlay = () => router.push('/game')
  const handleViewResults = () => router.push('/game')

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col items-center justify-center px-6 py-8">
      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Top bar: leaderboard + profile */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/leaderboard')}
            className="text-xs font-bold text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1"
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="text-xs font-bold text-gray-400 hover:text-sky-500 transition-colors flex items-center gap-1"
          >
            {user ? `👤 ${profile?.username ?? 'Profile'}` : '👤 Profile'}
          </button>
        </div>

        {/* App icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-sky-400 rounded-[28px] flex items-center justify-center shadow-2xl shadow-sky-200">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="40" height="60" className="drop-shadow-sm">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24S24 20.25 24 12C24 5.373 18.627 0 12 0z" fill="white" />
              <circle cx="12" cy="12" r="5" fill="#38BDF8" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">PinQuest</h1>
          <p className="text-gray-500 font-medium">Daily Geography Challenge</p>
          <p className="text-gray-400 text-sm">{today}</p>
        </div>

        {/* Streak at risk warning */}
        {atRisk && streakData.current > 0 && !playedToday && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600">
            ⚠️ Streak at risk! Play before midnight to keep your 🔥 {streakData.current} day streak.
          </div>
        )}

        {/* Played today state */}
        {playedToday && todayScore !== null ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 space-y-1">
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Today&apos;s Score</p>
            <p className="text-3xl font-black text-emerald-600 tabular-nums">
              {todayScore.toLocaleString()}
              <span className="text-base font-semibold text-emerald-400"> / 5,000</span>
            </p>
            {streakData.current > 0 && (
              <p className="text-sm text-emerald-500 font-semibold">🔥 {streakData.current} day streak</p>
            )}
          </div>
        ) : (
          <>
            {/* Streak nudge for logged-in users */}
            {user && streakData.current > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <p className="text-sm font-bold text-amber-600">
                  🔥 {streakData.current} day streak — keep it going!
                </p>
              </div>
            )}

            {/* Personal best */}
            {personalBest !== null && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Personal Best</p>
                <p className="text-3xl font-black text-amber-600">
                  {personalBest.toLocaleString()}
                  <span className="text-base font-semibold text-amber-400"> / 5,000</span>
                </p>
              </div>
            )}
          </>
        )}

        {/* Scoring guide */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 text-left space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Scoring</p>
          {[
            { label: 'PERFECT', pts: '1,000 pts', color: 'text-emerald-500', dist: '< 6 mi' },
            { label: 'GREAT', pts: '700–900 pts', color: 'text-sky-500', dist: '6–125 mi' },
            { label: 'GOOD', pts: '300–500 pts', color: 'text-amber-500', dist: '125–620 mi' },
            { label: 'BAD', pts: '0–160 pts', color: 'text-red-400', dist: '> 620 mi' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className={`text-sm font-bold ${row.color}`}>{row.label}</span>
              <span className="text-xs text-gray-400">{row.dist}</span>
              <span className="text-xs font-semibold text-gray-600">{row.pts}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3 w-full">
          {playedToday ? (
            <>
              <button
                onClick={handleViewResults}
                className="w-full py-4 bg-sky-400 text-white text-lg font-black rounded-full shadow-xl shadow-sky-200 hover:bg-sky-500 active:scale-[0.98] transition-all"
              >
                View Today&apos;s Results →
              </button>
              <p className="text-xs text-gray-400">New challenge available at midnight</p>
            </>
          ) : (
            <button
              onClick={handlePlay}
              className="w-full py-4 bg-sky-400 text-white text-lg font-black rounded-full shadow-xl shadow-sky-200 hover:bg-sky-500 active:scale-[0.98] transition-all"
            >
              Drop Today&apos;s Pins →
            </button>
          )}
          <button
            onClick={() => setShowHowTo(true)}
            className="w-full py-3.5 bg-white border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-full hover:bg-gray-50 transition-colors"
          >
            How to Play
          </button>
        </div>

        {/* Guest nudge */}
        {!user && (
          <button
            onClick={() => setShowAuth(true)}
            className="text-xs text-gray-400 hover:text-sky-500 transition-colors"
          >
            Login to save your streak across devices →
          </button>
        )}

        <p className="text-xs text-gray-300">5 rounds · 5,000 points possible · Free forever</p>
      </div>
    </div>
  )
}
