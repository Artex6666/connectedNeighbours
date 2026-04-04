import { useTranslation } from 'react-i18next'
import type { HomePageContent } from '@/modules/home/model/home-page-content'

export function useHomePageController(): HomePageContent {
  const { t } = useTranslation()

  return {
    badge: t('home.badge'),
    title: t('home.title'),
    description: t('home.description'),
    actions: [
      {
        href: '#hero-menu',
        label: t('home.primaryCta'),
        variant: 'primary',
      },
      {
        href: '#architecture',
        label: t('home.secondaryCta'),
        variant: 'secondary',
      },
    ],
    highlightsTitle: t('home.highlightsTitle'),
    highlightsDescription: t('home.highlightsDescription'),
    highlights: [
      {
        id: 'architecture',
        title: t('home.sections.architecture.title'),
        description: t('home.sections.architecture.description'),
      },
      {
        id: 'routing',
        title: t('home.sections.routing.title'),
        description: t('home.sections.routing.description'),
      },
      {
        id: 'tooling',
        title: t('home.sections.tooling.title'),
        description: t('home.sections.tooling.description'),
      },
    ],
    roadmapTitle: t('home.roadmapTitle'),
    roadmapDescription: t('home.roadmapDescription'),
    roadmapItems: [
      t('home.roadmap.auth'),
      t('home.roadmap.services'),
      t('home.roadmap.documents'),
      t('home.roadmap.events'),
      t('home.roadmap.messaging'),
    ],
  }
}
