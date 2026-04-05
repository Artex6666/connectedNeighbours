import { useMemo, useState } from 'react'
import inboxIcon from '@/assets/inbox.png'
import vocalIcon from '@/assets/vocal.png'

type ChatMessage = {
  id: string
  author: 'me' | 'other'
  type: 'text' | 'voice'
  content: string
  timestamp: string
}

type Conversation = {
  id: string
  name: string
  role: string
  avatar: string
  messages: ChatMessage[]
}

const initialConversations: Conversation[] = [
  {
    id: '1',
    name: 'Camille Martin',
    role: 'Voisine - Rue de Charonne',
    avatar: 'CM',
    messages: [
      {
        id: '1-1',
        author: 'other',
        type: 'text',
        content: 'Je peux passer pour les plantes demain vers 18h si tu veux.',
        timestamp: '2026-04-04T20:15:00.000Z',
      },
      {
        id: '1-2',
        author: 'me',
        type: 'text',
        content: 'Oui parfait, je te laisse le digicode en prive.',
        timestamp: '2026-04-04T19:42:00.000Z',
      },
      {
        id: '1-3',
        author: 'other',
        type: 'voice',
        content: 'Message vocal - 0:18',
        timestamp: '2026-04-04T18:05:00.000Z',
      },
    ],
  },
  {
    id: '2',
    name: 'Nassim Leroy',
    role: 'Moderateur - Quartier Saint-Ambroise',
    avatar: 'NL',
    messages: [
      {
        id: '2-1',
        author: 'other',
        type: 'text',
        content: 'La collecte de samedi est confirmee, on ouvre les inscriptions ce soir.',
        timestamp: '2026-04-04T17:30:00.000Z',
      },
      {
        id: '2-2',
        author: 'me',
        type: 'text',
        content: 'Super, je relaie l info sur le groupe de voisins.',
        timestamp: '2026-04-04T16:50:00.000Z',
      },
    ],
  },
  {
    id: '3',
    name: 'Sarah Benali',
    role: 'Voisine - Bastille',
    avatar: 'SB',
    messages: [
      {
        id: '3-1',
        author: 'me',
        type: 'text',
        content: 'Merci pour le document signe, je l ai bien recu.',
        timestamp: '2026-04-03T12:05:00.000Z',
      },
      {
        id: '3-2',
        author: 'other',
        type: 'text',
        content: 'Parfait, je te renvoie aussi la version PDF archivee.',
        timestamp: '2026-04-03T11:42:00.000Z',
      },
    ],
  },
]

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversations[0].id)
  const [draft, setDraft] = useState('')

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((first, second) => {
      const firstDate = new Date(first.messages[0]?.timestamp ?? 0).getTime()
      const secondDate = new Date(second.messages[0]?.timestamp ?? 0).getTime()
      return secondDate - firstDate
    })
  }, [conversations])

  const selectedConversation =
    sortedConversations.find((conversation) => conversation.id === selectedConversationId) ??
    sortedConversations[0]

  const appendMessage = (type: ChatMessage['type'], content: string) => {
    if (!selectedConversation) {
      return
    }

    const nextMessage: ChatMessage = {
      id: `${selectedConversation.id}-${Date.now()}`,
      author: 'me',
      type,
      content,
      timestamp: new Date().toISOString(),
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? { ...conversation, messages: [nextMessage, ...conversation.messages] }
          : conversation,
      ),
    )
  }

  return (
    <>
      {!isOpen ? (
        <button
          className="chat-bubble"
          type="button"
          aria-label="Ouvrir la messagerie"
          onClick={() => setIsOpen(true)}
        >
          <img src={inboxIcon} alt="" />
        </button>
      ) : null}

      {isOpen && selectedConversation ? (
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

          <div className="chat-panel__body">
            <aside className="chat-sidebar">
              {sortedConversations.map((conversation) => {
                const latestMessage = conversation.messages[0]

                return (
                  <button
                    key={conversation.id}
                    className={`chat-thread ${
                      selectedConversation.id === conversation.id ? 'chat-thread--active' : ''
                    }`}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    <span className="chat-thread__avatar">{conversation.avatar}</span>
                    <span className="chat-thread__content">
                      <strong>{conversation.name}</strong>
                      <small>{conversation.role}</small>
                      <span>{latestMessage?.content}</span>
                    </span>
                  </button>
                )
              })}
            </aside>

            <div className="chat-conversation">
              <div className="chat-conversation__header">
                <div>
                  <strong>{selectedConversation.name}</strong>
                  <small>{selectedConversation.role}</small>
                </div>
                <span className="status-pill">En ligne</span>
              </div>

              <div className="chat-messages">
                {selectedConversation.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`chat-message ${
                      message.author === 'me' ? 'chat-message--me' : 'chat-message--other'
                    }`}
                  >
                    <div className="chat-message__meta">
                      <strong>{message.author === 'me' ? 'Vous' : selectedConversation.name}</strong>
                      <span>{formatTimestamp(message.timestamp)}</span>
                    </div>
                    <p>{message.content}</p>
                    {message.type === 'voice' ? <span className="chat-voice-tag">Vocal</span> : null}
                  </article>
                ))}
              </div>

              <form
                className="chat-composer"
                onSubmit={(event) => {
                  event.preventDefault()

                  const trimmedDraft = draft.trim()
                  if (!trimmedDraft) {
                    return
                  }

                  appendMessage('text', trimmedDraft)
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
                    onClick={() => appendMessage('voice', 'Message vocal - 0:09')}
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
