import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'
import { apiBaseUrl } from '@/shared/config/env'

export function LoginPage() {
  const { t } = useTranslation()
  const { login, isAuthenticated, accessToken: existingToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    routes.dashboard

  const params = new URLSearchParams(location.search)
  const redirectUri = params.get('redirect_uri')
  const codeChallenge = params.get('code_challenge')
  const isDesktopSso = Boolean(redirectUri && codeChallenge)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [mfaStep, setMfaStep] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createDesktopSsoCode = async (accessToken: string) => {
    if (!redirectUri || !codeChallenge) {
      throw new Error('Paramètres SSO manquants')
    }

    let callbackUrl: URL

    try {
      callbackUrl = new URL(redirectUri)
    } catch {
      throw new Error('redirect_uri invalide')
    }

    const response = await fetch(`${apiBaseUrl}/auth/sso/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ codeChallenge }),
    })

    const json = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        json && typeof json === 'object' && 'message' in json
          ? String((json as { message?: unknown }).message)
          : 'Impossible de créer le code SSO'

      throw new Error(message)
    }

    const code =
      json && typeof json === 'object'
        ? ((json as { data?: { code?: string }; code?: string }).data?.code ??
            (json as { code?: string }).code)
        : null

    if (!code) {
      throw new Error('Code SSO manquant')
    }

    callbackUrl.searchParams.set('code', code)

    try {
      window.location.assign(callbackUrl.toString())
    } catch {
      throw new Error('Redirection vers Java impossible')
    }
  }

  useEffect(() => {
    if (isDesktopSso && isAuthenticated && existingToken) {
      createDesktopSsoCode(existingToken).catch((err: Error) => setError(err.message))
    }
  }, [isDesktopSso, isAuthenticated, existingToken])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await login(email, password, mfaStep ? totpCode : undefined)

      if (result.mfaRequired) {
        setMfaStep(true)
        return
      }

      if (isDesktopSso) {
        if (!result.accessToken) {
          throw new Error('AccessToken manquant après connexion')
        }

        await createDesktopSsoCode(result.accessToken)
        return
      }

      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-bg)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-10 shadow-2xl"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-strong)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Link to={routes.home} className="inline-flex items-center gap-3 mb-8">
          <span className="brand__mark">BC</span>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
            Connected Neighbours
          </span>
        </Link>

        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
          {isDesktopSso ? 'Connexion Desktop SSO' : t('auth.login')}
        </h1>

        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          {isDesktopSso
            ? 'Connectez-vous pour autoriser l’application Java.'
            : t('auth.loginSubtitle')}
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'rgba(255,80,80,0.1)',
                border: '1px solid rgba(255,80,80,0.2)',
                color: '#c0392b',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
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
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
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
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {mfaStep && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="totp"
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {t('auth.mfa.codeLabel', 'Code de double authentification')}
              </label>

              <input
                id="totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                required
                autoFocus
                className="h-12 px-4 rounded-xl outline-none transition-colors tracking-[0.4em] text-center"
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />

              <small style={{ color: 'var(--color-text-muted)' }}>
                {t(
                  'auth.mfa.codeHint',
                  "Saisissez le code à 6 chiffres de votre application d'authentification."
                )}
              </small>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="button button--full mt-2">
            {isLoading
              ? t('auth.modal.loading')
              : mfaStep
                ? t('auth.mfa.verify', 'Vérifier le code')
                : isDesktopSso
                  ? 'Autoriser l’application Java'
                  : t('auth.modal.submitLogin')}
          </button>
        </form>

        {!isDesktopSso && (
          <p className="text-center text-sm mt-6" style={{ color: 'var(--color-text-muted)' }}>
            {t('auth.noAccount')}{' '}
            <Link to={routes.register} className="font-semibold" style={{ color: 'var(--color-primary)' }}>
              {t('auth.register')}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}