'use client'

import { useEffect, useRef, useState } from 'react'
import { RoundResult, Location } from '@/types'
import { getRatingColor, getRatingBg } from '@/utils/scoring'
import { formatDistance } from '@/utils/distance'
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
    const duration = 1500
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [visible, result.pointsTotal])

  const distanceStr = formatDistance(result.distanceMiles, result.distanceKm, unitPreference)
  const ratingColor = getRatingColor(result.rating)
  const ratingBg = getRatingBg(result.rating)
  const progressPct = (result.pointsTotal / 1000) * 100

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-20"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.35s ease-out',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-3" />

      <StreakBanner streak={streakCount} />

      <div className="px-5 pb-6 space-y-3">
        {/* Rating */}
        <div className={`rounded-xl border p-3 ${ratingBg}`}>
          <p className={`text-2xl font-black text-center animate-ratingBounce ${ratingColor}`}>
            {result.rating}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-base font-bold text-gray-900 leading-tight">{distanceStr}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">distance</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-base font-bold text-sky-500 tabular-nums leading-tight">
              {animatedScore}
            </p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">pts earned</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-base font-bold text-gray-900 tabular-nums leading-tight">
              {result.pointsBonus > 0 ? (
                <span className="text-amber-500">+{result.pointsBonus}</span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">streak bonus</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              result.rating === 'PERFECT'
                ? 'bg-emerald-400'
                : result.rating === 'GREAT'
                ? 'bg-sky-400'
                : result.rating === 'GOOD'
                ? 'bg-amber-400'
                : 'bg-red-400'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Hint badge */}
        {result.hintUsed && (
          <p className="text-xs text-purple-500 font-medium text-center">
            Hint was used this round
          </p>
        )}

        {/* Fun fact */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">
            Did you know?
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">{location.funFact}</p>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs text-gray-400">You found</p>
            <p className="text-sm font-bold text-gray-800">{location.name}</p>
          </div>
          <button
            onClick={onNext}
            className="bg-sky-400 text-white font-bold px-5 py-3 rounded-xl hover:bg-sky-500 transition-colors shadow-md shadow-sky-200 text-sm"
          >
            {isLastRound ? 'See Results →' : 'Next Round →'}
          </button>
        </div>
      </div>
    </div>
  )
}
