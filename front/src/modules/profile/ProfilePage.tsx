import { useState, useEffect } from 'react'
import { MapContainer, Polygon, TileLayer } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/context/AuthContext'
import { usersApi, type UserProfile, type UpdateProfilePayload } from '@/shared/lib/api'
import { AppLayout } from '@/shared/layout/AppLayout'
import i18n from '@/shared/i18n'

const LANGUAGES = [
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'en', label: '🇬🇧 English' },
]

export function ProfilePage() {
  const { t, i18n: i18nHook } = useTranslation()
  const { accessToken } = useAuth()

  const handleLanguageChange = (code: string) => {
    void i18n.changeLanguage(code)
    localStorage.setItem('bobconnect_lang', code)
  }
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<UpdateProfilePayload>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    usersApi.getMe(accessToken)
      .then((data) => {
        setProfile(data)
        setForm({ firstName: data.firstName, lastName: data.lastName, phone: data.phone, address: data.address })
      })
      .catch((err) => setFetchError(err instanceof Error ? err.message : t('auth.errors.generic')))
      .finally(() => setIsLoading(false))
  }, [accessToken, t])

  const handleSave = async () => {
    if (!accessToken) return
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const updated = await usersApi.updateMe(accessToken, form)
      setProfile(updated)
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('auth.errors.generic'))
    } finally {
      setIsSaving(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  }

  if (isLoading) return (
    <AppLayout>
      <div className="text-center py-20" style={{ color: 'var(--color-text-muted)' }}>{t('common.loading')}</div>
    </AppLayout>
  )

  if (fetchError) return (
    <AppLayout>
      <div className="text-center py-20" style={{ color: '#ffb4b4' }}>{fetchError}</div>
    </AppLayout>
  )

  if (!profile) return null

  const neighborhood = profile.neighborhoodId
  const polygonCoords = neighborhood?.polygon?.coordinates?.[0]?.map(
    ([lng, lat]) => [lat, lng] as [number, number]
  )
  const mapCenter: [number, number] = polygonCoords
    ? [
        polygonCoords.reduce((s, [lat]) => s + lat, 0) / polygonCoords.length,
        polygonCoords.reduce((s, [, lng]) => s + lng, 0) / polygonCoords.length,
      ]
    : [48.8578, 2.3812]

  const FIELDS: { key: keyof UpdateProfilePayload; labelKey: string; value: string; readonly?: boolean }[] = [
    { key: 'firstName', labelKey: 'profile.fields.firstName', value: profile.firstName },
    { key: 'lastName', labelKey: 'profile.fields.lastName', value: profile.lastName },
    { key: 'email' as never, labelKey: 'profile.fields.email', value: profile.email, readonly: true },
    { key: 'phone', labelKey: 'profile.fields.phone', value: profile.phone ?? '' },
  ]

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{t('profile.title')}</h1>

        {/* Profile card */}
        <div className="rounded-3xl p-8 flex flex-col gap-6" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-strong)' }}>

          {/* Avatar + name + role */}
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), #8f95ff)', color: '#05111e' }}
            >
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold m-0" style={{ color: 'var(--color-text)' }}>
                {profile.firstName} {profile.lastName}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {t(`profile.roles.${profile.role}`, profile.role)}
                </span>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--color-secondary-soft)', color: '#c8b7ff' }}
                >
                  {profile.points} pts
                </span>
              </div>
            </div>
            <button
              className={`button ml-auto ${isEditing ? 'button--secondary' : ''}`}
              style={{ minHeight: '38px' }}
              onClick={() => { setIsEditing(!isEditing); setSaveError(null) }}
            >
              {isEditing ? t('profile.cancelBtn') : t('profile.editBtn')}
            </button>
          </div>

          {saveSuccess && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--color-success-soft)', color: '#93f0c0' }}>
              {t('profile.successMsg')}
            </div>
          )}
          {saveError && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,80,80,0.1)', color: '#ffb4b4' }}>
              {saveError}
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map(({ key, labelKey, value, readonly }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                  {t(labelKey)}
                </label>
                {isEditing && !readonly ? (
                  <input
                    type="text"
                    value={form[key] ?? value}
                    onChange={(e) => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="h-11 px-4 rounded-xl outline-none"
                    style={inputStyle}
                  />
                ) : (
                  <p className="m-0 font-medium" style={{ color: readonly ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                    {value}
                  </p>
                )}
              </div>
            ))}

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                {t('profile.fields.address')}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.address ?? profile.address}
                  onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                  className="h-11 px-4 rounded-xl outline-none"
                  style={inputStyle}
                />
              ) : (
                <p className="m-0 font-medium" style={{ color: 'var(--color-text)' }}>{profile.address}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <button className="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('profile.saving') : t('profile.saveBtn')}
            </button>
          )}
        </div>

        {/* Language card */}
        <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-strong)' }}>
          <span className="eyebrow">{t('profile.languageSection')}</span>
          <div className="flex gap-2">
            {LANGUAGES.map(({ code, label }) => {
              const isActive = i18nHook.language === code
              return (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: isActive ? 'var(--color-primary-soft)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? 'var(--color-border-strong)' : 'var(--color-border)'}`,
                    color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Neighborhood card */}
        {neighborhood && (
          <div className="rounded-3xl p-6 flex flex-col gap-4" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-strong)' }}>
            <div className="flex items-center gap-3">
              <span className="eyebrow">{t('profile.neighborhood')}</span>
              <h2 className="text-lg font-bold m-0 ml-1" style={{ color: 'var(--color-text)' }}>
                {neighborhood.name}
              </h2>
            </div>
            {neighborhood.description && (
              <p className="m-0 text-sm" style={{ color: 'var(--color-text-muted)' }}>{neighborhood.description}</p>
            )}
            {polygonCoords && (
              <MapContainer
                center={mapCenter}
                zoom={14}
                scrollWheelZoom={false}
                dragging={false}
                doubleClickZoom={false}
                touchZoom={false}
                zoomControl={false}
                attributionControl={false}
                style={{ height: 240, borderRadius: 16, border: '1px solid var(--color-border)' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polygon
                  positions={polygonCoords}
                  pathOptions={{ color: '#7eb0ff', weight: 3, fillColor: '#4e89ff', fillOpacity: 0.25 }}
                />
              </MapContainer>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
