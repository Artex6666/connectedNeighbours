import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { AppLayout } from '@/shared/layout/AppLayout'
import { routes } from '@/shared/config/routes'
import { usersApi, neighborhoodsApi, type UserProfile, type NeighborhoodSuggestion } from '@/shared/lib/api'

const modules = [
  { icon: '🤝', title: 'Services entre voisins', desc: 'Offrez ou demandez de l\'aide, gratuit ou en points.', href: routes.services },
  { icon: '📅', title: 'Événements', desc: 'Repas, ateliers, collectes… participez à la vie du quartier.', href: routes.events },
  { icon: '🗳️', title: 'Votes & sondages', desc: 'Décidez ensemble, façon swipe, et commentez.', href: routes.votes },
  { icon: '👥', title: 'Groupes de discussion', desc: 'Rejoignez ou créez des canaux de quartier.', href: routes.groups },
  { icon: '📄', title: 'Documents & signatures', desc: 'Signez vos contrats PDF en ligne (2FA).', href: routes.documents },
  { icon: '👤', title: 'Mon profil & données', desc: '2FA, préférences email, export RGPD.', href: routes.profile },
]

function NeighborhoodJoinCard({ onJoined, onCancel }: { onJoined: () => void; onCancel?: () => void }) {
  const { accessToken, updateAccessToken } = useAuth()
  const [sugg, setSugg] = useState<NeighborhoodSuggestion | null>(null)
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    neighborhoodsApi
      .suggest(accessToken)
      .then((s) => {
        setSugg(s)
        setSelected(s.defaultId ?? s.neighborhoods[0]?._id ?? '')
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [accessToken])

  const join = async () => {
    if (!accessToken || !selected) return
    setSaving(true)
    try {
      const res = await usersApi.setMyNeighborhood(accessToken, selected)
      updateAccessToken(res.accessToken) // token frais → scope quartier immédiat
      onJoined()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl p-6 flex flex-col gap-3" style={{ background: 'linear-gradient(150deg, #fff7ed, #ffedd5)', border: '1px solid #fed7aa' }}>
      <h2 className="text-lg font-bold m-0" style={{ color: '#7c2d12' }}>📍 Rejoignez votre quartier</h2>
      <p className="m-0 text-sm" style={{ color: '#9a3412' }}>
        Choisissez votre quartier pour voir les annonces, votes et événements près de chez vous.
      </p>
      {loading ? (
        <p className="m-0 text-sm" style={{ color: '#9a3412' }}>Chargement…</p>
      ) : !sugg || sugg.neighborhoods.length === 0 ? (
        <p className="m-0 text-sm" style={{ color: '#9a3412' }}>Aucun quartier disponible pour le moment.</p>
      ) : (
        <>
          <small style={{ color: '#9a3412' }}>
            {sugg.geocoded
              ? 'D\'après votre adresse, le quartier le plus proche est présélectionné.'
              : 'Adresse non localisée — choisissez votre quartier manuellement.'}
          </small>
          <div className="flex flex-col gap-2">
            {sugg.neighborhoods.map((n) => (
              <label key={n._id} className="flex items-center gap-2 cursor-pointer" style={{ color: '#7c2d12' }}>
                <input type="radio" name="hood" checked={selected === n._id} onChange={() => setSelected(n._id)} />
                <span className="font-medium">{n.name}</span>
                {n.contains ? (
                  <span className="text-xs font-bold" style={{ color: '#15803d' }}>⭐ votre adresse</span>
                ) : n.distanceKm != null ? (
                  <span className="text-xs" style={{ color: '#9a3412' }}>· {n.distanceKm} km</span>
                ) : null}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="button self-start" disabled={!selected || saving} onClick={() => void join()}>
              {saving ? 'Ça arrive…' : 'Rejoindre ce quartier'}
            </button>
            {onCancel && (
              <button type="button" className="button button--ghost" onClick={onCancel}>Annuler</button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const { user, accessToken, updateAccessToken } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [checked, setChecked] = useState(false)
  const [changing, setChanging] = useState(false)

  const loadProfile = () => {
    if (!accessToken) return
    usersApi
      .getMe(accessToken)
      .then(setProfile)
      .catch(() => undefined)
      .finally(() => setChecked(true))
  }

  useEffect(loadProfile, [accessToken])

  const hasNeighborhood = Boolean(profile?.neighborhoodId)

  const leave = async () => {
    if (!accessToken) return
    if (!confirm('Quitter votre quartier ? Vous ne verrez plus ses annonces/votes/événements.')) return
    try {
      const res = await usersApi.setMyNeighborhood(accessToken, null)
      updateAccessToken(res.accessToken)
      loadProfile()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur')
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            {t('dashboard.welcome', { name: user?.firstName })}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('dashboard.subtitle')}</p>
        </div>

        {checked && (!hasNeighborhood || changing) && (
          <NeighborhoodJoinCard
            onJoined={() => { setChanging(false); loadProfile() }}
            onCancel={changing ? () => setChanging(false) : undefined}
          />
        )}

        {checked && hasNeighborhood && !changing && typeof profile?.neighborhoodId !== 'string' && (
          <div className="flex items-center gap-3 flex-wrap rounded-2xl p-4" style={{ background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              📍 Votre quartier : <strong style={{ color: 'var(--color-text)' }}>{profile?.neighborhoodId?.name}</strong>
            </span>
            <button className="button button--ghost" style={{ minHeight: 34 }} onClick={() => setChanging(true)}>Changer</button>
            <button className="button button--ghost" style={{ minHeight: 34 }} onClick={() => void leave()}>Quitter</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(({ icon, title, desc, href }) => (
            <Link
              key={title}
              to={href}
              className="flex flex-col gap-3 p-6 rounded-2xl transition-transform hover:-translate-y-0.5"
              style={{
                background: 'var(--color-bg-soft)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <span className="text-3xl">{icon}</span>
              <h2 className="text-base font-semibold m-0" style={{ color: 'var(--color-text)' }}>
                {title}
              </h2>
              <p className="text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
                {desc}
              </p>
            </Link>
          ))}
        </div>

        <p className="text-sm m-0" style={{ color: 'var(--color-text-muted)' }}>
          💬 La messagerie privée est accessible via la bulle en bas à droite.
        </p>
      </div>
    </AppLayout>
  )
}
