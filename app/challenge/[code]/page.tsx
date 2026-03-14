'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchChallenge } from '@/utils/challenges'
import { ChallengeRun } from '@/types'

export default function ChallengeLandingPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const [challenge, setChallenge] = useState<ChallengeRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchChallenge(params.code).then((c) => {
      if (!c) setNotFound(true)
      else setChallenge(c)
      setLoading(false)
    })
  }, [params.code])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-[#0f1923] dark:to-[#0f1923] flex items-center justify-center transition-colors duration-200">
        <p className="text-gray-400 dark:text-slate-500 animate-pulse">Loading challenge…</p>
      </div>
    )
  }

  if (notFound || !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-[#0f1923] dark:to-[#0f1923] flex items-center justify-center px-6 transition-colors duration-200">
        <div className="text-center space-y-3 w-full max-w-sm">
          <p className="text-5xl">🤷</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">Challenge not found</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            This challenge link may be expired or invalid.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 bg-sky-400 text-white font-bold rounded-2xl mt-4 shadow-md shadow-sky-200 dark:shadow-sky-900/50"
          >
            Play Today&apos;s Challenge Instead
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-[#0f1923] dark:to-[#0f1923] flex flex-col items-center justify-center px-6 py-10 transition-colors duration-200">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-5xl">⚔️</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">You&apos;ve been challenged!</h1>
          <p className="text-gray-400 dark:text-slate-400 text-sm">Can you beat their score?</p>
        </div>

        {/* Challenge info card */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1e3a4a] px-5 py-5 space-y-4">
          {challenge.original_username && (
            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                Challenged by
              </p>
              <p className="text-xl font-black text-gray-900 dark:text-slate-100">{challenge.original_username}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Score to beat
            </p>
            <p className="text-4xl font-black text-sky-500 tabular-nums">
              {challenge.original_score.toLocaleString()}
              <span className="text-lg font-semibold text-gray-400 dark:text-slate-500"> / 5,000</span>
            </p>
          </div>
          {challenge.times_played > 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-slate-500">
              {challenge.times_played} {challenge.times_played === 1 ? 'player has' : 'players have'} accepted this challenge
            </p>
          )}
        </div>

        <button
          onClick={() => router.push(`/challenge/${params.code}/play`)}
          className="w-full py-4 bg-sky-400 text-white text-lg font-black rounded-2xl shadow-xl shadow-sky-200 dark:shadow-sky-900/50 hover:bg-sky-500 active:scale-[0.98] transition-all"
        >
          Accept Challenge →
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full py-3 text-sm font-semibold text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          Play Today&apos;s Daily Instead
        </button>
      </div>
    </div>
  )
}
