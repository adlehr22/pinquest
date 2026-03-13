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
  // Section 3: score counts up in 400ms
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
  // Section 4: whole-number distance
  const distStr      = formatDistanceWhole(result.distanceMiles, result.distanceKm, unitPreference)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-20"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        // Section 5: transform-only transition — no layout reflow
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        // Section 5: force GPU layer
        willChange: 'transform',
      }}
    >
      {/* Drag handle */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />

      {/* Section 1: streak banner stays if present */}
      <StreakBanner streak={streakCount} />

      <div className="px-4 pb-4 space-y-2.5 max-w-md mx-auto w-full">
        {/* Section 3 & 4: rating label — ratingFade animation, emoji suffix */}
        <div className="text-center py-1">
          <span
            className={`rating-label text-3xl font-black tracking-tight ${ratingColor}`}
          >
            {result.rating} {RATING_EMOJI[result.rating]}
          </span>
        </div>

        {/* Section 4: single-line stat — whole numbers, no decimals */}
        <p className="text-center text-sm font-semibold text-gray-600">
          {distStr} away
          {result.pointsBonus > 0 && (
            <span className="text-amber-500"> · +{result.pointsBonus} streak bonus</span>
          )}
        </p>

        {/* Section 3: score count — animated number */}
        <div className="flex items-center justify-center gap-1">
          <span className={`text-4xl font-black tabular-nums ${ratingColor}`}>
            {animatedScore.toLocaleString()}
          </span>
          <span className="text-gray-400 text-base font-semibold self-end mb-1">pts</span>
        </div>

        {/* Progress bar — GPU-safe width transition */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${PROGRESS_COLOR[result.rating]}`}
            style={{
              width: `${progressPct}%`,
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        {result.hintUsed && (
          <p className="text-xs text-purple-500 font-medium text-center">Hint used this round</p>
        )}

        {/* Fun fact — compact */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-0.5">
            Did you know?
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">{location.funFact}</p>
        </div>

        {/* Section 1: Next button full-width, 44px+ touch target */}
        <button
          onClick={onNext}
          // Section 3: button press feedback via active:scale-95
          className="w-full py-3.5 rounded-2xl bg-sky-400 text-white font-bold text-sm
                     hover:bg-sky-500 active:scale-95 transition-transform duration-100
                     shadow-md shadow-sky-200 min-h-[44px]"
        >
          {isLastRound ? 'See Results →' : 'Next Round →'}
        </button>
      </div>
    </div>
  )
}
