import { RoundResult } from '@/types'

export type Rating = 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD'

export interface ScoreBreakdown {
  base: number
  bonus: number
  total: number
  rating: Rating
}

export function getBaseScore(distanceMiles: number): { points: number; rating: Rating } {
  if (distanceMiles < 6) return { points: 1000, rating: 'PERFECT' }
  if (distanceMiles < 31) return { points: 900, rating: 'GREAT' }
  if (distanceMiles < 125) return { points: 700, rating: 'GREAT' }
  if (distanceMiles < 310) return { points: 500, rating: 'GOOD' }
  if (distanceMiles < 620) return { points: 300, rating: 'GOOD' }
  if (distanceMiles < 1240) return { points: 160, rating: 'BAD' }
  if (distanceMiles < 2500) return { points: 60, rating: 'BAD' }
  return { points: 0, rating: 'BAD' }
}

export function calculateStreak(results: Pick<RoundResult, 'pointsBase'>[]): number {
  let streak = 0
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].pointsBase >= 700) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export function applyStreakBonus(basePoints: number, streak: number): number {
  if (streak >= 2) {
    return Math.round(basePoints * 0.1)
  }
  return 0
}

export function getRatingColor(rating: Rating): string {
  switch (rating) {
    case 'PERFECT':
      return 'text-emerald-500'
    case 'GREAT':
      return 'text-sky-500'
    case 'GOOD':
      return 'text-amber-500'
    case 'BAD':
      return 'text-red-500'
  }
}

export function getRatingBg(rating: Rating): string {
  switch (rating) {
    case 'PERFECT':
      return 'bg-emerald-50 border-emerald-200'
    case 'GREAT':
      return 'bg-sky-50 border-sky-200'
    case 'GOOD':
      return 'bg-amber-50 border-amber-200'
    case 'BAD':
      return 'bg-red-50 border-red-200'
  }
}
