"use client";

import { useState, useEffect } from "react";
import styles from "./schedules.module.css";
import { 
  Calendar, 
  Clock, 
  Bus, 
  User, 
  Users, 
  MoreVertical,
  Plus,
  Zap,
  Search,
  ChevronRight
} from "lucide-react";
import { Modal } from "@/components/org-admin/Modal";
import { ScheduleForm } from "@/components/org-admin/ScheduleForm";

interface Schedule {
  id: string;
  name: string;
  type: "PICKUP" | "DROPOFF" | "SPECIAL";
  startTime: string;
  endTime: string | null;
  daysOfWeek: string[];
  isRecurring: boolean;
  status: string;
  branch: { name: string };
  vehicle?: { plateNumber: string; model: string };
  driver?: { name: string };
  _count: {
    passengers: number;
  };
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules");
      if (response.ok) {
        const data = await response.ok ? await response.json() : [];
        setSchedules(data);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.vehicle?.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleOptimize = async (id: string) => {
    try {
      const response = await fetch(`/api/schedules/${id}/optimize`, { method: "POST" });
      if (response.ok) {
        const res = await response.json();
        alert(res.message);
        fetchSchedules();
      }
    } catch (error) {
      console.error("Optimization failed:", error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Optimizing transit routes...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Daily Schedules</h1>
          <p className={styles.subtitle}>Manage recurring pickup and drop-off routes</p>
        </div>
        <button className={styles.createBtn} onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Create Schedule
        </button>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchWrapper} style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            type="text" 
            placeholder="Search by route name or vehicle..." 
            className={styles.searchBox}
            style={{ paddingLeft: '40px', width: '100%' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Types</option>
          <option value="PICKUP">Pickup (Morning)</option>
          <option value="DROPOFF">Drop-off (Evening)</option>
          <option value="SPECIAL">Special Trips</option>
        </select>
      </div>

      {filteredSchedules.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar size={48} color="#334155" style={{ marginBottom: '1rem' }} />
          <h3>No schedules found</h3>
          <p>Get started by creating your first recurring transit route.</p>
        </div>
      ) : (
        <div className={styles.scheduleGrid}>
          {filteredSchedules.map((schedule) => (
            <div key={schedule.id} className={styles.scheduleCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.scheduleName}>{schedule.name}</h3>
                  <span className={styles.branchTag}>{schedule.branch.name}</span>
                </div>
                <span className={`${styles.typeBadge} ${styles[schedule.type.toLowerCase()]}`}>
                  {schedule.type}
                </span>
              </div>

              <div className={styles.timeSlot}>
                <div className={styles.timeInfo}>
                  <span className={styles.timeLabel}>Start Time</span>
                  <span className={styles.timeValue}>{formatTime(schedule.startTime)}</span>
                </div>
                <ChevronRight size={16} color="#334155" />
                {schedule.endTime && (
                  <div className={styles.timeInfo}>
                    <span className={styles.timeLabel}>End Time</span>
                    <span className={styles.timeValue}>{formatTime(schedule.endTime)}</span>
                  </div>
                )}
              </div>

              <div className={styles.daysList}>
                {DAYS.map(day => (
                  <div 
                    key={day} 
                    className={`${styles.dayChip} ${schedule.daysOfWeek.includes(day) ? styles.dayActive : ""}`}
                  >
                    {day[0]}
                  </div>
                ))}
              </div>

              <div className={styles.assignments}>
                <div className={styles.assignmentItem}>
                  <span className={styles.assignmentLabel}>Vehicle</span>
                  <div className={styles.assignmentValue}>
                    <Bus size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {schedule.vehicle?.plateNumber || "Unassigned"}
                  </div>
                </div>
                <div className={styles.assignmentItem}>
                  <span className={styles.assignmentLabel}>Driver</span>
                  <div className={styles.assignmentValue}>
                    <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                    {schedule.driver?.name || "Unassigned"}
                  </div>
                </div>
              </div>

              <div className={styles.studentCount}>
                <Users size={16} />
                <span>
                  <span className={styles.countNumber}>{schedule._count.passengers}</span> Passengers assigned
                </span>
              </div>

              <div className={styles.actions}>
                <button 
                  className={styles.optimizeBtn} 
                  onClick={() => handleOptimize(schedule.id)}
                  title="Optimize stop sequence"
                >
                  <Zap size={14} fill="#3b82f6" color="#3b82f6" />
                  Optimize Route
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Transit Schedule"
      >
        <ScheduleForm
          onSuccess={() => {
            setIsModalOpen(false);
            fetchSchedules();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
