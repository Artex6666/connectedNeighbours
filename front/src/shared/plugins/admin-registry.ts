import i18n from '@/shared/i18n'
import type { AdminPlugin } from './types'

// Vite's `import.meta.glob` resolves at build time. Dropping a new folder
// inside `modules/admin/plugins/<id>/` with an `index.ts` that default-exports
// an `AdminPlugin` is enough — no other file needs to be touched.
const modules = import.meta.glob<{ default: AdminPlugin }>(
  '../../modules/admin/plugins/*/index.ts',
  { eager: true },
)

function loadPlugins(): AdminPlugin[] {
  const plugins: AdminPlugin[] = []
  for (const mod of Object.values(modules)) {
    if (mod?.default) plugins.push(mod.default)
  }
  return plugins
    .map((plugin) => {
      plugin.register?.({ i18n })
      return plugin
    })
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))
}

export const adminPlugins: AdminPlugin[] = loadPlugins()

export function pluginPath(plugin: AdminPlugin): string {
  return `/admin/${plugin.id}`
}
