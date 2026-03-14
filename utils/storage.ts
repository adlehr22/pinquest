import { TodayResult } from '@/types'

// ── Personal best ────────────────────────────────────────

export function getPersonalBest(): number | null {
  try {
    const val = localStorage.getItem('pinquest_personal_best')
    if (val === null) return null
    const parsed = parseInt(val, 10)
    return isNaN(parsed) ? null : parsed
  } catch {
    return null
  }
}

export function setPersonalBest(score: number): void {
  try {
    const current = getPersonalBest()
    if (current === null || score > current) {
      localStorage.setItem('pinquest_personal_best', score.toString())
    }
  } catch {
    // SSR safety
  }
}

export function isNewPersonalBest(score: number): boolean {
  try {
    const current = getPersonalBest()
    return current === null || score > current
  } catch {
    return false
  }
}

// ── Preferences ──────────────────────────────────────────

export function getMutePreference(): boolean {
  try {
    const val = localStorage.getItem('pinquest_muted')
    if (val === null) {
      return typeof window !== 'undefined' && window.innerWidth < 768
    }
    return val === 'true'
  } catch {
    return true
  }
}

export function setMutePreference(muted: boolean): void {
  try {
    localStorage.setItem('pinquest_muted', muted.toString())
  } catch {}
}

export function getUnitPreference(): 'mi' | 'km' {
  try {
    const val = localStorage.getItem('pinquest_unit')
    if (val === 'km' || val === 'mi') return val
    return 'mi'
  } catch {
    return 'mi'
  }
}

export function setUnitPreference(unit: 'mi' | 'km'): void {
  try {
    localStorage.setItem('pinquest_unit', unit)
  } catch {}
}

// ── Daily game result ────────────────────────────────────

const TODAY_KEY = 'pinquest_today_result'

export function getTodayResult(): TodayResult | null {
  try {
    const raw = localStorage.getItem(TODAY_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TodayResult
  } catch {
    return null
  }
}

export function setTodayResult(result: TodayResult): void {
  try {
    localStorage.setItem(TODAY_KEY, JSON.stringify(result))
  } catch {}
}

export function hasPlayedToday(todayStr: string): boolean {
  try {
    const result = getTodayResult()
    return result?.dateStr === todayStr
  } catch {
    return false
  }
}

// ── Auth-prompted flag (show auth modal only once per session) ──

export function hasBeenPromptedForAuth(): boolean {
  try {
    return sessionStorage.getItem('pinquest_auth_prompted') === 'true'
  } catch {
    return false
  }
}

export function markAuthPrompted(): void {
  try {
    sessionStorage.setItem('pinquest_auth_prompted', 'true')
  } catch {}
}

// ── Practice best ────────────────────────────────────────

export function getPracticeBest(): number | null {
  try {
    const val = localStorage.getItem('pinquest_practice_best')
    if (val === null) return null
    const parsed = parseInt(val, 10)
    return isNaN(parsed) ? null : parsed
  } catch {
    return null
  }
}

export function setPracticeBest(score: number): void {
  try {
    const current = getPracticeBest()
    if (current === null || score > current) {
      localStorage.setItem('pinquest_practice_best', score.toString())
    }
  } catch {}
}

// ── PWA nudge ────────────────────────────────────────────

export function isPwaPromptDismissed(): boolean {
  try {
    return localStorage.getItem('pinquest_pwa_dismissed') === 'true'
  } catch {
    return false
  }
}

export function dismissPwaPrompt(): void {
  try {
    localStorage.setItem('pinquest_pwa_dismissed', 'true')
  } catch {}
}
