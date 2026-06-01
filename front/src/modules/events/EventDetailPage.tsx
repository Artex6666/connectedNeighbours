import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { eventsApi, type Event } from '@/shared/lib/api'
import { AppLayout } from '@/shared/layout/AppLayout'
import { routes } from '@/shared/config/routes'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function EventDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { accessToken, user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!accessToken || !id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await eventsApi.get(accessToken, id)
      setEvent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void load() }, [id, accessToken])

  const handleRegister = async () => {
    if (!accessToken || !id) return
    try {
      await eventsApi.register(accessToken, id)
      void load()
    } catch (err) {
      alert(err instanceof Error ? err.message : t('auth.errors.generic'))
    }
  }

  const handleUnregister = async () => {
    if (!accessToken || !id || !confirm(t('events.actions.confirmUnregister'))) return
    try {
      await eventsApi.unregister(accessToken, id)
      void load()
    } catch (err) {
      alert(err instanceof Error ? err.message : t('auth.errors.generic'))
    }
  }

  const handleCancel = async () => {
    if (!accessToken || !id || !confirm(t('events.actions.confirmCancel'))) return
    try {
      await eventsApi.cancel(accessToken, id)
      navigate(routes.events)
    } catch (err) {
      alert(err instanceof Error ? err.message : t('auth.errors.generic'))
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>
      </AppLayout>
    )
  }

  if (error || !event) {
    return (
      <AppLayout>
        <div className="flex flex-col gap-4">
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,80,80,0.1)', color: '#ffb4b4' }}>
            {error ?? t('events.notFound')}
          </div>
          <Link to={routes.events} className="text-sm" style={{ color: 'var(--color-primary)' }}>
            {t('events.backToList')}
          </Link>
        </div>
      </AppLayout>
    )
  }

  const currentUserId = user?._id ?? ''
  const isOrganizer = event.organizerId._id === currentUserId
  const isParticipant = event.participants.some((p) => p._id === currentUserId)
  const isOnWaitingList = event.waitingList.some((p) => p._id === currentUserId)
  const isFull = event.participants.length >= event.maxParticipants

  const cardStyle = {
    background: 'var(--color-bg-soft)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-soft)',
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 max-w-3xl">

        <Link to={routes.events} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('events.backToList')}
        </Link>

        {/* Header card */}
        <div className="flex flex-col gap-4 p-6 rounded-2xl" style={cardStyle}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--color-text)' }}>
              {event.title}
            </h1>
            {event.isCancelled && (
              <span
                className="text-sm font-bold px-3 py-1 rounded-full shrink-0"
                style={{ background: 'rgba(255,80,80,0.12)', color: '#ffb4b4' }}
              >
                {t('events.cancelled')}
              </span>
            )}
          </div>

          <p style={{ color: 'var(--color-text-muted)' }}>{event.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <span>📅 {formatDate(event.date)} à {formatTime(event.date)}</span>
            <span>📍 {event.location}</span>
            <span>👥 {t('events.participantsRatio', { current: event.participants.length, max: event.maxParticipants })}</span>
            <span>🧑‍💼 {t('events.organizedBy', { firstName: event.organizerId.firstName, lastName: event.organizerId.lastName })}</span>
          </div>

          {/* Actions */}
          {!event.isCancelled && (
            <div className="flex gap-3 flex-wrap pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              {!isOrganizer && (
                isParticipant || isOnWaitingList ? (
                  <button className="button button--secondary" onClick={handleUnregister}>
                    {isOnWaitingList ? t('events.actions.unregisterWaiting') : t('events.actions.unregister')}
                  </button>
                ) : (
                  <button className="button" onClick={handleRegister}>
                    {isFull ? t('events.actions.joinFullDetail') : t('events.actions.join')}
                  </button>
                )
              )}
              {isOrganizer && (
                <button
                  className="button button--secondary"
                  style={{ color: '#ffb4b4' }}
                  onClick={handleCancel}
                >
                  {t('events.actions.cancelEvent')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="flex flex-col gap-3 p-6 rounded-2xl" style={cardStyle}>
          <h2 className="text-base font-semibold m-0" style={{ color: 'var(--color-text)' }}>
            {t('events.participantsTitle', { count: event.participants.length })}
          </h2>
          {event.participants.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('events.noParticipants')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {event.participants.map((p) => (
                <span
                  key={p._id}
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ background: 'var(--color-primary-soft)', color: 'var(--color-text)' }}
                >
                  {p.firstName} {p.lastName}
                  {p._id === event.organizerId._id && ' ★'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Waiting list */}
        {event.waitingList.length > 0 && (
          <div className="flex flex-col gap-3 p-6 rounded-2xl" style={cardStyle}>
            <h2 className="text-base font-semibold m-0" style={{ color: 'var(--color-text)' }}>
              {t('events.waitingListTitle', { count: event.waitingList.length })}
            </h2>
            <div className="flex flex-wrap gap-2">
              {event.waitingList.map((p) => (
                <span
                  key={p._id}
                  className="text-sm px-3 py-1 rounded-full"
                  style={{ background: 'rgba(255,213,128,0.10)', color: '#ffd580' }}
                >
                  {p.firstName} {p.lastName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
