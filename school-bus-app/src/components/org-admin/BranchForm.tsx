"use client";

import { useState } from "react";
import styles from "./Form.module.css";

interface BranchFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function BranchForm({ onSuccess, onCancel }: BranchFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      address: formData.get("address"),
      contactInfo: formData.get("contactInfo"),
    };

    try {
      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const result = await response.json();
        setError(result.error || "Failed to create branch");
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
        <label className={styles.label}>Branch Name</label>
        <input 
          name="name" 
          type="text" 
          className={styles.input} 
          placeholder="e.g. Westside Campus" 
          required 
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Physical Address</label>
        <input 
          name="address" 
          type="text" 
          className={styles.input} 
          placeholder="e.g. 123 Education Way, Nairobi" 
          required 
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Contact Information</label>
        <input 
          name="contactInfo" 
          type="text" 
          className={styles.input} 
          placeholder="e.g. +254 700 111222" 
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Create Branch"}
        </button>
      </div>
    </form>
  );
}
