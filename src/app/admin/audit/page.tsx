"use client";

import { useState, useEffect } from "react";

type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  details: string;
  createdAt: string;
  actor: { name: string, username: string };
};

import { useLanguage } from '@/i18n/LanguageProvider'

export default function AuditPage() {
  const { t } = useLanguage()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    try {
      const res = await fetch("/api/audit")
      if (res.ok) {
        const data = await res.json()
        setLogs(data.auditLogs || [])
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="content-area">
      <div style={{ marginBottom: '2rem' }}>
        <h1>{t.audit.title}</h1>
        <p className="subtitle">{t.audit.subtitle}</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>{t.common.loading}</div>
      ) : (
        <div className="panel">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem', width: '200px' }}>{t.audit.date}</th>
                  <th style={{ padding: '1rem' }}>{t.audit.actor}</th>
                  <th style={{ padding: '1rem' }}>{t.audit.action}</th>
                  <th style={{ padding: '1rem' }}>{t.audit.detail}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>{t.audit.noRecords}</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{log.actor?.name || 'Desconocido'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{log.actor?.username || 'N/A'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.3rem 0.6rem', 
                          borderRadius: '12px', 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          ...(log.action.includes('DELETE') ? { color: '#ff4d4f', background: 'rgba(255, 77, 79, 0.1)' } : 
                              log.action.includes('CREATE') ? { color: 'var(--accent-green)', background: 'var(--accent-green-dim)' } : 
                              { color: 'var(--accent-purple)', background: 'rgba(157, 0, 255, 0.1)' })
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
