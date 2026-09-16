"use client";

import { useState, useEffect } from "react";
import { useLanguage } from '@/i18n/LanguageProvider';

type Absence = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: string;
  user: { name: string, username: string };
};

type User = {
  id: string;
  name: string;
};

export default function AbsencesPage() {
  const { t } = useLanguage();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    startDate: "",
    endDate: "",
    type: "VACATION"
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [absencesRes, usersRes] = await Promise.all([
        fetch("/api/absences"),
        fetch("/api/users")
      ]);
      const absencesData = await absencesRes.json();
      const usersData = await usersRes.json();
      
      setAbsences(absencesData.absences || []);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.startDate || !form.endDate || !form.type) return;

    try {
      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ userId: "", startDate: "", endDate: "", type: "VACATION" });
        fetchData();
      } else {
        alert(t.common.error);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t.absences.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/absences/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  }

  const typeLabels: Record<string, string> = {
    VACATION: t.absences.typeVacation,
    SICK_LEAVE: t.absences.typeSick,
    OTHER: t.absences.typeOther
  };

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>{t.absences.title}</h1>
          <p className="subtitle">{t.absences.subtitle}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          {t.absences.addAbsence}
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>{t.common.loading}</div>
      ) : (
        <div className="panel">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>{t.absences.agent}</th>
                  <th style={{ padding: '1rem' }}>{t.absences.type}</th>
                  <th style={{ padding: '1rem' }}>{t.absences.from}</th>
                  <th style={{ padding: '1rem' }}>{t.absences.to}</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>{t.common.edit}</th>
                </tr>
              </thead>
              <tbody>
                {absences.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t.absences.noRecords}</td>
                  </tr>
                ) : (
                  absences.map(absence => (
                    <tr key={absence.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{absence.user.name}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-dark)', borderRadius: '12px', fontSize: '0.85rem' }}>
                          {typeLabels[absence.type] || absence.type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>{new Date(absence.startDate).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem' }}>{new Date(absence.endDate).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(absence.id)}
                          style={{ color: '#ff4d4f', border: '1px solid rgba(255, 77, 79, 0.3)', background: 'transparent' }}
                        >
                          {t.common.delete}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>{t.absences.addAbsence}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t.absences.agent}</label>
                <select
                  required
                  value={form.userId}
                  onChange={e => setForm({ ...form, userId: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">-- {t.absences.selectAgent} --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t.absences.type}</label>
                <select
                  required
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="VACATION">{t.absences.typeVacation}</option>
                  <option value="SICK_LEAVE">{t.absences.typeSick}</option>
                  <option value="OTHER">{t.absences.typeOther}</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t.absences.from}</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{t.absences.to}</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {t.absences.saveAndDeleteShifts}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, background: 'transparent', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
