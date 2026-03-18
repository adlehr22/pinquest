'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { RoundResult, GameState } from '@/types'
import { buildRoundResult, getTotalScore } from '@/utils/game'
import { getMutePreference, getUnitPreference, hasPlayedToday, setTodayResult, getTodayResult, hasBeenPromptedForAuth, markAuthPrompted } from '@/utils/storage'
import { calculateStreak } from '@/utils/scoring'
import { playPinDrop, playWhoosh, playChime } from '@/utils/sound'
import { getDailyLocations, getTodayDateString } from '@/utils/daily'
import { recordGamePlayed, getStreakData } from '@/utils/streak'
import { trackGameStarted, trackRoundCompleted, trackGameCompleted } from '@/utils/analytics'
import { notifyGameCompleted } from '@/utils/notifications'
import { useAuth } from '@/lib/AuthContext'
import GameHeader from '@/components/GameHeader'
import PromptCard from '@/components/PromptCard'
import ResultCard from '@/components/ResultCard'
import FinalScreen from '@/components/FinalScreen'
import AuthModal from '@/components/AuthModal'
import AlreadyPlayedScreen from '@/components/AlreadyPlayedScreen'

const GameMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading map…</div>
    </div>
  ),
})

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
  confetti?.({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#38BDF8', '#F59E0B', '#10B981', '#F472B6'] })
}

export default function GamePage() {
  const router = useRouter()
  const { user, saveGameToDb, saveGuestGame } = useAuth()

  // Derive today's date & locations once
  const todayStr = getTodayDateString()
  const locations = getDailyLocations(todayStr)

  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [gameState, setGameState] = useState<GameState>({
    phase: 'guessing',
    currentRound: 0,
    totalScore: 0,
    results: [],
    streakCount: 0,
    unitPreference: 'mi',
  })
  const [muted, setMuted] = useState(true)
  const [guessLat, setGuessLat] = useState<number | null>(null)
  const [guessLng, setGuessLng] = useState<number | null>(null)
  const [hintUsed, setHintUsed] = useState(false)
  const [cardVisible, setCardVisible] = useState(false)
  const [latestResult, setLatestResult] = useState<RoundResult | null>(null)
  const [finished, setFinished] = useState(false)
  const [roundKey, setRoundKey] = useState(0)
  const [dayStreak, setDayStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Init: check already played, load prefs
  useEffect(() => {
    if (hasPlayedToday(todayStr)) {
      setAlreadyPlayed(true)
      return
    }
    setMuted(getMutePreference())
    setGameState((s) => ({ ...s, unitPreference: getUnitPreference() }))
    const sd = getStreakData()
    setDayStreak(sd.current)
    setLongestStreak(sd.longest)
    trackGameStarted(user?.id ?? null, todayStr)
    const t = setTimeout(() => setCardVisible(true), 200)
    return () => clearTimeout(t)
  }, [todayStr])

  const currentLocation = locations[gameState.currentRound]

  const handleGuess = useCallback((lat: number, lng: number) => {
    if (gameState.phase !== 'guessing') return
    setGuessLat(lat)
    setGuessLng(lng)
    playPinDrop(muted)
  }, [gameState.phase, muted])

  const handleClear = useCallback(() => {
    setGuessLat(null)
    setGuessLng(null)
  }, [])

  const handleHint = useCallback(() => { setHintUsed(true) }, [])

  const handleLock = useCallback(() => {
    if (guessLat === null || guessLng === null) return
    if (gameState.phase !== 'guessing') return

    const result = buildRoundResult(
      currentLocation.id, guessLat, guessLng,
      currentLocation.latitude, currentLocation.longitude,
      hintUsed, gameState.results,
    )

    const finalResult: RoundResult = hintUsed
      ? { ...result, pointsBase: Math.max(0, result.pointsBase - 500), pointsTotal: Math.max(0, result.pointsBase - 500) + result.pointsBonus }
      : result

    const newResults = [...gameState.results, finalResult]
    const streak = calculateStreak(newResults)

    setLatestResult(finalResult)
    setGameState((s) => ({
      ...s, phase: 'reveal',
      totalScore: getTotalScore(newResults),
      results: newResults,
      streakCount: streak,
    }))

    trackRoundCompleted(
      user?.id ?? null,
      gameState.currentRound + 1,
      currentLocation.id,
      finalResult.distanceMiles,
      finalResult.pointsTotal,
      todayStr,
    )

    playWhoosh(muted)
    if (finalResult.rating === 'PERFECT' || finalResult.rating === 'GREAT') {
      setTimeout(() => playChime(muted), 400)
      if (finalResult.rating === 'PERFECT') setTimeout(() => fireConfetti(), 600)
    }
  }, [guessLat, guessLng, gameState, currentLocation, hintUsed, muted])

  const handleNext = useCallback(() => {
    const nextRound = gameState.currentRound + 1
    if (nextRound >= locations.length) {
      setFinished(true)
      return
    }
    setGuessLat(null)
    setGuessLng(null)
    setHintUsed(false)
    setLatestResult(null)
    setCardVisible(false)
    setRoundKey((k) => k + 1)
    setGameState((s) => ({ ...s, phase: 'guessing', currentRound: nextRound }))
    setTimeout(() => setCardVisible(true), 300)
  }, [gameState.currentRound, locations.length])

  // Called when FinalScreen mounts — record everything
  const handleGameFinished = useCallback((results: RoundResult[], totalScore: number) => {
    // Record streak
    const updatedStreak = recordGamePlayed(todayStr)
    setDayStreak(updatedStreak.current)
    setLongestStreak(updatedStreak.longest)

    // Persist today's result for "already played" gate
    setTodayResult({ dateStr: todayStr, totalScore, results })

    // Milestone confetti
    const milestones = [3, 7, 14, 30]
    if (milestones.includes(updatedStreak.current)) {
      setTimeout(() => fireConfetti(), 1000)
    }

    trackGameCompleted(user?.id ?? null, totalScore, todayStr)

    // Save to DB — logged-in users save with profile, guests save anonymously
    if (user) {
      saveGameToDb(todayStr, totalScore, results, updatedStreak.current, updatedStreak.longest)
      notifyGameCompleted(user.id, totalScore, todayStr)
    } else {
      saveGuestGame(todayStr, totalScore, results)
    }
  }, [todayStr, user, saveGameToDb, saveGuestGame])

  const handleAuthPrompt = useCallback(() => {
    if (user) return // already logged in
    if (hasBeenPromptedForAuth()) return // already shown this session
    markAuthPrompted()
    setTimeout(() => setShowAuthModal(true), 800)
  }, [user])

  const handleToggleUnit = useCallback(() => {
    setGameState((s) => ({ ...s, unitPreference: s.unitPreference === 'mi' ? 'km' : 'mi' }))
  }, [])

  // ── Already played today ─────────────────────────────
  if (alreadyPlayed) {
    const stored = getTodayResult()
    if (stored) {
      return (
        <AlreadyPlayedScreen
          todayResult={stored}
          locations={locations}
          unitPreference={gameState.unitPreference || getUnitPreference()}
          onHome={() => router.push('/')}
        />
      )
    }
  }

  // ── Finished → final screen ──────────────────────────
  if (finished) {
    // Fire side-effects once via a rendered effect inside FinalScreen
    return (
      <>
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => {
              saveGameToDb(todayStr, gameState.totalScore, gameState.results, dayStreak, longestStreak)
            }}
          />
        )}
        <FinalScreenWithEffect
          results={gameState.results}
          locations={locations}
          totalScore={gameState.totalScore}
          unitPreference={gameState.unitPreference}
          dayStreak={dayStreak}
          longestStreak={longestStreak}
          dateStr={todayStr}
          onHome={() => router.push('/')}
          onPlayAgain={() => router.push('/')}
          onAuthPrompt={handleAuthPrompt}
          onMount={() => handleGameFinished(gameState.results, gameState.totalScore)}
        />
      </>
    )
  }

  const isReveal = gameState.phase === 'reveal'

  return (
    <div className="flex flex-col overflow-hidden bg-white" style={{ height: '100dvh' }}>
      <GameHeader
        state={gameState}
        muted={muted}
        dayStreak={dayStreak}
        onToggleMute={() => setMuted((m) => !m)}
        onToggleUnit={handleToggleUnit}
        totalRounds={locations.length}
      />

      <div
        className="flex-1 overflow-hidden"
        style={{ paddingBottom: isReveal ? 270 : 235 }}
      >
        <GameMap
          targetLocation={currentLocation}
          guessLat={guessLat}
          guessLng={guessLng}
          locked={isReveal}
          revealed={isReveal}
          onGuess={handleGuess}
          roundKey={roundKey}
          hintActive={hintUsed}
        />

        {!isReveal && (
          <PromptCard
            location={currentLocation}
            guessLat={guessLat}
            guessLng={guessLng}
            onClear={handleClear}
            onLock={handleLock}
            onHint={handleHint}
            hintUsed={hintUsed}
            visible={cardVisible}
          />
        )}

        {isReveal && latestResult && (
          <ResultCard
            result={latestResult}
            location={currentLocation}
            unitPreference={gameState.unitPreference}
            streakCount={gameState.streakCount}
            onNext={handleNext}
            isLastRound={gameState.currentRound === locations.length - 1}
            visible={true}
          />
        )}
      </div>
    </div>
  )
}

// Wrapper so handleGameFinished fires exactly once when the final screen mounts
interface FinalScreenWithEffectProps {
  results: RoundResult[]
  locations: ReturnType<typeof getDailyLocations>
  totalScore: number
  unitPreference: 'mi' | 'km'
  dayStreak: number
  longestStreak: number
  dateStr: string
  onHome: () => void
  onPlayAgain: () => void
  onAuthPrompt: () => void
  onMount: () => void
}

function FinalScreenWithEffect({ onMount, ...props }: FinalScreenWithEffectProps) {
  useEffect(() => {
    onMount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <FinalScreen {...props} />
}
