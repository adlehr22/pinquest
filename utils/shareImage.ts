import { RoundResult, Location } from '@/types'
import { allContinents, LatLng } from './continents'

// Canvas logical dimensions
const W = 600
const H = 520

// Map section bounds (within the canvas)
const MAP_Y = 90
const MAP_H = 180

// ── Projection helpers ────────────────────────────────────

function lngToX(lng: number): number {
  return ((lng + 180) / 360) * W
}

function latToMapY(lat: number): number {
  return MAP_Y + ((90 - lat) / 180) * MAP_H
}

// ── Continent drawing ─────────────────────────────────────

function drawContinent(
  ctx: CanvasRenderingContext2D,
  points: LatLng[],
): void {
  if (points.length < 2) return
  ctx.beginPath()
  points.forEach(([lat, lng], i) => {
    const x = lngToX(lng)
    const y = latToMapY(lat)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fill()
}

// ── Emoji circle colors ───────────────────────────────────

function getCircleColors(pointsBase: number, isDark: boolean): string[] {
  const empty = isDark ? '#334155' : '#cbd5e1'
  const green  = '#4ade80'
  const yellow = '#fbbf24'
  const red    = '#f87171'
  const dark   = isDark ? '#1e293b' : '#94a3b8'

  if (pointsBase >= 1000) return [green,  green,  green,  green,  green]
  if (pointsBase >= 900)  return [green,  green,  green,  green,  empty]
  if (pointsBase >= 700)  return [green,  green,  green,  empty,  empty]
  if (pointsBase >= 500)  return [yellow, yellow, yellow, empty,  empty]
  if (pointsBase >= 300)  return [yellow, yellow, empty,  empty,  empty]
  if (pointsBase >= 1)    return [red,    empty,  empty,  empty,  empty]
  return                         [dark,   empty,  empty,  empty,  empty]
}

// ── Date formatting ────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ── Pin icon helper ────────────────────────────────────────

function drawPinIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const r = size * 0.5
  ctx.beginPath()
  ctx.arc(x, y - size * 0.3, r, Math.PI, 0)
  ctx.bezierCurveTo(x + r, y - size * 0.3, x + r * 0.4, y, x, y + size * 0.5)
  ctx.bezierCurveTo(x - r * 0.4, y, x - r, y - size * 0.3, x - r, y - size * 0.3)
  ctx.closePath()
  ctx.fillStyle = '#38BDF8'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x, y - size * 0.3, r * 0.35, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.fill()
}

// ── Main export ───────────────────────────────────────────

export function generateShareImage(
  results: RoundResult[],
  locations: Location[],
  totalScore: number,
  dateStr: string,
  dayStreak: number,
  isDark: boolean,
): HTMLCanvasElement | null {
  if (typeof window === 'undefined') return null

  try {
    const dpr = window.devicePixelRatio || 1
    const canvas = document.createElement('canvas')
    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.width  = `${W}px`
    canvas.style.height = `${H}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.scale(dpr, dpr)

    // Colours
    const bg        = isDark ? '#0f1923' : '#f0f7ff'
    const cardBg    = isDark ? '#162130' : '#ffffff'
    const cardBord  = isDark ? '#1e3a4a' : '#e2e8f0'
    const textPrim  = isDark ? '#f1f5f9' : '#0f172a'
    const textMuted = '#64748b'
    const mapBg     = isDark ? '#0d2137' : '#dbeafe'
    const contFill  = isDark ? '#1a3a55' : '#93c5fd'
    const accent    = '#38BDF8'

    const font = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif'

    // ── Background ─────────────────────────────────────────
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // ── HEADER (y = 0..90) ─────────────────────────────────
    // Pin icon
    drawPinIcon(ctx, 28, 42, 32)

    // "PinQuest" title
    ctx.font = `bold 22px ${font}`
    ctx.fillStyle = textPrim
    ctx.textAlign = 'left'
    ctx.fillText('PinQuest', 52, 38)

    // Date
    ctx.font = `13px ${font}`
    ctx.fillStyle = textMuted
    ctx.fillText(formatDate(dateStr), 52, 58)

    // Score (right-aligned)
    const scoreStr = totalScore.toLocaleString()
    ctx.font = `bold 30px ${font}`
    ctx.fillStyle = accent
    ctx.textAlign = 'right'
    ctx.fillText(scoreStr, W - 24, 42)

    ctx.font = `13px ${font}`
    ctx.fillStyle = textMuted
    ctx.fillText('/ 5,000', W - 24, 62)

    ctx.textAlign = 'left'

    // ── MINI MAP (y = 90..270) ─────────────────────────────
    ctx.fillStyle = mapBg
    ctx.fillRect(0, MAP_Y, W, MAP_H)

    // Continent outlines
    ctx.fillStyle = contFill
    allContinents.forEach((pts) => drawContinent(ctx, pts))

    // Clamp a point to the map rectangle
    const clampX = (x: number) => Math.max(4, Math.min(W - 4, x))
    const clampY = (y: number) => Math.max(MAP_Y + 4, Math.min(MAP_Y + MAP_H - 4, y))

    // Draw connecting lines first (under dots)
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 1.5
    ctx.strokeStyle = '#ef4444'
    results.forEach((result) => {
      const loc = locations.find((l) => l.id === result.locationId)
      if (!loc) return
      const gx = clampX(lngToX(result.guessLng))
      const gy = clampY(latToMapY(result.guessLat))
      const lx = clampX(lngToX(loc.longitude))
      const ly = clampY(latToMapY(loc.latitude))
      ctx.beginPath()
      ctx.moveTo(gx, gy)
      ctx.lineTo(lx, ly)
      ctx.stroke()
    })
    ctx.setLineDash([])

    // Draw correct location dots (blue)
    results.forEach((result) => {
      const loc = locations.find((l) => l.id === result.locationId)
      if (!loc) return
      const x = clampX(lngToX(loc.longitude))
      const y = clampY(latToMapY(loc.latitude))
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = accent
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = 'white'
      ctx.stroke()
    })

    // Draw guess dots (yellow)
    results.forEach((result) => {
      const x = clampX(lngToX(result.guessLng))
      const y = clampY(latToMapY(result.guessLat))
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#FBBF24'
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = 'white'
      ctx.stroke()
    })

    // Map border
    ctx.strokeStyle = cardBord
    ctx.lineWidth = 1
    ctx.strokeRect(0, MAP_Y, W, MAP_H)

    // ── EMOJI GRID (y = 270..440) ──────────────────────────
    const gridY = MAP_Y + MAP_H + 16

    // Section label
    ctx.font = `bold 11px ${font}`
    ctx.fillStyle = textMuted
    ctx.letterSpacing = '0.08em'
    ctx.fillText('ROUND SCORES', 24, gridY + 16)
    ctx.letterSpacing = '0em'

    const rowStartY = gridY + 36
    const rowSpacing = 26
    const circleR = 8
    const circleSpacing = 22
    const circlesStartX = 60

    results.forEach((result, i) => {
      const y = rowStartY + i * rowSpacing

      // Round number
      ctx.font = `bold 13px ${font}`
      ctx.fillStyle = textMuted
      ctx.textAlign = 'left'
      ctx.fillText(`${i + 1}`, 26, y + 4)

      // Colored circles
      const colors = getCircleColors(result.pointsBase, isDark)
      colors.forEach((color, j) => {
        const cx = circlesStartX + j * circleSpacing
        ctx.beginPath()
        ctx.arc(cx, y, circleR, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      })
    })

    ctx.textAlign = 'left'

    // ── LEGEND (inline, right of emoji grid) ──────────────
    const legendX = circlesStartX + 5 * circleSpacing + 16
    const legendY = rowStartY

    ctx.font = `11px ${font}`
    ctx.fillStyle = textMuted

    // Guess dot
    ctx.beginPath()
    ctx.arc(legendX + 6, legendY, 5, 0, Math.PI * 2)
    ctx.fillStyle = '#FBBF24'
    ctx.fill()
    ctx.fillStyle = textMuted
    ctx.fillText('guess', legendX + 14, legendY + 4)

    // Correct dot
    ctx.beginPath()
    ctx.arc(legendX + 6, legendY + 20, 5, 0, Math.PI * 2)
    ctx.fillStyle = accent
    ctx.fill()
    ctx.fillStyle = textMuted
    ctx.fillText('correct', legendX + 14, legendY + 24)

    // ── FOOTER (y = 470..520) ──────────────────────────────
    const footerY = H - 28

    // Divider
    ctx.strokeStyle = cardBord
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(24, H - 60)
    ctx.lineTo(W - 24, H - 60)
    ctx.stroke()

    // Streak
    if (dayStreak > 0) {
      ctx.font = `bold 14px ${font}`
      ctx.fillStyle = accent
      ctx.textAlign = 'left'
      ctx.fillText(`🔥 ${dayStreak}-day streak`, 24, footerY)
    }

    // Site URL
    ctx.font = `13px ${font}`
    ctx.fillStyle = textMuted
    ctx.textAlign = 'right'
    ctx.fillText('pinquest.app', W - 24, footerY)

    ctx.textAlign = 'left'

    return canvas
  } catch {
    return null
  }
}

// Convert canvas → Blob → share or download
export async function shareOrDownloadImage(
  canvas: HTMLCanvasElement,
  dateStr: string,
  fallbackText: string,
): Promise<'shared' | 'downloaded' | 'text' | 'error'> {
  try {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    )
    if (!blob) throw new Error('no blob')

    const file = new File([blob], `pinquest-${dateStr}.png`, { type: 'image/png' })

    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: fallbackText })
      return 'shared'
    }

    // Download fallback
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pinquest-${dateStr}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Also copy text to clipboard quietly
    navigator.clipboard?.writeText(fallbackText).catch(() => {})

    return 'downloaded'
  } catch {
    // Last resort: plain text clipboard
    try {
      await navigator.clipboard.writeText(fallbackText)
      return 'text'
    } catch {
      return 'error'
    }
  }
}
