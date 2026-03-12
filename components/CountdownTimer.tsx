'use client'

import { useEffect, useState } from 'react'

function getMsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function CountdownTimer() {
  const [remaining, setRemaining] = useState(getMsUntilMidnight)

  useEffect(() => {
    const id = setInterval(() => {
      const ms = getMsUntilMidnight()
      setRemaining(ms)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-center">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">
        Next challenge in
      </p>
      <p className="text-3xl font-black text-gray-800 tabular-nums tracking-tight">
        {formatMs(remaining)}
      </p>
    </div>
  )
}
