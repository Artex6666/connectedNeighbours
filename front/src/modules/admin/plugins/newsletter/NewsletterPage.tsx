import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { newsletterApi, type Newsletter, type NewsletterStatus } from '@/shared/lib/api'

const STATUS_LABEL: Record<NewsletterStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifiée',
  sent: 'Envoyée',
}

type EditorState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; newsletter: Newsletter }

export function NewsletterPage() {
  const { accessToken } = useAuth()
  const [items, setItems] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' })

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setErrorMsg(null)
    try {
      setItems(await newsletterApi.list(accessToken))
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleSend = async (n: Newsletter) => {
    if (!accessToken) return
    if (!confirm(`Envoyer « ${n.subject} » à tous les abonnés maintenant ?`)) return
    try {
      const res = await newsletterApi.send(accessToken, n._id)
      alert(`Newsletter envoyée à ${res.sentCount} destinataire(s).`)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) return
    if (!confirm('Supprimer cette newsletter ?')) return
    try {
      await newsletterApi.remove(accessToken, id)
      await reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header admin-page__header--with-action">
        <div>
          <h1>Newsletter</h1>
          <p>Composez, planifiez et envoyez la newsletter du quartier.</p>
        </div>
        <button type="button" className="button" onClick={() => setEditor({ mode: 'create' })}>
          + Nouvelle newsletter
        </button>
      </header>

      {errorMsg ? <p className="admin-error">{errorMsg}</p> : null}

      {loading ? (
        <p className="admin-empty">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="admin-empty">Aucune newsletter pour le moment.</p>
      ) : (
        <div className="admin-alerte-list">
          {items.map((n) => (
            <article key={n._id} className="admin-alerte-card">
              <header>
                <strong>{n.subject}</strong>
                <span className={`admin-status admin-status--${n.status === 'sent' ? 'info' : n.status === 'scheduled' ? 'warning' : 'danger'}`}>
                  {STATUS_LABEL[n.status]}
                </span>
              </header>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {n.status === 'sent'
                  ? `Envoyée à ${n.sentCount} destinataire(s)${n.sentAt ? ` le ${new Date(n.sentAt).toLocaleString()}` : ''}`
                  : n.status === 'scheduled' && n.scheduledAt
                    ? `Planifiée pour le ${new Date(n.scheduledAt).toLocaleString()}`
                    : 'Brouillon non envoyé'}
              </p>
              <footer>
                <div className="admin-alerte-card__actions" style={{ marginLeft: 'auto' }}>
                  {n.status !== 'sent' && (
                    <>
                      <button type="button" className="button button--secondary" onClick={() => setEditor({ mode: 'edit', newsletter: n })}>
                        ✏️ Modifier
                      </button>
                      <button type="button" className="button" onClick={() => void handleSend(n)}>
                        📤 Envoyer
                      </button>
                    </>
                  )}
                  <button type="button" className="button button--ghost" onClick={() => void handleDelete(n._id)}>
                    🗑️
                  </button>
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}

      {editor.mode !== 'closed' ? (
        <NewsletterEditorModal
          initial={editor.mode === 'edit' ? editor.newsletter : null}
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

// Convert an ISO date to the value expected by <input type="datetime-local">.
function toLocalInput(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type EditorProps = {
  initial: Newsletter | null
  onClose: () => void
  onSaved: () => void | Promise<void>
}

function NewsletterEditorModal({ initial, onClose, onSaved }: EditorProps) {
  const { accessToken } = useAuth()
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [contentHtml, setContentHtml] = useState(initial?.contentHtml ?? '')
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(initial?.scheduledAt))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!accessToken) return
    if (!subject.trim()) {
      setErr('Le sujet est requis')
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const payload = {
        subject: subject.trim(),
        contentHtml,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      }
      if (initial) {
        await newsletterApi.update(accessToken, initial._id, payload)
      } else {
        await newsletterApi.create(accessToken, payload)
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
            <span className="eyebrow">Newsletter</span>
            <h2>{initial ? 'Modifier la newsletter' : 'Nouvelle newsletter'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            ×
          </button>
        </header>
        <form className="admin-modal__form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Sujet</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </label>
          <label className="admin-field">
            <span>Contenu (HTML autorisé : présentation, liens…)</span>
            <textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              rows={10}
              placeholder="<h2>Les actus du quartier</h2><p>Bonjour à tous…</p>"
            />
          </label>
          <label className="admin-field">
            <span>Planifier l'envoi (laisser vide pour un brouillon)</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </label>
          {err ? <p className="admin-error">{err}</p> : null}
          <footer className="admin-modal__footer">
            <button type="button" className="button button--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="button" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
