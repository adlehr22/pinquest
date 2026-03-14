'use client'

import { useState } from 'react'
import { RoundResult, Location } from '@/types'
import { buildShareText, shareResult } from '@/utils/share'
import { formatDistance } from '@/utils/distance'
import Toast from './Toast'

const RATING_COLORS: Record<string, string> = {
  PERFECT: 'text-emerald-500',
  GREAT: 'text-sky-500',
  GOOD: 'text-amber-500',
  BAD: 'text-red-400',
}

interface ChallengeResultScreenProps {
  results: RoundResult[]
  locations: Location[]
  totalScore: number
  opponentScore: number
  opponentUsername: string | null
  challengeCode: string
  unitPreference: 'mi' | 'km'
  onHome: () => void
  onPlayDaily: () => void
}

export default function ChallengeResultScreen({
  results,
  locations,
  totalScore,
  opponentScore,
  opponentUsername,
  challengeCode,
  unitPreference,
  onHome,
  onPlayDaily,
}: ChallengeResultScreenProps) {
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const diff = totalScore - opponentScore
  const won = diff > 0
  const tied = diff === 0

  let resultEmoji = '😤'
  let resultHeadline = 'So close!'
  let resultSub = `You were ${Math.abs(diff).toLocaleString()} pts behind ${opponentUsername ?? 'them'}.`
  if (won) {
    resultEmoji = '🏆'
    resultHeadline = 'You won!'
    resultSub = `You beat ${opponentUsername ?? 'them'} by ${diff.toLocaleString()} pts!`
  } else if (tied) {
    resultEmoji = '🤝'
    resultHeadline = "It's a tie!"
    resultSub = 'Exactly matched — impressive!'
  }

  const handleShare = async () => {
    const text = buildShareText(results, locations, totalScore, challengeCode, 0, unitPreference)
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
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-5xl">{resultEmoji}</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">{resultHeadline}</h1>
          <p className="text-gray-400 dark:text-slate-400 text-sm">{resultSub}</p>
        </div>

        {/* Score comparison */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1e3a4a] overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-[#1e3a4a]">
            <div className={`px-4 py-4 text-center ${won ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}>
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Your Score</p>
              <p className={`text-3xl font-black tabular-nums ${won ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-slate-100'}`}>
                {totalScore.toLocaleString()}
              </p>
            </div>
            <div className={`px-4 py-4 text-center ${!won && !tied ? 'bg-sky-50 dark:bg-sky-900/10' : ''}`}>
              <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                {opponentUsername ?? 'Their Score'}
              </p>
              <p className={`text-3xl font-black tabular-nums ${!won && !tied ? 'text-sky-600 dark:text-sky-400' : 'text-gray-900 dark:text-slate-100'}`}>
                {opponentScore.toLocaleString()}
              </p>
            </div>
          </div>
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

        {/* Actions */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 bg-sky-400 text-white font-bold rounded-2xl hover:bg-sky-500 transition-colors shadow-md shadow-sky-200 dark:shadow-sky-900/50"
        >
          Share My Result 📤
        </button>
        <button
          onClick={onPlayDaily}
          className="w-full py-3 bg-white dark:bg-[#162130] border border-gray-200 dark:border-[#1e3a4a] text-gray-700 dark:text-slate-300 font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          Play Today's Daily Challenge
        </button>
        <button
          onClick={onHome}
          className="w-full py-3 text-sm font-semibold text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  )
}
