import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FleetTab() {
    const [buses, setBuses] = useState<any[]>([])
    const [routes, setRoutes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
    const [routeStops, setRouteStops] = useState<any[]>([])
    const [newStop, setNewStop] = useState({ name: '', latitude: '', longitude: '' })

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/buses').then(res => res.json()),
            fetch('/api/admin/routes').then(res => res.json())
        ]).then(([busData, routeData]) => {
            setBuses(busData.buses || [])
            setRoutes(routeData.routes || [])
            setLoading(false)
        }).catch(console.error)
    }, [])

    const loadStops = async (routeId: string) => {
        const res = await fetch(`/api/stops?routeId=${routeId}`)
        const data = await res.json()
        setRouteStops(data.stops || [])
        setSelectedRouteId(routeId)
    }

    const handleAddStop = async () => {
        if (!newStop.name || !selectedRouteId) return
        try {
            const res = await fetch('/api/stops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    routeId: selectedRouteId,
                    name: newStop.name,
                    latitude: parseFloat(newStop.latitude) || 0,
                    longitude: parseFloat(newStop.longitude) || 0,
                    order: routeStops.length + 1
                })
            })
            if (res.ok) {
                setNewStop({ name: '', latitude: '', longitude: '' })
                loadStops(selectedRouteId)
            }
        } catch (e) { console.error(e) }
    }

    if (loading) return <div>Loading fleet...</div>

    return (
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Fleet (Buses)</h3>
                    <button className="btn btn-primary" onClick={() => alert('Add Bus UI pending')}>+ Add Bus</button>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {buses.map(b => (
                        <div key={b.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{b.plateNumber}</strong>
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{b.status}</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Capacity: {b.capacity} | Driver: {b.driver?.name || 'Unassigned'}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Routes</h3>
                    <button className="btn btn-primary" onClick={() => alert('Add Route UI pending')}>+ Add Route</button>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {routes.map(r => (
                        <div key={r.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>{r.name}</strong>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Morning: {r.morningTime || 'N/A'} | Afternoon: {r.afternoonTime || 'N/A'}</span>
                                <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)' }} onClick={() => selectedRouteId === r.id ? setSelectedRouteId(null) : loadStops(r.id)}>
                                    {selectedRouteId === r.id ? 'Hide Stops' : 'Manage Stops'}
                                </button>
                            </div>

                            <AnimatePresence>
                                {selectedRouteId === r.id && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginTop: '1rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
                                        <h4 style={{ margin: '0 0 1rem 0' }}>Route Stops</h4>
                                        {routeStops.map((s, idx) => (
                                            <div key={s.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{idx + 1}</div>
                                                <div style={{ flex: 1 }}>{s.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>[{s.latitude}, {s.longitude}]</div>
                                            </div>
                                        ))}

                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                            <input type="text" placeholder="Stop Name" className="input-field" style={{ marginBottom: 0, padding: '0.5rem', flex: 1 }} value={newStop.name} onChange={e => setNewStop({ ...newStop, name: e.target.value })} />
                                            <button className="btn btn-success" style={{ padding: '0.5rem 1rem' }} onClick={handleAddStop}>Add Stop</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
