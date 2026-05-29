import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import { servicesApi, messagesApi, type Service } from '@/shared/lib/api'
import { AppLayout } from '@/shared/layout/AppLayout'
import { routes } from '@/shared/config/routes'

const CATEGORY_LABELS: Record<string, string> = {
  bricolage: '🔨 Bricolage',
  jardinage: '🌱 Jardinage',
  garde_animaux: '🐾 Garde d\'animaux',
  cours_particuliers: '📚 Cours particuliers',
  demenagement: '📦 Déménagement',
  autre: '✨ Autre',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Disponible',
  in_progress: 'En cours',
  done: 'Terminé',
  cancelled: 'Annulé',
  pending: 'En attente',
}

const STATUS_COLORS: Record<string, string> = {
  open: '#93f0c0',
  in_progress: '#78adff',
  done: '#9fb1c9',
  cancelled: '#ffb4b4',
  pending: '#ffd580',
}

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { accessToken, user } = useAuth()
  const navigate = useNavigate()

  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!accessToken || !id) return
    setIsLoading(true)
    servicesApi.get(accessToken, id)
      .then(setService)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur'))
      .finally(() => setIsLoading(false))
  }, [accessToken, id])

  const refetch = async () => {
    if (!accessToken || !id) return
    const updated = await servicesApi.get(accessToken, id)
    setService(updated)
  }

  const handleAccept = async () => {
    if (!accessToken || !id) return
    setActionLoading(true)
    try {
      await servicesApi.accept(accessToken, id)
      await refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!accessToken || !id) return
    setActionLoading(true)
    try {
      await servicesApi.complete(accessToken, id)
      await refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const handleContact = async () => {
    if (!accessToken || !service || !user) return
    // Open conversation with the other party
    const otherUserId = service.authorId._id === user._id
      ? (service as any).accepterId
      : service.authorId._id
    if (!otherUserId) return
    // Send an initial message to open the conversation
    try {
      await messagesApi.sendMessage(accessToken, otherUserId, {
        content: `Bonjour, je vous contacte au sujet de votre annonce : "${service.title}"`,
        type: 'text',
      })
      alert('Message envoyé ! Retrouvez la conversation dans la messagerie.')
    } catch {
      alert('Impossible d\'envoyer le message.')
    }
  }

  const handleDelete = async () => {
    if (!accessToken || !id || !confirm('Supprimer cette annonce ?')) return
    try {
      await servicesApi.delete(accessToken, id)
      navigate(routes.services)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  if (isLoading) return (
    <AppLayout>
      <div className="text-center py-20" style={{ color: 'var(--color-text-muted)' }}>Chargement...</div>
    </AppLayout>
  )

  if (error || !service) return (
    <AppLayout>
      <div className="text-center py-20" style={{ color: '#ffb4b4' }}>{error ?? 'Annonce introuvable'}</div>
    </AppLayout>
  )

  const isOwner = service.authorId._id === user?._id
  const canAccept = service.status === 'open' && !isOwner
  const canComplete = service.status === 'in_progress' && isOwner
  const canContact = !isOwner && service.status !== 'open'

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Back */}
        <Link to={routes.services} className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
          ← Retour aux annonces
        </Link>

        {/* Main card */}
        <div
          className="rounded-3xl p-8 flex flex-col gap-6"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-strong)' }}
        >
          {/* Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
            >
              {CATEGORY_LABELS[service.category]}
            </span>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: STATUS_COLORS[service.status] }}
            >
              {STATUS_LABELS[service.status]}
            </span>
            {service.isPaid ? (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full ml-auto"
                style={{ background: 'var(--color-secondary-soft)', color: '#c8b7ff' }}
              >
                {service.points} points
              </span>
            ) : (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-full ml-auto"
                style={{ background: 'var(--color-success-soft)', color: '#93f0c0' }}
              >
                Gratuit
              </span>
            )}
          </div>

          {/* Title + description */}
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--color-text)' }}>
              {service.title}
            </h1>
            <p className="text-base m-0 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {service.description}
            </p>
          </div>

          {/* Author info */}
          <div
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), #8f95ff)', color: '#05111e' }}
            >
              {service.authorId.firstName[0]}{service.authorId.lastName[0]}
            </div>
            <div>
              <p className="font-semibold m-0" style={{ color: 'var(--color-text)' }}>
                {service.authorId.firstName} {service.authorId.lastName}
              </p>
              <p className="text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
                {service.authorId.points} points · {service.authorId.role}
              </p>
            </div>
            <p className="text-xs ml-auto" style={{ color: 'var(--color-text-muted)' }}>
              Publié le {new Date(service.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            {canAccept && (
              <button className="button flex-1" disabled={actionLoading} onClick={handleAccept}>
                {actionLoading ? 'En cours...' : '✅ Accepter ce service'}
              </button>
            )}
            {canComplete && (
              <button className="button flex-1" disabled={actionLoading} onClick={handleComplete}>
                {actionLoading ? 'En cours...' : '🎉 Marquer comme terminé'}
              </button>
            )}
            {canContact && (
              <button className="button button--secondary flex-1" onClick={handleContact}>
                💬 Contacter
              </button>
            )}
            {isOwner && service.status === 'open' && (
              <button
                className="button button--secondary"
                style={{ borderColor: 'rgba(255,80,80,0.3)', color: '#ffb4b4' }}
                onClick={handleDelete}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
