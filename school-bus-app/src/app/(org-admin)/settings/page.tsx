"use client";

import { useState } from 'react';
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Key
} from 'lucide-react';
import styles from './settings.module.css';

export default function SettingsPage() {
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const testConnection = async (type: string) => {
    setTesting(type);
    try {
      const res = await fetch('/api/settings/test-comms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      setResults(prev => ({ ...prev, [type]: data }));
    } catch (error) {
      setResults(prev => ({ ...prev, [type]: { error: 'Connection failed' } }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>System Settings</h1>
        <p className={styles.subtitle}>Configure integration keys and test operational communications</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Mail className={styles.icon} />
            <h3>Email Service (Resend)</h3>
          </div>
          <p>Used for parent notifications, staff invites, and reports.</p>
          <div className={styles.status}>
            {results.email?.success ? (
              <span className={styles.success}><CheckCircle2 size={14} /> Connected</span>
            ) : results.email?.error ? (
              <span className={styles.error}><XCircle size={14} /> Config Error</span>
            ) : (
              <span className={styles.pending}>Not Tested</span>
            )}
          </div>
          <button 
            className={styles.testBtn} 
            disabled={testing === 'email'}
            onClick={() => testConnection('email')}
          >
            {testing === 'email' ? <RefreshCw className={styles.spin} /> : 'Test Connectivity'}
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <MessageSquare className={styles.icon} />
            <h3>WhatsApp Service</h3>
          </div>
          <p>Real-time trip updates and emergency alerts for parents.</p>
          <div className={styles.status}>
            <span className={styles.pending}>Template Mode</span>
          </div>
          <button 
            className={styles.testBtn}
            onClick={() => testConnection('whatsapp')}
          >
            Test Sandbox
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Smartphone className={styles.icon} />
            <h3>SMS Gateway</h3>
          </div>
          <p>Fallback communication for areas with low data connectivity.</p>
          <div className={styles.status}>
            <span className={styles.pending}>Pending Keys</span>
          </div>
          <button className={styles.testBtn}>Configure Twilio</button>
        </div>
      </div>

      <div className={styles.envSection}>
        <h3><Key size={18} /> Environment Keys Required</h3>
        <ul className={styles.keyList}>
          <li><code>RESEND_API_KEY</code> - Required for Email</li>
          <li><code>TWILIO_ACCOUNT_SID</code> - Required for SMS/WhatsApp</li>
          <li><code>TWILIO_AUTH_TOKEN</code> - Required for SMS/WhatsApp</li>
          <li><code>DATABASE_URL</code> - PostgreSQL Production Instance</li>
        </ul>
      </div>
    </div>
  );
}
