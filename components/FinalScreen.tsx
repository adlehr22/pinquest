'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { RoundResult, Location } from '@/types'
import { formatDistanceWhole } from '@/utils/distance'
import { getPersonalBest, isNewPersonalBest, setPersonalBest } from '@/utils/storage'
import { buildShareText, shareResult } from '@/utils/share'
import { generateShareImage, shareOrDownloadImage } from '@/utils/shareImage'
import { createChallenge } from '@/utils/challenges'
import StreakCard from './StreakCard'
import Toast from './Toast'
import PWANudge from './PWANudge'
import { useAuth } from '@/lib/AuthContext'
import { trackShareClicked } from '@/utils/analytics'

const GameMap = dynamic(() => import('./Map'), { ssr: false })

async function fireConfetti() {
  if (typeof window === 'undefined') return
  const src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
  if (!document.querySelector(`script[src="${src}"]`)) {
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

function getPerformanceSummary(score: number): string {
  if (score === 5000) return 'Perfect game! 🏆'
  if (score >= 4000) return 'Excellent! 🌟'
  if (score >= 3000) return 'Great job! 🎯'
  if (score >= 2000) return 'Not bad! 🗺️'
  return 'Keep practicing! 💪'
}

function getFlexLine(totalScore: number, prevBest: number | null): string {
  if (totalScore === 5000) return 'Absolutely perfect — flawless game! 🏆'
  if (prevBest === null) return 'First game! Set the bar. 🎯'
  if (totalScore > prevBest) {
    const diff = totalScore - prevBest
    return `New personal best — up ${diff.toLocaleString()} pts! 🔥`
  }
  if (totalScore === prevBest) return 'Matched your personal best! One more push! 💪'
  const gap = prevBest - totalScore
  if (gap < 200) return `Just ${gap} pts shy of your best — so close! 😤`
  if (totalScore >= 4000) return 'Elite geographer! Top tier performance. 🌍'
  if (totalScore >= 3000) return 'Solid round! Your geography skills are sharp. 🗺️'
  if (totalScore >= 2000) return 'Not bad — keep exploring! 🧭'
  return 'Every game makes you better. Keep going! 💪'
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

const RATING_COLORS: Record<string, string> = {
  PERFECT: 'text-emerald-500',
  GREAT:   'text-sky-500',
  GOOD:    'text-amber-500',
  BAD:     'text-red-400',
}

export default function FinalScreen({
  results,
  locations,
  totalScore,
  unitPreference,
  dayStreak,
  longestStreak,
  dateStr,
  onHome,
  onAuthPrompt,
}: FinalScreenProps) {
  const { user, profile } = useAuth()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // Capture personal best BEFORE the effect updates it
  const prevBestRef = useRef(getPersonalBest())

  const [newBest, setNewBest] = useState(false)
  const [animatedScore, setAnimatedScore] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [shareModal, setShareModal] = useState(false)
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null)
  const [shareGenerating, setShareGenerating] = useState(false)
  const [challengeLoading, setChallengeLoading] = useState(false)
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

  useEffect(() => {
    const t = setTimeout(() => {
      if (newBest) fireConfetti()
      onAuthPrompt()
    }, 2000)
    return () => clearTimeout(t)
  }, [newBest, onAuthPrompt])

  // Open modal and generate image
  const handleShare = useCallback(async () => {
    trackShareClicked(user?.id ?? null, totalScore, dateStr)
    setShareImageUrl(null)
    setShareGenerating(true)
    setShareModal(true)
    try {
      const canvas = generateShareImage(results, locations, totalScore, dateStr, dayStreak, isDark)
      if (canvas) setShareImageUrl(canvas.toDataURL('image/png'))
    } catch {
      // silently fall through — modal still shows "Copy Text Instead"
    }
    setShareGenerating(false)
  }, [results, locations, totalScore, dateStr, dayStreak, isDark, user])

  // Share or download the image
  const handleShareImage = useCallback(async () => {
    setShareModal(false)
    const plainText = buildShareText(results, locations, totalScore, dateStr, dayStreak, unitPreference, 'standard')
    try {
      const canvas = generateShareImage(results, locations, totalScore, dateStr, dayStreak, isDark)
      if (!canvas) throw new Error('no canvas')
      const outcome = await shareOrDownloadImage(canvas, dateStr, plainText)
      if (outcome === 'downloaded') {
        setToastMsg('Image saved!')
        setToastVisible(true)
      } else if (outcome === 'text') {
        setToastMsg('✓ Copied to clipboard!')
        setToastVisible(true)
      }
    } catch {
      const outcome = await shareResult(plainText)
      if (outcome === 'clipboard') {
        setToastMsg('✓ Copied to clipboard!')
        setToastVisible(true)
      }
    }
  }, [results, locations, totalScore, dateStr, dayStreak, unitPreference, isDark])

  // Copy plain text to clipboard
  const handleCopyText = useCallback(async () => {
    setShareModal(false)
    const text = buildShareText(results, locations, totalScore, dateStr, dayStreak, unitPreference, 'standard')
    const outcome = await shareResult(text)
    if (outcome === 'clipboard') {
      setToastMsg('✓ Copied to clipboard!')
      setToastVisible(true)
    } else if (outcome === 'error') {
      setToastMsg('Could not share — try again.')
      setToastVisible(true)
    }
  }, [results, locations, totalScore, dateStr, dayStreak, unitPreference])

  // Create a friend challenge
  const handleChallenge = useCallback(async () => {
    setChallengeLoading(true)
    try {
      const code = await createChallenge(
        results.map((r) => r.locationId),
        totalScore,
        profile?.username ?? null,
        user?.id ?? null,
      )
      if (code) {
        const url = `${window.location.origin}/challenge/${code}`
        await navigator.clipboard?.writeText(url).catch(() => {})
        setToastMsg('Challenge link copied! Send it to a friend. 🔗')
        setToastVisible(true)
      } else {
        setToastMsg('Could not create challenge — try again.')
        setToastVisible(true)
      }
    } catch {
      setToastMsg('Could not create challenge — try again.')
      setToastVisible(true)
    }
    setChallengeLoading(false)
  }, [results, totalScore, profile, user])

  const maxScore = results.length * 1000
  const flexLine = getFlexLine(totalScore, prevBestRef.current)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1923] flex flex-col transition-colors duration-200">
      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <PWANudge />

      {/* Share Image Modal */}
      {shareModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
          onClick={() => setShareModal(false)}
        >
          <div
            className="bg-white dark:bg-[#162130] rounded-t-3xl w-full max-w-md p-6 pb-10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mb-2" />
            <p className="text-center font-bold text-gray-800 dark:text-slate-100 text-lg">Share Your Result</p>

            {/* Image preview */}
            <div className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-[#1e3a4a] bg-gray-50 dark:bg-slate-800 min-h-[120px] flex items-center justify-center">
              {shareGenerating ? (
                <p className="text-gray-400 dark:text-slate-500 text-sm py-10">Generating…</p>
              ) : shareImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shareImageUrl} alt="Share card preview" className="w-full" />
              ) : (
                <p className="text-gray-400 dark:text-slate-500 text-sm py-10">Preview unavailable</p>
              )}
            </div>

            <button
              onClick={handleShareImage}
              disabled={shareGenerating}
              className="w-full py-3.5 rounded-2xl bg-sky-400 text-white font-bold
                         active:scale-95 transition-transform duration-100
                         shadow-md shadow-sky-200 dark:shadow-sky-900/50
                         disabled:opacity-50 min-h-[44px]"
            >
              Share Image 🖼️
            </button>

            <button
              onClick={handleCopyText}
              className="w-full py-3 rounded-2xl border border-gray-200 dark:border-[#1e3a4a]
                         text-gray-600 dark:text-slate-300 font-semibold
                         active:scale-95 transition-transform duration-100 min-h-[44px]"
            >
              Copy Text Instead
            </button>

            <button
              onClick={() => setShareModal(false)}
              className="w-full py-2 text-gray-400 dark:text-slate-500 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Map — 35vh */}
      <div style={{ height: '35vh', minHeight: 180 }} className="relative flex-shrink-0">
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
        {/* Score overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-[#162130]/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-xl text-center border border-transparent dark:border-[#1e3a4a]">
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              Final Score
            </p>
            <p className="text-4xl font-black text-gray-900 dark:text-slate-100 tabular-nums">
              {animatedScore.toLocaleString()}
              <span className="text-base font-semibold text-gray-400 dark:text-slate-500"> / {maxScore.toLocaleString()}</span>
            </p>
            <p className="text-sm font-bold text-gray-500 dark:text-slate-400 mt-1">
              {getPerformanceSummary(totalScore)}
            </p>
            {newBest && (
              <p className="text-xs font-bold text-amber-500 mt-0.5">🏆 New Personal Best!</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-md mx-auto w-full">
        {/* Streak */}
        {dayStreak > 0 && (
          <StreakCard current={dayStreak} longest={longestStreak} onMilestone={() => fireConfetti()} />
        )}

        {/* Round breakdown */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-[#1e3a4a]">
          <div className="grid grid-cols-4 px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-[#1e3a4a]">
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase">#</p>
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase col-span-2">Location</p>
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase text-right">Pts</p>
          </div>
          {results.map((result, i) => {
            const loc = locations.find((l) => l.id === result.locationId)
            const distStr = formatDistanceWhole(result.distanceMiles, result.distanceKm, unitPreference)
            return (
              <div key={i} className="grid grid-cols-4 px-4 py-2.5 border-b border-gray-50 dark:border-[#1e3a4a] last:border-0">
                <p className="text-sm font-bold text-gray-400 dark:text-slate-500">{i + 1}</p>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{loc?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{distStr}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${RATING_COLORS[result.rating]}`}>
                    {result.pointsTotal}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{result.rating}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Flex line */}
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/40 rounded-2xl px-5 py-3 text-center">
          <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">{flexLine}</p>
        </div>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="w-full py-3.5 min-h-[44px] rounded-2xl bg-sky-400 text-white font-bold
                     hover:bg-sky-500 active:scale-95 transition-transform duration-100
                     shadow-md shadow-sky-200 dark:shadow-sky-900/50"
        >
          Share My Result 📤
        </button>

        {/* Challenge a friend */}
        <button
          onClick={handleChallenge}
          disabled={challengeLoading}
          className="w-full py-3.5 min-h-[44px] rounded-2xl border-2 border-sky-300 dark:border-sky-700
                     text-sky-600 dark:text-sky-300 font-bold
                     hover:bg-sky-50 dark:hover:bg-sky-900/20
                     active:scale-95 transition-transform duration-100
                     disabled:opacity-60"
        >
          {challengeLoading ? 'Creating challenge…' : '⚔️ Challenge a Friend'}
        </button>

        {/* Countdown */}
        <div className="bg-white dark:bg-[#162130] rounded-2xl border border-gray-100 dark:border-[#1e3a4a] shadow-sm px-5 py-4 text-center space-y-1">
          <p className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-widest">
            Next challenge in
          </p>
          <CountdownInline />
        </div>

        <button
          onClick={onHome}
          className="w-full py-3.5 min-h-[44px] rounded-2xl bg-white dark:bg-[#162130] border border-gray-200 dark:border-[#1e3a4a]
                     text-gray-600 dark:text-slate-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800
                     active:scale-95 transition-transform duration-100"
        >
          ← Back to Home
        </button>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-lg">📍</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">Your guesses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sky-400 text-lg">📍</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">Correct answers</span>
          </div>
        </div>
      </div>
    </div>
  )
}

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
    <p className="text-3xl font-black text-gray-800 dark:text-slate-100 tabular-nums">{fmt(h)}:{fmt(m)}:{fmt(s)}</p>
  )
}
