'use client'

import { Location } from '@/types'

interface PromptCardProps {
  location: Location
  guessLat: number | null
  guessLng: number | null
  onClear: () => void
  onLock: () => void
  onHint: () => void
  hintUsed: boolean
  visible: boolean
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy:   'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  hard:   'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
}

export default function PromptCard({
  location,
  guessLat,
  guessLng,
  onClear,
  onLock,
  onHint,
  hintUsed,
  visible,
}: PromptCardProps) {
  const hasPin = guessLat !== null && guessLng !== null

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
      <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mt-3 mb-3" />

      <div className="px-4 pb-4 space-y-3 max-w-md mx-auto w-full">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
              Find this location
            </p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug truncate">
              {location.prompt.replace('Find ', '').replace('Find the ', '')}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${DIFFICULTY_STYLES[location.difficulty]}`}
            >
              {location.difficulty}
            </span>
            {hintUsed && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                HINT USED
              </span>
            )}
          </div>
        </div>

        {/* Pin status row */}
        {hasPin ? (
          <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-2.5 min-h-[44px]">
            <div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Your pin</p>
              <p className="text-sm font-mono text-amber-800 dark:text-amber-300 font-semibold">
                {guessLat!.toFixed(3)}°, {guessLng!.toFixed(3)}°
              </p>
            </div>
            <button
              onClick={onClear}
              className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 font-semibold px-2 py-1 min-h-[44px]"
            >
              × Clear
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-center min-h-[44px] flex items-center justify-center">
            <p className="text-sm text-gray-400 dark:text-slate-500">Tap anywhere on the map to place your pin</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2.5">
          {!hintUsed && (
            <button
              onClick={onHint}
              className="flex-1 min-h-[44px] py-3 rounded-xl border-2 border-purple-200 dark:border-purple-700
                         text-purple-600 dark:text-purple-300 font-semibold text-sm
                         hover:bg-purple-50 dark:hover:bg-purple-900/20 active:scale-95 transition-transform duration-100"
            >
              Hint (−500 pts)
            </button>
          )}
          <button
            onClick={onLock}
            disabled={!hasPin}
            className={`
              flex-1 min-h-[44px] py-3 rounded-xl font-bold text-sm
              transition-transform duration-100
              ${hasPin
                ? 'bg-sky-400 text-white hover:bg-sky-500 active:scale-95 shadow-md shadow-sky-200 dark:shadow-sky-900'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed'
              }
            `}
          >
            Lock It In ✓
          </button>
        </div>
      </div>
    </div>
  )
}
