"use client";

import { useState, useEffect } from "react";
import styles from "./Form.module.css";

interface Branch {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
}

interface Driver {
  id: string;
  name: string;
}

interface ScheduleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const DAYS = [
  { label: "M", value: "MON" },
  { label: "T", value: "TUE" },
  { label: "W", value: "WED" },
  { label: "T", value: "THU" },
  { label: "F", value: "FRI" },
  { label: "S", value: "SAT" },
  { label: "S", value: "SUN" },
];

export function ScheduleForm({ onSuccess, onCancel }: ScheduleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>(["MON", "TUE", "WED", "THU", "FRI"]);

  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then(res => res.json()),
      fetch("/api/vehicles").then(res => res.json()),
      fetch("/api/organisation/users?role=DRIVER").then(res => res.json()),
    ]).then(([branchesData, vehiclesData, driversData]) => {
      setBranches(branchesData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
    }).catch(err => console.error("Failed to load form data", err));
  }, []);

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      type: formData.get("type"),
      branchId: formData.get("branchId"),
      vehicleId: formData.get("vehicleId") || null,
      driverUserId: formData.get("driverUserId") || null,
      daysOfWeek: selectedDays,
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime") || null,
      isRecurring: true,
    };

    try {
      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const result = await response.json();
        setError(result.error || "Failed to create schedule");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.875rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <div className={styles.group}>
        <label className={styles.label}>Schedule Name</label>
        <input name="name" type="text" className={styles.input} placeholder="e.g. Morning Pickup - Primary Section" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.group}>
          <label className={styles.label}>Type</label>
          <select name="type" className={styles.input} required>
            <option value="PICKUP">Pickup (Morning)</option>
            <option value="DROPOFF">Drop-off (Evening)</option>
            <option value="SPECIAL">Special Trip</option>
          </select>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Branch</label>
          <select name="branchId" className={styles.input} required>
            <option value="">Select Branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.group}>
          <label className={styles.label}>Start Time</label>
          <input name="startTime" type="time" className={styles.input} required />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>End Time (Optional)</label>
          <input name="endTime" type="time" className={styles.input} />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Active Days</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {DAYS.map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              style={{
                flex: 1,
                height: '40px',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: selectedDays.includes(day.value) ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                color: selectedDays.includes(day.value) ? 'white' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.group}>
          <label className={styles.label}>Vehicle Assignment</label>
          <select name="vehicleId" className={styles.input}>
            <option value="">Unassigned</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plateNumber}</option>
            ))}
          </select>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Driver Assignment</label>
          <select name="driverUserId" className={styles.input}>
            <option value="">Unassigned</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Create Schedule"}
        </button>
      </div>
    </form>
  );
}
