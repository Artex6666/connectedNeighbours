import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { AppLayout } from '@/shared/layout/AppLayout'
import { routes } from '@/shared/config/routes'

const modules = [
  { icon: '🤝', titleKey: 'home.sections.services.title', descKey: 'home.sections.services.description', href: routes.services, available: true },
  { icon: '📅', titleKey: 'home.sections.events.title', descKey: 'home.sections.events.description', href: routes.events, available: true },
  { icon: '💬', titleKey: 'home.sections.messaging.title', descKey: 'home.sections.messaging.description', href: '#', available: false },
  { icon: '📄', titleKey: 'home.sections.documents.title', descKey: 'home.sections.documents.description', href: '#', available: false },
]

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {t('dashboard.welcome', { name: user?.firstName })}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map(({ icon, titleKey, descKey, href, available }) => (
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
                {!available && (
                  <span
                    className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: 'var(--color-secondary-soft)', color: '#c8b7ff' }}
                  >
                    {t('dashboard.comingSoon')}
                  </span>
                )}
              </div>
              <p className="text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
                {t(descKey)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
