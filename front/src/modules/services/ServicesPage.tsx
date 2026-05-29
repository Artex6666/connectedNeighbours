import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/shared/context/AuthContext'
import { servicesApi, type Service, type ServiceCategory } from '@/shared/lib/api'
import { AppLayout } from '@/shared/layout/AppLayout'
import { ServiceCard } from './ServiceCard'
import { CreateServiceModal } from './CreateServiceModal'

const CATEGORIES: { value: ServiceCategory | ''; label: string }[] = [
  { value: '', label: 'Toutes les catégories' },
  { value: 'bricolage', label: '🔨 Bricolage' },
  { value: 'jardinage', label: '🌱 Jardinage' },
  { value: 'garde_animaux', label: '🐾 Garde d\'animaux' },
  { value: 'cours_particuliers', label: '📚 Cours particuliers' },
  { value: 'demenagement', label: '📦 Déménagement' },
  { value: 'autre', label: '✨ Autre' },
]

type Tab = 'all' | 'mine'

export function ServicesPage() {
  const { accessToken, user } = useAuth()

  const [tab, setTab] = useState<Tab>('all')
  const [services, setServices] = useState<Service[]>([])
  const [myPosted, setMyPosted] = useState<Service[]>([])
  const [myAccepted, setMyAccepted] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<ServiceCategory | ''>('')
  const [onlyFree, setOnlyFree] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const loadAll = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await servicesApi.list(accessToken, {
        category: category || undefined,
        isPaid: onlyFree ? false : undefined,
      })
      setServices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, category, onlyFree])

  const loadMine = useCallback(async () => {
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await servicesApi.mine(accessToken)
      setMyPosted(data.posted)
      setMyAccepted(data.accepted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (tab === 'all') void loadAll()
    else void loadMine()
  }, [tab, loadAll, loadMine])

  const handleAccept = async (id: string) => {
    if (!accessToken) return
    try {
      await servicesApi.accept(accessToken, id)
      void loadAll()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleDelete = async (id: string) => {
    if (!accessToken || !confirm('Supprimer cette annonce ?')) return
    try {
      await servicesApi.delete(accessToken, id)
      tab === 'all' ? void loadAll() : void loadMine()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const tabStyle = (active: boolean) => ({
    background: active ? 'var(--color-primary-soft)' : 'transparent',
    color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
    border: '1px solid',
    borderColor: active ? 'var(--color-border-strong)' : 'transparent',
  })

  const renderGrid = (list: Service[], emptyMsg: string) => {
    if (isLoading) return <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Chargement...</div>
    if (error) return <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,80,80,0.1)', color: '#ffb4b4' }}>{error}</div>
    if (list.length === 0) return (
      <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
        <p className="text-4xl mb-3">🤝</p>
        <p>{emptyMsg}</p>
      </div>
    )
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((service) => (
          <ServiceCard
            key={service._id}
            service={service}
            currentUserId={user?._id ?? ''}
            onAccept={handleAccept}
            onDelete={handleDelete}
          />
        ))}
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--color-text)' }}>
              Services du quartier
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Offrez ou demandez un service à vos voisins
            </p>
          </div>
          <button className="button" onClick={() => setIsCreateOpen(true)}>
            + Publier une annonce
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([['all', 'Toutes les annonces'], ['mine', 'Mes annonces']] as [Tab, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={tabStyle(tab === value)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters (only on "all" tab) */}
        {tab === 'all' && (
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory | '')}
              className="h-10 px-3 rounded-xl text-sm"
              style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
              <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} className="accent-blue-400" />
              Gratuit uniquement
            </label>
            <span className="text-sm ml-auto" style={{ color: 'var(--color-text-muted)' }}>
              {services.length} annonce{services.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Content */}
        {tab === 'all' && renderGrid(services, 'Aucune annonce pour le moment. Soyez le premier à publier !')}

        {tab === 'mine' && (
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Mes annonces publiées ({myPosted.length})
              </h2>
              {renderGrid(myPosted, 'Vous n\'avez pas encore publié d\'annonce.')}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Services que j'ai acceptés ({myAccepted.length})
              </h2>
              {renderGrid(myAccepted, 'Vous n\'avez pas encore accepté de service.')}
            </div>
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateServiceModal
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => { setIsCreateOpen(false); void (tab === 'all' ? loadAll() : loadMine()) }}
        />
      )}
    </AppLayout>
  )
}
