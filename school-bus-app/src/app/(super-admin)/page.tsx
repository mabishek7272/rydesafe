'use client'

import { motion } from 'framer-motion'
import { 
  Building2, 
  Users, 
  Activity, 
  ShieldCheck,
  Globe,
  Zap,
  Bell,
  CheckCircle2
} from 'lucide-react'
import styles from './organisations/page.module.css' // Reusing some styles

export default function SuperAdminDashboard() {
  const stats = [
    { label: 'Total Orgs', value: '12', icon: Building2, color: '#2E7D32' },
    { label: 'Global Users', value: '1,248', icon: Users, color: '#1E3A8A' },
    { label: 'System Uptime', value: '99.9%', icon: Activity, color: '#D97706' },
    { label: 'Active Trips', value: '84', icon: Zap, color: '#EAB308' },
  ]

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>System Overview</h1>
          <p className={styles.subtitle}>Global health monitoring and system statistics</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={styles.statCard}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className={styles.statLabel}>{stat.label}</p>
                <p className={styles.statValue}>{stat.value}</p>
              </div>
              <div style={{ backgroundColor: `${stat.color}15`, padding: '0.75rem', borderRadius: '12px', color: stat.color }}>
                <stat.icon size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className={styles.tableContainer} style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#2E7D32" />
            System Health
          </h3>
          <div style={{ spaceY: '1.5rem' }}>
            <HealthItem label="API Services" status="Operational" />
            <HealthItem label="Database Cluster" status="Operational" />
            <HealthItem label="GPS Relay Server" status="Operational" />
            <HealthItem label="Notification Workers" status="Operational" />
            <HealthItem label="Redis Cache" status="Operational" />
          </div>
        </div>

        <div className={styles.tableContainer} style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} color="#EAB308" />
            Recent Alerts
          </h3>
          <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>
            No critical system alerts
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function HealthItem({ label, status }: { label: string, status: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontSize: '0.85rem' }}>
        <CheckCircle2 size={16} />
        {status}
      </div>
    </div>
  )
}
