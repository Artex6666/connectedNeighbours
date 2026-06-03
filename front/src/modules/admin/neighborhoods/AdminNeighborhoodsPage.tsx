import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import {
  neighborhoodsApi,
  type CreateNeighborhoodPayload,
  type Neighborhood,
} from '@/shared/lib/api'
import { NeighborhoodMapEditor, type LngLat } from './NeighborhoodMapEditor'

type EditorState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; neighborhood: Neighborhood }

function ringFromNeighborhood(n: Neighborhood): LngLat[] {
  const coords = n.polygon.coordinates[0] ?? []
  const open = coords.slice(0, -1)
  return open.map((p) => [p[0], p[1]] as LngLat)
}

function closeRing(ring: LngLat[]): LngLat[] {
  if (ring.length === 0) return ring
  const [first] = ring
  const last = ring[ring.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) return ring
  return [...ring, [first[0], first[1]] as LngLat]
}

function describeAdmin(adminId: Neighborhood['adminId']) {
  if (typeof adminId === 'string') return adminId
  return `${adminId.firstName} ${adminId.lastName}`
}

export function AdminNeighborhoodsPage() {
  const { t } = useTranslation()
  const { accessToken } = useAuth()

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' })

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setListError(null)
    try {
      const next = await neighborhoodsApi.list(accessToken)
      setNeighborhoods(next)
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleDelete = async (id: string) => {
    if (!accessToken) return
    if (!confirm(t('admin.neighborhoods.confirmDelete'))) return
    try {
      await neighborhoodsApi.delete(accessToken, id)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header admin-page__header--with-action">
        <div>
          <h1>{t('admin.neighborhoods.title')}</h1>
          <p>{t('admin.neighborhoods.subtitle')}</p>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => setEditor({ mode: 'create' })}
        >
          + {t('admin.neighborhoods.create')}
        </button>
      </header>

      {listError ? <p className="admin-error">{listError}</p> : null}

      {loading ? (
        <p className="admin-empty">{t('common.loading')}</p>
      ) : neighborhoods.length === 0 ? (
        <p className="admin-empty">{t('admin.neighborhoods.empty')}</p>
      ) : (
        <div className="admin-neighborhood-list">
          {neighborhoods.map((n) => {
            const ring = n.polygon.coordinates[0] ?? []
            return (
              <article key={n._id} className="admin-neighborhood-card">
                <header>
                  <strong>{n.name}</strong>
                  <small>
                    {t('admin.neighborhoods.card.vertices', { count: Math.max(ring.length - 1, 0) })} ·{' '}
                    {t('admin.neighborhoods.card.admin', { admin: describeAdmin(n.adminId) })}
                  </small>
                </header>
                {n.description ? <p>{n.description}</p> : null}
                <footer>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setEditor({ mode: 'edit', neighborhood: n })}
                  >
                    ✏️ {t('admin.neighborhoods.card.edit')}
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => void handleDelete(n._id)}
                  >
                    🗑️ {t('common.delete')}
                  </button>
                </footer>
              </article>
            )
          })}
        </div>
      )}

      {editor.mode !== 'closed' ? (
        <NeighborhoodEditorModal
          initial={editor.mode === 'edit' ? editor.neighborhood : null}
          existing={neighborhoods}
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

type ModalProps = {
  initial: Neighborhood | null
  existing: Neighborhood[]
  onClose: () => void
  onSaved: () => void | Promise<void>
}

function NeighborhoodEditorModal({ initial, existing, onClose, onSaved }: ModalProps) {
  const { t } = useTranslation()
  const { accessToken } = useAuth()
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [ring, setRing] = useState<LngLat[]>(() =>
    initial ? ringFromNeighborhood(initial) : [],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const otherPolygons = useMemo(
    () =>
      existing
        .filter((n) => n._id !== initial?._id)
        .map((n) => ({
          id: n._id,
          name: n.name,
          ring: (n.polygon.coordinates[0] ?? []).map((p) => [p[0], p[1]] as LngLat),
        })),
    [existing, initial?._id],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accessToken) return

    if (!name.trim()) {
      setError(t('admin.neighborhoods.errors.nameRequired'))
      return
    }
    if (ring.length < 3) {
      setError(t('admin.neighborhoods.errors.polygonTooSmall'))
      return
    }

    const payload: CreateNeighborhoodPayload = {
      name: name.trim(),
      description: description.trim(),
      polygon: { type: 'Polygon', coordinates: [closeRing(ring)] },
    }

    setSaving(true)
    setError(null)
    try {
      if (initial) {
        await neighborhoodsApi.update(accessToken, initial._id, payload)
      } else {
        await neighborhoodsApi.create(accessToken, payload)
      }
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
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
              {initial ? t('admin.neighborhoods.modal.editEyebrow') : t('admin.neighborhoods.modal.createEyebrow')}
            </span>
            <h2>{initial ? t('admin.neighborhoods.modal.editTitle') : t('admin.neighborhoods.modal.createTitle')}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </header>

        <form className="admin-modal__form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>{t('admin.neighborhoods.modal.nameLabel')}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('admin.neighborhoods.modal.namePlaceholder')}
              required
            />
          </label>

          <label className="admin-field">
            <span>{t('admin.neighborhoods.modal.descriptionLabel')}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('admin.neighborhoods.modal.descriptionPlaceholder')}
              rows={3}
            />
          </label>

          <NeighborhoodMapEditor
            value={ring}
            onChange={setRing}
            otherPolygons={otherPolygons}
          />

          {error ? <p className="admin-error">{error}</p> : null}

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
