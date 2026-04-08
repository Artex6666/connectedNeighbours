import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navItems } from '@/shared/config/nav-items'
import { AuthModal } from '@/shared/ui/AuthModal'
import { ChatWidget } from '@/shared/ui/ChatWidget'
import { authApi, type AuthFormPayload, type AuthSession } from '@/shared/lib/api'

const authStorageKey = 'bobconnect.auth.session'

export function PublicLayout() {
  const { t } = useTranslation()
  const [session, setSession] = useState<AuthSession | null>(() => {
    const storedSession = window.localStorage.getItem(authStorageKey)
    if (!storedSession) {
      return null
    }

    try {
      return JSON.parse(storedSession) as AuthSession
    } catch {
      window.localStorage.removeItem(authStorageKey)
      return null
    }
  })
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)

  const isAuthenticated = session !== null

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setAuthError(null)
    setIsAuthModalOpen(true)
  }

  const persistSession = (nextSession: AuthSession | null) => {
    setSession(nextSession)

    if (nextSession) {
      window.localStorage.setItem(authStorageKey, JSON.stringify(nextSession))
      return
    }

    window.localStorage.removeItem(authStorageKey)
  }

  const handleAuthSubmit = async (payload: AuthFormPayload) => {
    setAuthError(null)
    setIsSubmittingAuth(true)

    try {
      const activeSession =
        authMode === 'login'
          ? await authApi.login(payload.email, payload.password)
          : await (async () => {
              await authApi.register(payload)
              return authApi.login(payload.email, payload.password)
            })()

      persistSession(activeSession)
      setIsAuthModalOpen(false)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Une erreur est survenue.')
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  return (
    <div>
      <header className="topbar">
        <div className="topbar__inner">
          <a className="brand" href="/">
            <span className="brand__mark">BC</span>
            <span>
              <strong>BobConnect</strong>
              <small>{t('app.tagline')}</small>
            </span>
          </a>

          <nav className="topbar__nav" aria-label={t('navigation.ariaLabel')}>
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {t(item.labelKey)}
              </a>
            ))}
          </nav>

          <div className="topbar__actions">
            {isAuthenticated ? (
              <>
                <span className="session-badge">
                  {t('auth.connected')} {session?.user.firstName}
                </span>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => persistSession(null)}
                >
                  {t('auth.logout')}
                </button>
              </>
            ) : (
              <>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => openAuthModal('login')}
                >
                  {t('auth.login')}
                </button>
                <button
                  className="button"
                  type="button"
                  onClick={() => openAuthModal('register')}
                >
                  {t('auth.register')}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="app-shell">
        <main className="page-content">
          <Outlet />
        </main>

        <footer className="site-footer" id="footer">
          <div className="site-footer__intro">
            <span className="eyebrow">{t('footer.eyebrow')}</span>
            <h2>{t('footer.title')}</h2>
            <p>{t('footer.description')}</p>
          </div>

          <div className="site-footer__grid">
            <div>
              <h3>{t('footer.sections.platformTitle')}</h3>
              <p>{t('footer.sections.platformDescription')}</p>
            </div>
            <div>
              <h3>{t('footer.sections.trustTitle')}</h3>
              <p>{t('footer.sections.trustDescription')}</p>
            </div>
            <div>
              <h3>{t('footer.sections.futureTitle')}</h3>
              <p>{t('footer.sections.futureDescription')}</p>
            </div>
          </div>
        </footer>
      </div>

      {isAuthModalOpen ? (
        <AuthModal
          mode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
          onModeChange={(mode) => {
            setAuthMode(mode)
            setAuthError(null)
          }}
          onSubmit={handleAuthSubmit}
          isSubmitting={isSubmittingAuth}
          errorMessage={authError}
        />
      ) : null}

      <ChatWidget
        isAuthenticated={isAuthenticated}
        session={session}
        onRequireAuth={() => openAuthModal('login')}
      />
    </div>
  )
}
