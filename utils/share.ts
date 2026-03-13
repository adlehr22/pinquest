import { RoundResult, Location } from '@/types'

function getEmojiRow(pointsBase: number): string {
  if (pointsBase >= 1000) return '🟢🟢🟢🟢🟢'
  if (pointsBase >= 900)  return '🟢🟢🟢🟢⚪'
  if (pointsBase >= 700)  return '🟢🟢🟢⚪⚪'
  if (pointsBase >= 500)  return '🟡🟡🟡⚪⚪'
  if (pointsBase >= 300)  return '🟡🟡⚪⚪⚪'
  if (pointsBase >= 60)   return '🔴⚪⚪⚪⚪'
  if (pointsBase > 0)     return '🔴⚪⚪⚪⚪'
  return '⚫⚪⚪⚪⚪'
}

function getPlayfulOneliner(totalScore: number): string {
  if (totalScore === 5000) return '"A perfect run. The globe has no secrets from you." 🌐'
  if (totalScore >= 4000) return '"You could navigate a pirate ship with those instincts." 🏴‍☠️'
  if (totalScore >= 3000) return '"Not bad for a landlocked guesser." 🌍'
  if (totalScore >= 2000) return '"The world is big. You found some of it." 🗺️'
  return '"Geography class would like a word." 📚'
}

const ROUND_LABELS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export type ShareFormat = 'minimal' | 'standard' | 'playful'

export function buildShareText(
  results: RoundResult[],
  locations: Location[],
  totalScore: number,
  dateStr: string,
  dayStreak: number,
  unitPreference: 'mi' | 'km' = 'mi',
  format: ShareFormat = 'standard',
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pinquest.app'
  const emojiGrid = results
    .map((r, i) => `${ROUND_LABELS[i] ?? `${i + 1}.`} ${getEmojiRow(r.pointsBase)}`)
    .join('\n')
  const streakSuffix = dayStreak > 0 ? ` · 🔥 ${dayStreak}-day streak` : ''

  if (format === 'minimal') {
    return [
      `PinQuest 📍`,
      `${totalScore.toLocaleString()} / 5,000`,
      '',
      emojiGrid,
      '',
      siteUrl,
    ].join('\n')
  }

  if (format === 'playful') {
    return [
      `PinQuest 📍 ${formatDate(dateStr)}`,
      `${totalScore.toLocaleString()} / 5,000${streakSuffix}`,
      '',
      emojiGrid,
      '',
      getPlayfulOneliner(totalScore),
      '',
      `Play today → ${siteUrl}`,
    ].join('\n')
  }

  // standard (default)
  return [
    `PinQuest 📍 ${formatDate(dateStr)}`,
    `${totalScore.toLocaleString()} / 5,000${streakSuffix}`,
    '',
    emojiGrid,
    '',
    `Play today → ${siteUrl}`,
  ].join('\n')
}

export async function shareResult(text: string): Promise<'native' | 'clipboard' | 'error'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text })
      return 'native'
    } catch {
      // cancelled or unsupported — fall through
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'clipboard'
  } catch {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      return 'clipboard'
    } catch {
      return 'error'
    }
  }
}
