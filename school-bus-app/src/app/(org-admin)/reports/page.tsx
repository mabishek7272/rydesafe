"use client";

import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock
} from 'lucide-react';
import styles from './reports.module.css';

export default function ReportsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    entityType: '',
    severity: '',
    startDate: '',
    endDate: ''
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filter as any).toString();
      const res = await fetch(`/api/reports/logs?${query}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ef4444';
      case 'ERROR': return '#f87171';
      case 'WARNING': return '#fbbf24';
      default: return '#60a5fa';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle size={16} color="#ef4444" />;
      case 'ERROR': return <AlertCircle size={16} color="#f87171" />;
      case 'WARNING': return <AlertTriangle size={16} color="#fbbf24" />;
      default: return <Info size={16} color="#60a5fa" />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Operational Logs</h1>
          <p className={styles.subtitle}>Audit trail of all administrative and system actions</p>
        </div>
        <button className={styles.exportBtn} onClick={() => window.print()}>
          <Download size={18} />
          Export PDF
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <Filter size={18} className={styles.filterIcon} />
          <select 
            className={styles.select}
            value={filter.entityType}
            onChange={(e) => setFilter({...filter, entityType: e.target.value})}
          >
            <option value="">All Entities</option>
            <option value="Passenger">Students</option>
            <option value="Vehicle">Fleet</option>
            <option value="Schedule">Schedules</option>
            <option value="Trip">Trips</option>
            <option value="Staff">Staff</option>
          </select>
          <select 
            className={styles.select}
            value={filter.severity}
            onChange={(e) => setFilter({...filter, severity: e.target.value})}
          >
            <option value="">All Severities</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <input 
            type="date" 
            className={styles.input} 
            onChange={(e) => setFilter({...filter, startDate: e.target.value})}
          />
          <button className={styles.searchBtn} onClick={fetchLogs}>
            <Search size={18} />
          </button>
        </div>
      </div>

      <div className={styles.logList}>
        {loading ? (
          <div className={styles.loading}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className={styles.empty}>No logs found matching filters</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Severity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className={styles.timeCell}>
                      <Clock size={14} />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actorCell}>
                      <span className={styles.actorName}>{log.actor?.name || 'System'}</span>
                      <span className={styles.actorRole}>{log.actorRole}</span>
                    </div>
                  </td>
                  <td><span className={styles.actionTag}>{log.action}</span></td>
                  <td>{log.entityType}</td>
                  <td>
                    <div className={styles.severityCell}>
                      {getSeverityIcon(log.severity)}
                      <span style={{ color: getSeverityColor(log.severity) }}>{log.severity}</span>
                    </div>
                  </td>
                  <td className={styles.detailsCell}>
                    {log.action} performed on {log.entityType} ({log.entityId})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
