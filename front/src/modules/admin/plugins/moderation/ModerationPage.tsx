import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { RoleBadge } from '@/shared/ui/RoleBadge'
import {
  messagesApi,
  votesApi,
  groupsApi,
  resolveMediaUrl,
  type MessageReport,
  type Vote,
  type GroupSummary,
} from '@/shared/lib/api'

type Tab = 'reports' | 'votes' | 'groups'

export function ModerationPage() {
  const { accessToken } = useAuth()
  const [tab, setTab] = useState<Tab>('reports')
  const [reports, setReports] = useState<MessageReport[]>([])
  const [votes, setVotes] = useState<Vote[]>([])
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const [r, v, g] = await Promise.all([
        messagesApi.listReports(accessToken).catch(() => []),
        votesApi.list(accessToken).catch(() => []),
        groupsApi.list(accessToken).catch(() => []),
      ])
      setReports(r)
      setVotes(v)
      setGroups(g)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const resolveReport = async (id: string, status: 'reviewed' | 'dismissed') => {
    if (!accessToken) return
    await messagesApi.resolveReport(accessToken, id, status)
    await reload()
  }
  const delVote = async (id: string) => {
    if (!accessToken || !confirm('Supprimer ce vote ?')) return
    await votesApi.remove(accessToken, id)
    await reload()
  }
  const delGroup = async (id: string) => {
    if (!accessToken || !confirm('Supprimer ce groupe ?')) return
    await groupsApi.remove(accessToken, id)
    await reload()
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'reports', label: `🚩 Signalements (${reports.length})` },
    { id: 'votes', label: `🗳️ Votes (${votes.length})` },
    { id: 'groups', label: `👥 Groupes (${groups.length})` },
  ]

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Modération</h1>
        <p>Signalements de messages, votes et groupes du quartier.</p>
      </header>

      <div className="admin-filters" style={{ gap: 8 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`button ${tab === t.id ? '' : 'button--ghost'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="admin-empty">Chargement…</p>
      ) : tab === 'reports' ? (
        reports.length === 0 ? (
          <p className="admin-empty">Aucun signalement en attente. 🎉</p>
        ) : (
          <div className="admin-alerte-list">
            {reports.map((r) => (
              <article key={r._id} className="admin-alerte-card">
                <header>
                  <strong>Signalé par {r.reportedBy ? `${r.reportedBy.firstName} ${r.reportedBy.lastName}` : '—'}</strong>
                  {r.reason ? <span className="admin-status admin-status--warning">{r.reason}</span> : null}
                </header>
                {r.messageId ? (
                  r.messageId.type === 'text' ? (
                    <p>« {r.messageId.content} »</p>
                  ) : (
                    <p><a href={resolveMediaUrl(r.messageId.content)} target="_blank" rel="noreferrer">Voir le média {r.messageId.type}</a></p>
                  )
                ) : (
                  <p style={{ color: 'var(--color-text-muted)' }}>Message supprimé.</p>
                )}
                <footer>
                  <div className="admin-alerte-card__actions" style={{ marginLeft: 'auto' }}>
                    <button className="button button--secondary" onClick={() => void resolveReport(r._id, 'dismissed')}>Ignorer</button>
                    <button className="button" onClick={() => void resolveReport(r._id, 'reviewed')}>Traité</button>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )
      ) : tab === 'votes' ? (
        votes.length === 0 ? (
          <p className="admin-empty">Aucun vote.</p>
        ) : (
          <div className="admin-alerte-list">
            {votes.map((v) => (
              <article key={v._id} className="admin-alerte-card">
                <header>
                  <strong>{v.question}</strong>
                  <span className="admin-status admin-status--info">{v.totalVoters} votant(s)</span>
                </header>
                {v.author && (
                  <p className="flex items-center gap-1.5">par {v.author.name} <RoleBadge role={v.author.role} /></p>
                )}
                <footer>
                  <button className="button button--ghost" style={{ marginLeft: 'auto' }} onClick={() => void delVote(v._id)}>🗑️ Supprimer</button>
                </footer>
              </article>
            ))}
          </div>
        )
      ) : groups.length === 0 ? (
        <p className="admin-empty">Aucun groupe.</p>
      ) : (
        <div className="admin-alerte-list">
          {groups.map((g) => (
            <article key={g._id} className="admin-alerte-card">
              <header>
                <strong>{g.name}</strong>
                <span className="admin-status admin-status--info">{g.memberCount} membre(s)</span>
              </header>
              {g.description ? <p>{g.description}</p> : null}
              <footer>
                <button className="button button--ghost" style={{ marginLeft: 'auto' }} onClick={() => void delGroup(g._id)}>🗑️ Supprimer</button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
