import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <a className="brand" href="/">
            <span className="brand__mark">CN</span>
            <span>
              <strong>Connected Neighbours</strong>
            </span>
          </a>
          <div className="dashboard-header__actions">
            <span className="session-badge">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => void logout()}
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <h1>{t('dashboard.welcome', { name: user?.firstName })}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span className="dashboard-card__icon">🤝</span>
            <h2>{t('home.sections.services.title')}</h2>
            <p>{t('home.sections.services.description')}</p>
            <span className="badge badge--soon">{t('dashboard.comingSoon')}</span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card__icon">📅</span>
            <h2>{t('home.sections.events.title')}</h2>
            <p>{t('home.sections.events.description')}</p>
            <span className="badge badge--soon">{t('dashboard.comingSoon')}</span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card__icon">💬</span>
            <h2>{t('home.sections.messaging.title')}</h2>
            <p>{t('home.sections.messaging.description')}</p>
            <span className="badge badge--soon">{t('dashboard.comingSoon')}</span>
          </div>

          <div className="dashboard-card">
            <span className="dashboard-card__icon">📄</span>
            <h2>{t('home.sections.documents.title')}</h2>
            <p>{t('home.sections.documents.description')}</p>
            <span className="badge badge--soon">{t('dashboard.comingSoon')}</span>
          </div>
        </div>
      </main>
    </div>
  )
}
