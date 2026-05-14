'use client'

import React, { useEffect, useState } from 'react'
import { 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  GraduationCap,
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Mail,
  User,
  Plus
} from 'lucide-react'
import styles from './students.module.css'
import { Modal } from '@/components/org-admin/Modal'
import { StudentForm } from '@/components/org-admin/StudentForm'
import { ImportModal } from "@/components/org-admin/ImportModal"
import { FileUp } from "lucide-react"

interface Passenger {
  id: string
  name: string
  grade: string | null
  pickupAddress: string | null
  active: boolean
  guardians: {
    name: string
    relationship: string
    phonePrimary: string | null
  }[]
  _count: {
    tripEvents: number
  }
}

export default function StudentsPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  useEffect(() => {
    fetchPassengers()
  }, [])

  const fetchPassengers = async () => {
    try {
      setIsLoading(true)
      // We'll use the new passengers API
      const res = await fetch('/api/passengers')
      if (!res.ok) throw new Error('Failed to fetch students')
      const data = await res.json()
      setPassengers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = passengers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.grade || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader2 className="animate-spin" size={40} />
        <p>Loading student directory...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Student Directory</h1>
          <p className={styles.subtitle}>Manage profiles, attendance history, and parent associations.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryBtn} onClick={handleExport}>
            <Download size={18} />
            Export Roster
          </button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              className={styles.secondaryBtn} 
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileUp size={18} />
              Bulk Import
            </button>
            <button className={styles.primaryBtn} onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Add Student
            </button>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by name, grade, or parent..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className={styles.filterBtn}>
          <Filter size={18} />
          Filters
        </button>
      </div>

      {error && (
        <div className={styles.errorCard}>
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Grade</th>
              <th>Primary Guardian</th>
              <th>Pickup Point</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const primaryGuardian = p.guardians?.[0]
              return (
                <tr key={p.id}>
                  <td>
                    <div className={styles.studentCell}>
                      <div className={styles.avatar}>
                        <User size={18} />
                      </div>
                      <div className={styles.studentInfo}>
                        <span className={styles.studentName}>{p.name}</span>
                        <span className={styles.studentId}>#{p.id.slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.gradeBadge}>
                      <GraduationCap size={14} />
                      {p.grade || 'N/A'}
                    </div>
                  </td>
                  <td>
                    {primaryGuardian ? (
                      <div className={styles.guardianInfo}>
                        <span className={styles.guardianName}>{primaryGuardian.name}</span>
                        <span className={styles.guardianPhone}>
                          <Phone size={10} />
                          {primaryGuardian.phonePrimary}
                        </span>
                      </div>
                    ) : (
                      <span className={styles.unlinked}>Unlinked</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.addressCell}>
                      <MapPin size={14} />
                      <span>{p.pickupAddress || 'Not set'}</span>
                    </div>
                  </td>
                  <td>
                    <span className={p.active ? styles.activeBadge : styles.inactiveBadge}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className={styles.rowAction}>
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <p>No students found matching your criteria.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Enroll New Student"
      >
        <StudentForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPassengers();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Students"
      >
        <ImportModal
          onSuccess={() => {
            setIsImportModalOpen(false);
            fetchPassengers();
          }}
          onCancel={() => setIsImportModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
