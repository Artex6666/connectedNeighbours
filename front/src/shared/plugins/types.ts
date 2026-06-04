import type { ComponentType } from 'react'
import type { i18n as I18n } from 'i18next'

export type AdminRole = 'admin' | 'moderator'

export type AdminPlugin = {
  // Unique identifier — also used as URL slug under /admin/<id>
  id: string

  // Sidebar order (lower = higher in the list). Default: 100
  order?: number

  // Visual identity
  icon: string
  labelKey: string
  descriptionKey: string

  // React page (lazy or eager). Receives no props.
  Page: ComponentType

  // Required role(s) — defaults to ['admin'] if unset
  allow?: AdminRole[]

  // Optional hook called once at registry load time. Use it to register
  // i18n bundles, attach to a global store, etc.
  register?: (deps: { i18n: I18n }) => void
}
