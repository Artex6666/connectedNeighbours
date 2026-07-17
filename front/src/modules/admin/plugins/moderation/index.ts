import type { AdminPlugin } from '@/shared/plugins/types'
import { ModerationPage } from './ModerationPage'

const plugin: AdminPlugin = {
  id: 'moderation',
  order: 65,
  icon: '🛡️',
  labelKey: 'admin.nav.moderation',
  descriptionKey: 'admin.dashboard.tiles.moderation.description',
  Page: ModerationPage,
  allow: ['admin', 'moderator'],
  register({ i18n }) {
    i18n.addResourceBundle('fr', 'common', {
      admin: {
        nav: { moderation: 'Modération' },
        dashboard: { tiles: { moderation: { description: 'Signalements, votes et groupes du quartier.' } } },
      },
    }, true, true)
    i18n.addResourceBundle('en', 'common', {
      admin: {
        nav: { moderation: 'Moderation' },
        dashboard: { tiles: { moderation: { description: 'Reports, polls and neighbourhood groups.' } } },
      },
    }, true, true)
  },
}

export default plugin
