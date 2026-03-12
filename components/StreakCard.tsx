'use client'

import { useEffect } from 'react'
import { STREAK_MILESTONES } from '@/utils/streak'

interface StreakCardProps {
  current: number
  longest: number
  onMilestone?: () => void
}

export default function StreakCard({ current, longest, onMilestone }: StreakCardProps) {
  useEffect(() => {
    if (STREAK_MILESTONES.includes(current)) {
      onMilestone?.()
    }
  }, [current, onMilestone])

  if (current < 1) return null

  const nextMilestone = STREAK_MILESTONES.find((m) => m > current)

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">
            Daily Streak
          </p>
          <p className="text-3xl font-black text-gray-900">
            🔥 {current}
            <span className="text-base font-semibold text-gray-400 ml-1">
              {current === 1 ? 'day' : 'days'}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Best</p>
          <p className="text-lg font-bold text-gray-600">🏅 {longest}</p>
        </div>
      </div>
      {nextMilestone && (
        <div className="mt-2">
          <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-700"
              style={{
                width: `${(current / nextMilestone) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-amber-500 mt-1 text-right">
            {nextMilestone - current} more to 🔥 {nextMilestone} day milestone
          </p>
        </div>
      )}
    </div>
  )
}
