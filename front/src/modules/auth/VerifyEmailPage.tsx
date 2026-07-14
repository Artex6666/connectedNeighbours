import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/shared/lib/api'
import { routes } from '@/shared/config/routes'

const inputStyle = {
  background: 'rgba(0,0,0,0.04)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
}

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const prefillEmail = (location.state as { email?: string })?.email ?? ''

  const [email, setEmail] = useState(prefillEmail)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      await authApi.verifyEmail(email.trim(), code.trim())
      navigate(routes.login, { replace: true, state: { verified: true, email: email.trim() } })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Renseignez votre email pour renvoyer le code.')
      return
    }
    setError(null)
    try {
      await authApi.resendVerification(email.trim())
      setInfo('Si un compte non vérifié existe, un nouveau code vient d\'être envoyé.')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.generic'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div
        className="w-full max-w-md rounded-3xl p-10 shadow-2xl"
        style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-strong)' }}
      >
        <Link to={routes.home} className="inline-flex items-center gap-3 mb-8">
          <span className="brand__mark">BC</span>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Connected Neighbours</span>
        </Link>

        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>Confirmez votre compte</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Saisissez le code à 6 chiffres reçu par email.
        </p>

        <form onSubmit={handleVerify} noValidate className="flex flex-col gap-5">
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', color: '#c0392b' }} role="alert">
              {error}
            </div>
          )}
          {info && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--color-success-soft)', color: '#15803d' }}>
              {info}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12 px-4 rounded-xl outline-none" style={inputStyle} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Code de vérification</label>
            <input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" required autoFocus className="h-12 px-4 rounded-xl outline-none text-center tracking-[0.5em]" style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} className="button button--full mt-2">
            {loading ? 'Vérification…' : 'Confirmer mon compte'}
          </button>
        </form>

        <div className="flex items-center justify-between mt-6 text-sm">
          <button type="button" onClick={() => void handleResend()} className="font-semibold" style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Renvoyer le code
          </button>
          <Link to={routes.login} style={{ color: 'var(--color-text-muted)' }}>Retour à la connexion</Link>
        </div>
      </div>
    </div>
  )
}
