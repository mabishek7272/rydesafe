import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Image from 'next/image'
import './globals.css'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TrackBuddy — Smart School Bus Tracker',
  description: 'Real-time school bus tracking, attendance, and parent notifications — all in one place.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/trackbuddy.png', type: 'image/png' },
    ],
    apple: '/trackbuddy.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="container">
          <nav className="main-nav" style={{
            padding: '1rem 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--surface-border)',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* TrackBuddy logo */}
              <div style={{
                width: 42, height: 42, borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(255,209,0,0.35)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#1e1b4b,#312e81)'
              }}>
                <Image
                  src="/trackbuddy.png"
                  alt="TrackBuddy Logo"
                  width={42}
                  height={42}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  priority
                />
              </div>
              <span className="tb-brand">TrackBuddy</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', minWidth: 'min-content' }}>
              <div style={{ fontWeight: 600, color: 'var(--bus-yellow)' }}>🏫 School Bus Management</div>
              <div style={{ marginTop: 2 }}>Real-time tracking &amp; safety</div>
            </div>
          </nav>
          <main><Providers>{children}</Providers></main>
        </div>
      </body>
    </html>
  )
}
