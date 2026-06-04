import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'
import { adminPlugins, pluginPath } from '@/shared/plugins/admin-registry'

export function AdminLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  const visiblePlugins = adminPlugins.filter((p) => {
    const allow = p.allow ?? ['admin']
    return user ? allow.includes(user.role as never) : false
  })

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
          <NavLink
            to={routes.admin}
            end
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`
            }
          >
            <span className="admin-nav-item__icon">📊</span>
            <span>{t('admin.nav.dashboard')}</span>
          </NavLink>

          {visiblePlugins.map((plugin) => (
            <NavLink
              key={plugin.id}
              to={pluginPath(plugin)}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`
              }
            >
              <span className="admin-nav-item__icon">{plugin.icon}</span>
              <span>{t(plugin.labelKey)}</span>
            </NavLink>
          ))}
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
