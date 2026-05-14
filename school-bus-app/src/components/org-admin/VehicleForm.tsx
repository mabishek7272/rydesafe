"use client";

import { useState, useEffect } from "react";
import styles from "./Form.module.css";

interface Driver {
  id: string;
  name: string;
}

interface VehicleFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function VehicleForm({ onSuccess, onCancel }: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    // Fetch personnel with DRIVER role
    fetch("/api/organisation/users?role=DRIVER")
      .then(res => res.json())
      .then(data => setDrivers(data))
      .catch(err => console.error("Failed to load drivers"));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      plateNumber: formData.get("plateNumber"),
      model: formData.get("model"),
      make: formData.get("make"),
      year: parseInt(formData.get("year") as string),
      capacity: parseInt(formData.get("capacity") as string),
      activeDriverId: formData.get("driverId") || null,
      status: "ACTIVE",
    };

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const result = await response.json();
        setError(result.error || "Failed to register vehicle");
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.group}>
          <label className={styles.label}>Plate Number</label>
          <input name="plateNumber" type="text" className={styles.input} placeholder="e.g. KCA 123X" required />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Vehicle Model</label>
          <input name="model" type="text" className={styles.input} placeholder="e.g. Hiace" required />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.group}>
          <label className={styles.label}>Make</label>
          <input name="make" type="text" className={styles.input} placeholder="e.g. Toyota" required />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Year</label>
          <input name="year" type="number" className={styles.input} defaultValue={new Date().getFullYear()} required />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Seating Capacity</label>
        <input name="capacity" type="number" className={styles.input} placeholder="e.g. 14" required />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Assign Primary Driver (Optional)</label>
        <select name="driverId" className={styles.input}>
          <option value="">Unassigned</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Registering..." : "Register Vehicle"}
        </button>
      </div>
    </form>
  );
}
