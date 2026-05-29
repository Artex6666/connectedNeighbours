import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

const NAV_ITEMS = [
  { href: routes.dashboard, label: 'Accueil' },
  { href: routes.services, label: '🤝 Services' },
  { href: routes.events, label: '📅 Événements' },
  { href: routes.profile, label: '👤 Profil' },
]

type Props = { children: ReactNode }

export function AppLayout({ children }: Props) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 py-3"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', backdropFilter: 'blur(20px)' }}
      >
        <div className="mx-auto px-4 flex items-center gap-6" style={{ maxWidth: 'var(--container-width)' }}>
          <Link to={routes.home} className="brand shrink-0">
            <span className="brand__mark">CN</span>
          </Link>

          <nav className="flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  color: location.pathname === item.href ? 'var(--color-text)' : 'var(--color-text-muted)',
                  background: location.pathname === item.href ? 'var(--color-primary-soft)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={routes.profile}
              className="session-badge"
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              {user?.firstName}
            </Link>
            <button className="button button--secondary" style={{ minHeight: '36px' }} onClick={() => void logout()}>
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full px-4 py-8" style={{ maxWidth: 'var(--container-width)' }}>
        {children}
      </main>
    </div>
  )
}
