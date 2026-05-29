import { useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { servicesApi, type ServiceCategory } from '@/shared/lib/api'

const CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'bricolage', label: '🔨 Bricolage' },
  { value: 'jardinage', label: '🌱 Jardinage' },
  { value: 'garde_animaux', label: '🐾 Garde d\'animaux' },
  { value: 'cours_particuliers', label: '📚 Cours particuliers' },
  { value: 'demenagement', label: '📦 Déménagement' },
  { value: 'autre', label: '✨ Autre' },
]

type Props = {
  onClose: () => void
  onCreated: () => void
}

export function CreateServiceModal({ onClose, onCreated }: Props) {
  const { accessToken } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'autre' as ServiceCategory,
    isPaid: false,
    points: 1,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      await servicesApi.create(accessToken, {
        ...form,
        points: form.isPaid ? form.points : 0,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  }

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
            Publier une annonce
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
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Titre
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Cours de guitare pour débutants"
              required
              className="h-11 px-4 rounded-xl outline-none"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Décrivez votre service..."
              required
              rows={3}
              className="px-4 py-3 rounded-xl outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Catégorie
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm(p => ({ ...p, category: e.target.value as ServiceCategory }))}
              className="h-11 px-4 rounded-xl outline-none"
              style={inputStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <input
                type="checkbox"
                checked={form.isPaid}
                onChange={(e) => setForm(p => ({ ...p, isPaid: e.target.checked }))}
                className="accent-blue-400"
              />
              Service payant (en points)
            </label>

            {form.isPaid && (
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Points :</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.points}
                  onChange={(e) => setForm(p => ({ ...p, points: parseInt(e.target.value) || 1 }))}
                  className="w-16 h-9 px-3 rounded-lg text-center outline-none"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" className="button button--secondary flex-1" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="button flex-1" disabled={isLoading}>
              {isLoading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
