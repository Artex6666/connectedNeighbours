import type { AdminPlugin } from '@/shared/plugins/types'
import { UsersPage } from './UsersPage'

const plugin: AdminPlugin = {
  id: 'users',
  order: 20,
  icon: '👥',
  labelKey: 'admin.nav.users',
  descriptionKey: 'admin.dashboard.tiles.users.description',
  Page: UsersPage,
}

export default plugin
