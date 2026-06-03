import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routes } from '@/shared/config/routes'

type AdminTile = {
  to: string
  icon: string
  titleKey: string
  descriptionKey: string
  enabled: boolean
}

const TILES: AdminTile[] = [
  {
    to: routes.adminNeighborhoods,
    icon: '🗺️',
    titleKey: 'admin.dashboard.tiles.neighborhoods.title',
    descriptionKey: 'admin.dashboard.tiles.neighborhoods.description',
    enabled: true,
  },
  {
    to: routes.adminUsers,
    icon: '👥',
    titleKey: 'admin.dashboard.tiles.users.title',
    descriptionKey: 'admin.dashboard.tiles.users.description',
    enabled: true,
  },
  {
    to: routes.adminServices,
    icon: '🤝',
    titleKey: 'admin.dashboard.tiles.services.title',
    descriptionKey: 'admin.dashboard.tiles.services.description',
    enabled: true,
  },
  {
    to: routes.adminEvents,
    icon: '📅',
    titleKey: 'admin.dashboard.tiles.events.title',
    descriptionKey: 'admin.dashboard.tiles.events.description',
    enabled: true,
  },
  {
    to: routes.adminIncidents,
    icon: '🚨',
    titleKey: 'admin.dashboard.tiles.incidents.title',
    descriptionKey: 'admin.dashboard.tiles.incidents.description',
    enabled: true,
  },
  {
    to: routes.adminAlertes,
    icon: '📣',
    titleKey: 'admin.dashboard.tiles.alertes.title',
    descriptionKey: 'admin.dashboard.tiles.alertes.description',
    enabled: true,
  },
  {
    to: '#',
    icon: '🗳️',
    titleKey: 'admin.dashboard.tiles.votes.title',
    descriptionKey: 'admin.dashboard.tiles.votes.description',
    enabled: false,
  },
]

export function AdminDashboardPage() {
  const { t } = useTranslation()

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>{t('admin.dashboard.title')}</h1>
        <p>{t('admin.dashboard.subtitle')}</p>
      </header>

      <section className="admin-tile-grid">
        {TILES.map((tile) => {
          const content = (
            <>
              <span className="admin-tile__icon">{tile.icon}</span>
              <strong>{t(tile.titleKey)}</strong>
              <small>{t(tile.descriptionKey)}</small>
              {!tile.enabled ? (
                <span className="admin-tile__badge">{t('admin.nav.soon')}</span>
              ) : null}
            </>
          )

          if (!tile.enabled) {
            return (
              <div key={tile.titleKey} className="admin-tile admin-tile--disabled">
                {content}
              </div>
            )
          }

          return (
            <Link key={tile.to} to={tile.to} className="admin-tile">
              {content}
            </Link>
          )
        })}
      </section>
    </div>
  )
}
