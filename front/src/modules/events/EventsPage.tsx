import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { eventsApi, type Event } from '@/shared/lib/api'
import { AppLayout } from '@/shared/layout/AppLayout'
import { EventCard } from './EventCard'
import { CreateEventModal } from './CreateEventModal'

export function EventsPage() {
  const { t } = useTranslation()
  const { accessToken, user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const load = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await eventsApi.list(accessToken)
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, t])

  useEffect(() => { void load() }, [load])

  const handleRegister = async (id: string) => {
    if (!accessToken) return
    try {
      await eventsApi.register(accessToken, id)
      void load()
    } catch (err) {
      alert(err instanceof Error ? err.message : t('auth.errors.generic'))
    }
  }

  const handleUnregister = async (id: string) => {
    if (!accessToken || !confirm(t('events.actions.confirmUnregister'))) return
    try {
      await eventsApi.unregister(accessToken, id)
      void load()
    } catch (err) {
      alert(err instanceof Error ? err.message : t('auth.errors.generic'))
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--color-text)' }}>
              {t('events.pageTitle')}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {t('events.pageSubtitle')}
            </p>
          </div>
          <button className="button" onClick={() => setIsCreateOpen(true)}>
            {t('events.createBtn')}
          </button>
        </div>

        {/* Content */}
        {isLoading && (
          <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,80,80,0.1)', color: '#ffb4b4' }}>
            {error}
          </div>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
            <p className="text-4xl mb-3">📅</p>
            <p>{t('events.empty')}</p>
          </div>
        )}

        {!isLoading && !error && events.length > 0 && (
          <>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t('events.count', { count: events.length })}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  currentUserId={user?._id ?? ''}
                  onRegister={handleRegister}
                  onUnregister={handleUnregister}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {isCreateOpen && (
        <CreateEventModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => { setIsCreateOpen(false); void load() }}
        />
      )}
    </AppLayout>
  )
}
