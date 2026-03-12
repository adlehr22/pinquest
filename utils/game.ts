import { GAME_LOCATIONS } from '@/data/locations'
import { Location, RoundResult, GameState } from '@/types'
import { haversineDistance } from './distance'
import { getBaseScore, applyStreakBonus, calculateStreak } from './scoring'
import { getUnitPreference } from './storage'

export function getLocationsForSession(): Location[] {
  return GAME_LOCATIONS
}

export function buildRoundResult(
  locationId: number,
  guessLat: number,
  guessLng: number,
  targetLat: number,
  targetLng: number,
  hintUsed: boolean,
  prevResults: RoundResult[],
): RoundResult {
  const { miles, km } = haversineDistance(guessLat, guessLng, targetLat, targetLng)
  const { points, rating } = getBaseScore(miles)

  // Calculate streak including this result
  const tempResults: Pick<RoundResult, 'pointsBase'>[] = [
    ...prevResults.map((r) => ({ pointsBase: r.pointsBase })),
    { pointsBase: points },
  ]
  const streak = calculateStreak(tempResults)
  const bonus = applyStreakBonus(points, streak)

  return {
    locationId,
    guessLat,
    guessLng,
    distanceMiles: miles,
    distanceKm: km,
    pointsBase: points,
    pointsBonus: bonus,
    pointsTotal: points + bonus,
    hintUsed,
    rating,
  }
}

export function getTotalScore(results: RoundResult[]): number {
  return results.reduce((sum, r) => sum + r.pointsTotal, 0)
}

export function initialGameState(): GameState {
  return {
    phase: 'guessing',
    currentRound: 0,
    totalScore: 0,
    results: [],
    streakCount: 0,
    unitPreference: getUnitPreference(),
  }
}

export function formatShareText(results: RoundResult[], totalScore: number): string {
  const now = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`

  const lines = results.map((r, i) => {
    const loc = GAME_LOCATIONS.find((l) => l.id === r.locationId)
    const name = loc?.name ?? 'Unknown'
    return `${i + 1}. ${name} — ${r.distanceMiles.toFixed(1)} mi — ${r.pointsTotal}pts`
  })

  return `PinQuest 📍\n${dateStr}\n${totalScore} / 5,000\n\n${lines.join('\n')}\n\nPlay at pinquest.app`
}
