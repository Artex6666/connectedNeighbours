import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? routes.dashboard

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div
        className="w-full max-w-md rounded-3xl p-10 shadow-2xl"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-strong)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Brand */}
        <Link to={routes.home} className="inline-flex items-center gap-3 mb-8">
          <span className="brand__mark">BC</span>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
            Connected Neighbours
          </span>
        </Link>

        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          {t('auth.login')}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          {t('auth.loginSubtitle')}
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', color: '#ffb4b4' }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              {t('auth.modal.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.modal.emailPlaceholder')}
              required
              autoComplete="email"
              autoFocus
              className="h-12 px-4 rounded-xl outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              {t('auth.modal.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="h-12 px-4 rounded-xl outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <button type="submit" disabled={isLoading} className="button button--full mt-2">
            {isLoading ? t('auth.modal.loading') : t('auth.modal.submitLogin')}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
          {t('auth.noAccount')}{' '}
          <Link to={routes.register} className="font-semibold" style={{ color: 'var(--color-primary)' }}>
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
