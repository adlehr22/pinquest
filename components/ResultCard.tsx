'use client'

import { useEffect, useRef, useState } from 'react'
import { RoundResult, Location } from '@/types'
import { getRatingColor } from '@/utils/scoring'
import { formatDistanceWhole } from '@/utils/distance'
import StreakBanner from './StreakBanner'

interface ResultCardProps {
  result: RoundResult
  location: Location
  unitPreference: 'mi' | 'km'
  streakCount: number
  onNext: () => void
  isLastRound: boolean
  visible: boolean
}

// Section 4: rating with contextual emoji
const RATING_EMOJI: Record<string, string> = {
  PERFECT: '🎯',
  GREAT:   '🌍',
  GOOD:    '🗺️',
  BAD:     '😬',
}

const PROGRESS_COLOR: Record<string, string> = {
  PERFECT: 'bg-emerald-400',
  GREAT:   'bg-sky-400',
  GOOD:    'bg-amber-400',
  BAD:     'bg-red-400',
}

export default function ResultCard({
  result,
  location,
  unitPreference,
  streakCount,
  onNext,
  isLastRound,
  visible,
}: ResultCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!visible) return
    const target = result.pointsTotal
    const duration = 400
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [visible, result.pointsTotal])

  const ratingColor  = getRatingColor(result.rating)
  const progressPct  = Math.min((result.pointsTotal / 1000) * 100, 100)
  const distStr      = formatDistanceWhole(result.distanceMiles, result.distanceKm, unitPreference)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#162130] rounded-t-2xl shadow-2xl z-20 transition-colors duration-200"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        willChange: 'transform',
      }}
    >
      {/* Drag handle */}
      <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mt-3 mb-2" />

      <StreakBanner streak={streakCount} />

      <div className="px-4 pb-4 space-y-2.5 max-w-md mx-auto w-full">
        {/* Rating label */}
        <div className="text-center py-1">
          <span className={`rating-label text-3xl font-black tracking-tight ${ratingColor}`}>
            {result.rating} {RATING_EMOJI[result.rating]}
          </span>
        </div>

        {/* Distance stat */}
        <p className="text-center text-sm font-semibold text-gray-600 dark:text-slate-300">
          {distStr} away
          {result.pointsBonus > 0 && (
            <span className="text-amber-500"> · +{result.pointsBonus} streak bonus</span>
          )}
        </p>

        {/* Animated score */}
        <div className="flex items-center justify-center gap-1">
          <span className={`text-4xl font-black tabular-nums ${ratingColor}`}>
            {animatedScore.toLocaleString()}
          </span>
          <span className="text-gray-400 dark:text-slate-500 text-base font-semibold self-end mb-1">pts</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${PROGRESS_COLOR[result.rating]}`}
            style={{
              width: `${progressPct}%`,
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        {result.hintUsed && (
          <p className="text-xs text-purple-500 dark:text-purple-400 font-medium text-center">Hint used this round</p>
        )}

        {/* Fun fact */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl px-3 py-2.5">
          <p className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide mb-0.5">
            Did you know?
          </p>
          <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">{location.funFact}</p>
        </div>

        {/* Next button */}
        <button
          onClick={onNext}
          className="w-full py-3.5 rounded-2xl bg-sky-400 text-white font-bold text-sm
                     hover:bg-sky-500 active:scale-95 transition-transform duration-100
                     shadow-md shadow-sky-200 dark:shadow-sky-900/50 min-h-[44px]"
        >
          {isLastRound ? 'See Results →' : 'Next Round →'}
        </button>
      </div>
    </div>
  )
}
