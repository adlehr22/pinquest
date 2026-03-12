'use client'

interface StreakBannerProps {
  streak: number
}

export default function StreakBanner({ streak }: StreakBannerProps) {
  if (streak < 2) return null

  return (
    <div className="animate-streakIn bg-gradient-to-r from-orange-400 to-amber-400 text-white text-center py-2 px-4 text-sm font-bold rounded-xl mx-5 mb-2">
      🔥 {streak} Streak! +10% bonus
    </div>
  )
}
