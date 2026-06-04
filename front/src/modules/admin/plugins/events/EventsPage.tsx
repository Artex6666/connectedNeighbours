import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { eventsApi, type Event } from '@/shared/lib/api'

export function EventsPage() {
  const { t } = useTranslation()
  const { accessToken } = useAuth()

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const list = await eventsApi.list(accessToken, { all: true, includeCancelled: true })
      setEvents(list)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleCancel = async (id: string) => {
    if (!accessToken) return
    if (!confirm(t('admin.events.confirmCancel'))) return
    try {
      await eventsApi.cancel(accessToken, id)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>{t('admin.events.title')}</h1>
        <p>{t('admin.events.subtitle')}</p>
      </header>

      <div className="admin-filters">
        <span className="admin-count">{t('admin.events.count', { count: events.length })}</span>
      </div>

      {errorMsg ? <p className="admin-error">{errorMsg}</p> : null}

      {loading ? (
        <p className="admin-empty">{t('common.loading')}</p>
      ) : events.length === 0 ? (
        <p className="admin-empty">{t('admin.events.empty')}</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.events.col.title')}</th>
                <th>{t('admin.events.col.organizer')}</th>
                <th>{t('admin.events.col.date')}</th>
                <th>{t('admin.events.col.location')}</th>
                <th>{t('admin.events.col.participants')}</th>
                <th>{t('admin.events.col.status')}</th>
                <th>{t('admin.events.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e._id} className={e.isCancelled ? 'admin-row--cancelled' : ''}>
                  <td>
                    <strong>{e.title}</strong>
                  </td>
                  <td>
                    {e.organizerId.firstName} {e.organizerId.lastName}
                  </td>
                  <td>{new Date(e.date).toLocaleString()}</td>
                  <td className="admin-cell-muted">{e.location}</td>
                  <td>
                    {e.participants.length}/{e.maxParticipants}
                    {e.waitingList.length > 0 ? (
                      <small className="admin-cell-muted"> +{e.waitingList.length}</small>
                    ) : null}
                  </td>
                  <td>
                    {e.isCancelled ? (
                      <span className="admin-status admin-status--cancelled">
                        {t('events.cancelled')}
                      </span>
                    ) : (
                      <span className="admin-status admin-status--open">
                        {t('admin.events.statusActive')}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button button--ghost admin-row-action"
                      onClick={() => void handleCancel(e._id)}
                      disabled={e.isCancelled}
                    >
                      ❌
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
