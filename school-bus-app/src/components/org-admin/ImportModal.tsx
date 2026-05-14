"use client";

import { useState } from "react";
import styles from "./Form.module.css";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ImportModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  title: string;
}

export function ImportModal({ onSuccess, onCancel, title }: ImportModalProps) {
  const [importMode, setImportMode] = useState<"EXCEL" | "OCR">("EXCEL");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number, failed: number, errors: string[] } | null>(null);
  const [ocrData, setOcrData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const endpoint = importMode === "EXCEL" ? "/api/imports/students" : "/api/imports/ocr";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (importMode === "EXCEL") {
          setResult(data);
        } else {
          setOcrData(data.data);
        }
      } else {
        const data = await response.json();
        setError(data.error || "Failed to process import");
      }
    } catch (err) {
      setError("An unexpected error occurred during upload");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Import Complete</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{result.success}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Successful</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{result.failed}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Failed</div>
          </div>
        </div>
        {result.errors.length > 0 && (
          <div style={{ textAlign: 'left', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#ef4444' }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Error Details:</p>
            {result.errors.map((err, i) => <p key={i}>• {err}</p>)}
          </div>
        )}
        <button className={styles.submitBtn} style={{ marginTop: '1.5rem' }} onClick={onSuccess}>
          Done
        </button>
      </div>
    );
  }

  if (ocrData) {
    return (
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Extracted Student Data</h3>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
          GLM-OCR successfully identified {ocrData.length} student(s). Please review before confirming.
        </p>
        <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          {ocrData.map((student, i) => (
            <div key={i} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontWeight: 700, color: '#60a5fa' }}>{student.name}</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pickup: {student.pickup_address}</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Guardian: {student.guardian_name} ({student.guardian_phone})</p>
            </div>
          ))}
        </div>
        <div className={styles.actions} style={{ marginTop: '2rem' }}>
          <button type="button" className={styles.cancelBtn} onClick={() => setOcrData(null)}>
            Retry
          </button>
          <button type="button" className={styles.submitBtn} onClick={onSuccess}>
            Confirm & Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      {/* Mode Switcher */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
        <button 
          className={importMode === "EXCEL" ? styles.submitBtn : styles.cancelBtn} 
          style={{ flex: 1, height: '36px', borderRadius: '0.5rem', border: 'none', background: importMode === "EXCEL" ? '#3b82f6' : 'transparent' }}
          onClick={() => setImportMode("EXCEL")}
        >
          Excel Template
        </button>
        <button 
          className={importMode === "OCR" ? styles.submitBtn : styles.cancelBtn} 
          style={{ flex: 1, height: '36px', borderRadius: '0.5rem', border: 'none', background: importMode === "OCR" ? '#3b82f6' : 'transparent' }}
          onClick={() => setImportMode("OCR")}
        >
          AI OCR (GLM-OCR)
        </button>
      </div>

      <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
        {importMode === "EXCEL" 
          ? "Upload an Excel file (.xlsx) with the standard student template."
          : "Upload an image or PDF of a registration form. Our AI will automatically extract student data."
        }
      </p>

      <div 
        style={{ 
          border: '2px dashed rgba(255, 255, 255, 0.1)', 
          borderRadius: '1rem', 
          padding: '2.5rem', 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        <input 
          type="file" 
          accept={importMode === "EXCEL" ? ".xlsx" : "image/*,.pdf"} 
          onChange={handleFileChange} 
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
        />
        {file ? (
          <div>
            <FileText size={40} color="#60a5fa" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 600 }}>{file.name}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div>
            <Upload size={40} color="#475569" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 600 }}>Click or Drag to Upload</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Support {importMode === "EXCEL" ? ".xlsx" : "Images & PDFs"}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: '0.875rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', marginTop: '1rem' }}>
          <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
          {error}
        </div>
      )}

      <div className={styles.actions} style={{ marginTop: '2rem' }}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button 
          type="button" 
          className={styles.submitBtn} 
          disabled={!file || loading}
          onClick={handleUpload}
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={16} style={{ marginRight: '8px' }} /> Processing...</>
          ) : (
            "Start Import"
          )}
        </button>
      </div>
    </div>
  );
}
