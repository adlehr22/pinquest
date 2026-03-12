'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { RoundResult, Location } from '@/types'
import { formatDistance } from '@/utils/distance'
import { isNewPersonalBest, setPersonalBest } from '@/utils/storage'
import { buildShareText, shareResult } from '@/utils/share'
import StreakCard from './StreakCard'
import Toast from './Toast'

const GameMap = dynamic(() => import('./Map'), { ssr: false })

async function fireConfetti() {
  if (typeof window === 'undefined') return
  const src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
  const existing = document.querySelector(`script[src="${src}"]`)
  if (!existing) {
    await new Promise<void>((res) => {
      const s = document.createElement('script')
      s.src = src
      s.onload = () => res()
      s.onerror = () => res()
      document.head.appendChild(s)
    })
  }
  const confetti = (window as unknown as { confetti?: (o: unknown) => void }).confetti
  confetti?.({ particleCount: 100, spread: 70, origin: { y: 0.5 } })
}

interface FinalScreenProps {
  results: RoundResult[]
  locations: Location[]
  totalScore: number
  unitPreference: 'mi' | 'km'
  dayStreak: number
  longestStreak: number
  dateStr: string
  onPlayAgain: () => void
  onHome: () => void
  onAuthPrompt: () => void
}

export default function FinalScreen({
  results,
  locations,
  totalScore,
  unitPreference,
  dayStreak,
  longestStreak,
  dateStr,
  onPlayAgain,
  onHome,
  onAuthPrompt,
}: FinalScreenProps) {
  const [newBest, setNewBest] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (isNewPersonalBest(totalScore)) {
      setNewBest(true)
      setPersonalBest(totalScore)
    }

    const duration = 1800
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setAnimatedScore(Math.round((1 - Math.pow(1 - progress, 3)) * totalScore))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [totalScore])

  // Milestone confetti & auth prompt after score animates
  useEffect(() => {
    const t = setTimeout(() => {
      if (newBest) fireConfetti()
      onAuthPrompt()
    }, 2000)
    return () => clearTimeout(t)
  }, [newBest, onAuthPrompt])

  const handleShare = useCallback(async () => {
    const text = buildShareText(results, locations, totalScore, dateStr, dayStreak, unitPreference)
    const outcome = await shareResult(text)
    if (outcome === 'clipboard') {
      setToastMsg('✓ Copied to clipboard!')
      setToastVisible(true)
    } else if (outcome === 'native') {
      // native sheet handled it
    } else {
      setToastMsg('Could not share. Try again.')
      setToastVisible(true)
    }
  }, [results, locations, totalScore, dateStr, dayStreak, unitPreference])

  const maxScore = results.length * 1000
  const ratingColors: Record<string, string> = {
    PERFECT: 'text-emerald-500',
    GREAT: 'text-sky-500',
    GOOD: 'text-amber-500',
    BAD: 'text-red-400',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />

      {/* Map */}
      <div style={{ height: '35vh' }} className="relative">
        <GameMap
          targetLocation={locations[0]}
          guessLat={null}
          guessLng={null}
          locked={true}
          revealed={false}
          onGuess={() => undefined}
          roundKey={999}
          finalMode={true}
          allResults={results}
          allLocations={locations}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Final Score
            </p>
            <p className="text-4xl font-black text-gray-900 tabular-nums">
              {animatedScore.toLocaleString()}
              <span className="text-lg font-semibold text-gray-400">
                {' '}/ {maxScore.toLocaleString()}
              </span>
            </p>
            {newBest && (
              <p className="text-sm font-bold text-amber-500 mt-1">🏆 New Personal Best!</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {/* Streak card */}
        {dayStreak > 0 && (
          <StreakCard
            current={dayStreak}
            longest={longestStreak}
            onMilestone={() => fireConfetti()}
          />
        )}

        {/* Round breakdown */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-4 px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase">#</p>
            <p className="text-xs font-bold text-gray-400 uppercase col-span-2">Location</p>
            <p className="text-xs font-bold text-gray-400 uppercase text-right">Pts</p>
          </div>
          {results.map((result, i) => {
            const loc = locations.find((l) => l.id === result.locationId)
            const distStr = formatDistance(result.distanceMiles, result.distanceKm, unitPreference)
            return (
              <div
                key={i}
                className="grid grid-cols-4 px-4 py-3 border-b border-gray-50 last:border-0"
              >
                <p className="text-sm font-bold text-gray-400">{i + 1}</p>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-800 truncate">{loc?.name}</p>
                  <p className="text-xs text-gray-400">{distStr}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${ratingColors[result.rating]}`}>
                    {result.pointsTotal}
                  </p>
                  <p className="text-xs text-gray-400">{result.rating}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 rounded-2xl bg-sky-400 text-white font-bold hover:bg-sky-500 transition-colors shadow-md shadow-sky-200"
        >
          Share My Result 📤
        </button>

        {/* Tomorrow countdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 text-center space-y-1">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
            Next challenge in
          </p>
          <CountdownInline />
        </div>

        <button
          onClick={onHome}
          className="w-full py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
        >
          ← Back to Home
        </button>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-lg">📍</span>
            <span className="text-xs text-gray-500">Your guesses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sky-400 text-lg">📍</span>
            <span className="text-xs text-gray-500">Correct answers</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline countdown (avoids importing CountdownTimer which has its own container styles)
function CountdownInline() {
  const [ms, setMs] = useState(() => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    return midnight.getTime() - now.getTime()
  })

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      setMs(midnight.getTime() - now.getTime())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const fmt = (n: number) => String(n).padStart(2, '0')
  return (
    <p className="text-3xl font-black text-gray-800 tabular-nums">{fmt(h)}:{fmt(m)}:{fmt(s)}</p>
  )
}
