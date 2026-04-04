import type { HomePageContent } from '@/modules/home/model/home-page-content'
import { FeatureCard } from '@/shared/ui/FeatureCard'

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
        </div>

        <aside className="hero-panel__summary">
          <span className="eyebrow">Front / React</span>
          <ul className="stack-list">
            <li>Vite + TypeScript</li>
            <li>React Router</li>
            <li>i18next</li>
            <li>Vitest + Testing Library</li>
            <li>Architecture modulaire</li>
          </ul>
        </aside>
      </section>

      <section className="content-section" id="architecture">
        <div className="section-heading">
          <h2>{content.highlightsTitle}</h2>
          <p>{content.highlightsDescription}</p>
        </div>

        <div className="feature-grid">
          {content.highlights.map((highlight) => (
            <FeatureCard
              key={highlight.id}
              title={highlight.title}
              description={highlight.description}
            />
          ))}
        </div>
      </section>

      <section className="content-section" id="roadmap">
        <div className="section-heading">
          <h2>{content.roadmapTitle}</h2>
          <p>{content.roadmapDescription}</p>
        </div>

        <ul className="roadmap-list">
          {content.roadmapItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
