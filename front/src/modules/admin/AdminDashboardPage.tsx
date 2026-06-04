import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { adminPlugins, pluginPath } from '@/shared/plugins/admin-registry'

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const tiles = adminPlugins.filter((p) => {
    const allow = p.allow ?? ['admin']
    return user ? allow.includes(user.role as never) : false
  })

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>{t('admin.dashboard.title')}</h1>
        <p>{t('admin.dashboard.subtitle')}</p>
      </header>

      <section className="admin-tile-grid">
        {tiles.map((plugin) => (
          <Link key={plugin.id} to={pluginPath(plugin)} className="admin-tile">
            <span className="admin-tile__icon">{plugin.icon}</span>
            <strong>{t(plugin.labelKey)}</strong>
            <small>{t(plugin.descriptionKey)}</small>
          </Link>
        ))}
      </section>
    </div>
  )
}
