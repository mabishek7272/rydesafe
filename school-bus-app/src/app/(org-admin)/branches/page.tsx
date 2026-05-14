'use client'

import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  MapPin, 
  Users, 
  School, 
  Search, 
  MoreVertical,
  Navigation,
  ArrowUpRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import styles from './branches.module.css'
import { Modal } from '@/components/org-admin/Modal'
import { BranchForm } from '@/components/org-admin/BranchForm'

interface Branch {
  id: string
  name: string
  code: string
  address: string | null
  type: string
  _count: {
    users: number
    students: number
    trips: number
  }
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/branches')
      if (!res.ok) throw new Error('Failed to fetch branches')
      const data = await res.json()
      setBranches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader2 className="animate-spin" size={40} />
        <p>Loading branches...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Branches & Schools</h1>
          <p className={styles.subtitle}>Manage physical locations and departments across your organisation.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Add New Branch
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Filter by name or code..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className={styles.errorCard}>
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      )}

      <div className={styles.grid}>
        {filteredBranches.map((branch) => (
          <div key={branch.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.branchIcon}>
                <School size={24} />
              </div>
              <div className={styles.branchInfo}>
                <h3>{branch.name}</h3>
                <span className={styles.code}>{branch.code}</span>
              </div>
              <button className={styles.optionsBtn}>
                <MoreVertical size={18} />
              </button>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.location}>
                <MapPin size={14} />
                <span>{branch.address || 'No address set'}</span>
              </div>
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{branch._count.users}</span>
                <span className={styles.statLabel}>Users</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{branch._count.students}</span>
                <span className={styles.statLabel}>Students</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{branch._count.trips}</span>
                <span className={styles.statLabel}>Total Trips</span>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button className={styles.viewBtn}>
                View Dashboard
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {filteredBranches.length === 0 && !isLoading && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Navigation size={48} />
            </div>
            <h3>No branches found</h3>
            <p>Start by adding your first branch or school location.</p>
            <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
              <Plus size={20} />
              Add Branch
            </button>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Branch"
      >
        <BranchForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchBranches();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  )
}
