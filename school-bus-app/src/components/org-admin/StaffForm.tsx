"use client";

import { useState, useEffect } from "react";
import styles from "./Form.module.css";

interface Branch {
  id: string;
  name: string;
}

interface StaffFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function StaffForm({ onSuccess, onCancel }: StaffFormProps) {
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
      email: formData.get("email"),
      role: formData.get("role"),
      phoneNumber: formData.get("phoneNumber"),
      branchId: formData.get("branchId") || null,
    };

    try {
      const response = await fetch("/api/organisation/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const result = await response.json();
        setError(result.error || "Failed to invite staff member");
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
        <label className={styles.label}>Full Name</label>
        <input name="name" type="text" className={styles.input} placeholder="e.g. John Doe" required />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Email Address</label>
        <input name="email" type="email" className={styles.input} placeholder="staff@example.com" required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className={styles.group}>
          <label className={styles.label}>Role</label>
          <select name="role" className={styles.input} required>
            <option value="STAFF">Dispatch Staff</option>
            <option value="DRIVER">Driver</option>
            <option value="ORG_ADMIN">Organisation Admin</option>
          </select>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Phone Number</label>
          <input name="phoneNumber" type="tel" className={styles.input} placeholder="+1234567890" />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Assigned Branch (Optional)</label>
        <select name="branchId" className={styles.input}>
          <option value="">Global / All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Sending Invitation..." : "Send Invitation"}
        </button>
      </div>
    </form>
  );
}
