import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navItems } from '@/shared/config/nav-items'
import { AuthModal } from '@/shared/ui/AuthModal'
import { ChatWidget } from '@/shared/ui/ChatWidget'

export function PublicLayout() {
  const { t } = useTranslation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setIsAuthModalOpen(true)
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
                <span className="session-badge">{t('auth.connected')}</span>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setIsAuthenticated(false)}
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
          onModeChange={setAuthMode}
          onSubmit={() => {
            setIsAuthenticated(true)
            setIsAuthModalOpen(false)
          }}
        />
      ) : null}

      <ChatWidget />
    </div>
  )
}
