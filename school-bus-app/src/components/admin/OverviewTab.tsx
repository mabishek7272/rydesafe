'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Bus, AlertTriangle } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'

interface StudentRecord { id: string; name: string; grade: string; level: string; parentContact1: string; status: string; isSelfPickup: boolean }
interface TripRecord { id: string; status: string }
interface EmergencyRecord { id: string; timestamp: string; latitude?: number; longitude?: number; driver?: { name: string; phone?: string } }

export default function OverviewTab({ currentUserRole }: { currentUserRole: string }) {
    const [students, setStudents] = useState<StudentRecord[]>([])
    const [trips, setTrips] = useState<TripRecord[]>([])
    const [pickupTimes, setPickupTimes] = useState('')
    const [schoolName, setSchoolName] = useState('')
    const [emergencies, setEmergencies] = useState<EmergencyRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState('')
    const [toastType, setToastType] = useState<'success' | 'error'>('success')
    const prevEmergenciesLength = useRef(0)

    const { play: playAlert } = useAudio('/alert toon.mp3')

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast(msg); setToastType(type)
        setTimeout(() => setToast(''), 3500)
    }

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [studentsRes, settingsRes, emergencyRes, tripsRes, adminSettingsRes] = await Promise.all([
                    fetch('/api/students'),
                    fetch('/api/settings'),
                    fetch('/api/emergency'),
                    fetch('/api/trips'),
                    fetch('/api/admin/settings'),
                ])

                const studentsData = await studentsRes.json()
                const settingsData = await settingsRes.json()
                const emergencyData = await emergencyRes.json()
                const tripsData = await tripsRes.json()
                const adminSettings = await adminSettingsRes.json()

                const alertsLength = emergencyData.alerts?.length || 0
                if (alertsLength > prevEmergenciesLength.current && prevEmergenciesLength.current !== 0) {
                    playAlert()
                    showToast('🚨 New emergency alert received!', 'error')
                }
                prevEmergenciesLength.current = alertsLength

                setStudents(studentsData.students || [])
                setPickupTimes((settingsData.times || []).join(', '))
                setSchoolName(adminSettings.schoolName || 'TrackBuddy School')
                setEmergencies(emergencyData.alerts || [])
                setTrips(tripsData.trips || [])
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchAllData()
        const interval = setInterval(fetchAllData, 5000)
        return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleResolveEmergency = async (id: string) => {
        try {
            const res = await fetch(`/api/emergency/${id}`, { method: 'PATCH' })
            if (res.ok) {
                setEmergencies(emergencies.filter(e => e.id !== id))
                showToast('✅ Emergency resolved')
            } else {
                showToast('❌ Failed to resolve', 'error')
            }
        } catch { showToast('❌ Network error', 'error') }
    }

    const handleUpdateSettings = async () => {
        const timesArray = pickupTimes.split(',').map(t => t.trim()).filter(Boolean)
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ times: timesArray })
            })
            const schoolRes = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schoolName, pickupTimes: timesArray })
            })
            if (res.ok || schoolRes.ok) {
                showToast('✅ Settings updated successfully!')
            } else {
                showToast('❌ Failed to update settings', 'error')
            }
        } catch {
            showToast('❌ Network error', 'error')
        }
    }

    if (loading) return (
        <div className="glass-panel" style={{ padding: '2rem' }}>
            {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: i === 1 ? 80 : 56, marginBottom: 14, borderRadius: 12 }} />
            ))}
        </div>
    )

    // Computed real stats
    const activeTrips = trips.filter((t: TripRecord) => t.status !== 'TRIP_COMPLETED').length
    const presentStudents = students.filter((s: StudentRecord) => s.status === 'CHECKED_OUT').length

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
    }
    const cardVariants = {
        hidden: { opacity: 0, y: 24, scale: 0.96 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, bounce: 0.35, duration: 0.7 } }
    }

    return (
        <div>
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        style={{
                            position: 'fixed', top: 20, right: 20, zIndex: 9999, padding: '0.875rem 1.5rem',
                            background: toastType === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            border: `1px solid ${toastType === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                            borderRadius: 12, color: 'var(--text-main)', fontWeight: 600, backdropFilter: 'blur(12px)'
                        }}>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emergency alerts */}
            <AnimatePresence>
                {emergencies.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid #ef4444', padding: '1.5rem', borderRadius: 12, marginBottom: '2rem', overflow: 'hidden' }}>
                        <h2 style={{ color: '#ef4444', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1 }}>⚠️</motion.span>
                            ACTIVE EMERGENCIES ({emergencies.length})
                        </h2>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {emergencies.map(e => (
                                <motion.div layout key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 8 }}>
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '1.05rem' }}>
                                            Driver: {e.driver?.name || 'Unknown'} {e.driver?.phone ? `(${e.driver.phone})` : ''}
                                        </strong>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
                                            Triggered: {new Date(e.timestamp).toLocaleString()}<br />
                                            Location: {e.latitude && e.longitude ? `${e.latitude.toFixed(5)}, ${e.longitude.toFixed(5)}` : 'Unknown'}
                                        </div>
                                    </div>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        className="btn btn-success" onClick={() => handleResolveEmergency(e.id)}>
                                        ✓ Resolve
                                    </motion.button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Stats - Bento Grid */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="bento-grid" style={{ marginBottom: '2.5rem' }}>
                {[
                    { icon: '🧑‍🎓', label: 'Total Students',     val: students.length,                    color: 'var(--primary)' },
                    { icon: <CheckCircle size={24}/>, label: 'Checked In',         val: presentStudents,                    color: 'var(--success)' },
                    { icon: <Bus size={24}/>, label: 'Active Trips',       val: activeTrips,                        color: 'var(--bus-yellow)' },
                    { icon: <AlertTriangle size={24}/>, label: 'Open Emergencies',   val: emergencies.length,                  color: 'var(--danger)' },
                ].map(({ icon, label, val, color }) => (
                    <motion.div key={label} variants={cardVariants} className="bento-card"
                        style={{ textAlign: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{icon}</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 800, color }}>{val}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div variants={containerVariants} initial="hidden" animate="visible"
                style={{ display: 'grid', gap: '2rem', gridTemplateColumns: (currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN') ? '1fr 2fr' : '1fr' }}>

                {/* Settings panel — admin only */}
                {(currentUserRole === 'ADMIN' || currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'SCHOOL_ADMIN') && (
                    <motion.div variants={cardVariants} className="bento-card" style={{ padding: '2rem', alignSelf: 'start' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>⚙️ School Settings</h3>

                        <div className="input-group">
                            <label className="input-label">School Name</label>
                            <input type="text" className="input-field" value={schoolName}
                                onChange={e => setSchoolName(e.target.value)} placeholder="School name" />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Available Pickup Times</label>
                            <input type="text" className="input-field" value={pickupTimes}
                                onChange={e => setPickupTimes(e.target.value)} placeholder="e.g. 3:00 PM, 4:00 PM" />
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Comma-separated list of times</div>
                        </div>

                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleUpdateSettings} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                            💾 Save Settings
                        </motion.button>
                    </motion.div>
                )}

                {/* Students overview */}
                <motion.div variants={cardVariants} className="bento-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Students Overview</h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <span className="badge badge-success">{presentStudents} In</span>
                            <span className="badge badge-pending">{students.length - presentStudents} Out</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {students.slice(0, 15).map(student => (
                            <motion.div key={student.id} whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.02)',
                                    borderRadius: 10, border: '1px solid var(--surface-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%',
                                        background: 'linear-gradient(135deg,#4f46e5,#6366f1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{student.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {student.grade} · {student.parentContact1}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {student.isSelfPickup && <span className="badge badge-warning">Self-Pickup</span>}
                                    <span className={`badge ${student.status === 'CHECKED_OUT' ? 'badge-success' : 'badge-pending'}`}>
                                        {student.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                        {students.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                No students registered yet. Go to the Students tab to add some.
                            </div>
                        )}
                        {students.length > 15 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
                                ... and {students.length - 15} more. See the Students tab for the full list.
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}
