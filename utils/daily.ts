import { ALL_LOCATIONS } from '@/data/locations'
import { Location } from '@/types'

// Mulberry32: fast, seedable 32-bit PRNG
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function dateToSeed(dateStr: string): number {
  // Simple, stable string → integer hash
  let h = 0
  for (let i = 0; i < dateStr.length; i++) {
    h = (Math.imul(31, h) + dateStr.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getDailyLocations(dateStr?: string): Location[] {
  const date = dateStr ?? getTodayDateString()
  const rand = mulberry32(dateToSeed(date))

  // Seeded Fisher-Yates shuffle
  const arr = [...ALL_LOCATIONS]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr.slice(0, 5)
}
