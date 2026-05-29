import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

const modules = [
  { icon: '🤝', titleKey: 'home.sections.services.title', descKey: 'home.sections.services.description', href: '#' },
  { icon: '📅', titleKey: 'home.sections.events.title', descKey: 'home.sections.events.description', href: '#' },
  { icon: '💬', titleKey: 'home.sections.messaging.title', descKey: 'home.sections.messaging.description', href: '#' },
  { icon: '📄', titleKey: 'home.sections.documents.title', descKey: 'home.sections.documents.description', href: '#' },
]

export function DashboardPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>

      {/* Header */}
      <header
        className="sticky top-0 z-10 py-4"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', backdropFilter: 'blur(20px)' }}
      >
        <div className="mx-auto px-4 flex items-center justify-between gap-6" style={{ maxWidth: 'var(--container-width)' }}>
          <Link to={routes.home} className="brand">
            <span className="brand__mark">CN</span>
            <span>
              <strong>Connected Neighbours</strong>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="session-badge">
              {user?.firstName} {user?.lastName}
            </span>
            <button className="button button--secondary" onClick={() => void logout()}>
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 mx-auto w-full px-4 py-10 flex flex-col gap-8" style={{ maxWidth: 'var(--container-width)' }}>

        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {t('dashboard.welcome', { name: user?.firstName })}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.subtitle')}</p>
        </div>

        {/* Modules grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map(({ icon, titleKey, descKey, href }) => (
            <Link
              key={titleKey}
              to={href}
              className="flex flex-col gap-3 p-6 rounded-2xl transition-transform hover:-translate-y-0.5"
              style={{
                background: 'var(--color-bg-soft)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <span className="text-3xl">{icon}</span>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold m-0" style={{ color: 'var(--color-text)' }}>
                  {t(titleKey)}
                </h2>
                <span
                  className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: 'var(--color-secondary-soft)', color: '#c8b7ff' }}
                >
                  {t('dashboard.comingSoon')}
                </span>
              </div>
              <p className="text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
                {t(descKey)}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
