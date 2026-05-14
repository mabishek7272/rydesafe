'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Truck,
  Building2,
  ShieldCheck,
  Calendar,
  ClipboardList,
  GraduationCap,
  Activity
} from 'lucide-react'
import styles from './layout.module.css'

interface User {
  name: string
  email: string
  role: string
  org?: string
}

export default function OrgAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          // Ensure they are at least an ORG_ADMIN or higher
          if (['SUPER_ADMIN', 'ORG_ADMIN'].includes(data.user.role)) {
            setUser(data.user)
          } else {
            router.push('/login')
          }
        } else {
          router.push('/login')
        }
      } catch (err) {
        console.error('Failed to fetch user', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/org-dashboard' },
    { name: 'Branches', icon: MapPin, href: '/branches' },
    { name: 'Students', icon: GraduationCap, href: '/students' },
    { name: 'Fleet', icon: Truck, href: '/fleet' },
    { name: 'Schedules', icon: Calendar, href: '/schedules' },
    { name: 'Live Dispatch', icon: Activity, href: '/dispatch' },
    { name: 'Staff & Drivers', icon: Users, href: '/staff' },
    { name: 'Reports & Logs', icon: ClipboardList, href: '/reports' },
    { name: 'System Settings', icon: Settings, href: '/settings' },
  ]

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff'
      }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <ShieldCheck size={32} />
          <span>TrackBuddy <b>Org</b></span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.orgBadge}>
            <Building2 size={14} style={{ marginRight: '6px' }} />
            Active Organisation
          </div>

          <div className={styles.userProfile}>
            <div className={styles.searchBox} style={{ 
              position: 'relative', 
              marginRight: '1.5rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="Search staff, routes..." 
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '100px',
                  padding: '0.5rem 1rem 0.5rem 2.5rem',
                  color: '#fff',
                  width: '240px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <button style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#94a3b8', 
              cursor: 'pointer',
              marginRight: '1rem'
            }}>
              <Bell size={20} />
            </button>

            <div className={styles.avatar}>
              {user?.name?.[0] || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.role.replace('_', ' ')}</span>
            </div>
          </div>
        </header>

        <section className={styles.content}>
          {children}
        </section>
      </main>
    </div>
  )
}
