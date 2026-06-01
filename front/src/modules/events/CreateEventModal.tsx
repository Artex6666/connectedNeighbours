import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { eventsApi } from '@/shared/lib/api'

type Props = {
  onClose: () => void
  onCreated: () => void
}

export function CreateEventModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation()
  const { accessToken } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    maxParticipants: 20,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      await eventsApi.create(accessToken, form)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  }

  const labelStyle = { color: 'var(--color-text-muted)' }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(2,8,18,0.74)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-8"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-strong)',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold m-0" style={{ color: 'var(--color-text)' }}>
            {t('events.modal.title')}
          </h2>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,80,80,0.1)', color: '#ffb4b4' }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
              {t('events.modal.titleLabel')}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder={t('events.modal.titlePlaceholder')}
              required
              className="h-11 px-4 rounded-xl outline-none"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
              {t('events.modal.descriptionLabel')}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder={t('events.modal.descriptionPlaceholder')}
              required
              rows={3}
              className="px-4 py-3 rounded-xl outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
                {t('events.modal.dateLabel')}
              </label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))}
                required
                className="h-11 px-4 rounded-xl outline-none"
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5 w-28">
              <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
                {t('events.modal.maxLabel')}
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={form.maxParticipants}
                onChange={(e) => setForm(p => ({ ...p, maxParticipants: parseInt(e.target.value) || 1 }))}
                required
                className="h-11 px-4 rounded-xl outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={labelStyle}>
              {t('events.modal.locationLabel')}
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder={t('events.modal.locationPlaceholder')}
              required
              className="h-11 px-4 rounded-xl outline-none"
              style={inputStyle}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" className="button button--secondary flex-1" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="button flex-1" disabled={isLoading}>
              {isLoading ? t('events.modal.submitting') : t('events.modal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
