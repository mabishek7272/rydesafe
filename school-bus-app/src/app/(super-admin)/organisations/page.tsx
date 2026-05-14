'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Plus, 
  MoreVertical, 
  ExternalLink, 
  Search,
  Filter,
  Users,
  MapPin,
  TrendingUp
} from 'lucide-react'
import styles from './page.module.css'

interface Organisation {
  id: string
  name: string
  type: 'SCHOOL' | 'CORPORATE' | 'FACTORY' | 'CHARTER'
  createdAt: string
  _count: {
    users: number
    passengers: number
    branches: number
  }
}

export default function OrganisationsPage() {
  const [orgs, setOrgs] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetch('/api/organisations')
      .then(res => res.json())
      .then(data => {
        setOrgs(data.organisations || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch orgs:', err)
        setLoading(false)
      })
  }, [])

  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Organisations</h1>
          <p className={styles.subtitle}>Manage tenants and global transportation partners</p>
        </div>
        <button className={styles.btnPrimary}>
          <Plus size={20} />
          <span>New Organisation</span>
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Tenants</p>
          <p className={styles.statValue}>{orgs.length}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Active Branches</p>
          <p className={styles.statValue}>
            {orgs.reduce((acc, org) => acc + org._count.branches, 0)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Passengers</p>
          <p className={styles.statValue}>
            {orgs.reduce((acc, org) => acc + org._count.passengers, 0)}
          </p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Search organisations..." 
              className="input-field" // Using global class if available, or style it here
              style={{ paddingLeft: '3rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '10px', color: 'white', width: '100%', height: '42px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles.actionBtn}>
            <Filter size={18} />
          </button>
        </div>

        {loading ? (
          <div className={styles.emptyState}>Loading organisations...</div>
        ) : filteredOrgs.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No organisations found</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Type</th>
                <th>Branches</th>
                <th>Users</th>
                <th>Passengers</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div className={styles.orgName}>{org.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {org.id.slice(0, 8)}...</div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${
                      org.type === 'SCHOOL' ? styles.badgeSchool : 
                      org.type === 'CORPORATE' ? styles.badgeCorporate : 
                      styles.badgeFactory
                    }`}>
                      {org.type}
                    </span>
                  </td>
                  <td><span className={styles.count}>{org._count.branches}</span></td>
                  <td><span className={styles.count}>{org._count.users}</span></td>
                  <td><span className={styles.count}>{org._count.passengers}</span></td>
                  <td>{new Date(org.createdAt).toLocaleDateString()}</td>
                  <td className={styles.actions}>
                    <button className={styles.actionBtn} title="View Details">
                      <ExternalLink size={16} />
                    </button>
                    <button className={styles.actionBtn} title="More Options">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  )
}
