'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type User = {
  id: string
  username: string
  name: string
  role: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json()
        throw new Error('Not authenticated')
      })
      .then((data) => {
        setUser(data.user)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
