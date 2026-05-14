'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut, 
  Activity,
  ShieldCheck
} from 'lucide-react'
import styles from './layout.module.css'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then(data => {
        if (data.user?.role !== 'SUPER_ADMIN') {
          router.push('/admin') // Fallback to existing admin
          return
        }
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        router.push('/')
      })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'POST' })
    router.push('/')
  }

  if (loading) return (
    <div className={styles.loadingOverlay}>
      <div className={styles.spinner} />
    </div>
  )

  const navItems = [
    { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
    { name: 'Organisations', href: '/super-admin/organisations', icon: Building2 },
    { name: 'Global Users', href: '/super-admin/users', icon: Users },
    { name: 'System Logs', href: '/super-admin/logs', icon: Activity },
    { name: 'Settings', href: '/super-admin/settings', icon: Settings },
  ]

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <ShieldCheck size={20} color="white" />
          </div>
          <span className={styles.logoText}>
            TrackBuddy<span className={styles.logoTag}>Super</span>
          </span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {user?.name?.[0] || 'S'}
            </div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className={styles.logoutBtn}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  )
}
