'use client'

import { useEffect, useState } from 'react'
import { RoundResult, Location } from '@/types'
import { formatDistance } from '@/utils/distance'
import { getPracticeBest, setPracticeBest } from '@/utils/storage'
import { buildShareText, shareResult } from '@/utils/share'
import CountdownTimer from './CountdownTimer'
import Toast from './Toast'

const RATING_COLORS: Record<string, string> = {
  PERFECT: 'text-emerald-500',
  GREAT: 'text-sky-500',
  GOOD: 'text-amber-500',
  BAD: 'text-red-400',
}

interface PracticeResultScreenProps {
  results: RoundResult[]
  locations: Location[]
  totalScore: number
  unitPreference: 'mi' | 'km'
  onPlayAgain: () => void
  onPlayDaily: () => void
  onHome: () => void
}

export default function PracticeResultScreen({
  results,
  locations,
  totalScore,
  unitPreference,
  onPlayAgain,
  onPlayDaily,
  onHome,
}: PracticeResultScreenProps) {
  const [newPracticeBest, setNewPracticeBest] = useState(false)
  const [practiceBest, setPracticeBestState] = useState<number | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    const prev = getPracticeBest()
    setPracticeBestState(prev)
    if (prev === null || totalScore > prev) {
      setNewPracticeBest(true)
      setPracticeBest(totalScore)
    }
  }, [totalScore])

  const handleShare = async () => {
    const text = buildShareText(results, locations, totalScore, 'practice', 0, unitPreference)
    const outcome = await shareResult(text)
    if (outcome === 'clipboard') {
      setToastMsg('Copied to clipboard!')
      setToastVisible(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-[#0f1923] dark:to-[#0f1923] flex flex-col items-center justify-center px-6 py-10 transition-colors duration-200">
      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />

      <div className="w-full max-w-sm space-y-5">
        {/* Practice badge + header */}
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 text-xs font-bold rounded-full uppercase tracking-widest">
            Practice Mode
          </span>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">Practice Complete!</h1>
          <p className="text-gray-400 dark:text-slate-400 text-sm">
            Practice doesn&apos;t affect your daily streak or leaderboard.
          </p>
        </div>

        {/* Score */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1e3a4a] px-5 py-5 text-center">
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Your Score</p>
          <p className="text-5xl font-black text-gray-900 dark:text-slate-100 tabular-nums">
            {totalScore.toLocaleString()}
            <span className="text-xl font-semibold text-gray-400 dark:text-slate-500"> / 5,000</span>
          </p>
          {newPracticeBest && (
            <p className="text-sm font-bold text-purple-500 mt-1">
              🎉 New practice best{practiceBest !== null && practiceBest < totalScore ? ` (+${(totalScore - practiceBest).toLocaleString()})` : ''}!
            </p>
          )}
        </div>

        {/* Round breakdown */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1e3a4a] overflow-hidden">
          {results.map((r, i) => {
            const loc = locations.find((l) => l.id === r.locationId)
            const dist = formatDistance(r.distanceMiles, r.distanceKm, unitPreference)
            return (
              <div key={i} className="flex items-center justify-between px-5 py-2.5 border-b border-gray-50 dark:border-[#1e3a4a] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 dark:text-slate-600 w-4">{i + 1}</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 truncate max-w-[140px]">
                    {loc?.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 dark:text-slate-400">{dist}</span>
                  <span className={`text-xs font-bold ${RATING_COLORS[r.rating]}`}>{r.pointsTotal}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Countdown to daily */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1e3a4a] px-5 py-5">
          <CountdownTimer />
        </div>

        {/* Actions */}
        <button
          onClick={onPlayAgain}
          className="w-full py-3.5 bg-sky-400 text-white font-bold rounded-2xl hover:bg-sky-500 transition-colors shadow-md shadow-sky-200 dark:shadow-sky-900/50"
        >
          Practice Again 🔄
        </button>
        <button
          onClick={onPlayDaily}
          className="w-full py-3 bg-white dark:bg-[#162130] border border-gray-200 dark:border-[#1e3a4a] text-gray-700 dark:text-slate-300 font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          Play Today's Challenge
        </button>
        <button
          onClick={handleShare}
          className="w-full py-2.5 text-sm font-semibold text-sky-400 hover:text-sky-500 transition-colors"
        >
          Share My Result 📤
        </button>
        <button
          onClick={onHome}
          className="w-full py-2 text-sm font-semibold text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  )
}
