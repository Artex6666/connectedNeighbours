export type HeroAction = {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

export type HeroMetric = {
  id: string
  value: string
  label: string
}

export type HomeHighlight = {
  id: string
  eyebrow: string
  title: string
  description: string
}

export type CommunityPillar = {
  id: string
  title: string
  description: string
}

export type JourneyStep = {
  id: string
  step: string
  title: string
  description: string
}

export type HomePageContent = {
  badge: string
  title: string
  description: string
  actions: HeroAction[]
  metrics: HeroMetric[]
  highlightsTitle: string
  highlightsDescription: string
  highlights: HomeHighlight[]
  journeyTitle: string
  journeyDescription: string
  journeySteps: JourneyStep[]
  communityTitle: string
  communityDescription: string
  communityPillars: CommunityPillar[]
}
