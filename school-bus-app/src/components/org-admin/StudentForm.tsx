"use client";

import { useState, useEffect } from "react";
import styles from "./Form.module.css";

interface Branch {
  id: string;
  name: string;
}

interface StudentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function StudentForm({ onSuccess, onCancel }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    fetch("/api/branches")
      .then(res => res.json())
      .then(data => setBranches(data))
      .catch(err => console.error("Failed to load branches"));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      dob: formData.get("dob"),
      pickupAddress: formData.get("pickupAddress"),
      dropoffAddress: formData.get("dropoffAddress"),
      branchId: formData.get("branchId"),
      guardian: {
        name: formData.get("guardianName"),
        phonePrimary: formData.get("guardianPhone"),
        email: formData.get("guardianEmail"),
        relationship: formData.get("relationship"),
      }
    };

    try {
      const response = await fetch("/api/passengers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const result = await response.json();
        setError(result.error || "Failed to add student");
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
          <label className={styles.label}>Full Name</label>
          <input name="name" type="text" className={styles.input} placeholder="Student Name" required />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Date of Birth</label>
          <input name="dob" type="date" className={styles.input} required />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Branch / Campus</label>
        <select name="branchId" className={styles.input} required>
          <option value="">Select Branch</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Pickup Address</label>
        <input name="pickupAddress" type="text" className={styles.input} placeholder="Residential address" required />
      </div>

      <div style={{ margin: '1rem 0', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '1rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: '#60a5fa' }}>Primary Guardian Info</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className={styles.group}>
            <label className={styles.label}>Guardian Name</label>
            <input name="guardianName" type="text" className={styles.input} placeholder="Parent/Guardian Name" required />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Relationship</label>
            <input name="relationship" type="text" className={styles.input} placeholder="e.g. Mother" required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className={styles.group}>
            <label className={styles.label}>Phone Number</label>
            <input name="guardianPhone" type="text" className={styles.input} placeholder="Primary contact" required />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Email Address</label>
            <input name="guardianEmail" type="email" className={styles.input} placeholder="For notifications" />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Adding..." : "Add Student"}
        </button>
      </div>
    </form>
  );
}
