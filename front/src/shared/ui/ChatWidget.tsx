import { useEffect, useMemo, useState } from 'react'
import inboxIcon from '@/assets/inbox.png'
import vocalIcon from '@/assets/vocal.png'
import {
  messagesApi,
  type AuthSession,
  type ConversationDetails,
  type ConversationMessage,
  type ConversationSummary,
} from '@/shared/lib/api'

function formatRole(role: string) {
  if (role === 'resident') {
    return 'Habitant'
  }

  if (role === 'moderator') {
    return 'Moderateur'
  }

  if (role === 'admin') {
    return 'Administrateur'
  }

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

type ChatWidgetProps = {
  isAuthenticated: boolean
  session: AuthSession | null
  onRequireAuth: () => void
}

export function ChatWidget({ isAuthenticated, session, onRequireAuth }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [activeConversation, setActiveConversation] = useState<ConversationDetails | null>(null)
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((first, second) => {
      const firstDate = new Date(first.lastTimestamp).getTime()
      const secondDate = new Date(second.lastTimestamp).getTime()
      return secondDate - firstDate
    })
  }, [conversations])

  const selectedConversation =
    sortedConversations.find((conversation) => conversation.userId === selectedConversationId) ??
    sortedConversations[0] ??
    null

  useEffect(() => {
    if (isAuthenticated) {
      return
    }

    setIsOpen(false)
    setConversations([])
    setSelectedConversationId(null)
    setActiveConversation(null)
    setDraft('')
    setErrorMessage(null)
  }, [isAuthenticated])

  useEffect(() => {
    if (!isOpen || !isAuthenticated || !session) {
      return
    }

    const fetchConversations = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextConversations = await messagesApi.list(session.token)
        setConversations(nextConversations)
        setSelectedConversationId((current) => current ?? nextConversations[0]?.userId ?? null)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger la messagerie.')
      } finally {
        setIsLoading(false)
      }
    }

    void fetchConversations()
  }, [isAuthenticated, isOpen, session])

  useEffect(() => {
    if (!isOpen || !session || !selectedConversationId) {
      return
    }

    const fetchConversation = async () => {
      try {
        const conversation = await messagesApi.getConversation(session.token, selectedConversationId)
        setActiveConversation(conversation)
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Impossible de charger la conversation.',
        )
      }
    }

    void fetchConversation()
  }, [isOpen, selectedConversationId, session])

  const refreshConversations = async (focusUserId?: string) => {
    if (!session) {
      return
    }

    const nextConversations = await messagesApi.list(session.token)
    setConversations(nextConversations)
    setSelectedConversationId(focusUserId ?? nextConversations[0]?.userId ?? null)
  }

  const appendMessage = async (type: 'text' | 'audio', content: string) => {
    if (!selectedConversation || !session) {
      return
    }

    await messagesApi.sendMessage(session.token, selectedConversation.userId, { content, type })
    await refreshConversations(selectedConversation.userId)

    const nextConversation = await messagesApi.getConversation(session.token, selectedConversation.userId)
    setActiveConversation(nextConversation)
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
        <section className="chat-panel" aria-label="Messagerie recente">
          <header className="chat-panel__header">
            <div>
              <span className="eyebrow">Messagerie</span>
              <h2>Conversations recentes</h2>
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

          {errorMessage ? <p className="chat-panel__error">{errorMessage}</p> : null}

          <div className="chat-panel__body">
            <aside className="chat-sidebar">
              {isLoading && sortedConversations.length === 0 ? (
                <p className="chat-empty-state">Chargement des conversations...</p>
              ) : null}

              {sortedConversations.map((conversation) => {
                return (
                  <button
                    key={conversation.userId}
                    className={`chat-thread ${
                      selectedConversation?.userId === conversation.userId ? 'chat-thread--active' : ''
                    }`}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.userId)}
                  >
                    <span className="chat-thread__avatar">{conversation.avatar}</span>
                    <span className="chat-thread__content">
                      <strong>{conversation.name}</strong>
                      <small>{formatRole(conversation.role)}</small>
                      <span>{conversation.lastMessage}</span>
                    </span>
                  </button>
                )
              })}
            </aside>

            <div className="chat-conversation">
              <div className="chat-conversation__header">
                <div>
                  <strong>{selectedConversation?.name ?? 'Conversation'}</strong>
                  <small>{selectedConversation ? formatRole(selectedConversation.role) : 'Voisin'}</small>
                </div>
                <span className="status-pill">En ligne</span>
              </div>

              <div className="chat-messages">
                {activeConversation?.messages.length ? (
                  activeConversation.messages.map((message: ConversationMessage) => {
                    const isMine = message.senderId === session?.user._id

                    return (
                      <article
                        key={message._id}
                        className={`chat-message ${
                          isMine ? 'chat-message--me' : 'chat-message--other'
                        }`}
                      >
                        <div className="chat-message__meta">
                          <strong>{isMine ? 'Vous' : activeConversation.participant.name}</strong>
                          <span>{formatTimestamp(message.createdAt)}</span>
                        </div>
                        <p>{message.content}</p>
                        {message.type === 'audio' ? <span className="chat-voice-tag">Vocal</span> : null}
                      </article>
                    )
                  })
                ) : (
                  <p className="chat-empty-state">Aucun message pour le moment.</p>
                )}
              </div>

              <form
                className="chat-composer"
                onSubmit={async (event) => {
                  event.preventDefault()

                  const trimmedDraft = draft.trim()
                  if (!trimmedDraft) {
                    return
                  }

                  await appendMessage('text', trimmedDraft)
                  setDraft('')
                }}
              >
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Repondre a la conversation..."
                  rows={1}
                />

                <div className="chat-composer__actions">
                  <button
                    className="chat-voice-button"
                    type="button"
                    aria-label="Envoyer un vocal"
                    onClick={async () => appendMessage('audio', 'Message vocal - 0:09')}
                  >
                    <img src={vocalIcon} alt="" />
                  </button>
                  <button className="button" type="submit">
                    Envoyer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
