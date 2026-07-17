import type { AdminPlugin } from '@/shared/plugins/types'
import { NewsletterPage } from './NewsletterPage'

const plugin: AdminPlugin = {
  id: 'newsletter',
  order: 70,
  icon: '📰',
  labelKey: 'admin.nav.newsletter',
  descriptionKey: 'admin.dashboard.tiles.newsletter.description',
  Page: NewsletterPage,
  allow: ['admin', 'moderator'],
  register({ i18n }) {
    i18n.addResourceBundle(
      'fr',
      'common',
      {
        admin: {
          nav: { newsletter: 'Newsletter' },
          dashboard: { tiles: { newsletter: { description: 'Composez et planifiez la newsletter du quartier.' } } },
        },
      },
      true,
      true,
    )
    i18n.addResourceBundle(
      'en',
      'common',
      {
        admin: {
          nav: { newsletter: 'Newsletter' },
          dashboard: { tiles: { newsletter: { description: 'Compose and schedule the neighbourhood newsletter.' } } },
        },
      },
      true,
      true,
    )
  },
}

export default plugin
