import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { navItems } from '@/shared/config/nav-items'

export function PublicLayout() {
  const { t } = useTranslation()

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand__mark">BC</span>
          <span>
            <strong>BobConnect</strong>
            <small>{t('app.tagline')}</small>
          </span>
        </a>

        <nav className="topbar__nav" aria-label={t('navigation.ariaLabel')}>
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {t(item.labelKey)}
            </a>
          ))}
        </nav>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}
