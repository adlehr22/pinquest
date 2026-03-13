import { getSupabaseClient } from '@/lib/supabase'

// Module-level session ID — created once per game session, persists across rounds
let _sessionId: string | null = null

function getSessionId(): string {
  if (!_sessionId) _sessionId = crypto.randomUUID()
  return _sessionId
}

function resetSession(): void {
  _sessionId = crypto.randomUUID()
}

// Internal fire-and-forget insert — never throws, never blocks
function trackEvent(
  eventType: string,
  properties: {
    user_id?: string | null
    challenge_date?: string | null
    location_id?: number | null
    round_number?: number | null
    distance_miles?: number | null
    points_earned?: number | null
    total_score?: number | null
    metadata?: Record<string, unknown> | null
  } = {},
): void {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return
    supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        session_id: getSessionId(),
        mode: 'daily',
        ...properties,
      })
      .then(void 0, () => {})
  } catch {
    // Analytics must never crash the game
  }
}

export function trackGameStarted(userId: string | null, date: string): void {
  resetSession() // new session ID for each game
  trackEvent('game_started', { user_id: userId, challenge_date: date })
}

export function trackRoundCompleted(
  userId: string | null,
  roundNumber: number,
  locationId: number,
  distanceMiles: number,
  pointsEarned: number,
  date: string,
): void {
  trackEvent('round_completed', {
    user_id: userId,
    round_number: roundNumber,
    location_id: locationId,
    distance_miles: distanceMiles,
    points_earned: pointsEarned,
    challenge_date: date,
  })
}

export function trackGameCompleted(
  userId: string | null,
  totalScore: number,
  date: string,
): void {
  trackEvent('game_completed', {
    user_id: userId,
    total_score: totalScore,
    challenge_date: date,
  })
}

export function trackShareClicked(
  userId: string | null,
  totalScore: number,
  date: string,
): void {
  trackEvent('share_clicked', {
    user_id: userId,
    total_score: totalScore,
    challenge_date: date,
  })
}

export function trackSignupCompleted(userId: string, date: string): void {
  trackEvent('signup_completed', { user_id: userId, challenge_date: date })
}
