import { StreakData } from '@/types'

const KEYS = {
  current: 'pinquest_streak_current',
  longest: 'pinquest_streak_longest',
  lastPlayed: 'pinquest_streak_last_played',
}

export function getStreakData(): StreakData {
  try {
    const current = parseInt(localStorage.getItem(KEYS.current) ?? '0', 10)
    const longest = parseInt(localStorage.getItem(KEYS.longest) ?? '0', 10)
    const lastPlayedDate = localStorage.getItem(KEYS.lastPlayed)
    return {
      current: isNaN(current) ? 0 : current,
      longest: isNaN(longest) ? 0 : longest,
      lastPlayedDate,
    }
  } catch {
    return { current: 0, longest: 0, lastPlayedDate: null }
  }
}

// Call after completing a game. Returns the updated StreakData.
export function recordGamePlayed(todayStr: string): StreakData {
  try {
    const data = getStreakData()
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    let newCurrent: number
    if (data.lastPlayedDate === todayStr) {
      // Already recorded today — no change
      newCurrent = data.current
    } else if (data.lastPlayedDate === yesterdayStr) {
      // Played yesterday → extend streak
      newCurrent = data.current + 1
    } else {
      // Missed a day (or first game ever) → reset
      newCurrent = 1
    }

    const newLongest = Math.max(data.longest, newCurrent)

    localStorage.setItem(KEYS.current, newCurrent.toString())
    localStorage.setItem(KEYS.longest, newLongest.toString())
    localStorage.setItem(KEYS.lastPlayed, todayStr)

    return { current: newCurrent, longest: newLongest, lastPlayedDate: todayStr }
  } catch {
    return { current: 1, longest: 1, lastPlayedDate: todayStr }
  }
}

// Sync streak from DB back into localStorage (called after login)
export function syncStreakFromDb(current: number, longest: number, lastPlayed: string): void {
  try {
    localStorage.setItem(KEYS.current, current.toString())
    localStorage.setItem(KEYS.longest, longest.toString())
    localStorage.setItem(KEYS.lastPlayed, lastPlayed)
  } catch {
    // SSR safety
  }
}

// Returns true if it's after 18:00 local and they haven't played today
export function isStreakAtRisk(lastPlayedDate: string | null, todayStr: string): boolean {
  if (lastPlayedDate === todayStr) return false
  if (lastPlayedDate === null) return false // no streak to protect
  return new Date().getHours() >= 18
}

export const STREAK_MILESTONES = [3, 7, 14, 30]
