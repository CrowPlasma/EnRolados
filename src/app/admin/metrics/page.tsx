'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { startOfMonth, endOfMonth, addMonths, subMonths, format, isWeekend } from 'date-fns'
import { enUS, es as esLocale } from 'date-fns/locale'
import { useLanguage } from '@/i18n/LanguageProvider'

interface Shift {
  id: string
  date: string
  type: string
  user: {
    id: string
    name: string
    role: string
  }
  isHomeOffice: boolean
}

interface UserMetrics {
  id: string
  name: string
  totalShifts: number
  nightShifts: number
  weekendShifts: number
  homeOfficeShifts: number
}

export default function MetricsAdmin() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const dateLocale = language === 'en' ? enUS : esLocale
  const [currentDate, setCurrentDate] = useState(new Date())
  const [metrics, setMetrics] = useState<UserMetrics[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMetrics = async (date: Date) => {
    setLoading(true)
    const startDate = startOfMonth(date)
    const endDate = endOfMonth(date)

    try {
      const [shiftsRes, settingsRes] = await Promise.all([
        fetch(`/api/shifts?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/settings`)
      ])
      
      const shiftsData = await shiftsRes.json()
      const settingsData = await settingsRes.json()
      
      let nightShiftIds = new Set<string>()
      if (settingsData.settings) {
        const typesSetting = settingsData.settings.find((s: any) => s.key === 'shift_types')
        if (typesSetting) {
          const parsed = JSON.parse(typesSetting.value)
          parsed.forEach((st: any) => {
            if (st.isNight) nightShiftIds.add(st.id)
          })
        }
      }
      
      if (shiftsData.shifts) {
        const userMap = new Map<string, UserMetrics>()
        
        shiftsData.shifts.forEach((shift: Shift) => {
          if (!userMap.has(shift.user.id)) {
            userMap.set(shift.user.id, {
              id: shift.user.id,
              name: shift.user.name,
              totalShifts: 0,
              nightShifts: 0,
              weekendShifts: 0,
              homeOfficeShifts: 0
            })
          }
          
          const metrics = userMap.get(shift.user.id)!
          metrics.totalShifts++
          
          if (nightShiftIds.has(shift.type)) {
            metrics.nightShifts++
          }
          if (isWeekend(new Date(shift.date))) {
            metrics.weekendShifts++
          }
          if (shift.isHomeOffice) {
            metrics.homeOfficeShifts++
          }
        })
        
        // Convert to array and sort by most night shifts, then weekend shifts
        const metricsArray = Array.from(userMap.values()).sort((a, b) => {
          if (b.nightShifts !== a.nightShifts) return b.nightShifts - a.nightShifts
          return b.weekendShifts - a.weekendShifts
        })
        
        setMetrics(metricsArray)
      }
    } catch (error) {
      console.error("Error fetching metrics", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (metrics.length === 0) return;
    
    // Create CSV content
    const headers = ["Agente", "Total Turnos", "Nocturnos (Fatiga)", "Fines de Semana", "Home Office"];
    const rows = metrics.map(m => [
      `"${m.name}"`, 
      m.totalShifts, 
      m.nightShifts, 
      m.weekendShifts,
      m.homeOfficeShifts
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `metricas_soc_${format(currentDate, 'yyyy_MM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    if (user) {
      fetchMetrics(currentDate)
    }
  }, [user, currentDate])

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return <div className="content-area">No autorizado</div>
  }

  return (
    <div className="content-area">
      <h1>{t.metrics.title}</h1>
      <p className="subtitle">{t.metrics.subtitle}</p>

      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="btn-primary"
            >
              ← {t.metrics.prevMonth}
            </button>
            
            <h2 style={{ textTransform: 'capitalize', margin: 0 }}>
              {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
            </h2>
            
            <button 
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="btn-primary"
            >
              {t.metrics.nextMonth} →
            </button>
          </div>
          
          <button 
            onClick={downloadCSV}
            disabled={metrics.length === 0}
            className="bg-soc-primary hover:bg-soc-primary/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            {t.metrics.exportCSV}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>{t.common.loading}</div>
        ) : metrics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            {t.metrics.noShifts}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>{t.metrics.agent}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>{t.metrics.totalShifts}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>{t.metrics.nightShifts}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>{t.metrics.weekendShifts}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>{t.metrics.homeOfficeCol}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-dark)', borderRadius: '12px' }}>
                        {m.totalShifts}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', 
                        background: m.nightShifts > 5 ? 'rgba(255, 77, 79, 0.2)' : 'var(--bg-dark)', 
                        color: m.nightShifts > 5 ? '#ff4d4f' : 'inherit',
                        borderRadius: '12px',
                        fontWeight: m.nightShifts > 5 ? 700 : 'normal'
                      }}>
                        {m.nightShifts}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', 
                        background: m.weekendShifts > 4 ? 'rgba(255, 153, 0, 0.2)' : 'var(--bg-dark)',
                        color: m.weekendShifts > 4 ? '#ff9900' : 'inherit', 
                        borderRadius: '12px',
                        fontWeight: m.weekendShifts > 4 ? 700 : 'normal'
                      }}>
                        {m.weekendShifts}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-dark)', borderRadius: '12px', color: 'var(--accent-blue)' }}>
                        {m.homeOfficeShifts}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <strong>{t.metrics.fatigueNoteTitle}</strong> {t.metrics.fatigueNoteText}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
