'use client'

import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  visible: boolean
  onHide: () => void
  duration?: number
}

export default function Toast({ message, visible, onHide, duration = 2500 }: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const t = setTimeout(() => {
        setShow(false)
        setTimeout(onHide, 300)
      }, duration)
      return () => clearTimeout(t)
    }
  }, [visible, duration, onHide])

  return (
    <div
      className={`
        fixed top-20 left-1/2 -translate-x-1/2 z-50
        bg-gray-900 text-white text-sm font-semibold
        px-5 py-3 rounded-2xl shadow-xl
        transition-all duration-300
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
      aria-live="polite"
    >
      {message}
    </div>
  )
}
