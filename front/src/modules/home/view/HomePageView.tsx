import { lazy, Suspense } from 'react'
import type { HomePageContent } from '@/modules/home/model/home-page-content'
import { FeatureCard } from '@/shared/ui/FeatureCard'

const NeighborhoodMap = lazy(async () =>
  import('@/shared/ui/NeighborhoodMap').then((module) => ({
    default: module.NeighborhoodMap,
  })),
)

type HomePageViewProps = {
  content: HomePageContent
}

export function HomePageView({ content }: HomePageViewProps) {
  return (
    <div className="home-page">
      <section className="hero-panel" id="hero-menu">
        <div className="hero-panel__copy">
          <span className="hero-badge">{content.badge}</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>

          <div className="hero-actions">
            {content.actions.map((action) => (
              <a
                key={action.label}
                className={`button ${action.variant === 'secondary' ? 'button--secondary' : ''}`}
                href={action.href}
              >
                {action.label}
              </a>
            ))}
          </div>

          <div className="hero-metrics">
            {content.metrics.map((metric) => (
              <article key={metric.id} className="metric-card">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </div>

        <aside className="hero-panel__summary" aria-label="Vue produit">
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <span className="eyebrow">Vue de quartier</span>
              <span className="status-pill">En ligne</span>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-tile dashboard-tile--primary">
                <span>Messagerie</span>
                <strong>12 voisins actifs</strong>
              </div>
              <div className="dashboard-tile">
                <span>Evenement</span>
                <strong>Atelier jardinage samedi</strong>
              </div>
              <div className="dashboard-tile">
                <span>Documents</span>
                <strong>3 signatures en attente</strong>
              </div>
              <div className="dashboard-tile dashboard-tile--accent">
                <span>Services</span>
                <strong>4 annonces proches</strong>
              </div>
            </div>

            <Suspense fallback={<div className="neighborhood-map neighborhood-map--loading">Chargement de la carte...</div>}>
              <NeighborhoodMap />
            </Suspense>
          </div>
        </aside>
      </section>

      <section className="content-section" id="concept">
        <div className="section-heading">
          <h2>{content.highlightsTitle}</h2>
          <p>{content.highlightsDescription}</p>
        </div>

        <div className="feature-grid">
          {content.highlights.map((highlight) => (
            <FeatureCard
              key={highlight.id}
              eyebrow={highlight.eyebrow}
              title={highlight.title}
              description={highlight.description}
            />
          ))}
        </div>
      </section>

      <section className="content-section" id="services">
        <div className="section-heading">
          <h2>{content.journeyTitle}</h2>
          <p>{content.journeyDescription}</p>
        </div>

        <div className="journey-grid">
          {content.journeySteps.map((item) => (
            <article key={item.id} className="journey-card">
              <span className="journey-card__step">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section content-section--split" id="events">
        <div className="section-heading">
          <h2>{content.communityTitle}</h2>
          <p>{content.communityDescription}</p>
        </div>

        <div className="pillar-list">
          {content.communityPillars.map((pillar) => (
            <article key={pillar.id} className="pillar-card">
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section content-section--cta" id="messaging">
        <div className="cta-banner">
          <span className="eyebrow">BobConnect</span>
          <h2>Un meme espace pour s&apos;entraider, signer, echanger et participer.</h2>
          <p>
            Cette base front est prete pour brancher les prochaines routes, les vrais flux
            d&apos;authentification et les modules metier.
          </p>
        </div>
      </section>
    </div>
  )
}
