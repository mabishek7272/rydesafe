'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, MessageSquarePlus, Mails } from 'lucide-react'

interface Message { id: string; content: string; createdAt: string; read: boolean; sender: { name: string; role: string }; recipient: { name: string; role: string } }
interface User { id: string; name: string; role: string }

const ROLE_COLOR: Record<string, string> = { ADMIN: '#ef4444', DRIVER: '#3b82f6', PARENT: '#10b981', SCHOOL_ADMIN: '#f59e0b' }

export default function MessagesTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [recipientId, setRecipientId] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success'|'error'>('success')

  const loadMessages = () => {
    Promise.all([
      fetch('/api/messages').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json())
    ]).then(([msgData, userData]) => {
      setMessages(msgData.messages || [])
      setUsers((userData.users || []).filter((u: User) => !['ADMIN','SUPER_ADMIN'].includes(u.role)))
      setLoading(false)
    }).catch(console.error)
  }

  useEffect(() => { loadMessages() }, [])

  const showToast = (msg: string, type: 'success'|'error'='success') => { setToast(msg); setToastType(type); setTimeout(() => setToast(''), 3000) }

  const handleSend = async () => {
    if (!recipientId || !content.trim()) { showToast('Please select a recipient and write a message', 'error'); return }
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, content: content.trim() })
      })
      if (res.ok) {
        showToast('Message sent!', 'success'); setShowCompose(false); setContent(''); setRecipientId(''); loadMessages()
      } else {
        const e = await res.json(); showToast((e.error || 'Failed to send'), 'error')
      }
    } catch { showToast('Network error', 'error') } finally { setSending(false) }
  }

  if (loading) return (
    <div className="glass-panel" style={{ padding:'2rem' }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:70, marginBottom:12, borderRadius:10 }} />)}
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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div>
            <h3 style={{ margin:0 }}>Admin Inbox</h3>
            <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginTop:4 }}>
              {messages.filter(m => !m.read).length} unread · {messages.length} total
            </div>
          </div>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            className="btn btn-primary" onClick={() => setShowCompose(true)} style={{display:'flex', alignItems:'center', gap:6}}>
            <MessageSquarePlus size={18}/> Compose
          </motion.button>
        </div>

        {messages.length === 0 && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem', color:'var(--text-muted)' }}>
            <Mails size={32} style={{marginBottom:12}}/> No messages yet. Send one to a driver or parent!
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
              whileHover={{ backgroundColor:'rgba(255,255,255,0.03)' }}
              style={{ padding:'1.25rem', background: msg.read ? 'rgba(255,255,255,0.02)' : 'rgba(79,70,229,0.06)',
                borderRadius:12, borderLeft:`3px solid ${ROLE_COLOR[msg.sender.role] || 'var(--primary)'}`,
                border: msg.read ? '1px solid var(--surface-border)' : '1px solid rgba(79,70,229,0.3)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem', flexWrap:'wrap', gap:'0.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background: ROLE_COLOR[msg.sender.role] || 'var(--primary)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.9rem', color:'#fff', opacity:0.85 }}>
                    {msg.sender.name.charAt(0)}
                  </div>
                  <div>
                    <strong>{msg.sender.name}</strong>
                    <span className={`badge ${msg.sender.role === 'DRIVER' ? 'badge-info' : 'badge-success'}`}
                      style={{ marginLeft:8, fontSize:'0.7rem' }}>{msg.sender.role}</span>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.82rem', display:'block' }}>→ {msg.recipient.name}</span>
                  </div>
                </div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', textAlign:'right' }}>
                  {new Date(msg.createdAt).toLocaleString()}
                  {!msg.read && <span className="badge badge-info" style={{ marginLeft:8, fontSize:'0.65rem' }}>NEW</span>}
                </div>
              </div>
              <p style={{ margin:0, color:'rgba(255,255,255,0.85)', fontSize:'0.95rem', lineHeight:'1.6' }}>{msg.content}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div className="modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={e => { if (e.target === e.currentTarget) setShowCompose(false) }}>
            <motion.div className="modal-box" initial={{ opacity:0, scale:0.9, y:30 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h3 style={{ margin:0, display:'flex', alignItems:'center', gap:8 }}><MessageSquarePlus size={20}/> New Message</h3>
                <button onClick={() => setShowCompose(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'1.5rem', cursor:'pointer' }}>✕</button>
              </div>

              <div className="input-group">
                <label className="input-label">Send To</label>
                <select className="select-field" value={recipientId} onChange={e => setRecipientId(e.target.value)}>
                  <option value="">Select recipient…</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Message</label>
                <textarea className="input-field" rows={5} placeholder="Type your message here…" value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ resize:'vertical', fontFamily:'inherit', lineHeight:'1.6' }} />
              </div>

              <div style={{ display:'flex', gap:'1rem', marginTop:'0.5rem' }}>
                <button className="btn" style={{ flex:1, background:'rgba(255,255,255,0.06)' }} onClick={() => setShowCompose(false)}>Cancel</button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  className="btn btn-primary" style={{ flex:2 }}
                  onClick={handleSend} disabled={sending}>
                  {sending ? 'Sending…' : 'Send Message'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
