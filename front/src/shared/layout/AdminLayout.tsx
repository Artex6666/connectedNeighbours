import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

type AdminNavItem = {
  to: string
  labelKey: string
  icon: string
  disabled?: boolean
}

const ADMIN_NAV: AdminNavItem[] = [
  { to: routes.admin, labelKey: 'admin.nav.dashboard', icon: '📊' },
  { to: routes.adminNeighborhoods, labelKey: 'admin.nav.neighborhoods', icon: '🗺️' },
  { to: '#', labelKey: 'admin.nav.users', icon: '👥', disabled: true },
  { to: '#', labelKey: 'admin.nav.services', icon: '🤝', disabled: true },
  { to: '#', labelKey: 'admin.nav.events', icon: '📅', disabled: true },
  { to: '#', labelKey: 'admin.nav.incidents', icon: '🚨', disabled: true },
  { to: '#', labelKey: 'admin.nav.alertes', icon: '📣', disabled: true },
  { to: '#', labelKey: 'admin.nav.votes', icon: '🗳️', disabled: true },
  { to: '#', labelKey: 'admin.nav.documents', icon: '📄', disabled: true },
  { to: '#', labelKey: 'admin.nav.stats', icon: '📈', disabled: true },
  { to: '#', labelKey: 'admin.nav.rgpd', icon: '🛡️', disabled: true },
]

export function AdminLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to={routes.home} className="admin-sidebar__brand">
          <span className="brand__mark">BC</span>
          <span className="admin-sidebar__brand-label">
            <strong>{t('admin.brand.title')}</strong>
            <small>{t('admin.brand.subtitle')}</small>
          </span>
        </Link>

        <nav className="admin-sidebar__nav" aria-label={t('admin.nav.ariaLabel')}>
          {ADMIN_NAV.map((item) => {
            if (item.disabled) {
              return (
                <span key={item.labelKey} className="admin-nav-item admin-nav-item--disabled">
                  <span className="admin-nav-item__icon">{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
                  <span className="admin-nav-item__badge">{t('admin.nav.soon')}</span>
                </span>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === routes.admin}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`
                }
              >
                <span className="admin-nav-item__icon">{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="admin-sidebar__footer">
          <Link to={routes.dashboard} className="admin-back-link">
            ← {t('admin.backToApp')}
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="eyebrow">{t('admin.topbar.eyebrow')}</span>
            <strong className="admin-topbar__title">
              {t('admin.topbar.greeting', { name: user?.firstName ?? '' })}
            </strong>
          </div>

          <div className="admin-topbar__actions">
            <span className="session-badge">⚙️ {user?.role}</span>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => void logout()}
              style={{ minHeight: '36px' }}
            >
              {t('auth.logout')}
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
