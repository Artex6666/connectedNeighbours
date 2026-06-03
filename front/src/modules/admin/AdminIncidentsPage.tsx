import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import {
  incidentsApi,
  type CreateIncidentPayload,
  type Incident,
  type IncidentPriority,
  type IncidentStatus,
} from '@/shared/lib/api'

const STATUSES: IncidentStatus[] = ['open', 'in_progress', 'resolved']
const PRIORITIES: IncidentPriority[] = ['low', 'medium', 'high']

export function AdminIncidentsPage() {
  const { t } = useTranslation()
  const { accessToken } = useAuth()

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all')
  const [creating, setCreating] = useState(false)

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const list = await incidentsApi.list(accessToken)
      setIncidents(list)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const filtered = incidents.filter(
    (i) => statusFilter === 'all' || i.status === statusFilter,
  )

  const handleStatusChange = async (id: string, status: IncidentStatus) => {
    if (!accessToken) return
    try {
      await incidentsApi.update(accessToken, id, { status })
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handlePriorityChange = async (id: string, priority: IncidentPriority) => {
    if (!accessToken) return
    try {
      await incidentsApi.update(accessToken, id, { priority })
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) return
    if (!confirm(t('admin.incidents.confirmDelete'))) return
    try {
      await incidentsApi.delete(accessToken, id)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header admin-page__header--with-action">
        <div>
          <h1>{t('admin.incidents.title')}</h1>
          <p>{t('admin.incidents.subtitle')}</p>
        </div>
        <button type="button" className="button" onClick={() => setCreating(true)}>
          + {t('admin.incidents.create')}
        </button>
      </header>

      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | 'all')}
          className="admin-filter-input"
        >
          <option value="all">{t('admin.incidents.filterAllStatus')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`admin.incidents.status.${s}`)}
            </option>
          ))}
        </select>
        <span className="admin-count">
          {t('admin.incidents.count', { count: filtered.length })}
        </span>
      </div>

      {errorMsg ? <p className="admin-error">{errorMsg}</p> : null}

      {loading ? (
        <p className="admin-empty">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">{t('admin.incidents.empty')}</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.incidents.col.title')}</th>
                <th>{t('admin.incidents.col.priority')}</th>
                <th>{t('admin.incidents.col.status')}</th>
                <th>{t('admin.incidents.col.createdAt')}</th>
                <th>{t('admin.incidents.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => (
                <tr key={inc._id}>
                  <td>
                    <strong>{inc.title}</strong>
                    <small className="admin-cell-muted">{inc.description}</small>
                  </td>
                  <td>
                    <select
                      value={inc.priority}
                      onChange={(e) =>
                        void handlePriorityChange(inc._id, e.target.value as IncidentPriority)
                      }
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {t(`admin.incidents.priority.${p}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={inc.status}
                      onChange={(e) =>
                        void handleStatusChange(inc._id, e.target.value as IncidentStatus)
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(`admin.incidents.status.${s}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="admin-cell-muted">
                    {new Date(inc.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button button--ghost admin-row-action"
                      onClick={() => void handleDelete(inc._id)}
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

      {creating ? (
        <IncidentCreateModal
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false)
            await reload()
          }}
        />
      ) : null}
    </div>
  )
}

type CreateProps = {
  onClose: () => void
  onCreated: () => void | Promise<void>
}

function IncidentCreateModal({ onClose, onCreated }: CreateProps) {
  const { t } = useTranslation()
  const { accessToken } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<IncidentPriority>('medium')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accessToken) return
    if (!title.trim() || !description.trim()) {
      setErr(t('admin.incidents.errors.fieldsRequired'))
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const payload: CreateIncidentPayload = {
        title: title.trim(),
        description: description.trim(),
        priority,
      }
      await incidentsApi.create(accessToken, payload)
      await onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="admin-modal">
        <header className="admin-modal__header">
          <div>
            <span className="eyebrow">{t('admin.incidents.modal.eyebrow')}</span>
            <h2>{t('admin.incidents.modal.title')}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </header>
        <form className="admin-modal__form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>{t('admin.incidents.modal.titleLabel')}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="admin-field">
            <span>{t('admin.incidents.modal.descriptionLabel')}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </label>
          <label className="admin-field">
            <span>{t('admin.incidents.modal.priorityLabel')}</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as IncidentPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`admin.incidents.priority.${p}`)}
                </option>
              ))}
            </select>
          </label>
          {err ? <p className="admin-error">{err}</p> : null}
          <footer className="admin-modal__footer">
            <button type="button" className="button button--ghost" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="button" disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
