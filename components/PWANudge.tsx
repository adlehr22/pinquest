'use client'

import { useEffect, useState } from 'react'
import { isPwaPromptDismissed, dismissPwaPrompt } from '@/utils/storage'

export default function PWANudge() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isDismissed = isPwaPromptDismissed()
    setIsIOS(/iPhone|iPad/i.test(navigator.userAgent))

    if (isMobile && !isStandalone && !isDismissed) {
      const t = setTimeout(() => setShow(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe pb-6">
      <div className="bg-white dark:bg-[#162130] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#1e3a4a] p-4 space-y-2 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-sky-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="16" height="24">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24S24 20.25 24 12C24 5.373 18.627 0 12 0z" fill="white" />
              <circle cx="12" cy="12" r="5" fill="#38BDF8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">Add PinQuest to Home Screen</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">
              {isIOS
                ? 'Tap Share ↑ then "Add to Home Screen" for the best experience.'
                : 'Tap menu ⋮ then "Install app" for the best experience.'}
            </p>
          </div>
          <button
            onClick={() => { dismissPwaPrompt(); setShow(false) }}
            className="text-gray-300 dark:text-slate-600 text-xl font-bold flex-shrink-0 w-7 h-7 flex items-center justify-center"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
