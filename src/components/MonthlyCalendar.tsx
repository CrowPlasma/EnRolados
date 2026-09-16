'use client'

import React, { useState, useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useLanguage } from '@/i18n/LanguageProvider'

interface User {
  id: string
  name: string
  level: string
  defaultShift: string
}

interface Shift {
  id: string
  userId: string
  date: string
  type: string
  isHomeOffice: boolean
}

interface ShiftType {
  id: string
  name: string
  color: string
}

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function MonthlyCalendar() {
  const { t, language } = useLanguage()
  const MONTHS = language === 'en' ? MONTHS_EN : MONTHS_ES
  
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ users: User[], shifts: Shift[], shiftTypes: ShiftType[] } | null>(null)
  
  const reportRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/shifts/monthly-report?month=${month}&year=${year}`)
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else {
        alert(json.error || 'Error al cargar reporte')
      }
    } catch (e) {
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [month, year])

  const exportPDF = async () => {
    if (!reportRef.current) return
    const element = reportRef.current
    
    // Configurar html2canvas para mejor calidad
    const canvas = await html2canvas(element, {
      scale: 2, 
      useCORS: true,
      backgroundColor: '#1e293b' // var(--bg-dark)
    })
    
    const imgData = canvas.toDataURL('image/png')
    
    // PDF orientation: landscape. Format: a4 or custom depending on aspect ratio.
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a3'
    })
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    
    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight)
    pdf.save(`Calendario_${MONTHS[month]}_${year}.pdf`)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const getShiftColor = (colorCode: string) => {
    if (!colorCode) return 'var(--bg-dark)'
    if (colorCode.startsWith('#')) return colorCode
    switch (colorCode) {
      case 'blue': return '#3b82f6'
      case 'indigo': return '#6366f1'
      case 'purple': return '#a855f7'
      case 'pink': return '#ec4899'
      case 'rose': return '#f43f5e'
      case 'red': return '#ef4444'
      case 'orange': return '#f97316'
      case 'yellow': return '#eab308'
      case 'lime': return '#84cc16'
      case 'green': return '#22c55e'
      case 'emerald': return '#10b981'
      case 'teal': return '#14b8a6'
      case 'cyan': return '#06b6d4'
      case 'sky': return '#0ea5e9'
      case 'gray': return '#6b7280'
      case 'slate': return '#64748b'
      default: return 'var(--bg-dark)'
    }
  }

  // Get cell data for a specific user and day
  const getCellData = (userId: string, day: number) => {
    if (!data) return null
    // We compare by local date string part because DB returns ISO strings
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    const shift = data.shifts.find(s => {
      const sDate = new Date(s.date)
      // Ajuste de zona horaria simple
      const sDateStr = `${sDate.getUTCFullYear()}-${String(sDate.getUTCMonth() + 1).padStart(2, '0')}-${String(sDate.getUTCDate()).padStart(2, '0')}`
      return s.userId === userId && sDateStr === targetDateStr
    })

    if (!shift) return null

    const typeDef = data.shiftTypes.find(t => t.id === shift.type)
    return {
      type: shift.type,
      name: typeDef ? typeDef.name : shift.type,
      color: typeDef ? getShiftColor(typeDef.color) : 'transparent',
      isHomeOffice: shift.isHomeOffice
    }
  }

  // Group users by level, then by shift
  const groupedUsersByLevel = data?.users.reduce((acc, user) => {
    if ((user as any).showInCalendar === false) return acc;
    const levelKey = user.level || 'Sin Nivel'
    const shiftTypeDef = data.shiftTypes.find(t => t.id === user.defaultShift)
    const shiftKey = shiftTypeDef ? shiftTypeDef.name : (user.defaultShift || 'Sin Turno Asignado')
    
    if (!acc[levelKey]) acc[levelKey] = {}
    if (!acc[levelKey][shiftKey]) acc[levelKey][shiftKey] = []
    
    acc[levelKey][shiftKey].push(user)
    return acc
  }, {} as Record<string, Record<string, User[]>>)

  return (
    <div className="panel" style={{ marginTop: '2rem', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{t.calendar.viewAllMonth}</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '0.4rem', borderRadius: '4px' }}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: '80px', padding: '0.4rem', borderRadius: '4px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={fetchData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            {t.common.refresh}
          </button>
          <button onClick={exportPDF} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-green-dim)', color: 'var(--accent-green)' }}>
            {t.common.downloadPDF}
          </button>
        </div>
      </div>

      {loading && <p>{t.common.loading}</p>}
      
      {!loading && data && (
        <div ref={reportRef} style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px', minWidth: 'max-content' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#fff' }}>
            {t.calendar.title} - {MONTHS[month]} {year}
          </h3>

          {/* Leyenda */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#fff' }}>
            <div style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>{t.calendar.legend}</div>
            {data.shiftTypes.map(st => (
              <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '12px', height: '12px', background: st.color, borderRadius: '2px' }}></div>
                <span>{st.name}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🏠 Home Office</span>
            </div>
          </div>

          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.75rem', color: '#fff' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #334155', padding: '0.5rem', background: '#0f172a', textAlign: 'center', width: '90px' }}>{t.calendar.mainShift}</th>
                <th style={{ border: '1px solid #334155', padding: '0.5rem', background: '#0f172a', textAlign: 'left', minWidth: '200px' }}>{t.calendar.user}</th>
                {daysArray.map(day => {
                  const date = new Date(year, month, day)
                  const dayName = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'][date.getDay()]
                  const isSunday = date.getDay() === 0;
                  const rightBorder = isSunday ? '3px solid #94a3b8' : '1px solid #334155';
                  return (
                    <th key={day} style={{ border: '1px solid #334155', borderRight: rightBorder, padding: '0.3rem', background: '#0f172a', textAlign: 'center', minWidth: '40px' }}>
                      <div style={{ opacity: 0.7, fontSize: '0.65rem' }}>{dayName}</div>
                      <div>{day}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {groupedUsersByLevel && Object.entries(groupedUsersByLevel).map(([level, shiftsObj]) => (
                <React.Fragment key={level}>
                  {/* Fila separadora del grupo (Nivel) */}
                  <tr>
                    <td colSpan={1} style={{ background: '#0e7490', border: '1px solid #334155', padding: '0.5rem 1rem', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
                      {level}
                    </td>
                    <td colSpan={daysInMonth + 1} style={{ background: '#0e7490', border: '1px solid #334155', padding: '0.5rem 1rem' }}></td>
                  </tr>
                  
                  {/* Filas de usuarios del grupo */}
                  {Object.entries(shiftsObj).map(([shiftName, usersInShift]) => {
                    return usersInShift.map((user, index) => {
                      const userHasAnyShift = data.shifts.some(s => s.userId === user.id)
                      return (
                      <tr key={user.id}>
                        {/* Celda del turno (con rowspan para agrupar) */}
                        {index === 0 && (
                          <td rowSpan={usersInShift.length} style={{ border: '1px solid #334155', padding: '0.4rem', background: '#1e293b', fontWeight: 'bold', color: '#fff', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'normal', width: '90px' }}>
                            {shiftName}
                          </td>
                        )}
                        <td style={{ border: '1px solid #334155', padding: '0.4rem', background: '#0f172a', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                          {user.name}
                        </td>
                        {daysArray.map(day => {
                          const date = new Date(year, month, day)
                          const isSunday = date.getDay() === 0;
                          const rightBorder = isSunday ? '3px solid #94a3b8' : '1px solid #334155';
                          
                          const cell = getCellData(user.id, day)
                          if (!cell) {
                            return <td key={day} style={{ border: '1px solid #334155', borderRight: rightBorder, padding: '0.4rem', textAlign: 'center', color: '#64748b' }}>
                              {userHasAnyShift ? 'Descanso' : '-'}
                            </td>
                          }
                          
                          return (
                            <td key={day} style={{ 
                              border: '1px solid #334155', 
                              borderRight: rightBorder,
                              padding: '0.4rem', 
                              textAlign: 'center',
                              background: cell.color,
                              color: '#fff',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap'
                            }}>
                              {cell.name} {cell.isHomeOffice && '🏠'}
                            </td>
                          )
                        })}
                      </tr>
                      )
                    })
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
