import { useEffect, useMemo, useRef, useState } from 'react'
import inboxIcon from '@/assets/inbox.png'
import vocalIcon from '@/assets/vocal.png'
import {
  messagesApi,
  resolveMediaUrl,
  usersApi,
  type AuthSession,
  type ConversationDetails,
  type ConversationMessage,
  type ConversationSummary,
  type NeighborSummary,
} from '@/shared/lib/api'
import { formatDuration, useVoiceRecorder } from '@/shared/hooks/useVoiceRecorder'

function formatRole(role: string) {
  if (role === 'resident') return 'Habitant'
  if (role === 'moderator') return 'Modérateur'
  if (role === 'admin') return 'Administrateur'
  return role
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

function makeAvatar(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB

type ChatWidgetProps = {
  isAuthenticated: boolean
  session: AuthSession | null
  onRequireAuth: () => void
}

type PendingPeer = {
  userId: string
  firstName: string
  lastName: string
  role: string
}

export function ChatWidget({ isAuthenticated, session, onRequireAuth }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [activeConversation, setActiveConversation] = useState<ConversationDetails | null>(null)
  const [pendingPeer, setPendingPeer] = useState<PendingPeer | null>(null)
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null)
  const [showNewConversation, setShowNewConversation] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const recorder = useVoiceRecorder()

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((first, second) => {
      const firstDate = new Date(first.lastTimestamp).getTime()
      const secondDate = new Date(second.lastTimestamp).getTime()
      return secondDate - firstDate
    })
  }, [conversations])

  // Effective conversation in focus: either an existing one, or the pending
  // peer the user just picked from "Nouvelle conversation".
  const currentPeerId =
    pendingPeer?.userId ??
    sortedConversations.find((c) => c.userId === selectedConversationId)?.userId ??
    sortedConversations[0]?.userId ??
    null

  const currentPeerLabel = useMemo(() => {
    if (pendingPeer) {
      return { name: `${pendingPeer.firstName} ${pendingPeer.lastName}`, role: pendingPeer.role }
    }
    const found = sortedConversations.find((c) => c.userId === currentPeerId)
    if (found) return { name: found.name, role: found.role }
    return null
  }, [pendingPeer, sortedConversations, currentPeerId])

  // Cleanup when user logs out
  useEffect(() => {
    if (isAuthenticated) return
    setIsOpen(false)
    setConversations([])
    setSelectedConversationId(null)
    setActiveConversation(null)
    setPendingPeer(null)
    setDraft('')
    setErrorMessage(null)
    setImagePreview(null)
    recorder.reset()
  }, [isAuthenticated, recorder])

  // Load conversation list (and poll every 5s while open)
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !session) return

    let cancelled = false

    const fetchList = async () => {
      try {
        const next = await messagesApi.list(session.accessToken)
        if (cancelled) return
        setConversations(next)
        setSelectedConversationId((current) => current ?? next[0]?.userId ?? null)
      } catch (err) {
        if (cancelled) return
        setErrorMessage(err instanceof Error ? err.message : 'Impossible de charger la messagerie.')
      }
    }

    setIsLoading(true)
    void fetchList().finally(() => {
      if (!cancelled) setIsLoading(false)
    })

    const interval = window.setInterval(fetchList, 5000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [isAuthenticated, isOpen, session])

  // Load active conversation (and poll every 3s while open + focused on a peer)
  useEffect(() => {
    if (!isOpen || !session || !currentPeerId) {
      setActiveConversation(null)
      return
    }

    let cancelled = false

    const fetchConv = async () => {
      try {
        const conv = await messagesApi.getConversation(session.accessToken, currentPeerId)
        if (!cancelled) setActiveConversation(conv)
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Impossible de charger la conversation.')
        }
      }
    }

    void fetchConv()
    const interval = window.setInterval(fetchConv, 3000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [isOpen, currentPeerId, session])

  // Once a pending peer has a real message in the list, clear the pending state
  useEffect(() => {
    if (!pendingPeer) return
    if (sortedConversations.some((c) => c.userId === pendingPeer.userId)) {
      setSelectedConversationId(pendingPeer.userId)
      setPendingPeer(null)
    }
  }, [pendingPeer, sortedConversations])

  const refreshAfterSend = async () => {
    if (!session || !currentPeerId) return
    const [list, conv] = await Promise.all([
      messagesApi.list(session.accessToken),
      messagesApi.getConversation(session.accessToken, currentPeerId),
    ])
    setConversations(list)
    setActiveConversation(conv)
  }

  const sendText = async (content: string) => {
    if (!session || !currentPeerId) return
    setIsSending(true)
    setErrorMessage(null)
    try {
      await messagesApi.sendMessage(session.accessToken, currentPeerId, { content })
      await refreshAfterSend()
      setDraft('')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Impossible d'envoyer le message.")
    } finally {
      setIsSending(false)
    }
  }

  const sendAttachment = async (file: Blob, type: 'photo' | 'audio', filename?: string) => {
    if (!session || !currentPeerId) return
    setIsSending(true)
    setErrorMessage(null)
    try {
      await messagesApi.sendAttachment(session.accessToken, currentPeerId, file, type, filename)
      await refreshAfterSend()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Échec de l'envoi du fichier.")
    } finally {
      setIsSending(false)
    }
  }

  const handleImagePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage(`Image trop volumineuse (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB).`)
      return
    }
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Seules les images sont autorisées.')
      return
    }
    setImagePreview({ file, url: URL.createObjectURL(file) })
  }

  const handleImageSend = async () => {
    if (!imagePreview) return
    const file = imagePreview.file
    URL.revokeObjectURL(imagePreview.url)
    setImagePreview(null)
    await sendAttachment(file, 'photo', file.name)
  }

  const handleImageCancel = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview.url)
    setImagePreview(null)
  }

  const handleVoiceSend = async () => {
    if (!recorder.blob) return
    const ext = recorder.blob.type.includes('mp4') ? 'm4a' : recorder.blob.type.includes('ogg') ? 'ogg' : 'webm'
    await sendAttachment(recorder.blob, 'audio', `vocal.${ext}`)
    recorder.reset()
  }

  const handleSelectPeer = (peer: PendingPeer) => {
    setShowNewConversation(false)
    const existing = sortedConversations.find((c) => c.userId === peer.userId)
    if (existing) {
      setSelectedConversationId(peer.userId)
      setPendingPeer(null)
    } else {
      setPendingPeer(peer)
      setSelectedConversationId(peer.userId)
    }
  }

  return (
    <>
      {!isOpen ? (
        <button
          className="chat-bubble"
          type="button"
          aria-label="Ouvrir la messagerie"
          onClick={() => {
            if (!isAuthenticated) {
              onRequireAuth()
              return
            }
            setIsOpen(true)
          }}
        >
          <img src={inboxIcon} alt="" />
        </button>
      ) : null}

      {isOpen ? (
        <section className="chat-panel" aria-label="Messagerie">
          <header className="chat-panel__header">
            <div>
              <span className="eyebrow">Messagerie</span>
              <h2>Conversations</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Fermer la messagerie"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </header>

          {errorMessage ? (
            <p className="chat-panel__error" onClick={() => setErrorMessage(null)} role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="chat-panel__body">
            <aside className="chat-sidebar">
              <button
                type="button"
                className="button chat-new-conv"
                onClick={() => setShowNewConversation(true)}
              >
                + Nouvelle conversation
              </button>

              {pendingPeer &&
              !sortedConversations.find((c) => c.userId === pendingPeer.userId) ? (
                <button
                  key={`pending-${pendingPeer.userId}`}
                  className={`chat-thread ${currentPeerId === pendingPeer.userId ? 'chat-thread--active' : ''}`}
                  type="button"
                  onClick={() => setSelectedConversationId(pendingPeer.userId)}
                >
                  <span className="chat-thread__avatar">
                    {makeAvatar(pendingPeer.firstName, pendingPeer.lastName)}
                  </span>
                  <span className="chat-thread__content">
                    <strong>
                      {pendingPeer.firstName} {pendingPeer.lastName}
                    </strong>
                    <small>{formatRole(pendingPeer.role)}</small>
                    <span>Nouvelle conversation…</span>
                  </span>
                </button>
              ) : null}

              {isLoading && sortedConversations.length === 0 && !pendingPeer ? (
                <p className="chat-empty-state">Chargement des conversations…</p>
              ) : null}

              {sortedConversations.length === 0 && !isLoading && !pendingPeer ? (
                <p className="chat-empty-state">
                  Aucune conversation pour le moment. Démarrez-en une depuis le bouton ci-dessus.
                </p>
              ) : null}

              {sortedConversations.map((conversation) => (
                <button
                  key={conversation.userId}
                  className={`chat-thread ${
                    currentPeerId === conversation.userId ? 'chat-thread--active' : ''
                  }`}
                  type="button"
                  onClick={() => {
                    setSelectedConversationId(conversation.userId)
                    setPendingPeer(null)
                  }}
                >
                  <span className="chat-thread__avatar">{conversation.avatar}</span>
                  <span className="chat-thread__content">
                    <strong>{conversation.name}</strong>
                    <small>{formatRole(conversation.role)}</small>
                    <span>{conversation.lastMessage}</span>
                  </span>
                </button>
              ))}
            </aside>

            <div className="chat-conversation">
              <div className="chat-conversation__header">
                <div>
                  <strong>{currentPeerLabel?.name ?? 'Conversation'}</strong>
                  <small>{currentPeerLabel ? formatRole(currentPeerLabel.role) : 'Voisin'}</small>
                </div>
                <span className="status-pill">En ligne</span>
              </div>

              <div className="chat-messages">
                {!currentPeerId ? (
                  <p className="chat-empty-state">Sélectionnez une conversation.</p>
                ) : activeConversation?.messages.length ? (
                  activeConversation.messages.map((message: ConversationMessage) => {
                    const isMine = message.senderId === session?.user._id
                    return (
                      <article
                        key={message._id}
                        className={`chat-message ${isMine ? 'chat-message--me' : 'chat-message--other'}`}
                      >
                        <div className="chat-message__meta">
                          <strong>{isMine ? 'Vous' : activeConversation.participant.name}</strong>
                          <span>{formatTimestamp(message.createdAt)}</span>
                        </div>
                        <MessageBody message={message} />
                      </article>
                    )
                  })
                ) : (
                  <p className="chat-empty-state">Aucun message — envoyez le premier !</p>
                )}
              </div>

              {imagePreview ? (
                <div className="chat-image-preview">
                  <img src={imagePreview.url} alt="Aperçu" />
                  <div className="chat-image-preview__actions">
                    <button type="button" className="button button--ghost" onClick={handleImageCancel}>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={() => void handleImageSend()}
                      disabled={isSending}
                    >
                      {isSending ? 'Envoi…' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              ) : null}

              {recorder.state === 'recorded' && recorder.blob ? (
                <div className="chat-voice-preview">
                  <audio controls src={URL.createObjectURL(recorder.blob)} />
                  <span className="chat-voice-preview__duration">
                    {formatDuration(recorder.durationSeconds)}
                  </span>
                  <div className="chat-voice-preview__actions">
                    <button type="button" className="button button--ghost" onClick={recorder.reset}>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={() => void handleVoiceSend()}
                      disabled={isSending}
                    >
                      {isSending ? 'Envoi…' : 'Envoyer le vocal'}
                    </button>
                  </div>
                </div>
              ) : null}

              {recorder.state === 'recording' ? (
                <div className="chat-voice-recording">
                  <span className="chat-voice-recording__pulse" aria-hidden="true" />
                  <span>Enregistrement… {formatDuration(recorder.durationSeconds)}</span>
                  <div className="chat-voice-recording__actions">
                    <button type="button" className="button button--ghost" onClick={recorder.reset}>
                      Annuler
                    </button>
                    <button type="button" className="button" onClick={recorder.stop}>
                      Stop
                    </button>
                  </div>
                </div>
              ) : null}

              {recorder.error ? <p className="chat-panel__error">{recorder.error}</p> : null}

              <form
                className="chat-composer"
                onSubmit={async (event) => {
                  event.preventDefault()
                  const trimmedDraft = draft.trim()
                  if (!trimmedDraft) return
                  await sendText(trimmedDraft)
                }}
              >
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    currentPeerId ? 'Écrire un message…' : 'Choisissez une conversation pour écrire…'
                  }
                  rows={1}
                  disabled={!currentPeerId || isSending}
                />

                <div className="chat-composer__actions">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImagePick}
                    hidden
                  />
                  <button
                    type="button"
                    className="chat-attach-button"
                    aria-label="Envoyer une image"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!currentPeerId || isSending || recorder.state === 'recording'}
                    title="Image"
                  >
                    📷
                  </button>

                  <button
                    type="button"
                    className={`chat-voice-button ${recorder.state === 'recording' ? 'chat-voice-button--active' : ''}`}
                    aria-label={
                      recorder.state === 'recording' ? 'Arrêter le vocal' : 'Enregistrer un vocal'
                    }
                    onClick={async () => {
                      if (recorder.state === 'recording') {
                        recorder.stop()
                      } else if (recorder.state === 'idle' || recorder.state === 'error') {
                        await recorder.start()
                      }
                    }}
                    disabled={!currentPeerId || isSending}
                    title={recorder.state === 'recording' ? 'Arrêter' : 'Vocal'}
                  >
                    <img src={vocalIcon} alt="" />
                  </button>

                  <button
                    className="button"
                    type="submit"
                    disabled={!currentPeerId || isSending || !draft.trim()}
                  >
                    {isSending ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ) : null}

      {showNewConversation && session ? (
        <NewConversationModal
          token={session.accessToken}
          onClose={() => setShowNewConversation(false)}
          onSelect={handleSelectPeer}
        />
      ) : null}
    </>
  )
}

function MessageBody({ message }: { message: ConversationMessage }) {
  if (message.type === 'photo') {
    return (
      <a
        className="chat-message__image"
        href={resolveMediaUrl(message.content)}
        target="_blank"
        rel="noreferrer"
      >
        <img src={resolveMediaUrl(message.content)} alt="" />
      </a>
    )
  }

  if (message.type === 'audio') {
    return (
      <audio
        className="chat-message__audio"
        controls
        preload="metadata"
        src={resolveMediaUrl(message.content)}
      />
    )
  }

  return <p>{message.content}</p>
}

type NewConversationModalProps = {
  token: string
  onClose: () => void
  onSelect: (peer: PendingPeer) => void
}

function NewConversationModal({ token, onClose, onSelect }: NewConversationModalProps) {
  const [neighbors, setNeighbors] = useState<NeighborSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    usersApi
      .listNeighbors(token)
      .then((list) => {
        if (!cancelled) setNeighbors(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return neighbors
    return neighbors.filter((n) =>
      `${n.firstName} ${n.lastName}`.toLowerCase().includes(q),
    )
  }, [neighbors, query])

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="new-conv-modal">
        <header className="new-conv-modal__header">
          <div>
            <span className="eyebrow">Nouveau</span>
            <h2>Démarrer une conversation</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <input
          className="new-conv-modal__search"
          type="search"
          placeholder="Rechercher un voisin par nom…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {error ? <p className="chat-panel__error">{error}</p> : null}

        <div className="new-conv-modal__list">
          {loading ? (
            <p className="chat-empty-state">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="chat-empty-state">Aucun voisin trouvé.</p>
          ) : (
            filtered.map((n) => (
              <button
                key={n._id}
                type="button"
                className="new-conv-modal__item"
                onClick={() =>
                  onSelect({
                    userId: n._id,
                    firstName: n.firstName,
                    lastName: n.lastName,
                    role: n.role,
                  })
                }
              >
                <span className="chat-thread__avatar">{makeAvatar(n.firstName, n.lastName)}</span>
                <span>
                  <strong>
                    {n.firstName} {n.lastName}
                  </strong>
                  <small>{formatRole(n.role)}</small>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
