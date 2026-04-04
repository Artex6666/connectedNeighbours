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
        href: '#concept',
        label: t('home.primaryCta'),
        variant: 'primary',
      },
      {
        href: '#footer',
        label: t('home.secondaryCta'),
        variant: 'secondary',
      },
    ],
    metrics: [
      {
        id: 'neighbors',
        value: t('home.metrics.neighbors.value'),
        label: t('home.metrics.neighbors.label'),
      },
      {
        id: 'documents',
        value: t('home.metrics.documents.value'),
        label: t('home.metrics.documents.label'),
      },
      {
        id: 'events',
        value: t('home.metrics.events.value'),
        label: t('home.metrics.events.label'),
      },
    ],
    highlightsTitle: t('home.highlightsTitle'),
    highlightsDescription: t('home.highlightsDescription'),
    highlights: [
      {
        id: 'services',
        eyebrow: t('home.sections.services.eyebrow'),
        title: t('home.sections.services.title'),
        description: t('home.sections.services.description'),
      },
      {
        id: 'documents',
        eyebrow: t('home.sections.documents.eyebrow'),
        title: t('home.sections.documents.title'),
        description: t('home.sections.documents.description'),
      },
      {
        id: 'events',
        eyebrow: t('home.sections.events.eyebrow'),
        title: t('home.sections.events.title'),
        description: t('home.sections.events.description'),
      },
      {
        id: 'messaging',
        eyebrow: t('home.sections.messaging.eyebrow'),
        title: t('home.sections.messaging.title'),
        description: t('home.sections.messaging.description'),
      },
    ],
    journeyTitle: t('home.journeyTitle'),
    journeyDescription: t('home.journeyDescription'),
    journeySteps: [
      {
        id: 'join',
        step: '01',
        title: t('home.journey.join.title'),
        description: t('home.journey.join.description'),
      },
      {
        id: 'connect',
        step: '02',
        title: t('home.journey.connect.title'),
        description: t('home.journey.connect.description'),
      },
      {
        id: 'contribute',
        step: '03',
        title: t('home.journey.contribute.title'),
        description: t('home.journey.contribute.description'),
      },
    ],
    communityTitle: t('home.communityTitle'),
    communityDescription: t('home.communityDescription'),
    communityPillars: [
      {
        id: 'trust',
        title: t('home.community.trust.title'),
        description: t('home.community.trust.description'),
      },
      {
        id: 'local',
        title: t('home.community.local.title'),
        description: t('home.community.local.description'),
      },
      {
        id: 'inclusion',
        title: t('home.community.inclusion.title'),
        description: t('home.community.inclusion.description'),
      },
    ],
  }
}
