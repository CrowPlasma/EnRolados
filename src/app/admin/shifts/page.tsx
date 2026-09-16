'use client'

import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useLanguage } from '@/i18n/LanguageProvider'

export default function ShiftsAdmin() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const handleBulkDeleteMonth = async () => {
    const locale = language === 'en' ? 'en' : 'es'
    const monthName = new Date(2000, month - 1, 1).toLocaleString(locale, { month: 'long' }).toUpperCase()
    if (!window.confirm(`${t.shifts.deleteAllWarning} (${monthName} ${year})`)) {
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/shifts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: month - 1, year })
      })
      
      const data = await res.json()
      if (res.ok) {
        setMessage(`${t.common.success} (${data.count}).`)
      } else {
        setMessage(data.error || t.common.error)
      }
    } catch (err) {
      setMessage(t.common.error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return <div className="content-area">No autorizado</div>
  }

  return (
    <div className="content-area">
      <h1>{t.shifts.title}</h1>
      <p className="subtitle">{t.shifts.subtitle}</p>

      <div className="panel" style={{ maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{t.shifts.selectMonth}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {t.shifts.deleteMonthDesc}
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.shifts.month}</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString(language === 'en' ? 'en' : 'es', { month: 'long' }).toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.shifts.year}</label>
            <input 
              type="number" 
              value={year} 
              onChange={e => setYear(Number(e.target.value))}
              min={2020} 
              max={2050}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button 
            onClick={handleBulkDeleteMonth} 
            disabled={loading} 
            className="btn-danger" 
            style={{ width: '100%', maxWidth: '300px', padding: '0.8rem', justifyContent: 'center' }}
          >
            {loading ? t.common.loading : t.shifts.deleteAll}
          </button>
        </div>
        {message && <p style={{ color: 'var(--accent-green)', fontSize: '0.9rem', marginTop: '1rem', textAlign: 'center' }}>{message}</p>}
      </div>
    </div>
  )
}
