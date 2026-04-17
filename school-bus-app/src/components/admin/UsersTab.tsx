'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, UserPlus, Search, Bus, AlertCircle } from 'lucide-react'

interface User { id: string; name: string; email: string; role: string; phone?: string; bus?: { plateNumber: string } }

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'badge-danger', SUPER_ADMIN: 'badge-danger', SCHOOL_ADMIN: 'badge-warning',
  DRIVER: 'badge-info', PARENT: 'badge-success'
}

const defaultForm = { name:'', email:'', password:'', phone:'', role:'DRIVER' }

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('ALL')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success'|'error'>('success')

  const loadUsers = () => {
    fetch('/api/admin/users').then(r => r.json())
      .then(data => { setUsers(data.users || []); setLoading(false) })
      .catch(console.error)
  }

  useEffect(() => { loadUsers() }, [])

  const showToast = (msg: string, type: 'success'|'error'='success') => { setToast(msg); setToastType(type); setTimeout(() => setToast(''), 3000) }

  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) {
      showToast('Name, Email and Password are required', 'error'); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        showToast('User created successfully!', 'success')
        setShowModal(false); setForm(defaultForm); loadUsers()
      } else {
        const err = await res.json()
        showToast((err.error || 'Failed to create user'), 'error')
      }
    } catch { showToast('Network error', 'error') } finally { setSaving(false) }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'ALL' || u.role === filterRole
    return matchSearch && matchRole
  })

  if (loading) return (
    <div className="glass-panel" style={{ padding:'2rem' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:60, marginBottom:12, borderRadius:10 }} />)}
    </div>
  )

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'0.875rem 1.5rem', display:'flex', alignItems:'center', gap:'0.75rem',
              background: toastType === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border:`1px solid ${toastType === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              borderRadius:12, color:'var(--text-main)', fontWeight:500, backdropFilter:'blur(12px)' }}>
            {toastType === 'error' ? <AlertTriangle size={18} color="var(--danger)"/> : <CheckCircle size={18} color="var(--success)"/>}
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel" style={{ padding:'2rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h3 style={{ margin:0 }}>System Users</h3>
            <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginTop:4 }}>{users.length} users registered</div>
          </div>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            className="btn btn-primary" onClick={() => { setShowModal(true); setForm(defaultForm) }}>
            + Add Driver / User
          </motion.button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:180 }}>
            <Search size={18} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
            <input className="input-field" placeholder="Search name or email…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>
          <select className="select-field" value={filterRole} onChange={e => setFilterRole(e.target.value)}
            style={{ width:'auto', flex:'0 0 140px' }}>
            <option value="ALL">All Roles</option>
            {['ADMIN','DRIVER','PARENT','SCHOOL_ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
          {[['Admins','ADMIN','red'],['Drivers','DRIVER','blue'],['Parents','PARENT','green']].map(([label, role, color]) => (
            <div key={label} className={`stat-card ${color}`} style={{ padding:'0.75rem 1rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:800 }}>{users.filter(u => u.role.includes(role as string)).length}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'grid', gap:'0.75rem' }}>
          {filtered.map(u => (
            <motion.div key={u.id} whileHover={{ backgroundColor:'rgba(255,255,255,0.04)' }}
              style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'1rem 1.25rem', background:'rgba(255,255,255,0.02)',
                borderRadius:12, border:'1px solid var(--surface-border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                <div style={{ width:40, height:40, borderRadius:'50%',
                  background: u.role === 'DRIVER' ? 'var(--info-bg)' : u.role.includes('ADMIN') ? 'var(--danger-bg)' : 'var(--success-bg)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'1rem',
                  color: u.role === 'DRIVER' ? 'var(--info)' : u.role.includes('ADMIN') ? 'var(--danger)' : 'var(--success)' }}>
                  {u.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>{u.name}</div>
                  <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                    {u.email} {u.phone && `· ${u.phone}`}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                {u.role === 'PARENT' && (
                  <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={async () => {
                      showToast('⏳ Generating invoice...');
                      try {
                        const res = await fetch('/api/billing/generate', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ parentId: u.id, amount: 150 }) // Mock flat fee RM150
                        });
                        if (res.ok) {
                           const data = await res.json();
                           showToast(`✅ Invoice Created! (ID: ${data.payment.bukkuInvoiceId})`);
                        } else throw new Error("Failed");
                      } catch { showToast('❌ Failed to generate Bukku invoice'); }
                    }}
                    className="badge" style={{ background: 'var(--primary)', color: 'white', cursor: 'pointer', border: 'none' }}>
                    💰 Generate Invoice (Bukku)
                  </motion.button>
                )}
                {u.bus && <span className="badge badge-warning" style={{ display:'flex', alignItems:'center', gap:4 }}><Bus size={12}/> {u.bus.plateNumber}</span>}
                <span className={`badge ${ROLE_COLORS[u.role] || 'badge-pending'}`}>
                  {u.role.replace('_',' ')}
                </span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>No users found.</div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div className="modal-box" initial={{ opacity:0, scale:0.9, y:30 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h3 style={{ margin:0, display:'flex', alignItems:'center', gap:8 }}><UserPlus size={20}/> Add New User</h3>
                <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'1.5rem', cursor:'pointer' }}>✕</button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="input-group" style={{ gridColumn:'1/-1' }}>
                  <label className="input-label">Full Name *</label>
                  <input className="input-field" placeholder="Full name" value={form.name}
                    onChange={e => setForm(p => ({...p, name:e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email *</label>
                  <input type="email" className="input-field" placeholder="user@school.com" value={form.email}
                    onChange={e => setForm(p => ({...p, email:e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone</label>
                  <input className="input-field" placeholder="+1 555 000 0000" value={form.phone}
                    onChange={e => setForm(p => ({...p, phone:e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Role *</label>
                  <select className="select-field" value={form.role} onChange={e => setForm(p => ({...p, role:e.target.value}))}>
                    <option value="DRIVER">Driver</option>
                    <option value="PARENT">Parent</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SCHOOL_ADMIN">School Admin</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Password *</label>
                  <input type="password" className="input-field" placeholder="Temporary password" value={form.password}
                    onChange={e => setForm(p => ({...p, password:e.target.value}))} />
                </div>
              </div>

              <div style={{ background:'rgba(29, 78, 216, 0.05)', border:'1px solid rgba(29, 78, 216, 0.2)', borderRadius:8, padding:'0.75rem 1rem', marginTop:'0.75rem', fontSize:'0.85rem', color:'var(--info)', display:'flex', gap:8, alignItems:'center' }}>
                <AlertCircle size={16}/> For drivers, assign them to a bus in Fleet & Routes after creation.
              </div>

              <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem' }}>
                <button className="btn" style={{ flex:1, background:'rgba(255,255,255,0.06)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  className="btn btn-primary" style={{ flex:2 }}
                  onClick={handleSave} disabled={saving}>
                  {saving ? 'Creating…' : '✓  Create User'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
