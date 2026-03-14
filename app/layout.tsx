import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'PinQuest — Daily Geography Challenge',
  description: 'A location guessing game where you drop pins on a world map to find famous places.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'PinQuest',
    statusBarStyle: 'default',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📍</text></svg>",
    apple: '/api/icon/180',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#38BDF8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-white dark:bg-[#0f1923] transition-colors duration-200">
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
