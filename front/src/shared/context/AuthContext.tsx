import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { authApi, usersApi, type AuthUser, type AuthSession } from '@/shared/lib/api'

const HEARTBEAT_INTERVAL_MS = 30_000

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateAccessToken: (token: string) => void
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'connectedneighbours.auth'

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthSession) : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function saveSession(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  const login = useCallback(async (email: string, password: string) => {
    const newSession = await authApi.login(email, password)
    setSession(newSession)
    saveSession(newSession)
  }, [])

  const logout = useCallback(async () => {
    if (session?.refreshToken) {
      try {
        await authApi.logout(session.refreshToken)
      } catch {
        // logout best-effort — clear local session regardless
      }
    }
    setSession(null)
    clearSession()
  }, [session])

  const updateAccessToken = useCallback((token: string) => {
    setSession((prev) => {
      if (!prev) return null
      const updated = { ...prev, accessToken: token }
      saveSession(updated)
      return updated
    })
  }, [])

  // Presence heartbeat: while logged in and the tab is open, periodically tell
  // the server we're online. Drives the green dot and "email only when offline".
  const accessToken = session?.accessToken ?? null
  useEffect(() => {
    if (!accessToken) return
    const ping = () => usersApi.heartbeat(accessToken).catch(() => undefined)
    ping()
    const id = window.setInterval(ping, HEARTBEAT_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [accessToken])

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        accessToken: session?.accessToken ?? null,
        isAuthenticated: session !== null,
        login,
        logout,
        updateAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
