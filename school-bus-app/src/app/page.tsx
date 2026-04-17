'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Redirect based on role
      const role = data.user.role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN') {
        router.push('/admin')
      } else if (role === 'DRIVER') {
        router.push('/driver')
      } else if (role === 'PARENT') {
        router.push('/parent')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut' as any
      }
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bus-theme-container"
        style={{
          display: 'flex',
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '960px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          .bus-theme-container { flex-direction: row; }
          @media (max-width: 768px) {
            .bus-theme-container { flex-direction: column !important; }
          }
          .bus-btn {
            background-color: #FFD100 !important;
            color: #111827 !important;
            font-weight: 700 !important;
            box-shadow: 0 4px 14px 0 rgba(255, 209, 0, 0.4) !important;
            border: none;
          }
          .bus-btn:hover {
            background-color: #F5A623 !important;
            transform: translateY(-2px);
          }
          .bus-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
          }
        `}} />

        {/* Left Side: Bus Illustration Panel */}
        <div style={{
          flex: '1.2',
          background: 'linear-gradient(135deg, #FFD100 0%, #F5A623 100%)',
          padding: '4rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* subtle background pattern */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 2px, transparent 2.5px)',
            backgroundSize: '20px 20px',
            opacity: 0.4
          }}></div>

          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
            style={{ zIndex: 1, background: '#111827', padding: '1.5rem', borderRadius: '50%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
          >
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FFD100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="18" rx="2" ry="2"></rect>
              <line x1="8" y1="16" x2="8.01" y2="16"></line>
              <line x1="16" y1="16" x2="16.01" y2="16"></line>
              <line x1="4" y1="11" x2="20" y2="11"></line>
              <polygon points="4 7 20 7 20 11 4 11 4 7"></polygon>
            </svg>
          </motion.div>

          <h1 style={{ marginTop: '2rem', color: '#111827', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', zIndex: 1, textShadow: '0 2px 10px rgba(255,255,255,0.3)' }}>
            Track Buddy
          </h1>
          <p style={{ color: 'rgba(17, 24, 39, 0.8)', fontSize: '1.1rem', fontWeight: 500, marginTop: '0.5rem', maxWidth: '80%', zIndex: 1 }}>
            The smart, safe, and premium way to manage your school&apos;s transport fleet.
          </p>
        </div>

        {/* Right Side: Login Form */}
        <div style={{ flex: '1', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'white', fontWeight: 700 }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-muted)' }}>Sign in to your dashboard</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.9rem', textAlign: 'center' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="email" style={{ color: '#E2E8F0' }}>Email Address</label>
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="driver@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.875rem 1rem' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="password" style={{ color: '#E2E8F0' }}>Password</label>
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.875rem 1rem' }}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn bus-btn"
              style={{ width: '100%', marginTop: '0.5rem', padding: '1rem', borderRadius: '12px', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </motion.button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Need access? <a href="#" style={{ color: '#FFD100', textDecoration: 'none', fontWeight: 600 }}>Contact Administrator</a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
