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
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
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
      className={`
        fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-20
        ${visible ? 'translate-y-0' : 'translate-y-full'}
      `}
      style={{
        transition: 'transform 0.35s ease-out',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />

      <div className="px-5 pb-6 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Find this location
            </p>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              {location.prompt.replace('Find ', '').replace('Find the ', '')}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${DIFFICULTY_STYLES[location.difficulty]}`}
            >
              {location.difficulty}
            </span>
            {hintUsed && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                HINT USED
              </span>
            )}
          </div>
        </div>

        {/* Pin info */}
        {hasPin ? (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <div>
              <p className="text-xs text-amber-600 font-medium">Your pin</p>
              <p className="text-sm font-mono text-amber-800 font-semibold">
                {guessLat!.toFixed(4)}°, {guessLng!.toFixed(4)}°
              </p>
            </div>
            <button
              onClick={onClear}
              className="text-sm text-amber-600 hover:text-amber-800 font-semibold"
            >
              × Clear
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-gray-400">Tap anywhere on the map to place your pin</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          {!hintUsed && (
            <button
              onClick={onHint}
              className="flex-1 py-3 rounded-xl border-2 border-purple-200 text-purple-600 font-semibold text-sm hover:bg-purple-50 transition-colors"
            >
              Hint (−500 pts)
            </button>
          )}
          <button
            onClick={onLock}
            disabled={!hasPin}
            className={`
              flex-1 py-3 rounded-xl font-bold text-sm transition-all
              ${hasPin
                ? 'bg-sky-400 text-white hover:bg-sky-500 shadow-md shadow-sky-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
