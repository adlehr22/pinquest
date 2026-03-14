import { getSupabaseClient } from '@/lib/supabase'
import { ALL_LOCATIONS } from '@/data/locations'
import { Location, ChallengeRun } from '@/types'

export function generateChallengeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function createChallenge(
  locationIds: number[],
  totalScore: number,
  username: string | null,
  userId: string | null,
): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const code = generateChallengeCode()
  const { error } = await supabase.from('challenge_runs').insert({
    challenge_code: code,
    location_ids: locationIds,
    original_score: totalScore,
    original_username: username,
    original_user_id: userId,
  })
  if (error) return null
  return code
}

export async function fetchChallenge(code: string): Promise<ChallengeRun | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('challenge_runs')
    .select('*')
    .eq('challenge_code', code.toUpperCase())
    .single()
  if (error || !data) return null
  return data as ChallengeRun
}

export async function incrementChallengeTimesPlayed(code: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  await supabase.rpc('increment_challenge_plays', { code_arg: code.toUpperCase() })
}

export function getChallengeLocations(locationIds: number[]): Location[] {
  return locationIds
    .map((id) => ALL_LOCATIONS.find((l) => l.id === id))
    .filter((l): l is Location => l !== undefined)
}

export function getPracticeLocations(): Location[] {
  const arr = [...ALL_LOCATIONS]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, 5)
}
