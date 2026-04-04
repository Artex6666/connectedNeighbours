type FeatureCardProps = {
  eyebrow?: string
  title: string
  description: string
}

export function FeatureCard({ eyebrow, title, description }: FeatureCardProps) {
  return (
    <article className="feature-card">
      {eyebrow ? <span className="feature-card__eyebrow">{eyebrow}</span> : null}
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}
