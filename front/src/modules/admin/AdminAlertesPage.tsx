import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import {
  alertesApi,
  type Alerte,
  type AlerteLevel,
  type CreateAlertePayload,
} from '@/shared/lib/api'

const LEVELS: AlerteLevel[] = ['info', 'warning', 'danger']

type EditorState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; alerte: Alerte }

export function AdminAlertesPage() {
  const { t } = useTranslation()
  const { accessToken } = useAuth()

  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' })

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const list = await alertesApi.list(accessToken)
      setAlertes(list)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleToggleActive = async (a: Alerte) => {
    if (!accessToken) return
    try {
      await alertesApi.update(accessToken, a._id, { active: !a.active })
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) return
    if (!confirm(t('admin.alertes.confirmDelete'))) return
    try {
      await alertesApi.delete(accessToken, id)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header admin-page__header--with-action">
        <div>
          <h1>{t('admin.alertes.title')}</h1>
          <p>{t('admin.alertes.subtitle')}</p>
        </div>
        <button type="button" className="button" onClick={() => setEditor({ mode: 'create' })}>
          + {t('admin.alertes.create')}
        </button>
      </header>

      {errorMsg ? <p className="admin-error">{errorMsg}</p> : null}

      {loading ? (
        <p className="admin-empty">{t('common.loading')}</p>
      ) : alertes.length === 0 ? (
        <p className="admin-empty">{t('admin.alertes.empty')}</p>
      ) : (
        <div className="admin-alerte-list">
          {alertes.map((a) => (
            <article key={a._id} className={`admin-alerte-card admin-alerte-card--${a.level}`}>
              <header>
                <strong>{a.title}</strong>
                <span className={`admin-status admin-status--${a.level}`}>
                  {t(`admin.alertes.level.${a.level}`)}
                </span>
              </header>
              <p>{a.message}</p>
              <footer>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={a.active}
                    onChange={() => void handleToggleActive(a)}
                  />
                  <span>
                    {a.active ? t('admin.alertes.active') : t('admin.alertes.inactive')}
                  </span>
                </label>
                <div className="admin-alerte-card__actions">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setEditor({ mode: 'edit', alerte: a })}
                  >
                    ✏️ {t('admin.alertes.edit')}
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => void handleDelete(a._id)}
                  >
                    🗑️
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}

      {editor.mode !== 'closed' ? (
        <AlerteEditorModal
          initial={editor.mode === 'edit' ? editor.alerte : null}
          onClose={() => setEditor({ mode: 'closed' })}
          onSaved={async () => {
            setEditor({ mode: 'closed' })
            await reload()
          }}
        />
      ) : null}
    </div>
  )
}

type EditorProps = {
  initial: Alerte | null
  onClose: () => void
  onSaved: () => void | Promise<void>
}

function AlerteEditorModal({ initial, onClose, onSaved }: EditorProps) {
  const { t } = useTranslation()
  const { accessToken } = useAuth()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [message, setMessage] = useState(initial?.message ?? '')
  const [level, setLevel] = useState<AlerteLevel>(initial?.level ?? 'info')
  const [active, setActive] = useState(initial?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accessToken) return
    if (!title.trim() || !message.trim()) {
      setErr(t('admin.alertes.errors.fieldsRequired'))
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const payload: CreateAlertePayload = {
        title: title.trim(),
        message: message.trim(),
        level,
        active,
      }
      if (initial) {
        await alertesApi.update(accessToken, initial._id, payload)
      } else {
        await alertesApi.create(accessToken, payload)
      }
      await onSaved()
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
            <span className="eyebrow">
              {initial ? t('admin.alertes.modal.editEyebrow') : t('admin.alertes.modal.createEyebrow')}
            </span>
            <h2>
              {initial ? t('admin.alertes.modal.editTitle') : t('admin.alertes.modal.createTitle')}
            </h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </header>
        <form className="admin-modal__form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>{t('admin.alertes.modal.titleLabel')}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="admin-field">
            <span>{t('admin.alertes.modal.messageLabel')}</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </label>
          <label className="admin-field">
            <span>{t('admin.alertes.modal.levelLabel')}</span>
            <select value={level} onChange={(e) => setLevel(e.target.value as AlerteLevel)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {t(`admin.alertes.level.${l}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>{t('admin.alertes.modal.activeLabel')}</span>
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
