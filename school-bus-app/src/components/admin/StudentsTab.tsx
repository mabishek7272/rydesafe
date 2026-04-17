'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, UserPlus, Search, Bus, Check, X, Download, Plus } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Student {
  id: string; name: string; grade: string; level: string;
  parentContact1: string; parentContact2?: string;
  status: string; isSelfPickup: boolean;
  busId?: string; bus?: { plateNumber: string };
  route?: { name: string }; parent?: { name: string }
}

interface Route { id: string; name: string }

const defaultForm = {
  name: '', grade: '', level: '',
  parentContact1: '', parentContact2: '',
  isSelfPickup: false, routeId: '', parentId: ''
}

export default function StudentsTab() {
  const [students, setStudents] = useState<Student[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success'|'error'>('success')

  const loadStudents = () => {
    Promise.all([
      fetch('/api/students').then(r => r.json()),
      fetch('/api/admin/routes').then(r => r.json()),
    ]).then(([sData, rData]) => {
      setStudents(sData.students || [])
      setRoutes(rData.routes || [])
      setLoading(false)
    }).catch(console.error)
  }

  useEffect(() => { loadStudents() }, [])

  const showToast = (msg: string, type: 'success'|'error'='success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSave = async () => {
    if (!form.name || !form.grade || !form.parentContact1) {
      showToast('⚠️ Name, Grade and Primary Contact are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          grade: form.grade,
          level: form.level || 'Primary',
          parentContact1: form.parentContact1,
          parentContact2: form.parentContact2 || null,
          isSelfPickup: form.isSelfPickup,
          routeId: form.routeId || null,
        })
      })
      if (res.ok) {
        showToast('Student added successfully!', 'success'); setShowModal(false); setForm(defaultForm); loadStudents()
      } else {
        const e = await res.json(); showToast((e.error || 'Failed'), 'error')
      }
    } catch { showToast('Network error', 'error') } finally {
      setSaving(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Name', 'Grade', 'Level', 'Contact1', 'Status', 'Route'],
      ...students.map(s => [s.name, s.grade, s.level, s.parentContact1, s.status, s.route?.name || ''])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`; a.click()
    showToast('CSV exported!', 'success')
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.setTextColor(40)
    doc.text('Student Roster — RideSafe', 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(120)
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Total: ${students.length} students`, 14, 30)

    autoTable(doc, {
      startY: 38,
      head: [['#', 'Name', 'Grade', 'Level', 'Contact', 'Status', 'Route']],
      body: students.map((s, i) => [
        i + 1, s.name, s.grade, s.level, s.parentContact1,
        s.status.replace('_', ' '), s.route?.name || 'N/A'
      ]),
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 245, 250] },
    })

    doc.save(`students_${new Date().toISOString().split('T')[0]}.pdf`)
    showToast('PDF exported!', 'success')
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.grade.toLowerCase().includes(search.toLowerCase()) ||
    (s.parent?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      {[1,2,3,4].map(i => (
        <div key={i} className="skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 10 }} />
      ))}
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'0.875rem 1.5rem', display:'flex', alignItems:'center', gap:'0.75rem',
              background: toastType === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toastType === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              borderRadius:12, color:'var(--text-main)', fontWeight:500, backdropFilter:'blur(12px)' }}>
            {toastType === 'error' ? <AlertTriangle size={18} color="var(--danger)"/> : <CheckCircle size={18} color="var(--success)"/>}
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header row */}
      <div className="glass-panel" style={{ padding:'2rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h3 style={{ margin:0, fontSize:'1.3rem' }}>Student Roster</h3>
            <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginTop:4 }}>{students.length} students enrolled</div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
            <button className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid var(--surface-border)', display:'flex', alignItems:'center', gap:6 }}
              onClick={exportCSV}>
              <Download size={16}/> Export CSV
            </button>
            <button className="btn" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid var(--surface-border)', display:'flex', alignItems:'center', gap:6 }}
              onClick={exportPDF}>
              <Download size={16}/> Export PDF
            </button>
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              className="btn btn-primary" onClick={() => { setShowModal(true); setForm(defaultForm) }} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Plus size={16}/> Add Student
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:'1.5rem' }}>
            <Search size={18} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
            <input className="input-field" placeholder="Search name, phone, parent…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
        </div>

        {/* Students list */}
        <div style={{ display:'grid', gap:'0.75rem' }}>
          {filtered.map(s => (
            <motion.div key={s.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
              whileHover={{ scale:1.005, backgroundColor:'rgba(255,255,255,0.04)' }}
              style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'1rem 1.25rem', background:'rgba(255,255,255,0.02)',
                borderRadius:12, border:'1px solid var(--surface-border)', transition:'all 0.2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                <div style={{ width:40, height:40, borderRadius:'50%',
                  background:'linear-gradient(135deg,#FFD100,#F5A623)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:700, color:'#111', fontSize:'1rem', flexShrink:0 }}>
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight:600 }}>{s.name}</div>
                  <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                    {s.grade} · {s.level}
                    {s.parent && <span> · Parent: {s.parent.name}</span>}
                    {s.parentContact1 && <span> · 📞 {s.parentContact1}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
                {s.route && <span className="badge badge-info">🚌 {s.route.name}</span>}
                {s.isSelfPickup ? <span style={{ color:'var(--info)', display:'flex', alignItems:'center', gap:4 }}><Check size={14}/> Self Pickup</span> : <span style={{ color:'var(--bus-yellow)', display:'flex', alignItems:'center', gap:4 }}><Bus size={14}/> {s.busId ? s.bus?.plateNumber : 'No Bus'}</span>}
                <span className={`badge ${s.status === 'CHECKED_OUT' ? 'badge-success' : 'badge-pending'}`}>
                  {s.status.replace('_',' ')}
                </span>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
              {search ? `No students matching "${search}"` : 'No students registered yet. Add your first student!'}
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
            <motion.div className="modal-box" initial={{ opacity:0, scale:0.9, y:30 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h3 style={{ margin:0, display:'flex', alignItems:'center', gap:8 }}><UserPlus size={20}/> Register Student</h3>
                <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'1.5rem', cursor:'pointer' }}><X size={20}/></button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="input-group" style={{ gridColumn:'1/-1' }}>
                  <label className="input-label">Full Name *</label>
                  <input className="input-field" placeholder="Student full name"
                    value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Grade *</label>
                  <input className="input-field" placeholder="e.g. Grade 3"
                    value={form.grade} onChange={e => setForm(p => ({...p, grade:e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Level</label>
                  <select className="select-field" value={form.level} onChange={e => setForm(p => ({...p, level:e.target.value}))}>
                    <option value="">Select level</option>
                    {['Nursery','KG','Primary','Middle','High'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Primary Contact *</label>
                  <input className="input-field" placeholder="+1 555 000 0000"
                    value={form.parentContact1} onChange={e => setForm(p => ({...p, parentContact1:e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Secondary Contact</label>
                  <input className="input-field" placeholder="+1 555 000 0001"
                    value={form.parentContact2} onChange={e => setForm(p => ({...p, parentContact2:e.target.value}))} />
                </div>
                <div className="input-group" style={{ gridColumn:'1/-1' }}>
                  <label className="input-label">Assign Route</label>
                  <select className="select-field" value={form.routeId} onChange={e => setForm(p => ({...p, routeId:e.target.value}))}>
                    <option value="">No route (self-pickup)</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ gridColumn:'1/-1' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer' }}>
                    <input type="checkbox" checked={form.isSelfPickup}
                      onChange={e => setForm(p => ({...p, isSelfPickup:e.target.checked}))}
                      style={{ width:18, height:18, cursor:'pointer' }} />
                    <span style={{ color:'var(--text-main)' }}>Self-pickup (parent picks up directly)</span>
                  </label>
                </div>
              </div>

              <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem' }}>
                <button className="btn" style={{ flex:1, background:'rgba(255,255,255,0.06)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  className="btn btn-primary" style={{ flex:2 }}
                  onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : '✓  Save Student'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
