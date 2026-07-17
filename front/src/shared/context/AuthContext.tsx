import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { authApi, usersApi, type AuthUser, type AuthSession } from '@/shared/lib/api'

const HEARTBEAT_INTERVAL_MS = 30_000

type LoginResult = {
  mfaRequired: boolean
  accessToken?: string
  refreshToken?: string
  user?: AuthUser
}

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string, totpCode?: string) => Promise<LoginResult>
  logout: () => Promise<void>
  updateAccessToken: (token: string) => void
}

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

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())

  const login = useCallback(async (email: string, password: string, totpCode?: string): Promise<LoginResult> => {
    const result = await authApi.login(email, password, totpCode)

    if ('mfaRequired' in result) {
      return { mfaRequired: true }
    }

    setSession(result)
    saveSession(result)

    return {
      mfaRequired: false,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    }
  }, [])

  const logout = useCallback(async () => {
    if (session?.refreshToken) {
      try {
        await authApi.logout(session.refreshToken)
      } catch {}
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}