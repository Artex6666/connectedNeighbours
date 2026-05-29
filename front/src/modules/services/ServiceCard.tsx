import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { routes } from '@/shared/config/routes'
import type { Service } from '@/shared/lib/api'

const STATUS_COLORS: Record<string, string> = {
  open: '#93f0c0',
  in_progress: '#78adff',
  done: '#9fb1c9',
  cancelled: '#ffb4b4',
  pending: '#ffd580',
}

type Props = {
  service: Service
  currentUserId: string
  onAccept: (id: string) => void
  onDelete: (id: string) => void
}

export function ServiceCard({ service, currentUserId, onAccept, onDelete }: Props) {
  const { t } = useTranslation()
  const isOwner = service.authorId._id === currentUserId
  const canAccept = service.status === 'open' && !isOwner

  return (
    <div
      className="flex flex-col gap-3 p-5 rounded-2xl"
      style={{
        background: 'var(--color-bg-soft)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
        >
          {t(`services.category.${service.category}`, service.category)}
        </span>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)', color: STATUS_COLORS[service.status] }}
        >
          {t(`services.status.${service.status}`, service.status)}
        </span>
      </div>

      {/* Title + description */}
      <div>
        <Link
          to={routes.serviceDetail(service._id)}
          className="font-semibold text-base m-0 mb-1 hover:underline"
          style={{ color: 'var(--color-text)' }}
        >
          {service.title}
        </Link>
        <p className="text-sm m-0 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
          {service.description}
        </p>
      </div>

      {/* Author + points */}
      <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {service.authorId.firstName} {service.authorId.lastName}
        </span>
        {service.isPaid ? (
          <span
            className="text-sm font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--color-secondary-soft)', color: '#c8b7ff' }}
          >
            {t('services.points', { count: service.points })}
          </span>
        ) : (
          <span
            className="text-sm font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--color-success-soft)', color: '#93f0c0' }}
          >
            {t('common.free')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {canAccept && (
          <button
            className="button flex-1 text-sm"
            style={{ minHeight: '38px' }}
            onClick={() => onAccept(service._id)}
          >
            {t('services.actions.accept')}
          </button>
        )}
        {isOwner && service.status === 'open' && (
          <button
            className="button button--secondary text-sm"
            style={{ minHeight: '38px' }}
            onClick={() => onDelete(service._id)}
          >
            {t('common.delete')}
          </button>
        )}
      </div>
    </div>
  )
}
