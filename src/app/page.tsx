'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks, isSameDay } from 'date-fns'
import { useLanguage } from '@/i18n/LanguageProvider'
import { enUS, es as esLocale } from 'date-fns/locale'

type Shift = {
  id: string
  userId: string
  date: string
  type: string
  user: { name: string, level: string, email: string, phone: string }
  isHomeOffice?: boolean
}

type ShiftType = {
  id: string
  name: string
  time: string
  color: string
}

const getShiftColor = (colorCode: string) => {
  if (!colorCode) return 'var(--bg-card)'
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
    default: return 'var(--bg-card)'
  }
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t, language } = useLanguage()
  const dateLocale = language === 'en' ? enUS : esLocale
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [fetching, setFetching] = useState(true)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  // Modal states
  const [selectedAgent, setSelectedAgent] = useState<Shift['user'] | null>(null)
  const [quickAssignDay, setQuickAssignDay] = useState<Date | null>(null)
  const [quickAssignData, setQuickAssignData] = useState({ userId: '', type: '', isHomeOffice: false })
  const [agentSearch, setAgentSearch] = useState('')

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }) // Sunday
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const shiftTypes: ShiftType[] = useMemo(() => {
    if (settings['shift_types']) {
      try {
        return JSON.parse(settings['shift_types'])
      } catch (e) {
        return []
      }
    }
    return []
  }, [settings])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const settingsMap: Record<string, string> = {}
        data.settings.forEach((s: any) => { settingsMap[s.key] = s.value })
        setSettings(settingsMap)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchUsers()
  }, [])

  const fetchShifts = async () => {
    setFetching(true)
    try {
      const res = await fetch(`/api/shifts?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setShifts(data.shifts || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchShifts()
    }
  }, [user, currentDate])

  const handleDeleteShift = async (shiftId: string) => {
    if (!window.confirm('¿Eliminar este turno?')) return
    
    // Optimistic update
    const previousShifts = [...shifts]
    setShifts(prev => prev.filter(s => s.id !== shiftId))
    
    try {
      const res = await fetch('/api/shifts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId })
      })
      if (!res.ok) throw new Error('Error deleting shift')
    } catch (err) {
      alert('Hubo un error al eliminar el turno')
      setShifts(previousShifts)
    }
  }



  const handleQuickAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickAssignDay || !quickAssignData.userId || !quickAssignData.type) return

    const targetDateStr = format(quickAssignDay, 'yyyy-MM-dd')
    
    // Check conflicts (same user, same type, same day)
    const hasConflict = shifts.some(s => 
      s.userId === quickAssignData.userId && 
      format(new Date(s.date), 'yyyy-MM-dd') === targetDateStr && 
      s.type === quickAssignData.type
    )
    
    if (hasConflict) {
      alert('Este agente ya tiene un turno de este mismo tipo asignado en este día.')
      return
    }

    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: quickAssignData.userId,
          date: targetDateStr,
          type: quickAssignData.type,
          isHomeOffice: quickAssignData.isHomeOffice
        })
      })
      
      if (res.ok) {
        setQuickAssignDay(null)
        setQuickAssignData({ userId: '', type: '', isHomeOffice: false })
        setAgentSearch('')
        fetchShifts() // Refresh to get populated user details
      } else {
        const data = await res.json()
        alert(data.error || 'Error al asignar turno')
      }
    } catch (err) {
      alert('Error de red al intentar asignar turno')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return

    const shiftId = active.id as string
    const targetDate = over.id as string
    const draggedShift = shifts.find(s => s.id === shiftId)

    if (draggedShift && format(new Date(draggedShift.date), 'yyyy-MM-dd') !== targetDate) {
      // Check if user already has a shift of this type on target date
      const hasConflict = shifts.some(s => s.userId === draggedShift.userId && format(new Date(s.date), 'yyyy-MM-dd') === targetDate && s.type === draggedShift.type && s.id !== shiftId)
      
      if (hasConflict) {
        alert('Este agente ya tiene un turno de este tipo asignado en el día destino.')
        return
      }

      // Optimizacion UX: Actualizar estado local primero
      const originalDate = draggedShift.date
      
      // Update local state temporarily with a fake UTC date so it displays correctly
      const [y, m, d] = targetDate.split('-').map(Number)
      const fakeDate = new Date(Date.UTC(y, m - 1, d, 12)).toISOString()
      
      setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, date: fakeDate } : s))

      // API Call
      const res = await fetch(`/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: targetDate })
      })

      if (!res.ok) {
        // Revert si falla
        setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, date: originalDate } : s))
        const errData = await res.json()
        alert(`Error al mover el turno: ${errData.error || 'Desconocido'}`)
      }
    }
  }

  if (loading || !user) return <div className="content-area">{t.common.loading}</div>

  return (
    <div className="content-area">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            {t.dashboard.calendarTitle}
          </h1>
          <p className="subtitle" style={{ margin: 0 }}>{t.dashboard.calendarSubtitle}</p>
        </div>
        
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder={t.dashboard.searchAgent} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', width: '250px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} style={{ background: 'transparent', border: 'none', padding: '0.4rem', color: 'var(--text-muted)' }} title={t.dashboard.prevWeek}>◀</button>
            <div style={{ position: 'relative' }}>
              <input 
                type="date"
                title="Ir a una fecha específica"
                value={format(currentDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    setCurrentDate(new Date(e.target.value + 'T12:00:00Z'))
                  }
                }}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
            <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} style={{ background: 'transparent', border: 'none', padding: '0.4rem', color: 'var(--text-muted)' }} title={t.dashboard.nextWeek}>▶</button>
          </div>
        </div>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="calendar-grid" style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          {days.map((day) => (
            <DroppableDay 
              key={day.toISOString()} 
              day={day} 
              shifts={shifts} 
              shiftTypes={shiftTypes} 
              searchQuery={searchQuery}
              onAgentClick={(agentUser) => setSelectedAgent(agentUser)}
              onQuickAssignClick={setQuickAssignDay}
              onDelete={handleDeleteShift}
            />
          ))}
        </div>
      </DndContext>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedAgent(null)}>
          <div className="panel" style={{ width: '400px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedAgent(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
            >✕</button>
            
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {selectedAgent.name}
              <span style={{ background: 'var(--accent-purple)', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {selectedAgent.level || 'N1'}
              </span>
            </h2>
            <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Información de Contacto SOC</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</div>
                  <div style={{ fontWeight: 500 }}>{selectedAgent.email || 'No especificado'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--neon-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Teléfono</div>
                  <div style={{ fontWeight: 500 }}>{selectedAgent.phone || 'No especificado'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Assign Modal */}
      {quickAssignDay && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setQuickAssignDay(null)}>
          <div className="panel" style={{ width: '400px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setQuickAssignDay(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
            >✕</button>
            
            <h2 style={{ marginBottom: '1.5rem' }}>{t.dashboard.quickAssign}</h2>
            <p className="subtitle" style={{ marginBottom: '1rem' }}>
              {t.dashboard.day} {format(quickAssignDay, 'EEEE d, MMMM yyyy', { locale: dateLocale })}
            </p>
            
            <form onSubmit={handleQuickAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t.dashboard.agent}</label>
                <input 
                  type="text"
                  placeholder={t.dashboard.searchAgentName}
                  value={agentSearch}
                  onChange={e => setAgentSearch(e.target.value)}
                  className="input"
                  style={{ marginBottom: '0.5rem' }}
                />
                <div style={{ 
                  maxHeight: '160px', 
                  overflowY: 'auto', 
                  background: 'var(--bg-dark)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '4px'
                }}>
                  {users.filter(u => u.name.toLowerCase().includes(agentSearch.toLowerCase())).map(u => (
                    <div 
                      key={u.id}
                      onClick={() => setQuickAssignData({ ...quickAssignData, userId: u.id })}
                      style={{
                        padding: '0.5rem 0.8rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: quickAssignData.userId === u.id ? 'var(--accent-purple)' : 'transparent',
                        color: quickAssignData.userId === u.id ? '#fff' : 'var(--text-main)',
                        fontSize: '0.85rem',
                        transition: 'background 0.2s',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onMouseEnter={e => { if (quickAssignData.userId !== u.id) e.currentTarget.style.background = 'var(--bg-darker)' }}
                      onMouseLeave={e => { if (quickAssignData.userId !== u.id) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{u.level || 'N1'}</span>
                    </div>
                  ))}
                  {users.filter(u => u.name.toLowerCase().includes(agentSearch.toLowerCase())).length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {t.common.search}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{t.dashboard.shiftType}</label>
                <select 
                  className="input"
                  value={quickAssignData.type} 
                  onChange={e => setQuickAssignData({...quickAssignData, type: e.target.value})} 
                  required
                >
                  <option value="">{t.dashboard.selectShift}</option>
                  {shiftTypes.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={quickAssignData.isHomeOffice}
                  onChange={e => setQuickAssignData({...quickAssignData, isHomeOffice: e.target.checked})}
                />
                🏠 {t.dashboard.markHomeOffice}
              </label>

              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
                {t.dashboard.assignShift}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// -- Componentes DND internos --

import { useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

function DroppableDay({ 
  day, 
  shifts, 
  shiftTypes, 
  searchQuery,
  onAgentClick,
  onQuickAssignClick,
  onDelete
}: { 
  day: Date, 
  shifts: Shift[], 
  shiftTypes: ShiftType[],
  searchQuery: string,
  onAgentClick: (u: Shift['user']) => void,
  onQuickAssignClick: (d: Date) => void,
  onDelete: (id: string) => void
}) {
  const { language, t } = useLanguage()
  const dateLocale = language === 'en' ? enUS : esLocale
  const dayStr = format(day, 'yyyy-MM-dd')
  const { isOver, setNodeRef } = useDroppable({ id: dayStr })
  
  const dayShifts = shifts.filter(s => {
    if (format(new Date(s.date), 'yyyy-MM-dd') !== dayStr) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.user.name.toLowerCase().includes(q) || (s.user.level && s.user.level.toLowerCase().includes(q));
  })
  
  return (
    <div 
      ref={setNodeRef}
      className="calendar-day" 
      style={{ 
        borderColor: isOver ? 'var(--accent-green)' : 'var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 250px)'
      }}
    >
      <div className="day-header" style={{ position: 'sticky', top: 0, background: 'var(--bg-dark)', zIndex: 2 }}>
        {format(day, 'eeee d', { locale: dateLocale }).toUpperCase()}
      </div>
      <div className="day-content" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', position: 'relative' }}>
        {dayShifts.map(shift => (
            <DraggableShift 
              key={shift.id} 
              shift={shift} 
              shiftTypes={shiftTypes} 
              searchQuery={searchQuery}
            onClick={() => onAgentClick(shift.user)}
            onDelete={() => onDelete(shift.id)}
          />
        ))}
        {dayShifts.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem', display: 'block' }}>{t.dashboard.free}</span>}
      </div>
      <button 
        onClick={() => onQuickAssignClick(day)}
        style={{ 
          background: 'var(--bg-card)', 
          border: '1px dashed var(--border-color)', 
          color: 'var(--text-muted)', 
          padding: '0.5rem', 
          margin: '0.5rem', 
          borderRadius: '6px', 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '0.8rem'
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-main)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
      >
        {t.dashboard.addShift}
      </button>
    </div>
  )
}

function DraggableShift({ shift, shiftTypes, searchQuery, onClick, onDelete }: { shift: Shift, shiftTypes: ShiftType[], searchQuery: string, onClick: () => void, onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: shift.id })

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: 10,
    opacity: 0.9,
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
  } : {
    transition: 'opacity 0.2s ease',
    cursor: 'pointer'
  }

  const shiftConfig = shiftTypes.find(st => st.id === shift.type)
  const timeLabel = shiftConfig?.time || ''
  const shiftName = shiftConfig?.name || shift.type
  const colorHex = shiftConfig?.color ? getShiftColor(shiftConfig.color) : 'var(--bg-card)'

  const isHO = (shift as any).isHomeOffice === true

  return (
    <div 
      ref={setNodeRef} 
      style={{ 
        ...style, 
        position: 'relative',
        ...(isHO ? { 
          boxShadow: '0 0 0 1.5px rgba(6,182,212,0.6), inset 0 0 8px rgba(6,182,212,0.08)',
          borderColor: 'rgba(6,182,212,0.5)'
        } : {})
      }} 
      className="shift-card"
      onClick={(e) => {
        if (!transform) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      {/* Delete button (X) */}
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          background: 'rgba(255,50,50,0.1)',
          border: '1px solid rgba(255,50,50,0.3)',
          color: '#ff6b6b',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '10px',
          padding: 0,
          zIndex: 20
        }}
        title="Eliminar turno"
      >
        ✕
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="name" style={{ fontSize: '0.85rem' }}>
            {isHO && <span title="Home Office" style={{ marginRight: '3px', fontSize: '0.75rem' }}>🏠</span>}
            {shift.user.name}
          </div>
          {shift.user.level && (
            <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', color: 'var(--text-muted)', display: 'inline-block', marginTop: '2px' }}>
              {shift.user.level}
            </span>
          )}
        </div>
        <div 
          {...listeners} 
          {...attributes} 
          style={{ cursor: 'grab', padding: '0 4px', opacity: 0.5, marginLeft: '4px' }}
          title="Arrastrar turno"
        >
          <svg width="12" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
        </div>
      </div>
      <span className="type" style={{ fontSize: '0.75rem', padding: '0.3rem', marginTop: '0.2rem', background: `color-mix(in srgb, ${colorHex} 15%, transparent)`, color: colorHex, border: `1px solid color-mix(in srgb, ${colorHex} 30%, transparent)`, borderRadius: '4px', display: 'inline-block', width: '100%' }}>
        {shiftName}
        {timeLabel && <span style={{ display: 'block', fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>{timeLabel}</span>}
      </span>
    </div>
  )
}
