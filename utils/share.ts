import { RoundResult, Location } from '@/types'

function getEmojiRow(pointsBase: number): string {
  if (pointsBase >= 1000) return '🟢🟢🟢🟢🟢'
  if (pointsBase >= 900) return '🟢🟢🟢🟢⚪'
  if (pointsBase >= 700) return '🟢🟢🟢⚪⚪'
  if (pointsBase >= 500) return '🟡🟡🟡⚪⚪'
  if (pointsBase >= 300) return '🟡🟡⚪⚪⚪'
  if (pointsBase >= 60) return '🔴⚪⚪⚪⚪'
  if (pointsBase > 0) return '🔴⚪⚪⚪⚪'
  return '⚫⚪⚪⚪⚪'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00') // noon avoids TZ rollover
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
}

export function buildShareText(
  results: RoundResult[],
  locations: Location[],
  totalScore: number,
  dateStr: string,
  dayStreak: number,
  unitPreference: 'mi' | 'km' = 'mi',
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pinquest.app'
  const streakLine = dayStreak > 0 ? ` · 🔥 ${dayStreak} day streak` : ''

  const lines = results.map((r, i) => {
    const loc = locations.find((l) => l.id === r.locationId)
    const name = loc?.name ?? 'Unknown'
    const dist =
      unitPreference === 'km'
        ? `${r.distanceKm.toFixed(1)} km`
        : `${r.distanceMiles.toFixed(1)} mi`
    return `${i + 1}. ${getEmojiRow(r.pointsBase)} ${name} · ${dist}`
  })

  return [
    `PinQuest 📍 ${formatDate(dateStr)}`,
    `${totalScore.toLocaleString()} / 5,000${streakLine}`,
    '',
    ...lines,
    '',
    `Play today's challenge → ${siteUrl}`,
  ].join('\n')
}

export async function shareResult(text: string): Promise<'native' | 'clipboard' | 'error'> {
  // Try native share sheet first (mobile browsers)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text })
      return 'native'
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(text)
    return 'clipboard'
  } catch {
    // execCommand fallback for older browsers
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
