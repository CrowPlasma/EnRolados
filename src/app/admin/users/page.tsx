'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import MonthlyCalendar from '@/components/MonthlyCalendar'

import { useLanguage } from '@/i18n/LanguageProvider'

type User = {
  id: string
  username: string
  name: string
  role: string
  defaultShift?: string
  workDays?: string | Record<string, string>
  level?: string
  email?: string
  phone?: string
}

const DEFAULT_WORK_DAYS = {}

const getShiftColor = (colorCode: string) => {
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

export default function UsersAdmin() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [shiftTypes, setShiftTypes] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'AGENT',
    workDays: { ...DEFAULT_WORK_DAYS } as Record<string, string>,
    homeOfficeDays: [] as number[],
    level: 'N1',
    email: '',
    phone: ''
  })

  useEffect(() => {
    fetchUsers()
    fetchShiftTypes()
  }, [])

  const fetchShiftTypes = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const typesSetting = data.settings.find((s: any) => s.key === 'shift_types')
        if (typesSetting) {
          setShiftTypes(JSON.parse(typesSetting.value))
        }
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
        setUsers(data.users)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDayToggle = (day: number, shiftType: string) => {
    setFormData(prev => {
      const newDays = { ...prev.workDays }
      if (shiftType === "OFF") {
        delete newDays[day.toString()]
      } else {
        newDays[day.toString()] = shiftType
      }
      return { ...prev, workDays: newDays }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Usuario creado exitosamente.')
        setFormData({ username: '', name: '', role: 'AGENT', workDays: { ...DEFAULT_WORK_DAYS }, homeOfficeDays: [], level: 'N1', email: '', phone: '' })
        fetchUsers()
      } else {
        setMessage(data.error || 'Error al crear usuario')
      }
    } catch (err) {
      setMessage('Error de red')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const csvContent = "nombre completo,usuario,correo,telefono,nivel\nEjemplo Nombre,ejemplo.usuario,correo@ejemplo.com,5551234567,N1\n"
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'plantilla_usuarios.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUploadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setMessage('')
    
    const formData = new FormData()
    formData.append('csvFile', file)

    try {
      const res = await fetch('/api/users/bulk-upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        fetchUsers()
      } else {
        setMessage(data.error || 'Error al subir el CSV')
      }
      if (data.errors && data.errors.length > 0) {
        console.error('Errores en CSV:', data.errors)
        alert('Se crearon algunos usuarios pero hubo errores (ver consola):\n' + data.errors.slice(0, 5).join('\n') + (data.errors.length > 5 ? '\n...' : ''))
      }
    } catch (err) {
      setMessage('Error de red al subir CSV')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }


  const [resetPasswordUser, setResetPasswordUser] = useState<{id: string, username: string} | null>(null)
  const [newPasswordValue, setNewPasswordValue] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth())
  const [targetYear, setTargetYear] = useState(new Date().getFullYear())
  const [editData, setEditData] = useState({
    workDays: {} as Record<string, string>,
    homeOfficeDays: [] as number[],
    role: 'AGENT',
    level: 'N1',
    email: '',
    phone: '',
    showInCalendar: true,
    defaultShift: 'MORNING'
  })

  const openEditModal = (u: User) => {
    setEditingUser(u)
    let parsedWorkDays = typeof u.workDays === 'string' ? JSON.parse(u.workDays) : (u.workDays || {})
    
    // Legacy support
    if (Array.isArray(parsedWorkDays)) {
      const defaultShift = u.defaultShift || 'MORNING'
      const legacyObj: Record<string, string> = {}
      parsedWorkDays.forEach((d: number) => { legacyObj[d.toString()] = defaultShift })
      parsedWorkDays = legacyObj
    }
    // Sanitize workDays against current shiftTypes to prevent ghost shifts (like "MORNING")
    const validShiftIds = shiftTypes.map(st => st.id);
    const sanitizedWorkDays: Record<string, string> = {};
    for (const [day, shiftId] of Object.entries(parsedWorkDays)) {
      if (typeof shiftId === 'string' && validShiftIds.includes(shiftId)) {
        sanitizedWorkDays[day] = shiftId;
      }
    }
    parsedWorkDays = sanitizedWorkDays;

    const parsedHoDays: number[] = JSON.parse((u as any).homeOfficeDays || '[]')

    setEditData({
      workDays: parsedWorkDays,
      homeOfficeDays: parsedHoDays,
      role: u.role,
      level: u.level || 'N1',
      email: u.email || '',
      phone: u.phone || '',
      showInCalendar: (u as any).showInCalendar ?? true,
      defaultShift: u.defaultShift || 'MORNING'
    })
  }

  const handleEditDayToggle = (day: number, shiftType: string) => {
    setEditData(prev => {
      const newDays = { ...prev.workDays }
      if (shiftType === "OFF") {
        delete newDays[day.toString()]
      } else {
        newDays[day.toString()] = shiftType
      }
      return { ...prev, workDays: newDays }
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const payload = { ...editData, targetMonth, targetYear }
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setEditingUser(null)
        fetchUsers()
      } else {
        alert('Error al actualizar usuario')
      }
    } catch (err) {
      alert('Error de red')
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${name}? Esta acción borrará todos sus turnos y no se puede deshacer.`)) {
      return
    }
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchUsers()
      } else {
        alert('Error al eliminar usuario. Puede que no tengas permisos.')
      }
    } catch (err) {
      alert('Error de red al intentar eliminar')
    }
  }

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return <div className="content-area">No autorizado</div>
  }

  const DAY_LABELS = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' }

  return (
    <div className="content-area">
      <h1>{t.users.title}</h1>
      <p className="subtitle">{t.users.subtitle}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="panel">
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{t.users.createNew}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder={t.users.fullName} 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required 
            />
            <input 
              type="text" 
              placeholder={t.users.username} 
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              required 
            />
            
            <div style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', padding: '0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              ℹ️ {t.users.defaultPassNotice}
            </div>

            <select 
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="AGENT">AGENTE</option>
              <option value="ADMIN">ADMIN</option>
              {user?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">SUPER ADMIN</option>}
            </select>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t.users.levelOrRole}</label>
              <input 
                type="text" 
                list="level-options"
                placeholder="Ej. N1, N2, Gerente, Analista"
                value={formData.level} 
                onChange={e => setFormData({...formData, level: e.target.value})}
                required
              />
              <datalist id="level-options">
                <option value="N1" />
                <option value="N2" />
                <option value="N3" />
                <option value="Gerente" />
              </datalist>
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? t.common.loading : t.users.createUserBtn}
            </button>
            {message && <p style={{ color: 'var(--accent-green)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{message}</p>}
          </form>
        </div>

        <div className="panel">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{t.users.bulkUpload}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {t.users.bulkUploadDesc}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            <button onClick={handleDownloadTemplate} className="btn-secondary">
              ⬇️ {t.users.downloadTemplate}
            </button>
            <input 
              type="file" 
              accept=".csv" 
              id="csvUpload" 
              style={{ display: 'none' }}
              onChange={handleUploadCSV}
            />
            <button onClick={() => document.getElementById('csvUpload')?.click()} className="btn-primary">
              ⬆️ {t.users.uploadCSV}
            </button>
          </div>
        </div>
      </div>

        <div style={{ position: 'relative' }}>
          <div className="panel" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', flexShrink: 0 }}>{t.users.userList}</h2>
          
          <input 
            type="text" 
            placeholder={t.users.searchUser}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ marginBottom: '1rem', width: '100%', padding: '0.6rem', borderRadius: '6px', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem', minHeight: 0 }}>
            {users.filter(u => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.level && u.level.toLowerCase().includes(q));
            }).map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username} • {u.role}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => openEditModal(u)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--bg-darker)' }}>
                    {t.common.edit}
                  </button>
                  <button onClick={() => {
                    setResetPasswordUser({id: u.id, username: u.username})
                    setNewPasswordValue('')
                  }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} className="btn-primary">
                    {t.users.passwordBtn}
                  </button>
                  {user?.role === 'SUPER_ADMIN' && u.id !== user?.id && (
                    <button onClick={() => handleDeleteUser(u.id, u.name)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#ff4d4f', borderColor: '#ff4d4f', background: 'transparent' }} className="btn-primary">
                      {t.common.delete}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      <MonthlyCalendar />

      {/* Modal de Edición */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="panel" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1rem' }}>Editar a {editingUser.name}</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {user?.role === 'SUPER_ADMIN' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Rol</label>
                  <select 
                    value={editData.role} 
                    onChange={e => setEditData({...editData, role: e.target.value})}
                  >
                    <option value="AGENT">AGENTE</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nivel o Puesto</label>
                <input 
                  type="text" 
                  list="level-options"
                  value={editData.level} 
                  onChange={e => setEditData({...editData, level: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Turno Principal (Agrupación en Calendario)</label>
                <select 
                  value={editData.defaultShift} 
                  onChange={e => setEditData({...editData, defaultShift: e.target.value})}
                >
                  <option value="">Sin Turno Asignado</option>
                  {shiftTypes.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Mes a programar</label>
                  <select value={targetMonth} onChange={e => setTargetMonth(parseInt(e.target.value))}>
                    {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Año</label>
                  <select value={targetYear} onChange={e => setTargetYear(parseInt(e.target.value))}>
                    {[2025, 2026, 2027, 2028].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Horario por Día</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {(() => {
                    const renderDayInput = (day: number) => {
                      const isWorking = editData.workDays[day.toString()] && editData.workDays[day.toString()] !== 'OFF'
                      const isHO = editData.homeOfficeDays.includes(day)
                      return (
                        <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.6rem', background: isHO ? 'rgba(6,182,212,0.12)' : 'var(--bg-dark)', borderRadius: '6px', border: isHO ? '1px solid rgba(6,182,212,0.4)' : '1px solid transparent' }}>
                          <span style={{ fontSize: '0.85rem', width: '90px', flexShrink: 0 }}>{DAY_LABELS[day as keyof typeof DAY_LABELS]}</span>
                          <select
                            value={editData.workDays[day.toString()] || 'OFF'}
                            onChange={(e) => handleEditDayToggle(day, e.target.value)}
                            style={{ padding: '0.25rem 0.4rem', fontSize: '0.82rem', flex: 1 }}
                          >
                            <option value="OFF">Descanso</option>
                            {shiftTypes.map(st => (
                              <option key={st.id} value={st.id}>{st.name}</option>
                            ))}
                          </select>
                          {isWorking && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: isHO ? '#06b6d4' : 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              <input
                                type="checkbox"
                                checked={isHO}
                                onChange={(e) => {
                                  setEditData(prev => ({
                                    ...prev,
                                    homeOfficeDays: e.target.checked
                                      ? [...prev.homeOfficeDays, day]
                                      : prev.homeOfficeDays.filter(d => d !== day)
                                  }))
                                }}
                                style={{ accentColor: '#06b6d4' }}
                              />
                              🏠 HO
                            </label>
                          )}
                        </div>
                      )
                    }

                    return (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                          {[1,2,3,4].map(renderDayInput)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                          {[5,6,7].map(renderDayInput)}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Vista Previa de Horario</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {[1,2,3,4,5,6,7].map(day => {
                    const shiftId = editData.workDays[day.toString()] || 'OFF'
                    const isHO = editData.homeOfficeDays.includes(day)
                    const shift = shiftId === 'OFF' ? null : shiftTypes.find(s => s.id === shiftId)
                    const color = shift ? getShiftColor((shift as any).color) : 'var(--bg-dark)'
                    
                    return (
                      <div key={day} style={{ display: 'flex', flexDirection: 'column', background: color, color: shift ? '#fff' : 'var(--text-muted)', padding: '0.5rem', borderRadius: '4px', border: isHO ? '2px solid #06b6d4' : '1px solid transparent', textAlign: 'center', fontSize: '0.7rem' }}>
                        <span style={{ fontWeight: 600, opacity: 0.8, marginBottom: '0.2rem' }}>{DAY_LABELS[day as keyof typeof DAY_LABELS].substring(0,3).toUpperCase()}</span>
                        {shift ? shift.name : 'Descanso'}
                        {isHO && <span style={{ marginTop: '0.2rem' }}>🏠 HO</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  <input
                    type="checkbox"
                    checked={editData.showInCalendar}
                    onChange={e => setEditData({...editData, showInCalendar: e.target.checked})}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-green)' }}
                  />
                  <span>Mostrar en el calendario mensual</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
                <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, background: 'var(--bg-darker)' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Reset Password */}
      {resetPasswordUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="panel" style={{ width: '400px', position: 'relative' }}>
            <h2 style={{ marginBottom: '1rem' }}>Contraseña para @{resetPasswordUser.username}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (newPasswordValue.length < 8) {
                alert('La contraseña debe tener al menos 8 caracteres')
                return
              }
              setLoading(true)
              const res = await fetch('/api/users/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: resetPasswordUser.id, newPassword: newPasswordValue })
              })
              setLoading(false)
              if (res.ok) {
                setMessage(`Contraseña de @${resetPasswordUser.username} actualizada`)
                setTimeout(() => setMessage(''), 3000)
                setResetPasswordUser(null)
              } else {
                alert('Error al actualizar contraseña')
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="password" 
                placeholder="Nueva contraseña (min 8)" 
                value={newPasswordValue}
                onChange={e => setNewPasswordValue(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: '0.8rem' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Guardando...' : 'Cambiar'}</button>
                <button type="button" onClick={() => setResetPasswordUser(null)} style={{ flex: 1, background: 'var(--bg-darker)' }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
