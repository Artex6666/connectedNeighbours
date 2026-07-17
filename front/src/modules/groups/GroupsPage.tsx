import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { AppLayout } from '@/shared/layout/AppLayout'
import { RoleBadge } from '@/shared/ui/RoleBadge'
import { groupsApi, type GroupSummary, type GroupDetail } from '@/shared/lib/api'

export function GroupsPage() {
  const { accessToken, user } = useAuth()
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [openGroup, setOpenGroup] = useState<GroupDetail | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      setGroups(await groupsApi.list(accessToken))
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const open = async (id: string) => {
    if (!accessToken) return
    try {
      setOpenGroup(await groupsApi.get(accessToken, id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const join = async (id: string) => {
    if (!accessToken) return
    await groupsApi.join(accessToken, id)
    await reload()
    await open(id)
  }
  const leave = async (id: string) => {
    if (!accessToken) return
    await groupsApi.leave(accessToken, id)
    setOpenGroup(null)
    await reload()
  }
  const remove = async (id: string) => {
    if (!accessToken) return
    if (!confirm('Supprimer ce groupe ?')) return
    await groupsApi.remove(accessToken, id)
    setOpenGroup(null)
    await reload()
  }

  const canModerate = user?.role === 'admin' || user?.role === 'moderator'

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--color-text)' }}>👥 Groupes de discussion</h1>
            <p className="m-0 text-sm" style={{ color: 'var(--color-text-muted)' }}>Des canaux collectifs pour le quartier, un événement, un sujet…</p>
          </div>
          <button className="button" onClick={() => setCreateOpen(true)}>+ Créer un groupe</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Chargement…</p>
        ) : groups.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Aucun groupe. Créez le premier canal du quartier !</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((g) => (
              <div key={g._id} className="rounded-3xl p-5 flex flex-col gap-2" style={{ background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border-strong)' }}>
                <strong style={{ color: 'var(--color-text)' }}>{g.name}</strong>
                {g.description && <p className="m-0 text-sm" style={{ color: 'var(--color-text-muted)' }}>{g.description}</p>}
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{g.memberCount} membre{g.memberCount > 1 ? 's' : ''}</span>
                <div className="flex gap-2 mt-1">
                  {g.isMember ? (
                    <button className="button button--secondary" onClick={() => void open(g._id)}>Ouvrir</button>
                  ) : (
                    <button className="button" onClick={() => void join(g._id)}>Rejoindre</button>
                  )}
                  {(canModerate || g.createdBy?._id === user?._id) && (
                    <button className="button button--ghost" onClick={() => void remove(g._id)} title="Supprimer">🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openGroup && (
        <GroupChat
          group={openGroup}
          onClose={() => setOpenGroup(null)}
          onLeave={() => void leave(openGroup._id)}
          reloadDetail={() => open(openGroup._id)}
        />
      )}
      {createOpen && (
        <CreateGroupModal onClose={() => setCreateOpen(false)} onCreated={async () => { setCreateOpen(false); await reload() }} />
      )}
    </AppLayout>
  )
}

function GroupChat({ group, onClose, onLeave, reloadDetail }: { group: GroupDetail; onClose: () => void; onLeave: () => void; reloadDetail: () => void | Promise<void> }) {
  const { accessToken, user } = useAuth()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const canModerate = user?.role === 'admin' || user?.role === 'moderator'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [group.messages.length])

  const send = async () => {
    if (!accessToken || !draft.trim()) return
    await groupsApi.sendMessage(accessToken, group._id, draft.trim())
    setDraft('')
    await reloadDetail()
  }
  const delMsg = async (id: string) => {
    if (!accessToken) return
    await groupsApi.deleteMessage(accessToken, id)
    await reloadDetail()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 560, display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal__header">
          <div>
            <span className="eyebrow">{group.members.length} membres</span>
            <h2 style={{ fontSize: 18 }}>{group.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="button button--ghost" onClick={onLeave}>Quitter</button>
            <button className="icon-button" type="button" onClick={onClose}>×</button>
          </div>
        </header>

        <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
          {group.messages.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Aucun message. Lancez la discussion !</p>
          ) : (
            group.messages.map((m) => {
              const mine = m.sender?._id === user?._id
              return (
                <div key={m._id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--color-text-muted)', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    {m.sender?.name ?? '—'} {m.sender && <RoleBadge role={m.sender.role} />}
                    {(canModerate || mine) && (
                      <button className="icon-button" style={{ fontSize: 12 }} onClick={() => void delMsg(m._id)} title="Supprimer">🗑️</button>
                    )}
                  </div>
                  <div style={{ background: mine ? 'var(--color-primary)' : 'var(--color-bg-elevated)', color: mine ? '#fff' : 'var(--color-text)', padding: '8px 12px', borderRadius: 14, marginTop: 2 }}>
                    {m.content}
                  </div>
                </div>
              )
            })
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 pt-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void send() }}
            placeholder="Votre message…"
            className="h-11 px-4 rounded-xl outline-none flex-1"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          <button className="button" onClick={() => void send()} disabled={!draft.trim()}>Envoyer</button>
        </div>
      </div>
    </div>
  )
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void | Promise<void> }) {
  const { accessToken } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    if (!accessToken) return
    if (!name.trim()) { setErr('Le nom est requis'); return }
    setSaving(true)
    setErr(null)
    try {
      await groupsApi.create(accessToken, { name: name.trim(), description: description.trim() })
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
            <span className="eyebrow">Nouveau groupe</span>
            <h2>Créer un groupe de discussion</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>×</button>
        </header>
        <div className="admin-modal__form">
          <label className="admin-field">
            <span>Nom</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Fête des voisins 2026" />
          </label>
          <label className="admin-field">
            <span>Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="De quoi parle ce groupe ?" />
          </label>
          {err && <p className="admin-error">{err}</p>}
          <footer className="admin-modal__footer">
            <button type="button" className="button button--ghost" onClick={onClose}>Annuler</button>
            <button type="button" className="button" disabled={saving} onClick={() => void submit()}>{saving ? 'Création…' : 'Créer'}</button>
          </footer>
        </div>
      </div>
    </div>
  )
}
