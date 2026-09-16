'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useLanguage } from '@/i18n/LanguageProvider'

type ShiftType = {
  id: string
  name: string
  time: string
  color: string
  isNight?: boolean
}

type Setting = {
  key: string
  value: string
}

const COLOR_OPTIONS = [
  { value: 'blue', label: '🔵 Azul', hex: '#3b82f6' },
  { value: 'indigo', label: '🟣 Índigo', hex: '#6366f1' },
  { value: 'purple', label: '🟪 Morado', hex: '#a855f7' },
  { value: 'pink', label: '🩷 Rosa', hex: '#ec4899' },
  { value: 'rose', label: '💖 Fucsia', hex: '#f43f5e' },
  { value: 'red', label: '🔴 Rojo', hex: '#ef4444' },
  { value: 'orange', label: '🟠 Naranja', hex: '#f97316' },
  { value: 'yellow', label: '🟡 Amarillo', hex: '#eab308' },
  { value: 'lime', label: '🍋 Lima', hex: '#84cc16' },
  { value: 'green', label: '🟢 Verde', hex: '#22c55e' },
  { value: 'emerald', label: '❇️ Esmeralda', hex: '#10b981' },
  { value: 'teal', label: '💠 Verde Azulado', hex: '#14b8a6' },
  { value: 'cyan', label: '🩵 Cian', hex: '#06b6d4' },
  { value: 'sky', label: '☁️ Celeste', hex: '#0ea5e9' },
  { value: 'gray', label: '🩶 Gris', hex: '#6b7280' },
  { value: 'slate', label: '🌚 Pizarra', hex: '#64748b' }
]

export default function SettingsAdmin() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [settings, setSettings] = useState<Setting[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [initialLoad, setInitialLoad] = useState(true)

  // Backup states
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupMessage, setBackupMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const typesSetting = data.settings.find((s: Setting) => s.key === 'shift_types')
        if (typesSetting) {
          setShiftTypes(JSON.parse(typesSetting.value))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setInitialLoad(false)
    }
  }

  const handleUpdateShift = (index: number, field: keyof ShiftType, value: string | boolean) => {
    const updated = [...shiftTypes]
    updated[index] = { ...updated[index], [field]: value }
    // Enforce uppercase NO_SPACES for ID if user edits it
    if (field === 'id') {
      updated[index].id = (value as string).toUpperCase().replace(/[^A-Z0-9_]/g, '')
    }
    setShiftTypes(updated)
  }

  const handleRemoveShift = (index: number) => {
    const shift = shiftTypes[index]
    if (confirm(`${t.settings.shiftDeleteConfirm} "${shift.name}"?\n\n${t.settings.shiftDeleteNote}`)) {
      setShiftTypes(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleAddShift = () => {
    setShiftTypes(prev => [
      ...prev, 
      { id: `TURNO_${Date.now().toString().slice(-4)}`, name: 'Nuevo Turno', time: '00:00 - 00:00', color: 'cyan', isNight: false }
    ])
  }

  const handleSave = async () => {
    // Validation
    const ids = shiftTypes.map(s => s.id)
    if (new Set(ids).size !== ids.length) {
      setMessage(t.settings.errorUniqueIds)
      return
    }
    if (shiftTypes.some(s => !s.id || !s.name)) {
      setMessage(t.settings.errorEmptyFields)
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const settings = [{ key: 'shift_types', value: JSON.stringify(shiftTypes) }]
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      if (res.ok) {
        setMessage(t.common.success)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(t.common.error)
      }
    } catch (err) {
      setMessage(t.common.error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadBackup = () => {
    window.open('/api/backup/download', '_blank')
  }

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm(`${t.settings.restoreConfirm} (${file.name})\n\n${t.settings.restoreWarning}`)) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setBackupLoading(true)
    setBackupMessage('')
    
    try {
      const formData = new FormData()
      formData.append('backupFile', file)

      const res = await fetch('/api/backup/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (res.ok) {
        setBackupMessage(t.settings.restoreSuccess)
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      } else {
        setBackupMessage(data.error || t.common.error)
      }
    } catch (err) {
      setBackupMessage(t.common.error)
    } finally {
      setBackupLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFactoryReset = async () => {
    if (!confirm(t.settings.factoryResetConfirm)) return
    if (!confirm(t.settings.factoryResetDoubleConfirm)) return

    setBackupLoading(true)
    setBackupMessage('')
    
    try {
      const res = await fetch('/api/backup/factory-reset', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setBackupMessage(t.settings.factoryResetSuccess)
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      } else {
        setBackupMessage(data.error || t.common.error)
        setBackupLoading(false)
      }
    } catch (err) {
      setBackupMessage(t.common.error)
      setBackupLoading(false)
    }
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return <div className="content-area">No autorizado - Se requiere rol SUPER_ADMIN</div>
  }

  return (
    <div className="content-area">
      <h1>{t.settings.title}</h1>
      <p className="subtitle">{t.settings.subtitle}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        {/* Columna Izquierda: Turnos */}
        <div className="panel" style={{ maxWidth: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem' }}>{t.settings.shiftManagement}</h2>
          <button onClick={handleAddShift} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            + {t.settings.addShift}
          </button>
        </div>
        
        {!initialLoad ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {shiftTypes.map((shift, index) => {
              return (
                <div key={index} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1.5fr 2fr 1fr auto auto', 
                  gap: '1rem', 
                  alignItems: 'end',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.settings.shiftCode}
                    </label>
                    <input 
                      type="text" 
                      value={shift.id}
                      onChange={e => handleUpdateShift(index, 'id', e.target.value)}
                      placeholder="Ej. TURNO_12H"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.settings.shiftNameTime}</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={shift.name}
                        onChange={e => handleUpdateShift(index, 'name', e.target.value)}
                        placeholder="Nombre"
                        style={{ flex: 1 }}
                      />
                      <input 
                        type="text" 
                        value={shift.time}
                        onChange={e => handleUpdateShift(index, 'time', e.target.value)}
                        placeholder="Horario"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.settings.shiftColor}</label>
                    <select 
                      value={shift.color}
                      onChange={e => handleUpdateShift(index, 'color', e.target.value)}
                      style={{ 
                        borderLeft: `4px solid ${COLOR_OPTIONS.find(c => c.value === shift.color)?.hex || 'transparent'}`,
                        color: COLOR_OPTIONS.find(c => c.value === shift.color)?.hex || 'inherit',
                        fontWeight: 'bold'
                      }}
                    >
                      {COLOR_OPTIONS.map(c => (
                        <option key={c.value} value={c.value} style={{ color: c.hex, fontWeight: 'bold' }}>
                          {(t.settings.colors as Record<string, string>)[c.value] || c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingBottom: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.settings.shiftNight}</label>
                    <input 
                      type="checkbox" 
                      checked={!!shift.isNight}
                      onChange={e => {
                        const updated = [...shiftTypes]
                        updated[index] = { ...updated[index], isNight: e.target.checked }
                        setShiftTypes(updated)
                      }}
                      title={t.settings.shiftNightTooltip}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                  </div>

                  <div style={{ paddingBottom: '0.2rem' }}>
                    <button 
                      onClick={() => handleRemoveShift(index)}
                      className="btn-danger"
                      title={t.common.delete}
                      style={{ padding: '0.6rem', cursor: 'pointer' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>

                </div>
              )
            })}

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={handleSave} disabled={loading} className="button" style={{ padding: '0.8rem 2rem' }}>
                {loading ? t.common.loading : t.common.save}
              </button>
              {message && <span style={{ color: message.includes('Error') ? '#ef4444' : 'var(--accent-green)', fontSize: '0.9rem', fontWeight: 500 }}>{message}</span>}
            </div>

          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.common.loading}</p>
        )}
        </div>

        {/* Columna Derecha: Backup & Restauración */}
        {user.role === 'SUPER_ADMIN' && (
          <div className="panel">
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>{t.settings.backupTitle}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Sección Descargar */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t.settings.downloadBackup}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {t.settings.backupSubtitle}
                </p>
                <button onClick={handleDownloadBackup} className="btn-primary" style={{ width: '100%' }}>
                  {t.settings.downloadBackup} dev.db
                </button>
              </div>

              {/* Sección Restaurar */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--accent-red)' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-red)' }}>{t.settings.restoreBackup}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {t.settings.restoreDesc}
                </p>
                
                <input 
                  type="file" 
                  accept=".db,.sqlite,.sqlite3" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleRestoreBackup}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={backupLoading}
                  className="btn-danger" 
                  style={{ width: '100%', padding: '0.6rem' }}
                >
                  {backupLoading ? t.common.loading : t.settings.uploadAndRestore}
                </button>
                {backupMessage && (
                  <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: backupMessage.includes('Error') ? '#ef4444' : 'var(--accent-green)', textAlign: 'center' }}>
                    {backupMessage}
                  </p>
                )}
              </div>

              {/* Sección Factory Reset */}
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid #ef4444' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#ef4444' }}>{t.settings.dangerZone}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {t.settings.factoryResetDesc}
                </p>
                <button 
                  onClick={handleFactoryReset} 
                  disabled={backupLoading}
                  className="btn-danger" 
                  style={{ width: '100%', padding: '0.6rem', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                >
                  {t.settings.factoryResetBtn}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
