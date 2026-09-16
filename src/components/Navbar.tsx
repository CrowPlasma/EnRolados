'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'

export function Navbar() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <nav className="nav-bar">
      <div>
        <h2 className="neon-text" style={{ margin: 0 }}>EnRolados</h2>
      </div>
      <div className="nav-links">
        <Link href="/">Horarios</Link>
        {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
          <>
            <Link href="/admin/users">Gestión de Usuarios</Link>
            <Link href="/admin/shifts">Asignar Turnos</Link>
          </>
        )}
        <div style={{ marginLeft: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>[{user.username} | {user.role}]</span>
          <button className="btn-danger" onClick={logout} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>SALIR</button>
        </div>
      </div>
    </nav>
  )
}
