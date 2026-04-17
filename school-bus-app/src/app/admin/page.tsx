'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import OverviewTab from '@/components/admin/OverviewTab'
import UsersTab from '@/components/admin/UsersTab'
import StudentsTab from '@/components/admin/StudentsTab'
import FleetTab from '@/components/admin/FleetTab'
import LiveTripsTab from '@/components/admin/LiveTripsTab'
import MessagesTab from '@/components/admin/MessagesTab'
import AnalyticsTab from '@/components/admin/AnalyticsTab'
import ScheduleTab from '@/components/admin/ScheduleTab'
import MaintenanceTab from '@/components/admin/MaintenanceTab'
import LostFoundTab from '@/components/admin/LostFoundTab'
import AnnouncementsTab from '@/components/admin/AnnouncementsTab'
import TripHistoryTab from '@/components/admin/TripHistoryTab'
import RouteOptimizationTab from '@/components/admin/RouteOptimizationTab'
import AcademicCalendarTab from '@/components/admin/AcademicCalendarTab'
import { LanguageSwitcher } from '@/i18n/provider'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('OVERVIEW')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then(data => {
        setCurrentUserRole(data.user?.role || '')
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Loading admin dashboard...</div>

  const tabs = [
    { id: 'OVERVIEW', label: 'Overview' },
    { id: 'ANALYTICS', label: 'Analytics' },
    { id: 'USERS', label: 'Users' },
    { id: 'STUDENTS', label: 'Students' },
    { id: 'FLEET', label: 'Fleet' },
    { id: 'LIVETRIPS', label: 'Live Trips' },
    { id: 'HISTORY', label: 'Trip History' },
    { id: 'SCHEDULE', label: 'Schedule' },
    { id: 'MAINTENANCE', label: 'Maintenance' },
    { id: 'LOSTFOUND', label: 'Lost & Found' },
    { id: 'ANNOUNCEMENTS', label: 'Announce' },
    { id: 'OPTIMIZE', label: 'AI Optimize' },
    { id: 'MESSAGES', label: 'Messages' },
    { id: 'CALENDAR', label: 'Academic Calendar' }
  ]

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="admin-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ minWidth: '200px' }}>
          <h1 style={{ marginBottom: '0.25rem', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>CRM and Fleet Management System</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="btn"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.5rem 1.25rem' }}
        >
          Logout
        </motion.button>
        <LanguageSwitcher />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'OVERVIEW' && <OverviewTab currentUserRole={currentUserRole} />}
          {activeTab === 'ANALYTICS' && <AnalyticsTab />}
          {activeTab === 'USERS' && <UsersTab />}
          {activeTab === 'STUDENTS' && <StudentsTab />}
          {activeTab === 'FLEET' && <FleetTab />}
          {activeTab === 'LIVETRIPS' && <LiveTripsTab />}
          {activeTab === 'HISTORY' && <TripHistoryTab />}
          {activeTab === 'SCHEDULE' && <ScheduleTab />}
          {activeTab === 'MAINTENANCE' && <MaintenanceTab />}
          {activeTab === 'LOSTFOUND' && <LostFoundTab />}
          {activeTab === 'ANNOUNCEMENTS' && <AnnouncementsTab />}
          {activeTab === 'OPTIMIZE' && <RouteOptimizationTab />}
          {activeTab === 'MESSAGES' && <MessagesTab />}
          {activeTab === 'CALENDAR' && <AcademicCalendarTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
