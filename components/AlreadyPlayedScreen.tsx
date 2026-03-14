'use client'

import { useState } from 'react'
import { TodayResult, Location } from '@/types'
import { buildShareText, shareResult } from '@/utils/share'
import { getStreakData } from '@/utils/streak'
import { formatDistance } from '@/utils/distance'
import CountdownTimer from './CountdownTimer'
import Toast from './Toast'

interface AlreadyPlayedScreenProps {
  todayResult: TodayResult
  locations: Location[]
  unitPreference: 'mi' | 'km'
  onHome: () => void
}

const RATING_COLORS: Record<string, string> = {
  PERFECT: 'text-emerald-500',
  GREAT: 'text-sky-500',
  GOOD: 'text-amber-500',
  BAD: 'text-red-400',
}

export default function AlreadyPlayedScreen({
  todayResult,
  locations,
  unitPreference,
  onHome,
}: AlreadyPlayedScreenProps) {
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const streak = getStreakData()

  const handleShare = async () => {
    const text = buildShareText(
      todayResult.results,
      locations,
      todayResult.totalScore,
      todayResult.dateStr,
      streak.current,
      unitPreference,
    )
    const result = await shareResult(text)
    if (result === 'clipboard') {
      setToastMsg('Copied to clipboard!')
      setToastVisible(true)
    } else if (result === 'error') {
      setToastMsg('Could not share. Try again.')
      setToastVisible(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-[#0f1923] dark:to-[#0f1923] flex flex-col items-center justify-center px-6 py-10 transition-colors duration-200">
      <Toast
        message={toastMsg}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-5xl">✅</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">Already played today!</h1>
          <p className="text-gray-400 dark:text-slate-400 text-sm">Come back tomorrow for a new challenge.</p>
        </div>

        {/* Score recap */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1e3a4a] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-[#1e3a4a]">
            <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-1">
              Your score today
            </p>
            <p className="text-4xl font-black text-gray-900 dark:text-slate-100 tabular-nums">
              {todayResult.totalScore.toLocaleString()}
              <span className="text-lg font-semibold text-gray-400 dark:text-slate-500"> / 5,000</span>
            </p>
            {streak.current > 0 && (
              <p className="text-sm font-bold text-amber-500 mt-1">🔥 {streak.current} day streak</p>
            )}
          </div>

          {/* Round breakdown */}
          {todayResult.results.map((r, i) => {
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
                  <span className={`text-xs font-bold ${RATING_COLORS[r.rating]}`}>
                    {r.pointsTotal}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Countdown */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl shadow-sm border border-gray-100 dark:border-[#1e3a4a] px-5 py-5">
          <CountdownTimer />
        </div>

        {/* Actions */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 bg-sky-400 text-white font-bold rounded-2xl hover:bg-sky-500 transition-colors shadow-md shadow-sky-200 dark:shadow-sky-900/50"
        >
          Share My Result
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
