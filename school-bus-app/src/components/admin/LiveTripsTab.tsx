import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface LiveTrip {
    id: string; date: string; status: string
    route: { name: string }; driver: { name: string }
    bus?: { plateNumber: string }
}

export default function LiveTripsTab() {
    const [trips, setTrips] = useState<LiveTrip[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTrips = useCallback(async () => {
        try {
            const res = await fetch('/api/trips')
            const data = await res.json()
            setTrips(data.trips || [])
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }, [])

    useEffect(() => {
        fetchTrips()
        const interval = setInterval(fetchTrips, 5000) // Poll every 5s for MVP
        return () => clearInterval(interval)
    }, [fetchTrips])

    if (loading) return <div>Loading live telemetry...</div>

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0 }}>Live Control Center</h2>
                <div>
                    <span className="badge" style={{ background: 'var(--warning)', color: 'black' }}>Polling Active</span>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
                {trips.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No active trips found.</p>}

                {trips.map(trip => (
                    <motion.div key={trip.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>{trip.route.name}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(trip.date).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <span className={`badge ${trip.status === 'TRIP_COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                                    {trip.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Driver</div>
                                <div style={{ fontWeight: 'bold' }}>{trip.driver.name}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Bus</div>
                                <div style={{ fontWeight: 'bold' }}>{trip.bus?.plateNumber || 'TBD'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Tracking Source</div>
                                <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>HYBRID (Mobile + Katsana)</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>GPS Confidence</div>
                                <div style={{ fontWeight: 'bold', color: 'var(--success)' }}>High (98%)</div>
                            </div>
                        </div>

                        {trip.status !== 'TRIP_COMPLETED' && (
                            <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status Check</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>Live Updates</span>
                                </div>
                                <div style={{ fontSize: '0.9rem' }}>
                                    Track driver coordinates or ping driver device here...
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
