import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Polygon, TileLayer, Tooltip } from 'react-leaflet'
import type { HomePageContent } from '@/modules/home/model/home-page-content'
import { RoleBadge } from '@/shared/ui/RoleBadge'
import { routes } from '@/shared/config/routes'
import {
  publicApi,
  type PublicStats,
  type PublicNeighborhood,
  type PublicService,
  type PublicVote,
  type PublicEvent,
} from '@/shared/lib/api'

const CATEGORY: Record<string, { emoji: string; label: string }> = {
  bricolage: { emoji: '🔧', label: 'Bricolage' },
  jardinage: { emoji: '🌱', label: 'Jardinage' },
  garde_animaux: { emoji: '🐾', label: 'Garde d\'animaux' },
  cours_particuliers: { emoji: '🎓', label: 'Cours particuliers' },
  demenagement: { emoji: '📦', label: 'Déménagement' },
  autre: { emoji: '🤝', label: 'Autre' },
}

const VOTE_TYPE: Record<string, string> = {
  yesno: 'Oui / Non',
  single: 'Choix unique',
  multiple: 'Choix multiples',
  weighted: 'Vote pondéré',
}

const FEATURES = [
  { icon: '🤝', title: 'Entraide entre voisins', text: 'Offrez ou demandez des services, gratuits ou contre des points.' },
  { icon: '🗳️', title: 'Votes & sondages', text: 'Décidez ensemble de la vie du quartier, façon swipe.' },
  { icon: '💬', title: 'Messagerie & groupes', text: 'Discutez en privé ou créez des canaux de quartier.' },
  { icon: '📅', title: 'Événements', text: 'Repas de quartier, ateliers, collectes… organisez et participez.' },
  { icon: '✍️', title: 'Documents & signatures', text: 'Signez vos contrats en ligne, sécurisés et horodatés.' },
  { icon: '🔒', title: 'Sécurisé (2FA, RGPD)', text: 'Double authentification et contrôle total de vos données.' },
]

function Section({ id, eyebrow, title, subtitle, children }: { id: string; eyebrow: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginTop: 56, scrollMarginTop: 90 }}>
      <div style={{ marginBottom: 20 }}>
        <span className="eyebrow">{eyebrow}</span>
        <h2 style={{ margin: '8px 0 4px', fontSize: '1.9rem', color: 'var(--color-text)' }}>{title}</h2>
        {subtitle && <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

const card: React.CSSProperties = {
  background: 'var(--color-surface, #fff)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: 20,
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  boxShadow: 'var(--shadow-soft)',
}

type HomePageViewProps = { content: HomePageContent }

export function HomePageView({ content }: HomePageViewProps) {
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [hoods, setHoods] = useState<PublicNeighborhood[]>([])
  const [services, setServices] = useState<PublicService[]>([])
  const [votes, setVotes] = useState<PublicVote[]>([])
  const [events, setEvents] = useState<PublicEvent[]>([])

  useEffect(() => {
    publicApi.stats().then(setStats).catch(() => undefined)
    publicApi.neighborhoods().then(setHoods).catch(() => undefined)
    publicApi.services().then(setServices).catch(() => undefined)
    publicApi.votes().then(setVotes).catch(() => undefined)
    publicApi.events().then(setEvents).catch(() => undefined)
  }, [])

  const statChips = stats
    ? [
        { v: stats.neighborhoods, l: 'quartiers' },
        { v: stats.residents, l: 'habitants' },
        { v: stats.services, l: 'annonces' },
        { v: stats.votes, l: 'sondages' },
        { v: stats.events, l: 'événements' },
      ]
    : []

  // Carte : centre = moyenne des points du 1er quartier, sinon Paris.
  const firstRing = hoods[0]?.polygon?.coordinates?.[0]
  const mapCenter: [number, number] = firstRing
    ? [
        firstRing.reduce((s, [, lat]) => s + lat, 0) / firstRing.length,
        firstRing.reduce((s, [lng]) => s + lng, 0) / firstRing.length,
      ]
    : [48.864, 2.365]

  const polygons = hoods
    .map((h) => ({ id: h._id, name: h.name, ring: h.polygon?.coordinates?.[0]?.map(([lng, lat]) => [lat, lng] as [number, number]) }))
    .filter((p): p is { id: string; name: string; ring: [number, number][] } => Boolean(p.ring))

  return (
    <div className="home-page">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        className="hero-panel"
        id="accueil"
        style={{ background: 'linear-gradient(150deg, #fff7ed 0%, #ffedd5 55%, #fef3c7 100%)', borderColor: '#fed7aa' }}
      >
        <div className="hero-panel__copy">
          <span className="hero-badge">{content.badge}</span>
          <h1 style={{ color: '#7c2d12' }}>{content.title}</h1>
          <p style={{ color: '#9a3412' }}>{content.description}</p>

          <div className="hero-actions">
            <Link className="button" to={routes.register}>Rejoindre mon quartier</Link>
            <a className="button button--secondary" href="#quartiers">Découvrir sans compte</a>
          </div>

          {statChips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
              {statChips.map((s) => (
                <div key={s.l} style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 14, padding: '8px 14px', border: '1px solid #fed7aa' }}>
                  <strong style={{ fontSize: '1.3rem', color: '#c2410c' }}>{s.v}</strong>{' '}
                  <span style={{ color: '#9a3412', fontSize: '.85rem' }}>{s.l}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="hero-panel__summary" aria-label="Aperçu" style={{ alignSelf: 'center' }}>
          <div style={{ ...card, padding: 0, overflow: 'hidden', borderColor: '#fed7aa', alignSelf: 'start' }}>
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={false} style={{ height: 420, width: '100%' }} attributionControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {polygons.map((p) => (
                <Polygon key={p.id} positions={p.ring} pathOptions={{ color: '#ea580c', weight: 2, fillColor: '#f97316', fillOpacity: 0.22 }}>
                  <Tooltip sticky>{p.name}</Tooltip>
                </Polygon>
              ))}
            </MapContainer>
          </div>
        </aside>
      </section>

      {/* ── Comment ça marche ──────────────────────────────────── */}
      <Section id="concept" eyebrow="La plateforme" title="Tout pour faire vivre votre quartier" subtitle="Une vraie boîte à outils entre voisins, simple et conviviale.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={card}>
              <span style={{ fontSize: '1.8rem' }}>{f.icon}</span>
              <strong style={{ color: 'var(--color-text)' }}>{f.title}</strong>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '.92rem' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Carte des quartiers ────────────────────────────────── */}
      <Section id="quartiers" eyebrow="Carte" title="Les quartiers BobConnect" subtitle="Chaque quartier est défini par ses limites géographiques.">
        <div className="home-quartiers-grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom style={{ height: 340, width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              {polygons.map((p) => (
                <Polygon key={p.id} positions={p.ring} pathOptions={{ color: '#ea580c', weight: 2, fillColor: '#f97316', fillOpacity: 0.22 }}>
                  <Tooltip sticky>{p.name}</Tooltip>
                </Polygon>
              ))}
            </MapContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hoods.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>Les quartiers apparaîtront ici.</p>
            ) : (
              hoods.map((h) => (
                <div key={h._id} style={card}>
                  <strong style={{ color: 'var(--color-text)' }}>📍 {h.name}</strong>
                  {h.description && <span style={{ color: 'var(--color-text-muted)', fontSize: '.9rem' }}>{h.description}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </Section>

      {/* ── Annonces récentes ──────────────────────────────────── */}
      <Section id="annonces" eyebrow="Entraide" title="Annonces récentes" subtitle="Services offerts ou demandés par les habitants. Connectez-vous pour répondre.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {services.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Pas encore d'annonces.</p>
          ) : (
            services.map((s) => {
              const cat = CATEGORY[s.category] ?? CATEGORY.autre
              return (
                <div key={s._id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#c2410c', background: '#ffedd5', padding: '3px 10px', borderRadius: 999 }}>
                      {cat.emoji} {cat.label}
                    </span>
                    <span style={{ fontSize: '.85rem', fontWeight: 700, color: s.isPaid ? '#7c3aed' : '#15803d' }}>
                      {s.isPaid ? `${s.points} pts` : 'Gratuit'}
                    </span>
                  </div>
                  <strong style={{ color: 'var(--color-text)' }}>{s.title}</strong>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '.9rem' }}>{s.description}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 8, fontSize: '.82rem', color: 'var(--color-text-muted)' }}>
                    {s.authorFirstName} {s.authorRole && <RoleBadge role={s.authorRole} />} · {s.neighborhoodName}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Section>

      {/* ── Sondages à la une ──────────────────────────────────── */}
      <Section id="sondages" eyebrow="Démocratie locale" title="Sondages à la une" subtitle="Ce sur quoi les habitants se prononcent en ce moment.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {votes.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Aucun sondage pour le moment.</p>
          ) : (
            votes.map((v) => {
              const total = v.options.reduce((s, o) => s + o.votes, 0) || 1
              return (
                <div key={v._id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '3px 9px', borderRadius: 999 }}>{VOTE_TYPE[v.type] ?? v.type}</span>
                    <span style={{ fontSize: '.8rem', color: 'var(--color-text-muted)' }}>{v.totalVoters} votant{v.totalVoters > 1 ? 's' : ''}</span>
                  </div>
                  <strong style={{ color: 'var(--color-text)' }}>{v.question}</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                    {v.options.slice(0, 4).map((o, i) => {
                      const pct = Math.round((o.votes / total) * 100)
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', color: 'var(--color-text)' }}>
                            <span>{o.label}</span><span>{pct}%</span>
                          </div>
                          <div style={{ height: 7, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#f97316' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <span style={{ fontSize: '.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>par {v.authorFirstName} · {v.neighborhoodName}</span>
                </div>
              )
            })
          )}
        </div>
      </Section>

      {/* ── Événements à venir ─────────────────────────────────── */}
      <Section id="evenements" eyebrow="Vie de quartier" title="Événements à venir" subtitle="Repas, ateliers, collectes… la vie du quartier se passe ici.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {events.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Aucun événement à venir.</p>
          ) : (
            events.map((e) => (
              <div key={e._id} style={card}>
                <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#c2410c' }}>
                  📅 {new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <strong style={{ color: 'var(--color-text)' }}>{e.title}</strong>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '.9rem' }}>{e.description}</span>
                <div style={{ marginTop: 'auto', paddingTop: 8, fontSize: '.82rem', color: 'var(--color-text-muted)' }}>
                  📍 {e.location} · 👥 {e.participantCount}/{e.maxParticipants}
                </div>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* ── CTA final ──────────────────────────────────────────── */}
      <section style={{ ...card, marginTop: 56, alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderColor: '#ea580c', padding: 36 }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Prêt à rejoindre votre quartier ?</h2>
        <p style={{ color: '#fff', opacity: 0.9, margin: '6px 0 16px' }}>Créez votre compte en 1 minute et commencez à échanger avec vos voisins.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to={routes.register} className="button button--secondary" style={{ background: '#fff', color: '#c2410c', border: 'none' }}>Créer mon compte</Link>
          <Link to={routes.login} className="button button--ghost" style={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff' }}>Se connecter</Link>
        </div>
      </section>
    </div>
  )
}
