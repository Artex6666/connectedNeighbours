import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { routes } from '@/shared/config/routes'

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

  console.log('[SSO] location.href =', window.location.href)
  console.log('[SSO] location.search =', location.search)
  console.log('[SSO] redirectUri =', redirectUri)
  console.log('[SSO] codeChallenge =', codeChallenge)
  console.log('[SSO] isDesktopSso =', isDesktopSso)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [mfaStep, setMfaStep] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createDesktopSsoCode = async (accessToken: string) => {
    console.log('[SSO] createDesktopSsoCode start')
    console.log('[SSO] accessToken exists =', Boolean(accessToken))
    console.log('[SSO] redirectUri before validation =', redirectUri)
    console.log('[SSO] codeChallenge before validation =', codeChallenge)

    if (!redirectUri || !codeChallenge) {
      throw new Error('Paramètres SSO manquants')
    }

    let callbackUrl: URL

    try {
      callbackUrl = new URL(redirectUri)
      console.log('[SSO] callbackUrl parsed =', callbackUrl.toString())
    } catch (err) {
      console.error('[SSO] redirectUri invalide =', redirectUri, err)
      throw new Error('redirect_uri invalide')
    }

    console.log('[SSO] POST /auth/sso/code')

    const response = await fetch('http://localhost:3000/api/v1/auth/sso/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ codeChallenge }),
    })

    console.log('[SSO] /auth/sso/code status =', response.status)

    const json = await response.json().catch((err) => {
      console.error('[SSO] JSON parse failed', err)
      return null
    })

    console.log('[SSO] /auth/sso/code response =', json)

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

    console.log('[SSO] code received =', code)

    if (!code) {
      throw new Error('Code SSO manquant')
    }

    callbackUrl.searchParams.set('code', code)

    const finalUrl = callbackUrl.toString()

    console.log('[SSO] final callback URL =', finalUrl)

    try {
      window.location.assign(finalUrl)
    } catch (err) {
      console.error('[SSO] window.location.assign failed', err)
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

    console.log('[SSO] handleSubmit')
    console.log('[SSO] email =', email)
    console.log('[SSO] mfaStep =', mfaStep)
    console.log('[SSO] isDesktopSso =', isDesktopSso)

    setError(null)
    setIsLoading(true)

    try {
      const result = await login(email, password, mfaStep ? totpCode : undefined)

      console.log('[SSO] login result =', result)

      if (result.mfaRequired) {
        console.log('[SSO] MFA required')
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

      console.log('[SSO] normal navigation to =', from)
      navigate(from, { replace: true })
    } catch (err) {
      console.error('[SSO] error =', err)
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