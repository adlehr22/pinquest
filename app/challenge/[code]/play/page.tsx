'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { RoundResult, GameState } from '@/types'
import { buildRoundResult, getTotalScore } from '@/utils/game'
import { getMutePreference, getUnitPreference } from '@/utils/storage'
import { calculateStreak } from '@/utils/scoring'
import { playPinDrop, playWhoosh, playChime } from '@/utils/sound'
import { fetchChallenge, getChallengeLocations, incrementChallengeTimesPlayed } from '@/utils/challenges'
import { ChallengeRun, Location } from '@/types'
import GameHeader from '@/components/GameHeader'
import PromptCard from '@/components/PromptCard'
import ResultCard from '@/components/ResultCard'
import ChallengeResultScreen from '@/components/ChallengeResultScreen'

const GameMap = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 dark:bg-[#162130] animate-pulse flex items-center justify-center">
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
  confetti?.({ particleCount: 100, spread: 70, origin: { y: 0.5 } })
}

export default function ChallengePlayPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const [challenge, setChallenge] = useState<ChallengeRun | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loadingChallenge, setLoadingChallenge] = useState(true)
  const [finished, setFinished] = useState(false)

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
  const [roundKey, setRoundKey] = useState(0)

  useEffect(() => {
    fetchChallenge(params.code).then((c) => {
      if (!c) {
        router.replace(`/challenge/${params.code}`)
        return
      }
      setChallenge(c)
      setLocations(getChallengeLocations(c.location_ids))
      setLoadingChallenge(false)
      setMuted(getMutePreference())
      setGameState((s) => ({ ...s, unitPreference: getUnitPreference() }))
      setTimeout(() => setCardVisible(true), 200)
    })
  }, [params.code, router])

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
      if (challenge) incrementChallengeTimesPlayed(challenge.challenge_code)
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
  }, [gameState.currentRound, locations.length, challenge])

  const handleToggleUnit = useCallback(() => {
    setGameState((s) => ({ ...s, unitPreference: s.unitPreference === 'mi' ? 'km' : 'mi' }))
  }, [])

  if (loadingChallenge) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1923] flex items-center justify-center transition-colors duration-200">
        <p className="text-gray-400 dark:text-slate-500 animate-pulse">Loading challenge…</p>
      </div>
    )
  }

  if (finished && challenge) {
    return (
      <ChallengeResultScreen
        results={gameState.results}
        locations={locations}
        totalScore={gameState.totalScore}
        opponentScore={challenge.original_score}
        opponentUsername={challenge.original_username}
        challengeCode={challenge.challenge_code}
        unitPreference={gameState.unitPreference}
        onHome={() => router.push('/')}
        onPlayDaily={() => router.push('/game')}
      />
    )
  }

  if (!currentLocation) return null

  const isReveal = gameState.phase === 'reveal'

  return (
    <div className="flex flex-col overflow-hidden bg-white dark:bg-[#0f1923]" style={{ height: '100dvh' }}>
      {/* Challenge badge */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-2 pointer-events-none">
        <span className="bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
          ⚔️ Challenge Mode
        </span>
      </div>

      <GameHeader
        state={gameState}
        muted={muted}
        dayStreak={0}
        onToggleMute={() => setMuted((m) => !m)}
        onToggleUnit={handleToggleUnit}
        totalRounds={locations.length}
      />

      <div className="flex-1 overflow-hidden" style={{ paddingBottom: isReveal ? 270 : 235 }}>
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
