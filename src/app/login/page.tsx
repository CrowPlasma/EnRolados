'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useLanguage } from '@/i18n/LanguageProvider'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const router = useRouter()
  const { setUser } = useAuth()
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || t.common.error)
      }
      
      if (data.requiresPasswordChange) {
        setRequiresPasswordChange(true)
        setTempToken(data.tempToken)
        return
      }

      setUser(data.user)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden') // Need to add to dictionary later if needed
      return
    }

    try {
      const res = await fetch('/api/auth/first-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, newPassword, email, phone })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t.common.error)
      
      setUser(data.user)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% -20%, rgba(16, 185, 129, 0.1), transparent 60%)',
      padding: '1rem'
    }}>
      <div className="panel" style={{ 
        maxWidth: '420px', 
        width: '100%', 
        textAlign: 'center',
        padding: '3rem 2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        borderRadius: '16px',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            padding: '1rem', 
            borderRadius: '50%', 
            marginBottom: '1.25rem',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="var(--bg-dark)" />
              <path d="M8 3v4" />
              <path d="M16 3v4" />
              <path d="M6 9h12" />
              <rect x="8.5" y="12" width="2" height="2" fill="currentColor" stroke="none" />
              <rect x="13.5" y="12" width="2" height="2" fill="currentColor" stroke="none" />
              <rect x="8.5" y="16" width="2" height="2" fill="currentColor" stroke="none" />
              <rect x="13.5" y="16" width="2" height="2" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.75rem', 
            fontWeight: 700, 
            letterSpacing: '3px',
            color: 'var(--text-main)',
            textTransform: 'uppercase'
          }}>
            ENROLADOS
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '1px' }}>{t.login.portal}</p>
        </div>

        {requiresPasswordChange ? (
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                {t.login.securityNotice}
              </p>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                placeholder={t.login.newPassword} 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.2)' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                placeholder={t.login.confirmPassword} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.2)' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                placeholder={t.login.email} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.2)' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type="tel" 
                placeholder={t.login.phone} 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.2)' }}
              />
            </div>
            
            {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>{error}</p>}
            
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.875rem', fontWeight: 600, letterSpacing: '1px' }}>
              {t.login.updateCredentials}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ position: 'relative', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '1px' }}>{t.login.userId}</label>
              <input 
                type="text" 
                placeholder={t.login.userIdPlaceholder} 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.2)', fontSize: '1rem' }}
              />
            </div>
            <div style={{ position: 'relative', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '1px' }}>{t.login.password}</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.2)', fontSize: '1rem', letterSpacing: '2px' }}
              />
            </div>
            
            {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>{error}</p>}
            
            <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '0.875rem', fontWeight: 600, letterSpacing: '1px', fontSize: '0.95rem' }}>
              {t.login.accessSystem}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
