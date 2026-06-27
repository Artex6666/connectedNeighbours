import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { AppLayout } from '@/shared/layout/AppLayout'
import { RoleBadge } from '@/shared/ui/RoleBadge'
import {
  votesApi,
  type Vote,
  type VoteComment,
  type CreateVotePayload,
  type VoteType,
} from '@/shared/lib/api'

const TYPE_LABEL: Record<VoteType, string> = {
  yesno: 'Oui / Non',
  single: 'Choix unique',
  multiple: 'Choix multiples',
  weighted: 'Vote pondéré',
}

export function VotesPage() {
  const { accessToken, user } = useAuth()
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [commentsFor, setCommentsFor] = useState<Vote | null>(null)

  const reload = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setErrorMsg(null)
    try {
      setVotes(await votesApi.list(accessToken))
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const cast = async (vote: Vote, payload: Parameters<typeof votesApi.cast>[2]) => {
    if (!accessToken) return
    try {
      await votesApi.cast(accessToken, vote._id, payload)
      await reload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  const remove = async (vote: Vote) => {
    if (!accessToken) return
    if (!confirm('Supprimer ce vote ?')) return
    try {
      await votesApi.remove(accessToken, vote._id)
      await reload()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  // Deck Tinder = votes oui/non ouverts, non encore votés.
  const deck = votes.filter((v) => v.type === 'yesno' && v.isOpen && !v.hasVoted)
  const others = votes.filter((v) => !(v.type === 'yesno' && v.isOpen && !v.hasVoted))

  const canModerate = user?.role === 'admin' || user?.role === 'moderator'

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--color-text)' }}>🗳️ Votes du quartier</h1>
            <p className="m-0 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Glissez à droite pour « Pour », à gauche pour « Contre », en haut pour discuter.
            </p>
          </div>
          <button className="button" onClick={() => setCreateOpen(true)}>+ Lancer un vote</button>
        </div>

        {errorMsg && <p style={{ color: '#e11d48' }}>{errorMsg}</p>}
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Chargement…</p>}

        {/* Deck Tinder */}
        {deck.length > 0 && (
          <SwipeDeck
            votes={deck}
            onVote={(v, choice) => void cast(v, { choice })}
            onComments={(v) => setCommentsFor(v)}
          />
        )}

        {/* Sondages multi-options + résultats */}
        {others.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold m-0" style={{ color: 'var(--color-text)' }}>Sondages & résultats</h2>
            {others.map((v) => (
              <VoteCard
                key={v._id}
                vote={v}
                onCast={(payload) => void cast(v, payload)}
                onComments={() => setCommentsFor(v)}
                canDelete={canModerate || v.author?._id === user?._id}
                onDelete={() => void remove(v)}
              />
            ))}
          </div>
        )}

        {!loading && votes.length === 0 && (
          <p className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
            Aucun vote pour le moment. Lancez le premier !
          </p>
        )}
      </div>

      {createOpen && (
        <CreateVoteModal
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false)
            await reload()
          }}
        />
      )}
      {commentsFor && (
        <CommentsPanel vote={commentsFor} onClose={() => setCommentsFor(null)} onChanged={reload} />
      )}
    </AppLayout>
  )
}

// ─── Tinder swipe deck (yes/no) ───────────────────────────────────────────────────

function SwipeDeck({
  votes,
  onVote,
  onComments,
}: {
  votes: Vote[]
  onVote: (v: Vote, choice: number) => void
  onComments: (v: Vote) => void
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const start = useRef<{ x: number; y: number } | null>(null)
  const top = votes[0]

  const fling = (dir: 'left' | 'right' | 'up') => {
    if (!top) return
    if (dir === 'right') onVote(top, 0) // Pour
    else if (dir === 'left') onVote(top, 1) // Contre
    else onComments(top)
    setDrag({ x: 0, y: 0 })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!start.current) return
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }
  const onPointerUp = () => {
    if (!start.current) return
    const { x, y } = drag
    if (x > 110) fling('right')
    else if (x < -110) fling('left')
    else if (y < -110) fling('up')
    else setDrag({ x: 0, y: 0 })
    start.current = null
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') fling('right')
      else if (e.key === 'ArrowLeft') fling('left')
      else if (e.key === 'ArrowUp') fling('up')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top])

  if (!top) return null
  const rot = drag.x / 18
  const hint = drag.x > 60 ? 'pour' : drag.x < -60 ? 'contre' : drag.y < -60 ? 'discuter' : null

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, height: 280 }}>
        {votes.slice(0, 3).reverse().map((v, idxFromBack) => {
          const depth = Math.min(votes.length, 3) - 1 - idxFromBack
          const isTop = v._id === top._id
          return (
            <div
              key={v._id}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 24,
                padding: 28,
                cursor: isTop ? 'grab' : 'default',
                background: 'linear-gradient(150deg, #fff7ed, #ffedd5)',
                border: '1px solid #fed7aa',
                boxShadow: '0 12px 30px rgba(120,72,20,0.12)',
                transform: isTop
                  ? `translate(${drag.x}px, ${drag.y}px) rotate(${rot}deg)`
                  : `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`,
                transition: start.current ? 'none' : 'transform 0.25s ease',
                touchAction: 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', background: '#ffedd5', padding: '3px 10px', borderRadius: 999 }}>
                  {TYPE_LABEL[v.type]}
                </span>
                {v.author && <RoleBadge role={v.author.role} />}
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#7c2d12', margin: 0, lineHeight: 1.25 }}>
                {v.question}
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#9a6b4b' }}>par {v.author?.name ?? '—'}</span>
                {isTop && hint && (
                  <span style={{ fontSize: 18, fontWeight: 800, color: hint === 'pour' ? '#16a34a' : hint === 'contre' ? '#e11d48' : '#7c3aed' }}>
                    {hint === 'pour' ? '👍 POUR' : hint === 'contre' ? '👎 CONTRE' : '💬 DISCUTER'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4">
        <button title="Contre (←)" onClick={() => fling('left')} style={circleBtn('#e11d48', '#fee2e2')}>👎</button>
        <button title="Discuter (↑)" onClick={() => fling('up')} style={circleBtn('#7c3aed', '#ede9fe')}>💬</button>
        <button title="Pour (→)" onClick={() => fling('right')} style={circleBtn('#16a34a', '#dcfce7')}>👍</button>
      </div>
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        {votes.length} vote{votes.length > 1 ? 's' : ''} à trancher · flèches ← → ↑
      </span>
    </div>
  )
}

function circleBtn(color: string, bg: string): React.CSSProperties {
  return {
    width: 58,
    height: 58,
    borderRadius: '50%',
    border: `2px solid ${color}`,
    background: bg,
    fontSize: 24,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

// ─── Vote card (multi-options + résultats) ────────────────────────────────────────

function VoteCard({
  vote,
  onCast,
  onComments,
  canDelete,
  onDelete,
}: {
  vote: Vote
  onCast: (payload: { choice?: number; choices?: number[]; weights?: number[] }) => void
  onComments: () => void
  canDelete: boolean
  onDelete: () => void
}) {
  const [single, setSingle] = useState<number | null>(null)
  const [multi, setMulti] = useState<number[]>([])
  const [weights, setWeights] = useState<number[]>(vote.options.map(() => 0))

  const canVote = vote.isOpen && !vote.hasVoted
  const total = vote.options.reduce((s, o) => s + (o.votes ?? 0), 0) || 1

  return (
    <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border-strong)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold m-0" style={{ color: 'var(--color-text)' }}>{vote.question}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <span>{TYPE_LABEL[vote.type]}</span>·<span>{vote.totalVoters} votant{vote.totalVoters > 1 ? 's' : ''}</span>
            {vote.closed && <span>· clôturé</span>}
          </div>
          {vote.author && (
            <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              par {vote.author.name} <RoleBadge role={vote.author.role} />
            </div>
          )}
        </div>
        {canDelete && (
          <button className="button button--ghost" onClick={onDelete} title="Supprimer">🗑️</button>
        )}
      </div>

      {/* Résultats si visibles */}
      {vote.resultsVisible ? (
        <div className="flex flex-col gap-2">
          {vote.options.map((o, i) => {
            const pct = Math.round(((o.votes ?? 0) / total) * 100)
            const mine = vote.myChoices.includes(i)
            return (
              <div key={i}>
                <div className="flex justify-between text-sm" style={{ color: 'var(--color-text)' }}>
                  <span>{mine ? '✓ ' : ''}{o.label}</span>
                  <span>{o.votes ?? 0}{vote.type === 'weighted' ? ' pts' : ''} · {pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: mine ? '#16a34a' : 'var(--color-primary)' }} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>Résultats visibles après votre vote ou à la clôture.</p>
      )}

      {/* Voter (si pas encore voté et ouvert) */}
      {canVote && (
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          {vote.type === 'single' && vote.options.map((o, i) => (
            <label key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
              <input type="radio" name={`v-${vote._id}`} checked={single === i} onChange={() => setSingle(i)} /> {o.label}
            </label>
          ))}
          {vote.type === 'multiple' && vote.options.map((o, i) => (
            <label key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
              <input type="checkbox" checked={multi.includes(i)} onChange={() => setMulti((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])} /> {o.label}
            </label>
          ))}
          {vote.type === 'weighted' && (
            <>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Répartissez 10 points :</span>
              {vote.options.map((o, i) => (
                <label key={i} className="flex items-center justify-between gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                  {o.label}
                  <input type="number" min={0} max={10} value={weights[i]} onChange={(e) => setWeights((p) => p.map((w, j) => j === i ? Number(e.target.value) : w))} style={{ width: 60 }} />
                </label>
              ))}
              <span className="text-xs" style={{ color: weights.reduce((a, b) => a + b, 0) === 10 ? '#16a34a' : '#e11d48' }}>
                Total : {weights.reduce((a, b) => a + b, 0)} / 10
              </span>
            </>
          )}
          <button
            className="button self-start"
            onClick={() => {
              if (vote.type === 'single') { if (single !== null) onCast({ choice: single }) }
              else if (vote.type === 'multiple') { if (multi.length) onCast({ choices: multi }) }
              else if (vote.type === 'weighted') onCast({ weights })
            }}
          >
            Voter
          </button>
        </div>
      )}

      <button className="button button--ghost self-start" onClick={onComments}>
        💬 {vote.commentsCount} commentaire{vote.commentsCount > 1 ? 's' : ''}
      </button>
    </div>
  )
}

// ─── Panneau commentaires ─────────────────────────────────────────────────────────

function CommentsPanel({ vote, onClose, onChanged }: { vote: Vote; onClose: () => void; onChanged: () => void | Promise<void> }) {
  const { accessToken, user } = useAuth()
  const [comments, setComments] = useState<VoteComment[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      setComments(await votesApi.listComments(accessToken, vote._id))
    } finally {
      setLoading(false)
    }
  }, [accessToken, vote._id])

  useEffect(() => {
    void load()
  }, [load])

  const add = async () => {
    if (!accessToken || !draft.trim()) return
    await votesApi.addComment(accessToken, vote._id, draft.trim())
    setDraft('')
    await load()
    await onChanged()
  }
  const del = async (id: string) => {
    if (!accessToken) return
    await votesApi.deleteComment(accessToken, id)
    await load()
    await onChanged()
  }

  const canModerate = user?.role === 'admin' || user?.role === 'moderator'

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <header className="admin-modal__header">
          <div>
            <span className="eyebrow">Discussion</span>
            <h2 style={{ fontSize: 18 }}>{vote.question}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>×</button>
        </header>
        <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
          {loading ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Chargement…</p>
          ) : comments.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Aucun commentaire. Lancez la discussion !</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} style={{ background: 'var(--color-bg-elevated)', borderRadius: 14, padding: 12 }}>
                <div className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  {c.author?.name ?? 'Anonyme'} {c.author && <RoleBadge role={c.author.role} />}
                  {(canModerate || c.author?._id === user?._id) && (
                    <button className="icon-button" style={{ marginLeft: 'auto', fontSize: 14 }} onClick={() => void del(c._id)} title="Supprimer">🗑️</button>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text)' }}>{c.content}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void add() }}
            placeholder="Votre commentaire…"
            className="h-11 px-4 rounded-xl outline-none flex-1"
            style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          <button className="button" onClick={() => void add()} disabled={!draft.trim()}>Envoyer</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modale de création ──────────────────────────────────────────────────────────

function CreateVoteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void | Promise<void> }) {
  const { accessToken } = useAuth()
  const [question, setQuestion] = useState('')
  const [type, setType] = useState<VoteType>('yesno')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [showResultsLive, setShowResultsLive] = useState(true)
  const [closeAt, setCloseAt] = useState('')
  const [quorum, setQuorum] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async () => {
    if (!accessToken) return
    if (!question.trim()) { setErr('La question est requise'); return }
    setSaving(true)
    setErr(null)
    try {
      const payload: CreateVotePayload = {
        question: question.trim(),
        type,
        isAnonymous,
        showResultsLive,
        closeAt: closeAt ? new Date(closeAt).toISOString() : undefined,
        quorum: quorum ? Number(quorum) : undefined,
        options: type === 'yesno' ? undefined : options.filter((o) => o.trim()),
      }
      await votesApi.create(accessToken, payload)
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
            <span className="eyebrow">Nouveau vote</span>
            <h2>Lancer un vote de quartier</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>×</button>
        </header>
        <div className="admin-modal__form">
          <label className="admin-field">
            <span>Question</span>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ex : Installer un composteur ?" />
          </label>
          <label className="admin-field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as VoteType)}>
              {(Object.keys(TYPE_LABEL) as VoteType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </label>
          {type !== 'yesno' && (
            <div className="admin-field">
              <span>Options</span>
              {options.map((o, i) => (
                <input key={i} value={o} onChange={(e) => setOptions((p) => p.map((x, j) => j === i ? e.target.value : x))} placeholder={`Option ${i + 1}`} style={{ marginBottom: 6 }} />
              ))}
              <button type="button" className="button button--ghost self-start" onClick={() => setOptions((p) => [...p, ''])}>+ Ajouter une option</button>
            </div>
          )}
          <label className="admin-field">
            <span>Clôture (optionnel)</span>
            <input type="datetime-local" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} />
          </label>
          <label className="admin-field">
            <span>Quorum (optionnel)</span>
            <input type="number" min={0} value={quorum} onChange={(e) => setQuorum(e.target.value)} placeholder="Nombre min. de votants" />
          </label>
          <label className="admin-toggle">
            <input type="checkbox" checked={showResultsLive} onChange={(e) => setShowResultsLive(e.target.checked)} />
            <span>Résultats visibles en direct</span>
          </label>
          <label className="admin-toggle">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
            <span>Vote anonyme</span>
          </label>
          {err && <p className="admin-error">{err}</p>}
          <footer className="admin-modal__footer">
            <button type="button" className="button button--ghost" onClick={onClose}>Annuler</button>
            <button type="button" className="button" disabled={saving} onClick={() => void submit()}>{saving ? 'Création…' : 'Lancer le vote'}</button>
          </footer>
        </div>
      </div>
    </div>
  )
}
