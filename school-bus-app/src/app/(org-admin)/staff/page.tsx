"use client";

import { useState, useEffect } from "react";
import styles from "./staff.module.css";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  Truck, 
  MoreVertical,
  Search,
  Filter,
  Clock
} from "lucide-react";
import { Modal } from "@/components/org-admin/Modal";
import { StaffForm } from "@/components/org-admin/StaffForm";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ORG_ADMIN" | "DRIVER" | "STAFF";
  phoneNumber: string | null;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  branch: { name: string } | null;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/organisation/users");
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return <div style={{ padding: '2rem', color: '#64748b' }}>Syncing team directory...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Staff & Drivers</h1>
          <p className={styles.subtitle}>Manage permissions and personnel for your organisation</p>
        </div>
        <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          Invite Staff
        </button>
      </header>

      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.staffIcon}`}>
            <Users size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{staff.length}</span>
            <span className={styles.statLabel}>Total Personnel</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.driverIcon}`}>
            <Truck size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {staff.filter(s => s.role === "DRIVER").length}
            </span>
            <span className={styles.statLabel}>Active Drivers</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.pendingIcon}`}>
            <Clock size={20} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>
              {staff.filter(s => s.status === "PENDING").length}
            </span>
            <span className={styles.statLabel}>Pending Invites</span>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              style={{ 
                width: '100%', 
                background: 'rgba(15, 23, 42, 0.5)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                padding: '0.625rem 1rem 0.625rem 2.5rem',
                borderRadius: '0.75rem',
                color: 'white',
                outline: 'none'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            style={{ 
              background: 'rgba(15, 23, 42, 0.5)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              padding: '0.625rem 1rem',
              borderRadius: '0.75rem',
              color: 'white'
            }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="ORG_ADMIN">Administrators</option>
            <option value="DRIVER">Drivers</option>
            <option value="STAFF">Dispatch Staff</option>
          </select>
        </div>

        <table className={styles.staffTable}>
          <thead>
            <tr>
              <th>Name & Contact</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((person) => (
              <tr key={person.id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                      {getInitials(person.name)}
                    </div>
                    <div>
                      <span className={styles.name}>{person.name}</span>
                      <span className={styles.email}>{person.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.roleBadge} ${styles[`role_${person.role}`]}`}>
                    {person.role === "ORG_ADMIN" ? <Shield size={12} style={{ marginRight: '4px' }} /> : null}
                    {person.role === "DRIVER" ? <Truck size={12} style={{ marginRight: '4px' }} /> : null}
                    {person.role}
                  </span>
                </td>
                <td>
                  <span className={styles.branchTag}>
                    {person.branch?.name || "Global"}
                  </span>
                </td>
                <td>
                  <span className={`${styles[`status_${person.status}`]}`} style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    <span className={styles.statusDot} style={{ background: 'currentColor' }}></span>
                    {person.status}
                  </span>
                </td>
                <td style={{ color: '#475569', fontSize: '0.875rem' }}>
                  {new Date(person.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <MoreVertical size={18} className={styles.actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invite New Staff or Driver"
      >
        <StaffForm
          onSuccess={() => {
            setIsModalOpen(false);
            fetchStaff();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
