'use client'

import { GameState } from '@/types'
import { setUnitPreference, setMutePreference } from '@/utils/storage'
import UserAvatar from './UserAvatar'
import ThemeToggle from './ThemeToggle'

interface GameHeaderProps {
  state: GameState
  muted: boolean
  dayStreak: number
  onToggleMute: () => void
  onToggleUnit: () => void
  totalRounds: number
}

export default function GameHeader({
  state,
  muted,
  dayStreak,
  onToggleMute,
  onToggleUnit,
  totalRounds,
}: GameHeaderProps) {
  const handleToggleUnit = () => {
    const next: 'mi' | 'km' = state.unitPreference === 'mi' ? 'km' : 'mi'
    setUnitPreference(next)
    onToggleUnit()
  }

  const handleToggleMute = () => {
    setMutePreference(!muted)
    onToggleMute()
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#162130] border-b border-gray-100 dark:border-[#1e3a4a] shadow-sm z-10 relative transition-colors duration-200">
      {/* Left: round pill + optional streak */}
      <div className="flex items-center gap-2">
        <span className="bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 text-xs font-bold px-3 py-1 rounded-full">
          Round {state.currentRound + 1}/{totalRounds}
        </span>
        {dayStreak > 0 && (
          <span className="text-xs font-bold text-amber-500">🔥 {dayStreak}</span>
        )}
      </div>

      {/* Center: progress dots */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalRounds }).map((_, i) => {
          const result = state.results[i]
          let color = 'bg-gray-200 dark:bg-slate-600'
          if (result) {
            if (result.rating === 'PERFECT') color = 'bg-emerald-400'
            else if (result.rating === 'GREAT') color = 'bg-sky-400'
            else if (result.rating === 'GOOD') color = 'bg-amber-400'
            else color = 'bg-red-400'
          } else if (i === state.currentRound) {
            color = 'bg-sky-400 ring-2 ring-sky-200 dark:ring-sky-800'
          }
          return <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${color}`} />
        })}
      </div>

      {/* Right: score + unit + mute + theme + avatar */}
      <div className="flex items-center gap-2">
        <span className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold px-3 py-1 rounded-full tabular-nums">
          {state.totalScore.toLocaleString()}
        </span>
        <button
          onClick={handleToggleUnit}
          className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-sky-500 transition-colors w-8 text-center"
        >
          {state.unitPreference}
        </button>
        <button
          onClick={handleToggleMute}
          className="text-lg leading-none"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <ThemeToggle />
        <UserAvatar />
      </div>
    </div>
  )
}
