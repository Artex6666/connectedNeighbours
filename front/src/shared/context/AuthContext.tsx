import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { authApi, type AuthUser, type AuthSession } from '@/shared/lib/api'

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
