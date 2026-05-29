import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routes } from '@/shared/config/routes'
import type { Event } from '@/shared/lib/api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

type Props = {
  event: Event
  currentUserId: string
  onRegister: (id: string) => void
  onUnregister: (id: string) => void
}

export function EventCard({ event, currentUserId, onRegister, onUnregister }: Props) {
  const { t } = useTranslation()
  const isParticipant = event.participants.some((p) => p._id === currentUserId)
  const isOnWaitingList = event.waitingList.some((p) => p._id === currentUserId)
  const isOrganizer = event.organizerId._id === currentUserId
  const isFull = event.participants.length >= event.maxParticipants
  const spotsLeft = event.maxParticipants - event.participants.length

  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-2xl"
      style={{
        background: 'var(--color-bg-soft)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between gap-2">
        {isOrganizer ? (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
          >
            {t('events.badges.organizer')}
          </span>
        ) : isParticipant ? (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--color-success-soft)', color: '#93f0c0' }}
          >
            {t('events.badges.registered')}
          </span>
        ) : isOnWaitingList ? (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,213,128,0.15)', color: '#ffd580' }}
          >
            {t('events.badges.waiting')}
          </span>
        ) : (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}
          >
            {isFull ? t('events.badges.full') : t('events.badges.spots', { count: spotsLeft })}
          </span>
        )}
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {t('events.participantsRatio', { current: event.participants.length, max: event.maxParticipants })}
        </span>
      </div>

      {/* Title */}
      <div>
        <Link
          to={`${routes.events}/${event._id}`}
          className="font-semibold text-base hover:underline"
          style={{ color: 'var(--color-text)' }}
        >
          {event.title}
        </Link>
        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
          {event.description}
        </p>
      </div>

      {/* Date + location */}
      <div className="flex flex-col gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <span>📅 {formatDate(event.date)} à {formatTime(event.date)}</span>
        <span>📍 {event.location}</span>
      </div>

      {/* Organizer + action */}
      <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('events.organizedBy', { firstName: event.organizerId.firstName, lastName: event.organizerId.lastName })}
        </span>

        {!isOrganizer && (
          isParticipant || isOnWaitingList ? (
            <button
              className="button button--secondary text-sm"
              style={{ minHeight: '34px', padding: '0 14px' }}
              onClick={() => onUnregister(event._id)}
            >
              {t('events.actions.unregister')}
            </button>
          ) : (
            <button
              className="button text-sm"
              style={{ minHeight: '34px', padding: '0 14px' }}
              onClick={() => onRegister(event._id)}
            >
              {isFull ? t('events.actions.joinFull') : t('events.actions.join')}
            </button>
          )
        )}
      </div>
    </div>
  )
}
