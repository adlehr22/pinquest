export interface Location {
  id: number
  name: string
  prompt: string
  latitude: number
  longitude: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  funFact: string
}

export interface RoundResult {
  locationId: number
  guessLat: number
  guessLng: number
  distanceMiles: number
  distanceKm: number
  pointsBase: number
  pointsBonus: number
  pointsTotal: number
  hintUsed: boolean
  rating: 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD'
}

export type GamePhase = 'home' | 'guessing' | 'reveal' | 'finished'

export interface GameState {
  phase: GamePhase
  currentRound: number
  totalScore: number
  results: RoundResult[]
  streakCount: number
  unitPreference: 'mi' | 'km'
}

// ── Auth / Database ─────────────────────────────────────
export interface Profile {
  id: string
  username: string | null
  created_at: string
  current_streak: number
  longest_streak: number
  total_games: number
  average_score: number
}

export interface GameRecord {
  id: string
  user_id: string | null
  played_date: string
  total_score: number
  round_results: RoundResult[]
  created_at: string
}

export interface LeaderboardEntry {
  username: string
  total_score: number
  played_date: string
  current_streak: number
  rank: number
}

// ── Streak ───────────────────────────────────────────────
export interface StreakData {
  current: number
  longest: number
  lastPlayedDate: string | null
}

// ── Daily state ──────────────────────────────────────────
export interface TodayResult {
  dateStr: string
  totalScore: number
  results: RoundResult[]
}

// ── Friend challenges ─────────────────────────────────────
export interface ChallengeRun {
  id: string
  challenge_code: string
  location_ids: number[]
  original_score: number
  original_username: string | null
  original_user_id: string | null
  times_played: number
  created_at: string
}
