export type HeroAction = {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

export type HomeHighlight = {
  id: string
  title: string
  description: string
}

export type HomePageContent = {
  badge: string
  title: string
  description: string
  actions: HeroAction[]
  highlightsTitle: string
  highlightsDescription: string
  highlights: HomeHighlight[]
  roadmapTitle: string
  roadmapDescription: string
  roadmapItems: string[]
}
