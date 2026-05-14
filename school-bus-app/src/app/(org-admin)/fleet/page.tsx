'use client'

import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  Search, 
  Truck, 
  Users, 
  ShieldCheck, 
  Tool, 
  AlertTriangle,
  ChevronRight,
  Loader2,
  Calendar,
  Settings2
} from 'lucide-react'
import styles from './fleet.module.css'
import { Modal } from '@/components/org-admin/Modal'
import { VehicleForm } from '@/components/org-admin/VehicleForm'

interface Vehicle {
  id: string
  plateNumber: string
  make: string | null
  model: string | null
  capacity: number
  status: string
  vehicleAssignments: {
    driver: {
      user: { name: string }
    }
  }[]
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/vehicles')
      if (!res.ok) throw new Error('Failed to fetch fleet')
      const data = await res.json()
      setVehicles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = vehicles.filter(v => 
    v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.make || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader2 className="animate-spin" size={40} />
        <p>Syncing fleet data...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fleet Inventory</h1>
          <p className={styles.subtitle}>Track vehicle status, capacity, and active driver assignments.</p>
        </div>
        <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Register Vehicle
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by plate number, make..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.statsOverview}>
          <div className={styles.miniStat}>
            <span className={styles.statLabel}>Active</span>
            <span className={styles.statValue}>{vehicles.filter(v => v.status === 'ACTIVE').length}</span>
          </div>
          <div className={styles.miniStat}>
            <span className={styles.statLabel}>Service</span>
            <span className={styles.statValue}>{vehicles.filter(v => v.status === 'MAINTENANCE').length}</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.map((vehicle) => (
          <div key={vehicle.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.busIcon}>
                <Truck size={24} />
              </div>
              <div className={styles.busInfo}>
                <h3>{vehicle.plateNumber}</h3>
                <span className={styles.model}>{vehicle.make} {vehicle.model}</span>
              </div>
              <div className={`${styles.statusBadge} ${styles[vehicle.status.toLowerCase()]}`}>
                {vehicle.status}
              </div>
            </div>

            <div className={styles.details}>
              <div className={styles.detailRow}>
                <Users size={14} />
                <span>Capacity: <b>{vehicle.capacity}</b> seats</span>
              </div>
              <div className={styles.detailRow}>
                <Settings2 size={14} />
                <span>Driver: <b>{vehicle.vehicleAssignments?.[0]?.driver?.user?.name || 'Unassigned'}</b></span>
              </div>
            </div>

            <div className={styles.footer}>
              <button className={styles.detailsBtn}>
                Vehicle Details
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <Truck size={48} />
            <p>No vehicles registered in your fleet.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Register New Vehicle"
      >
        <VehicleForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchVehicles();
          }} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  )
}
