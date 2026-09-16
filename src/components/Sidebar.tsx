'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/i18n/LanguageProvider'

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const { language, setLanguage, t } = useLanguage()

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    const initial = saved || 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es')
  }

  if (pathname === '/login') return null

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ width: collapsed ? '72px' : '260px', transition: 'width 0.3s ease', overflow: 'hidden' }}>
      {/* Logo */}
      <div className="sidebar-header" style={{ 
        display: 'flex', 
        flexDirection: collapsed ? 'row' : 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: collapsed ? '1.5rem 0' : '2rem 1rem 1.5rem',
        gap: collapsed ? '0' : '0.75rem'
      }}>
        <svg width={collapsed ? "24" : "40"} height={collapsed ? "24" : "40"} viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth={collapsed ? "1.8" : "1.5"} strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: collapsed ? '24px' : '40px' }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="var(--bg-dark)" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M6 9h12" />
          <rect x="8.5" y="12" width="2" height="2" fill="currentColor" stroke="none" />
          <rect x="13.5" y="12" width="2" height="2" fill="currentColor" stroke="none" />
          <rect x="8.5" y="16" width="2" height="2" fill="currentColor" stroke="none" />
          <rect x="13.5" y="16" width="2" height="2" fill="currentColor" stroke="none" />
        </svg>
        {!collapsed && <h2 style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '2px' }}>ENROLADOS</h2>}
      </div>

      {/* Nav section label */}
      {!collapsed && (
        <div className="nav-section-label">{t.sidebar.modules}</div>
      )}

      {/* Navigation */}
      <nav className="nav-menu" style={{ padding: collapsed ? '0.5rem' : '0 0.75rem' }}>
        <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`} title={t.sidebar.dashboard} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '17px' }}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          {!collapsed && t.sidebar.dashboard}
        </Link>
        <Link href="/calendar" className={`nav-item ${pathname === '/calendar' ? 'active' : ''}`} title={t.sidebar.monthlyCalendar} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '17px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          {!collapsed && t.sidebar.monthlyCalendar}
        </Link>

        {user?.role !== 'AGENT' && (
          <>
            <Link href="/admin/users" className={`nav-item ${pathname === '/admin/users' ? 'active' : ''}`} title={t.sidebar.userManagement} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '17px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              {!collapsed && t.sidebar.userManagement}
            </Link>
            <Link href="/admin/shifts" className={`nav-item ${pathname === '/admin/shifts' ? 'active' : ''}`} title={t.sidebar.monthlyPlanner} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '17px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              {!collapsed && t.sidebar.monthlyPlanner}
            </Link>
            <Link href="/admin/metrics" className={`nav-item ${pathname === '/admin/metrics' ? 'active' : ''}`} title={t.sidebar.metrics} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '17px' }}><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
              {!collapsed && t.sidebar.metrics}
            </Link>
            <Link href="/admin/absences" className={`nav-item ${pathname === '/admin/absences' ? 'active' : ''}`} title={t.sidebar.absences} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '17px' }}><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
              {!collapsed && t.sidebar.absences}
            </Link>
            {user?.role === 'SUPER_ADMIN' && (
              <>
                <Link href="/admin/audit" className={`nav-item ${pathname === '/admin/audit' ? 'active' : ''}`} title={t.sidebar.audit} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '17px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  {!collapsed && t.sidebar.audit}
                </Link>
                <Link href="/admin/settings" className={`nav-item ${pathname === '/admin/settings' ? 'active' : ''}`} title={t.sidebar.settings} style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '17px' }}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  {!collapsed && t.sidebar.settings}
                </Link>
              </>
            )}
          </>
        )}
      </nav>

      {/* Bottom: theme toggle + language + user + logout */}
      {user && (
        <div style={{
          padding: collapsed ? '1rem 0.5rem' : '1rem 0.75rem',
          borderTop: '1px solid var(--border-color)',
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {/* Lang toggle */}
          <button
            onClick={toggleLanguage}
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: collapsed ? '0.6rem' : '0.55rem 0.9rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '0.65rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '16px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            {!collapsed && (language === 'es' ? 'English' : 'Español')}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Tema Claro' : 'Tema Oscuro'}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: collapsed ? '0.6rem' : '0.55rem 0.9rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '0.65rem',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '16px' }}>
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '16px' }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            {!collapsed && (theme === 'dark' ? 'Tema Claro' : 'Tema Oscuro')}
          </button>

          {/* User info */}
          {!collapsed && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.1rem 0' }}>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{user.name}</span>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1px' }}>{user.role}</span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            title={t.sidebar.logout}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              padding: collapsed ? '0.6rem' : '0.55rem 0.9rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '0.65rem',
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ minWidth: '15px' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            {!collapsed && t.sidebar.logout}
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? t.sidebar.expand : t.sidebar.collapse}
        style={{
          position: 'absolute',
          right: '-13px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          zIndex: 50,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: 'all 0.18s ease',
          fontSize: '1rem',
          lineHeight: 1,
          padding: 0
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-green-dim)'; e.currentTarget.style.color = 'var(--accent-green)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        <span style={{ transform: collapsed ? 'translateX(1px)' : 'translateX(-1px)', display: 'block' }}>
          {collapsed ? '›' : '‹'}
        </span>
      </button>
    </aside>
  )
}
