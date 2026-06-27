import { useMemo } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navItems } from '@/shared/config/nav-items'
import { ChatWidget } from '@/shared/ui/ChatWidget'
import { AdminQuickButton } from '@/shared/ui/AdminQuickButton'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

export function PublicLayout() {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout, accessToken } = useAuth()

  // Minimal session for the ChatWidget. Memoised so its reference is stable
  // across renders (an unstable session prop thrashes the widget's effects).
  const chatSession = useMemo(
    () => (isAuthenticated && accessToken && user ? { accessToken, refreshToken: '', user } : null),
    [isAuthenticated, accessToken, user],
  )

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
            {isAuthenticated ? (
              <>
                <Link to={routes.dashboard} className="topbar__nav a">Mon espace</Link>
                <Link to={routes.services}>🤝 Services</Link>
                <Link to={routes.events}>📅 Événements</Link>
              </>
            ) : (
              navItems.map((item) => (
                <a key={item.href} href={item.href}>{item.label}</a>
              ))
            )}
          </nav>

          <div className="topbar__actions">
            {isAuthenticated ? (
              <>
                <Link to={routes.profile} className="session-badge">
                  👤 {user?.firstName}
                </Link>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => void logout()}
                >
                  {t('auth.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to={routes.login} className="button button--ghost">
                  {t('auth.login')}
                </Link>
                <Link to={routes.register} className="button">
                  {t('auth.register')}
                </Link>
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

      {/* La messagerie n'apparaît que pour les utilisateurs connectés. */}
      {isAuthenticated && chatSession && (
        <ChatWidget
          isAuthenticated={isAuthenticated}
          session={chatSession}
          onRequireAuth={() => void 0}
        />
      )}

      <AdminQuickButton />
    </div>
  )
}
