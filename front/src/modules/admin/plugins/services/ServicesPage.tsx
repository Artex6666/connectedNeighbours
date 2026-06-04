import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import {
  servicesApi,
  type Service,
  type ServiceCategory,
  type ServiceStatus,
} from '@/shared/lib/api'

const CATEGORIES: ServiceCategory[] = [
  'bricolage',
  'jardinage',
  'garde_animaux',
  'cours_particuliers',
  'demenagement',
  'autre',
]

const STATUSES: ServiceStatus[] = ['open', 'pending', 'in_progress', 'done', 'cancelled']

export function ServicesPage() {
  const { t } = useTranslation()
  const { accessToken } = useAuth()

  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all')

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const list = await servicesApi.list(accessToken, { all: true })
      setServices(list)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const filtered = useMemo(
    () =>
      services.filter(
        (s) =>
          (statusFilter === 'all' || s.status === statusFilter) &&
          (categoryFilter === 'all' || s.category === categoryFilter),
      ),
    [services, statusFilter, categoryFilter],
  )

  const handleDelete = async (id: string) => {
    if (!accessToken) return
    if (!confirm(t('admin.services.confirmDelete'))) return
    try {
      await servicesApi.delete(accessToken, id)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>{t('admin.services.title')}</h1>
        <p>{t('admin.services.subtitle')}</p>
      </header>

      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'all')}
          className="admin-filter-input"
        >
          <option value="all">{t('admin.services.filterAllStatus')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`services.status.${s}`)}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as ServiceCategory | 'all')}
          className="admin-filter-input"
        >
          <option value="all">{t('services.filterAllCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`services.category.${c}`)}
            </option>
          ))}
        </select>

        <span className="admin-count">
          {t('admin.services.count', { count: filtered.length })}
        </span>
      </div>

      {errorMsg ? <p className="admin-error">{errorMsg}</p> : null}

      {loading ? (
        <p className="admin-empty">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">{t('admin.services.empty')}</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.services.col.title')}</th>
                <th>{t('admin.services.col.author')}</th>
                <th>{t('admin.services.col.category')}</th>
                <th>{t('admin.services.col.status')}</th>
                <th>{t('admin.services.col.points')}</th>
                <th>{t('admin.services.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td>
                    <strong>{s.title}</strong>
                    <small className="admin-cell-muted">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </small>
                  </td>
                  <td>
                    {s.authorId.firstName} {s.authorId.lastName}
                  </td>
                  <td>{t(`services.category.${s.category}`)}</td>
                  <td>
                    <span className={`admin-status admin-status--${s.status}`}>
                      {t(`services.status.${s.status}`)}
                    </span>
                  </td>
                  <td>{s.isPaid ? `${s.points} pts` : t('common.free')}</td>
                  <td>
                    <button
                      type="button"
                      className="button button--ghost admin-row-action"
                      onClick={() => void handleDelete(s._id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
